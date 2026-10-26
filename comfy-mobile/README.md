# ComfyMobile 🎨

Una **app web (PWA)** para generar imágenes con IA desde tu móvil, conectándose a un
**ComfyUI que corre en una GPU en la nube** (RunPod, Vast.ai, etc.).

- ✅ Se instala en la pantalla de inicio (parece una app nativa).
- ✅ Interfaz pensada para el pulgar: prompt, ajustes, botón de generar.
- ✅ Progreso en vivo por WebSocket + vista previa mientras difunde.
- ✅ Guardar / compartir la imagen con el menú nativo del móvil.
- ✅ No guarda tu URL ni token en ningún servidor: todo vive en tu teléfono.

No necesitas GPU en el móvil: el teléfono solo es el mando a distancia. La GPU está en la nube.

---

## 1. Montar ComfyUI en una GPU (RunPod, ~5 min)

1. Crea cuenta en **[runpod.io](https://runpod.io)** y añade unos créditos.
2. **Deploy → Pods → GPU Cloud**. Elige una GPU (una RTX 4090 o A5000 sobra para empezar; ~0,3–0,7 $/h).
3. En *Template*, busca y elige **"ComfyUI"** (hay varias plantillas de la comunidad, p. ej. *comfyui* / *ai-dock/comfyui*).
4. **Importante:** en *Environment / Docker command* añade el flag para permitir CORS
   (sin esto el navegador bloqueará la conexión desde la app):

   ```
   --enable-cors-header *
   ```

   Muchas plantillas lo traen ya; si puedes editar el comando de arranque, asegúralo.
5. Despliega el pod. Cuando esté *Running*, pulsa **Connect** y copia la URL del
   puerto **8188** (algo como `https://xxxxxxxx-8188.proxy.runpod.net`). Debe ser **https**.
6. Descarga al menos un modelo (checkpoint). Muchas plantillas ya incluyen SD1.5 / SDXL.

> **Vast.ai u otro proveedor:** igual de válido. Solo necesitas la URL pública **https**
> del puerto 8188 y arrancar ComfyUI con `--enable-cors-header *`.

---

## 2. Publicar la app (para abrirla en el móvil)

La app son ficheros estáticos (`index.html`, `app.js`, ...). Necesita servirse por **https**
(igual que la GPU, para que el navegador no bloquee la mezcla http/https). Opciones:

- **Rápido:** súbela a Netlify Drop, Cloudflare Pages o GitHub Pages (arrastra la carpeta).
- **En tu droplet:** cópiala a Nginx y sírvela en una ruta, p. ej. `https://tu-dominio/comfy/`.
- **Local para probar:** `python3 -m http.server 8080` y abre desde el móvil en la misma red
  (para probar la conexión a la GPU necesitarás https en producción).

Luego abre la URL en el móvil → menú del navegador → **"Añadir a pantalla de inicio"**.
Ya tienes el icono como si fuera una app.

---

## 3. Usarla

1. Abre la app → **Conexión a la GPU** → pega la URL del puerto 8188 (y token si tu server lo pide).
2. Pulsa **Conectar**. Si va bien, verás el nombre de la GPU arriba a la derecha en verde.
3. Se cargan solos tus modelos. Elige uno en **Ajustes**.
4. Escribe tu **prompt**, pulsa **Generar**. Verás el progreso y la vista previa en vivo.
5. Toca **⬇️** para guardar o compartir la imagen.

---

## Solución de problemas

| Síntoma | Causa / arreglo |
|---|---|
| "No se pudo conectar" | La URL está mal, el pod no arrancó, o falta `--enable-cors-header *` en ComfyUI. |
| Conecta pero no genera | ¿Hay un checkpoint seleccionado en Ajustes? ¿El modelo está descargado en el pod? |
| Se bloquea la petición (mixed content) | La app va por **https** pero la GPU por **http**. Usa la URL **https** del proxy. |
| No hay modelos en la lista | El pod aún no tiene checkpoints descargados. Descárgalos en ComfyUI Manager. |
| La imagen no carga tras generar | El pod se reinició o el token caducó. Reconecta. |

---

## Detalles técnicos

- **100 % cliente**, sin backend propio. Habla directo con la API de ComfyUI:
  `GET /system_stats`, `GET /object_info`, `POST /prompt`, `GET /history/{id}`,
  `GET /view`, y el WebSocket `/ws` para progreso y previews.
- Construye el workflow txt2img estándar (Checkpoint → CLIP → KSampler → VAEDecode → SaveImage)
  en formato *API* y lo envía a `/prompt`.
- La detección del final es por sondeo de `/history` (robusta aunque el WebSocket falle);
  el WebSocket solo añade la barra de progreso y la vista previa en vivo.
- La configuración (URL, token, prompt, ajustes) se guarda en `localStorage`, solo en tu móvil.
- El service worker cachea **solo** el shell de la app; las llamadas a la GPU van siempre a la red.

Hecho para uso personal. Ajusta y amplía a gusto.
