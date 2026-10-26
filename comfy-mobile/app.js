/* ComfyMobile — cliente ligero de ComfyUI para móvil.
   Se conecta por HTTP + WebSocket a un ComfyUI corriendo en una GPU en la nube. */

'use strict';

const $ = (id) => document.getElementById(id);
const state = {
  server: '',
  token: '',
  clientId: 'comfymobile-' + Math.random().toString(36).slice(2),
  connected: false,
  ws: null,
  running: false,
  polling: null,        // prompt_id que se está sondeando (evita cadenas duplicadas)
  currentPromptId: null,
  lastBlobUrl: null,
};

/* ---------- utilidades UI ---------- */
function toast(msg, isErr) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.className = 'toast'), 2600);
}
function toggle(id) { $(id).classList.toggle('open'); }
function setStatus(kind, txt) {
  const d = $('statusDot');
  d.className = 'dot' + (kind === 'ok' ? ' on' : kind === 'err' ? ' err' : '');
  $('statusTxt').textContent = txt;
}
function normalizeUrl(u) {
  u = (u || '').trim().replace(/\/+$/, '');
  if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}
function headers(extra) {
  const h = Object.assign({}, extra || {});
  if (state.token) h['Authorization'] = 'Bearer ' + state.token;
  return h;
}

/* ---------- persistencia ---------- */
function saveConfig() {
  try {
    localStorage.setItem('cm_cfg', JSON.stringify({
      server: state.server, token: state.token,
      positive: $('positive').value, negative: $('negative').value,
      width: $('width').value, height: $('height').value,
      steps: $('steps').value, cfg: $('cfg').value,
      sampler: $('sampler').value, scheduler: $('scheduler').value,
      seed: $('seed').value, batch: $('batch').value, ckpt: $('ckpt').value,
    }));
  } catch (_) {}
}
function loadConfig() {
  try {
    const c = JSON.parse(localStorage.getItem('cm_cfg') || '{}');
    if (c.server) $('serverUrl').value = c.server;
    if (c.token) $('authToken').value = c.token;
    ['positive','negative','width','height','steps','cfg','seed','batch'].forEach(k => {
      if (c[k] != null && c[k] !== '') $(k).value = c[k];
    });
    if (c.sampler) $('sampler').value = c.sampler;
    if (c.scheduler) $('scheduler').value = c.scheduler;
    state._pendingCkpt = c.ckpt || '';
  } catch (_) {}
}

/* ---------- conexión ---------- */
async function connect() {
  state.server = normalizeUrl($('serverUrl').value);
  state.token = $('authToken').value.trim();
  if (!state.server) { toast('Escribe la URL del servidor', true); return; }

  const btn = $('connectBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Conectando…';
  setStatus('', 'conectando…');

  try {
    const r = await fetch(state.server + '/system_stats', { headers: headers(), mode: 'cors' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const stats = await r.json();
    state.connected = true;
    saveConfig();

    const gpu = (stats.devices && stats.devices[0] && stats.devices[0].name) || 'GPU';
    setStatus('ok', gpu.slice(0, 22));
    $('connHint').innerHTML = '✅ Conectado a <b>' + escapeHtml(gpu) + '</b>';
    toast('¡Conectado a la GPU!');
    $('connCard').classList.remove('open');
    await loadModels();
  } catch (e) {
    state.connected = false;
    setStatus('err', 'sin conexión');
    $('connHint').innerHTML =
      '❌ No se pudo conectar. Revisa que la URL sea correcta, que ComfyUI esté arrancado con ' +
      '<code>--enable-cors-header</code> y que uses <b>https</b>. (' + escapeHtml(e.message) + ')';
    toast('Error de conexión', true);
  } finally {
    btn.disabled = false; btn.textContent = 'Conectar';
  }
}

async function loadModels() {
  try {
    const r = await fetch(state.server + '/object_info/CheckpointLoaderSimple', { headers: headers(), mode: 'cors' });
    if (!r.ok) throw new Error();
    const info = await r.json();
    const list = info.CheckpointLoaderSimple.input.required.ckpt_name[0] || [];
    const sel = $('ckpt');
    sel.innerHTML = '';
    if (!list.length) { sel.innerHTML = '<option value="">(no hay checkpoints)</option>'; return; }
    list.forEach(name => {
      const o = document.createElement('option');
      o.value = name; o.textContent = name;
      sel.appendChild(o);
    });
    if (state._pendingCkpt && list.includes(state._pendingCkpt)) sel.value = state._pendingCkpt;
  } catch (_) {
    $('ckpt').innerHTML = '<option value="">(no se pudieron cargar los modelos)</option>';
  }
}

/* ---------- construcción del workflow (API format) ---------- */
function buildPrompt() {
  let seed = parseInt($('seed').value, 10);
  if (isNaN(seed) || seed < 0) seed = Math.floor(Math.random() * 1e15);
  return {
    graph: {
      '4': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: $('ckpt').value } },
      '5': { class_type: 'EmptyLatentImage', inputs: {
        width: clampInt($('width').value, 256, 2048, 768),
        height: clampInt($('height').value, 256, 2048, 768),
        batch_size: clampInt($('batch').value, 1, 8, 1) } },
      '6': { class_type: 'CLIPTextEncode', inputs: { text: $('positive').value || 'a photo', clip: ['4', 1] } },
      '7': { class_type: 'CLIPTextEncode', inputs: { text: $('negative').value || '', clip: ['4', 1] } },
      '3': { class_type: 'KSampler', inputs: {
        seed, steps: clampInt($('steps').value, 1, 150, 25),
        cfg: clampFloat($('cfg').value, 1, 30, 6.5),
        sampler_name: $('sampler').value, scheduler: $('scheduler').value,
        denoise: 1, model: ['4', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['5', 0] } },
      '8': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
      '9': { class_type: 'SaveImage', inputs: { filename_prefix: 'ComfyMobile', images: ['8', 0] } },
    },
    seed,
  };
}
function clampInt(v, min, max, def) { v = parseInt(v, 10); return isNaN(v) ? def : Math.min(max, Math.max(min, v)); }
function clampFloat(v, min, max, def) { v = parseFloat(v); return isNaN(v) ? def : Math.min(max, Math.max(min, v)); }

/* ---------- generación ---------- */
async function generate() {
  if (state.running) return;
  if (!state.connected) { toast('Conéctate a la GPU primero', true); $('connCard').classList.add('open'); return; }
  if (!$('ckpt').value) { toast('Selecciona un modelo', true); $('advCard').classList.add('open'); return; }

  saveConfig();
  const { graph } = buildPrompt();
  const btn = $('genBtn');
  state.running = true;
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Generando…';
  showProgress(true, 0, 'En cola…');

  try {
    openSocket(); // asegura ws vivo para el progreso en vivo
    const r = await fetch(state.server + '/prompt', {
      method: 'POST', mode: 'cors',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prompt: graph, client_id: state.clientId }),
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error('El servidor rechazó el prompt (' + r.status + '). ' + t.slice(0, 140));
    }
    const { prompt_id } = await r.json();
    state.currentPromptId = prompt_id;
    // El WebSocket da el progreso; el sondeo del history detecta el final (robusto aunque el ws falle).
    startPolling(prompt_id);
  } catch (e) {
    finishRun();
    showProgress(false);
    toast(e.message || 'Error al generar', true);
  }
}

// Una sola cadena de sondeo por prompt. startPolling es idempotente.
function startPolling(pid) {
  if (state.polling === pid) return;
  state.polling = pid;
  pollHistory(pid, 0);
}

function pollHistory(pid, tries) {
  if (!state.running || state.currentPromptId !== pid) { state.polling = null; return; }
  if (tries > 600) { // ~10 min de margen
    state.polling = null; finishRun(); showProgress(false);
    toast('Tiempo de espera agotado', true); return;
  }
  fetch(state.server + '/history/' + pid, { headers: headers(), mode: 'cors' })
    .then(r => r.ok ? r.json() : {})
    .then(h => {
      const entry = h && h[pid];
      const imgs = (entry && entry.outputs) ? collectImages(entry.outputs) : [];
      if (imgs.length) { state.polling = null; onImages(imgs); return; }
      setTimeout(() => pollHistory(pid, tries + 1), 1000);
    })
    .catch(() => setTimeout(() => pollHistory(pid, tries + 1), 1500));
}

function collectImages(outputs) {
  const out = [];
  Object.values(outputs || {}).forEach(node => {
    (node && node.images || []).forEach(img => {
      if (img.type === 'temp') return;
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      out.push(state.server + '/view?' + q.toString());
    });
  });
  return out;
}

async function onImages(urls) {
  finishRun();
  showProgress(true, 100, 'Descargando…');
  try {
    const primary = urls[urls.length - 1];
    const blobUrl = await toBlobUrl(primary);
    setResult(blobUrl);
    for (const u of urls) {
      const bu = (u === primary) ? blobUrl : await toBlobUrl(u);
      addThumb(bu);
    }
    toast('¡Imagen lista! ✨');
  } catch (e) {
    toast('Generada, pero no se pudo cargar la imagen', true);
  } finally {
    showProgress(false);
  }
}

async function toBlobUrl(url) {
  const r = await fetch(url, { headers: headers(), mode: 'cors' });
  const b = await r.blob();
  return URL.createObjectURL(b);
}

function setResult(blobUrl) {
  const img = $('resultImg');
  img.src = blobUrl;
  $('stage').classList.add('has-img');
  $('placeholder').style.display = 'none';
  state.lastBlobUrl = blobUrl;
  $('saveBtn').disabled = false;
}
function addThumb(blobUrl) {
  const t = document.createElement('img');
  t.src = blobUrl;
  t.onclick = () => setResult(blobUrl);
  $('thumbs').prepend(t);
  while ($('thumbs').children.length > 12) $('thumbs').lastChild.remove();
}

/* ---------- WebSocket (progreso en vivo + preview) ---------- */
function openSocket() {
  if (state.ws && (state.ws.readyState === 0 || state.ws.readyState === 1)) return;
  try {
    const wsUrl = state.server.replace(/^http/i, 'ws') + '/ws?clientId=' + state.clientId;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    ws.onmessage = onSocketMessage;
    ws.onclose = () => { state.ws = null; };
    ws.onerror = () => {}; // el polling es el respaldo
    state.ws = ws;
  } catch (_) {}
}

function onSocketMessage(ev) {
  if (typeof ev.data !== 'string') { handlePreview(ev.data); return; }
  let msg; try { msg = JSON.parse(ev.data); } catch (_) { return; }
  const d = msg.data || {};
  if (state.currentPromptId && d.prompt_id && d.prompt_id !== state.currentPromptId) return;

  if (msg.type === 'progress' && d.max) {
    const pct = Math.round((d.value / d.max) * 100);
    showProgress(true, pct, 'Difundiendo… paso ' + d.value + '/' + d.max);
  } else if (msg.type === 'executing') {
    if (d.node === null && state.running) {
      // ejecución terminada: aseguramos que el sondeo siga vivo para recoger la imagen
      if (state.currentPromptId) startPolling(state.currentPromptId);
    } else if (d.node) {
      showProgress(true, null, 'Procesando nodo…');
    }
  } else if (msg.type === 'execution_error') {
    finishRun(); showProgress(false);
    toast('Error de ejecución en la GPU', true);
  }
}

function handlePreview(buf) {
  try {
    const view = new DataView(buf);
    const imgType = view.getUint32(0); // primeros 4 bytes: tipo de evento; siguientes 4: tipo de imagen
    const mime = imgType === 2 ? 'image/png' : 'image/jpeg';
    const blob = new Blob([buf.slice(8)], { type: mime });
    const url = URL.createObjectURL(blob);
    const img = $('resultImg');
    if (img._prev) URL.revokeObjectURL(img._prev);
    img._prev = url;
    img.src = url;
    $('stage').classList.add('has-img');
    $('placeholder').style.display = 'none';
  } catch (_) {}
}

/* ---------- progreso / estado ---------- */
function showProgress(show, pct, label) {
  $('progWrap').classList.toggle('show', !!show);
  if (label != null) $('progLabel').textContent = label;
  if (pct != null) {
    $('progBar').style.width = pct + '%';
    $('progPct').textContent = pct + '%';
  }
}
function finishRun() {
  state.running = false;
  const btn = $('genBtn');
  btn.disabled = false; btn.textContent = 'Generar';
}

/* ---------- guardar / compartir ---------- */
async function saveImage() {
  if (!state.lastBlobUrl) return;
  try {
    const blob = await (await fetch(state.lastBlobUrl)).blob();
    const file = new File([blob], 'comfymobile-' + Date.now() + '.png', { type: blob.type || 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'ComfyMobile' });
      return;
    }
    const a = document.createElement('a');
    a.href = state.lastBlobUrl; a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    toast('Descargando imagen…');
  } catch (e) {
    toast('No se pudo guardar', true);
  }
}

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }

/* ---------- init ---------- */
loadConfig();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if ($('serverUrl').value) { connect(); } // autoconecta si ya había servidor guardado
