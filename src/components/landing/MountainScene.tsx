'use client';

/**
 * MountainScene — Escena WebGL cinematográfica para la landing de AutomatizaWPP.
 *
 * Renderiza en vivo (no es vídeo) una cordillera generada con shaders GLSL:
 *  - Terreno desplazado con ruido fractal (fbm + ridged) formando un valle/corredor.
 *  - Rayos de luz atmosféricos azules entre los picos (shader de cielo).
 *  - Niebla volumétrica que reacciona a la velocidad de scroll.
 *  - Partículas tipo "mensaje" que viajan por el valle.
 *  - Profundidad de campo (BokehPass) + bloom (UnrealBloomPass) en escritorio.
 *
 * El scroll (Lenis) mueve físicamente la cámara a través de la cordillera.
 * Todo se actualiza por frame con requestAnimationFrame.
 *
 * Colores núcleo: #07111F (navy medianoche) y #38BDF8 (azul eléctrico WhatsApp/IA).
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export type ScrollState = { progress: number; velocity: number };

type Props = {
  /** Ref compartido alimentado por Lenis: progreso 0..1 y velocidad de scroll. */
  scrollRef: React.MutableRefObject<ScrollState>;
};

/* ──────────────────────────────────────────────────────────────────────────
 * GLSL compartido: ruido simplex 2D (Ashima) + fbm + ridged fbm.
 * ────────────────────────────────────────────────────────────────────────── */
const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0))
                          + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  for(int i = 0; i < 5; i++){
    v += a * snoise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v * 0.5 + 0.5;
}
float ridged(vec2 p){
  float v = 0.0;
  float a = 0.5;
  for(int i = 0; i < 5; i++){
    float n = 1.0 - abs(snoise(p));
    n *= n;
    v += a * n;
    p *= 2.05;
    a *= 0.5;
  }
  return v;
}
`;

export default function MountainScene({ scrollRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    // Postprocesado (DOF + bloom) solo en escritorio con movimiento permitido.
    const usePost = !prefersReduced && !isMobile;

    // ── Renderer ──
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance', alpha: false });
    } catch {
      // Sin WebGL: dejamos el fallback CSS del contenedor padre.
      mount.classList.add('lp-webgl-failed');
      return;
    }
    const getSize = () => ({ w: mount.clientWidth || window.innerWidth, h: mount.clientHeight || window.innerHeight });
    let { w, h } = getSize();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    mount.appendChild(renderer.domElement);

    // ── Escena y cámara ──
    const FOG = new THREE.Color(0x07111f);
    const scene = new THREE.Scene();
    scene.background = FOG;

    const camera = new THREE.PerspectiveCamera(56, w / h, 0.5, 2000);
    camera.position.set(0, 10, 60);
    scene.add(camera);

    const clock = new THREE.Clock();

    /* ── Terreno (cordillera) ── */
    const SEG = isMobile ? 120 : 220;
    const terrainGeo = new THREE.PlaneGeometry(420, 900, SEG, SEG);
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uVelocity: { value: 0 },
        uFogColor: { value: new THREE.Color(0x07111f) },
        uAccent: { value: new THREE.Color(0x38bdf8) },
      },
      vertexShader: /* glsl */ `
        ${NOISE_GLSL}
        uniform float uTime;
        varying float vH;
        varying float vFog;
        varying vec3 vNormalW;

        float terrainH(vec2 p){
          float corridor = smoothstep(12.0, 60.0, abs(p.x));
          float r = ridged(p * 0.016);
          float h = r * (3.0 + corridor * 78.0);
          h += (fbm(p * 0.05) - 0.5) * 6.0 * (0.35 + corridor);
          h += (fbm(p * 0.12) - 0.5) * 1.6;
          return h;
        }

        void main(){
          vec3 pos = position;
          float hh = terrainH(pos.xz);
          pos.y += hh;
          vH = hh;

          float e = 1.6;
          float hx = terrainH(pos.xz + vec2(e, 0.0));
          float hz = terrainH(pos.xz + vec2(0.0, e));
          vec3 nx = vec3(e, hx - hh, 0.0);
          vec3 nz = vec3(0.0, hz - hh, e);
          vec3 n = normalize(cross(nz, nx));
          if(n.y < 0.0) n = -n;
          vNormalW = n;

          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          vFog = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uVelocity;
        uniform vec3 uFogColor;
        uniform vec3 uAccent;
        varying float vH;
        varying float vFog;
        varying vec3 vNormalW;

        void main(){
          vec3 navy  = vec3(0.020, 0.050, 0.098);
          vec3 navy2 = vec3(0.035, 0.090, 0.165);
          vec3 L = normalize(vec3(0.18, 0.85, 0.45));
          float diff = clamp(dot(normalize(vNormalW), L), 0.0, 1.0);
          float hN = clamp(vH / 62.0, 0.0, 1.0);

          vec3 col = mix(navy, navy2, diff);
          col += uAccent * pow(hN, 1.7) * 0.30;        // brillo azul en los picos
          col += uAccent * diff * 0.06;                 // tinte atmosférico

          float fnear = 34.0;
          float ffar  = max(fnear + 24.0, 235.0 - uVelocity * 70.0);
          float f = smoothstep(fnear, ffar, vFog);
          col = mix(col, uFogColor, f);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.z = -360; // centra la cordillera por delante de la cámara
    scene.add(terrain);

    /* ── Cielo + rayos de luz (hijo de la cámara: siempre de fondo) ── */
    const skyMat = new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uVelocity: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        ${NOISE_GLSL}
        uniform float uTime;
        uniform float uVelocity;
        varying vec2 vUv;

        void main(){
          vec2 uv = vUv;
          vec3 top = vec3(0.012, 0.030, 0.062);
          vec3 hor = vec3(0.028, 0.085, 0.150);
          vec3 base = mix(hor, top, smoothstep(0.32, 1.0, uv.y));

          // resplandor en el horizonte (entre los picos)
          float horizon = smoothstep(0.55, 0.18, abs(uv.y - 0.40));
          base += vec3(0.05, 0.17, 0.30) * horizon * 0.55;

          // rayos de luz: shafts verticales animados
          float t = uTime * 0.025;
          float shaft = fbm(vec2(uv.x * 7.0 + t, uv.x * 2.5 - t * 0.5));
          shaft = pow(clamp(shaft, 0.0, 1.0), 2.6);
          float vMask = smoothstep(0.0, 0.55, uv.y) * (0.55 + 0.45 * uv.y);
          float rays = shaft * vMask * (0.45 + uVelocity * 1.6);
          base += vec3(0.13, 0.50, 0.85) * rays * 0.55;

          // viñeta suave
          float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
          base *= 0.65 + 0.35 * vig;

          gl_FragColor = vec4(base, 1.0);
        }
      `,
    });
    // Dimensiona el plano para cubrir el FOV a su distancia.
    const skyDist = 700;
    const skyH = 2 * Math.tan((camera.fov * Math.PI) / 180 / 2) * skyDist * 1.4;
    const skyW = skyH * Math.max(camera.aspect, 0.6) * 1.6;
    const skyGeo = new THREE.PlaneGeometry(skyW, skyH);
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.position.set(0, 0, -skyDist);
    sky.renderOrder = -1;
    camera.add(sky);

    /* ── Partículas tipo "mensaje" viajando por el valle ── */
    const P_COUNT = isMobile ? 140 : 300;
    const pPos = new Float32Array(P_COUNT * 3);
    const pSeed = new Float32Array(P_COUNT);
    const pSpeed = new Float32Array(P_COUNT);
    for (let i = 0; i < P_COUNT; i++) {
      pPos[i * 3 + 0] = (Math.random() - 0.5) * 26;            // x: dentro del corredor
      pPos[i * 3 + 1] = 3 + Math.random() * 22;                // y: sobre el suelo del valle
      pPos[i * 3 + 2] = -260 + Math.random() * 320;            // z
      pSeed[i] = Math.random();
      pSpeed[i] = 4 + Math.random() * 9;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aSeed', new THREE.BufferAttribute(pSeed, 1));
    pGeo.setAttribute('aSpeed', new THREE.BufferAttribute(pSpeed, 1));

    const pMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        attribute float aSpeed;
        uniform float uTime;
        varying float vSeed;
        void main(){
          vec3 p = position;
          float range = 330.0;
          p.z = mod(position.z + 270.0 + uTime * aSpeed, range) - 270.0;
          p.y += sin(uTime * 0.6 + aSeed * 6.2831) * 0.7;
          vSeed = aSeed;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (150.0 / max(-mv.z, 1.0)) * (0.6 + 0.7 * aSeed);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uTime;
        varying float vSeed;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.0, d);
          float pulse = 0.55 + 0.45 * sin(uTime * 2.0 + vSeed * 10.0);
          vec3 col = mix(vec3(0.22, 0.74, 0.97), vec3(0.55, 0.88, 1.0), vSeed);
          gl_FragColor = vec4(col, a * pulse * 0.85);
        }
      `,
    });
    const particles = new THREE.Points(pGeo, pMat);
    particles.frustumCulled = false;
    scene.add(particles);

    /* ── Postprocesado: DOF (bokeh) + bloom ── */
    let composer: EffectComposer | null = null;
    let bokeh: BokehPass | null = null;
    let bloom: UnrealBloomPass | null = null;
    if (usePost) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bokeh = new BokehPass(scene, camera, { focus: 95.0, aperture: 0.0009, maxblur: 0.011 });
      composer.addPass(bokeh);
      bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.5, 0.72);
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    }

    /* ── Resize ── */
    const onResize = () => {
      const s = getSize();
      w = s.w; h = s.h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
      bloom?.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    /* ── Visibilidad: pausa el RAF cuando no se ve ── */
    let visible = true;
    const io = new IntersectionObserver(
      (entries) => { visible = entries[0]?.isIntersecting ?? true; },
      { threshold: 0 }
    );
    io.observe(mount);
    const onVis = () => { if (document.hidden) visible = false; };
    document.addEventListener('visibilitychange', onVis);

    /* ── Bucle de animación ── */
    let raf = 0;
    let velSmooth = 0;
    const camTarget = new THREE.Vector3(0, 10, 60);
    const lookTarget = new THREE.Vector3(0, 6, 0);

    const renderStatic = () => {
      // Un frame para movimiento reducido / pestaña oculta.
      if (composer) composer.render();
      else renderer.render(scene, camera);
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;

      const t = clock.getElapsedTime();
      const st = scrollRef.current || { progress: 0, velocity: 0 };
      const vAbs = Math.min(Math.abs(st.velocity) / 30, 1.5);
      velSmooth += (vAbs - velSmooth) * 0.08;

      // La velocidad de scroll alimenta niebla y rayos.
      (terrainMat.uniforms.uVelocity.value as number) = velSmooth;
      (skyMat.uniforms.uVelocity.value as number) = velSmooth;
      terrainMat.uniforms.uTime.value = t;
      skyMat.uniforms.uTime.value = t;
      pMat.uniforms.uTime.value = t;

      // El scroll mueve físicamente la cámara a través de la cordillera.
      const p = st.progress;
      camTarget.z = 60 - p * 320;
      camTarget.y = 10 + Math.sin(t * 0.22) * 0.8 + velSmooth * 1.2;
      camTarget.x = Math.sin(t * 0.11) * 1.6;
      camera.position.lerp(camTarget, 0.055);

      lookTarget.set(camTarget.x * 0.3, camera.position.y - 3.0, camera.position.z - 36);
      camera.lookAt(lookTarget);

      if (composer) composer.render();
      else renderer.render(scene, camera);
    };

    if (prefersReduced) {
      // Render estático, sin bucle.
      camera.position.set(0, 11, 40);
      camera.lookAt(0, 6, -36);
      renderStatic();
    } else {
      animate();
    }

    /* ── Limpieza ── */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      io.disconnect();
      terrainGeo.dispose();
      terrainMat.dispose();
      skyGeo.dispose();
      skyMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [scrollRef]);

  return <div ref={mountRef} className="lp-webgl" aria-hidden="true" />;
}
