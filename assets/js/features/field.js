import { content } from '../core/content.js';
import { $, $$, clamp, finePointer, lerp, reduce, root, token } from '../core/env.js';
import { Theme } from './theme.js';

/* ------------------------------------------------------------------
   The particle field (Three.js)
   One Points cloud. Every particle has a place in six shapes: the name,
   a globe, a three-layer stack, a helix, "</>" and "HELLO". Scroll
   position picks two neighbouring shapes and how far to blend; the
   vertex shader does the travelling, the swirl, the cursor force field
   and the click shockwave.
------------------------------------------------------------------ */
export const Field = (() => {
  const api = { ready: false, start() { }, boom() { }, tint() { }, prism() { }, spell() { }, shape() { }, clear() { }, place() { }, word() { } };
  /* the loader may finish before three.js arrives: remember, and start once booted */
  let wantStart = false;
  api.start = () => { wantStart = true; };
  api.boot = () => {
  if (api.ready) return api;
  const canvas = $('#gl');
  const fail = () => { if (canvas) canvas.style.display = 'none'; root.classList.add('no-3d'); return api; };
  if (!canvas || typeof window.THREE === 'undefined') return fail();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { console.error(e); return fail(); }

  try {
    const FOV = 45, CAM_Z = 6;
    const N = innerWidth < 760 ? 14000 : 38000;
    /* hue pairs per chapter: name, globe, stack, helix, code, hello */
    /* hue pairs per chapter: name, globe, stack, graph, cube, helix, code, branch, hello */
    const HUES = [[38, 16], [190, 224], [262, 322], [96, 150], [14, 44], [168, 200], [50, 92], [226, 268], [352, 318]];
    const LAST = HUES.length - 1;
    const NAME_LIGHT = [224, 204];                       /* light theme: the name is blue */
    const huesOf = k => (k === 0 && Theme.current() !== 'dark' ? NAME_LIGHT : HUES[k]);

    const VERT = `
  attribute vec3 aTo;
  attribute vec3 aCustom;
  attribute vec4 aSeed;
  uniform float uTime, uMix, uIntro, uBoom, uPx, uSize, uTintAmt, uPrism, uGain;
  uniform vec2 uScale, uRot, uTilt, uAlpha;
  uniform vec3 uOffA, uOffB, uMouse, uShock, uC1A, uC2A, uC1B, uC2B, uTint;
  uniform float uCustom;
  uniform vec3 uCus, uOffC, uCusA, uCusB;   /* uCus = rotation, tilt, scale */
  varying vec3 vColor;
  varying float vAlpha;

  vec3 place(vec3 p, float rot, float tilt, float scale, vec3 off) {
    float c = cos(rot), s = sin(rot);
    p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
    float ct = cos(tilt), st = sin(tilt);
    p = vec3(p.x, ct * p.y - st * p.z, st * p.y + ct * p.z);
    return p * scale + off;
  }
  vec3 hue(float h) {
    return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  }

  void main() {
    float dust = step(0.92, aSeed.w);
    vec3 dir = normalize(aSeed.xyz * 2.0 - 1.0 + 0.0001);

    /* travel from shape A to shape B, each particle leaving at its own moment */
    float delay = aSeed.x * 0.45;
    float e = smoothstep(delay, delay + 0.55, uMix);
    vec3 a = place(position, uRot.x, uTilt.x, uScale.x, uOffA);
    vec3 b = place(aTo, uRot.y, uTilt.y, uScale.y, uOffB);
    vec3 w = mix(a, b, e);
    float mid = sin(e * 3.14159265);
    w += dir * mid * (0.35 + aSeed.y * 0.9);
    float ang = mid * 1.6 * (aSeed.z - 0.5);
    w.xy = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * w.xy;

    /* a word the visitor typed, or a secret shape, takes over the whole cloud */
    float ec = smoothstep(aSeed.z * 0.4, aSeed.z * 0.4 + 0.6, uCustom);
    float midc = sin(ec * 3.14159265);
    w = mix(w, place(aCustom, uCus.x, uCus.y, uCus.z, uOffC), ec) + dir * midc * (0.3 + aSeed.x * 0.8);

    /* dust never joins a shape: it just drifts, for depth */
    vec3 drift = vec3(sin(uTime * 0.11 + aSeed.x * 30.0), cos(uTime * 0.09 + aSeed.y * 30.0), sin(uTime * 0.07 + aSeed.z * 30.0));
    w = mix(w, position + drift * 0.35, dust);

    /* breathing */
    w += 0.011 * vec3(sin(uTime * 0.9 + aSeed.x * 40.0), cos(uTime * 0.8 + aSeed.y * 40.0), sin(uTime * 0.7 + aSeed.z * 40.0));

    /* intro: everything flies in from a shell around the camera */
    float ie = smoothstep(aSeed.y * 0.5, aSeed.y * 0.5 + 0.5, uIntro);
    ie = 1.0 - pow(1.0 - ie, 3.0);
    w = mix(dir * (3.5 + aSeed.w * 5.0), w, ie);

    /* cursor force field */
    vec2 dm = w.xy - uMouse.xy;
    float f = uMouse.z * exp(-dot(dm, dm) / 0.16);
    w.xy += normalize(dm + 0.0001) * f * 0.45;
    w.z += f * 0.6;

    /* click shockwave: a ring that travels outwards */
    float age = uTime - uShock.z;
    if (age > 0.0 && age < 4.0) {
      vec2 ds = w.xy - uShock.xy;
      float r = length(ds);
      float q = (r - age * 3.2) * 2.2;
      float ring = exp(-q * q) * exp(-age * 1.1);
      w.xy += normalize(ds + 0.0001) * ring * 0.42;
      w.z += ring * 0.5;
    }

    /* all bugs fixed: one big burst */
    w += dir * uBoom * (1.2 + aSeed.x * 3.2);

    vec4 mv = modelViewMatrix * vec4(w, 1.0);
    gl_Position = projectionMatrix * mv;
    float sz = mix(0.55 + aSeed.z * 1.1, 0.5 + aSeed.z * 0.6, dust);
    gl_PointSize = uSize * sz * uPx * (${CAM_Z.toFixed(1)} / max(0.5, -mv.z)) * (1.0 + f * 1.5 + mid * 0.6 + midc * 0.6);

    vec3 col = mix(mix(uC1A, uC2A, aSeed.x), mix(uC1B, uC2B, aSeed.x), e);
    col = mix(col, mix(uTint, vec3(1.0), aSeed.y * 0.25), uTintAmt * (1.0 - dust));
    col = mix(col, mix(uCusA, uCusB, aSeed.x), ec * (1.0 - dust));
    col = mix(col, mix(hue(aSeed.x + uTime * 0.04 + w.x * 0.08), col, 0.25), uPrism);
    vColor = col;

    float twinkle = 0.78 + 0.22 * sin(uTime * 2.2 + aSeed.w * 60.0);
    float alpha = mix(mix(mix(uAlpha.x, uAlpha.y, e), 1.0, ec), 0.5, dust);
    vAlpha = alpha * twinkle * uGain * ie;
  }
`;
    const FRAG = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = a * a + smoothstep(0.2, 0.0, d) * 0.6;   /* soft halo with a hot core */
    gl_FragColor = vec4(vColor, min(1.0, a) * vAlpha);
  }
`;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.z = CAM_Z;

    const U = {
      uTime: { value: 0 }, uMix: { value: 0 }, uIntro: { value: reduce ? 1 : 0 }, uBoom: { value: 0 },
      uPx: { value: 1 }, uSize: { value: 2.3 }, uTintAmt: { value: 0 }, uPrism: { value: 0 }, uGain: { value: 0.6 },
      uScale: { value: new THREE.Vector2(1, 1) }, uRot: { value: new THREE.Vector2() }, uTilt: { value: new THREE.Vector2() }, uAlpha: { value: new THREE.Vector2(1, 1) },
      uOffA: { value: new THREE.Vector3() }, uOffB: { value: new THREE.Vector3() },
      uMouse: { value: new THREE.Vector3(0, 0, 0) }, uShock: { value: new THREE.Vector3(0, 0, -99) },
      uC1A: { value: new THREE.Color() }, uC2A: { value: new THREE.Color() }, uC1B: { value: new THREE.Color() }, uC2B: { value: new THREE.Color() },
      uTint: { value: new THREE.Color() },
      uCustom: { value: 0 }, uCus: { value: new THREE.Vector3(0, 0, 1) }, uOffC: { value: new THREE.Vector3() },
      uCusA: { value: new THREE.Color() }, uCusB: { value: new THREE.Color() }
    };

    /* per-particle randomness, and the fixed homes of the dust */
    /* The portrait behind the name: points sampled from the owner's photo.
       4 bytes each: x, y, z, brightness (0-255). A full 3D bust (71k points): z uses the same scale as x/y,
       0 = back of the head, ~173 = the nose tip. From portrait-legacy.js. */
    const PORTRAIT = window.PORTRAIT_POINTS || '';          /* from portrait.js, loaded lazily */
    /* the photo the bust was made from (me.png, 160px): hovering paints its real colours back onto the points */
    const PORTRAIT_PHOTO = window.PORTRAIT_PHOTO || '';

    const seeds = new Float32Array(N * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    const isDust = i => seeds[i * 4 + 3] > 0.92;
    const dustHome = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      dustHome[i * 3] = (Math.random() - 0.5) * 10;
      dustHome[i * 3 + 1] = (Math.random() - 0.5) * 6;
      dustHome[i * 3 + 2] = -3.2 + Math.random() * 4.4;
    }

    /* ---- shape builders: each fills a Float32Array(N * 3) ---- */
    function fill(fn) {
      const out = new Float32Array(N * 3), p = [0, 0, 0];
      for (let i = 0; i < N; i++) {
        if (isDust(i)) { out[i * 3] = dustHome[i * 3]; out[i * 3 + 1] = dustHome[i * 3 + 1]; out[i * 3 + 2] = dustHome[i * 3 + 2]; continue; }
        fn(p, i);
        out[i * 3] = p[0]; out[i * 3 + 1] = p[1]; out[i * 3 + 2] = p[2];
      }
      return out;
    }

    /* Draw text on a 2D canvas and keep the pixels that are filled. Returns a sampler, or null if nothing was drawn. */
    function textPoints(lines) {
      const cw = 1600, pad = 110, fit = cw - 2 * pad;
      const c = document.createElement('canvas');
      const g = c.getContext('2d', { willReadFrequently: true });
      const family = token('--font-display') || 'Arial, sans-serif';
      const font = px => `800 ${px}px ${family}`;
      const one = Math.min(...lines.map(t => { g.font = font(200); return Math.min(620, (200 * fit) / Math.max(1, g.measureText(t).width)); }));
      const sizes = lines.map(() => one);   /* same letter size on every line; the widest line sets it */
      const gap = 0.9;
      const ch = Math.ceil(sizes.reduce((s, v) => s + v * gap, 0) + 2 * pad);
      c.width = cw; c.height = ch;
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let y = pad;
      lines.forEach((t, k) => { g.font = font(sizes[k]); g.fillText(t, cw / 2, y + sizes[k] * gap * 0.5); y += sizes[k] * gap; });

      const data = g.getImageData(0, 0, cw, ch).data;
      const pts = [];
      let minX = cw, maxX = 0, minY = ch, maxY = 0;
      for (let yy = 0; yy < ch; yy += 3) {
        for (let xx = 0; xx < cw; xx += 3) {
          if (data[(yy * cw + xx) * 4 + 3] > 128) {
            pts.push(xx, yy);
            if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (yy < minY) minY = yy; if (yy > maxY) maxY = yy;
          }
        }
      }
      const m = pts.length / 2;
      if (!m) return null;
      const half = (maxX - minX) / 2 || 1, cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      /* one random point of the lettering; the text is 2 units wide and centred on the origin */
      const sampler = (p, tall) => {
        const k = (Math.random() * m) | 0;
        p[0] = (pts[k * 2] + (Math.random() - 0.5) * 3 - cx) / half;
        p[1] = (-(pts[k * 2 + 1] + (Math.random() - 0.5) * 3 - cy) / half) * tall;
        p[2] = (Math.random() - 0.5) * 0.05;
      };
      /* how the lettering was laid out, so a plate can be drawn exactly behind it */
      sampler.meta = { lines, sizes, gap, pad, cw, ch, cx, cy, half, font };
      return sampler;
    }
    function textShape(lines, tall = 1) {
      const sample = textPoints(lines);
      if (!sample) return fill(p => { const a = Math.random() * 6.283; p[0] = Math.cos(a); p[1] = Math.sin(a) * 0.3; p[2] = 0; });
      const out = fill(p => sample(p, tall));
      out.meta = Object.assign({ tall }, sample.meta);
      return out;
    }

    /* A globe: sphere, an orbit ring, and a pin standing on each place given. */
    const rad = d => (d * Math.PI) / 180;
    const onGlobe = ([lat, lon]) => [Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat)), Math.cos(rad(lat)) * Math.cos(rad(lon))];
    function globePoint(p, pins) {
      const r = Math.random();
      if (r < 0.8) {
        const y = 1 - 2 * Math.random(), rr0 = Math.sqrt(1 - y * y), a = Math.random() * 6.2832;
        /* snap most points to latitude / longitude lines so it reads as a globe */
        const snap = Math.random();
        let yy = y, aa = a;
        if (snap < 0.42) yy = Math.round(y * 7) / 7; else if (snap < 0.8) aa = Math.round(a / 6.2832 * 14) / 14 * 6.2832;
        const rr = snap < 0.42 ? Math.sqrt(Math.max(0, 1 - yy * yy)) : rr0;
        p[0] = rr * Math.cos(aa); p[1] = yy; p[2] = rr * Math.sin(aa);
      } else if (r < 0.93) {
        const a = Math.random() * 6.2832, d = 1.42 + (Math.random() - 0.5) * 0.05;
        const x = d * Math.cos(a), z = d * Math.sin(a);
        p[0] = x; p[1] = z * 0.38 + (Math.random() - 0.5) * 0.02; p[2] = z * 0.92;
      } else {
        /* the first pin is the main one and gets most of the points */
        const pin = pins[pins.length > 1 && Math.random() > 0.62 ? 1 + ((Math.random() * (pins.length - 1)) | 0) : 0];
        const t = Math.random(), tip = t > 0.7;
        const d = tip ? 1.34 : 1 + t * 0.48, j = tip ? 0.07 : 0.012;
        p[0] = pin[0] * d + (Math.random() - 0.5) * j; p[1] = pin[1] * d + (Math.random() - 0.5) * j; p[2] = pin[2] * d + (Math.random() - 0.5) * j;
      }
    }
    function globeShape() {
      const pins = [onGlobe([23.8, 90.4])];   /* Dhaka */
      return fill(p => globePoint(p, pins));
    }

    /* A globe turned so the first pin faces the viewer (up and to the right), with the place name written underneath.
       The whole thing is about 2.9 units wide and 3.5 tall, centred on the origin. */
    const PLACE = { halfW: 1.45, halfH: 1.75 };
    function placeShape(pins, label) {
      const vec = pins.map(onGlobe);
      const rot = 0.5 - rad(pins[0][1]), tilt = rad(pins[0][0]) - 0.42;
      const c = Math.cos(rot), s = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
      const sample = label ? textPoints([label]) : null;
      const lw = Math.min(1.4, 0.17 * label.length);
      return fill(p => {
        if (sample && Math.random() < 0.22) { sample(p, 1.25); p[0] *= lw; p[1] = p[1] * lw - 1.5; return; }
        globePoint(p, vec);
        const x = c * p[0] + s * p[2], z = -s * p[0] + c * p[2], y = p[1];
        p[0] = x; p[1] = ct * y - st * z + 0.35; p[2] = st * y + ct * z;
      });
    }

    /* Three floating layers: database, API, interface. */
    function stackShape() {
      return fill(p => {
        const layer = (Math.random() * 3) | 0, y = (layer - 1) * 0.62, half = 0.92 - layer * 0.06;
        if (Math.random() < 0.42) {
          const side = (Math.random() * 4) | 0, t = (Math.random() * 2 - 1) * half;
          p[0] = side < 2 ? t : (side === 2 ? half : -half);
          p[2] = side < 2 ? (side === 0 ? half : -half) : t;
        } else {
          /* a grid of dots on each layer */
          const g = 9;
          p[0] = (Math.round(Math.random() * g) / g * 2 - 1) * half + (Math.random() - 0.5) * 0.02;
          p[2] = (Math.round(Math.random() * g) / g * 2 - 1) * half + (Math.random() - 0.5) * 0.02;
        }
        p[1] = y + (Math.random() - 0.5) * 0.025;
      });
    }

    /* A double helix with rungs. */
    function helixShape() {
      return fill(p => {
        const rung = Math.random() < 0.26;
        const t = rung ? Math.round(Math.random() * 26) / 26 : Math.random();
        const a = t * 6.2832 * 2.4, y = -1.2 + 2.4 * t, R = 0.46;
        if (rung) {
          const k = Math.random() * 2 - 1;
          p[0] = Math.cos(a) * R * k; p[1] = y; p[2] = Math.sin(a) * R * k;
        } else {
          const s = Math.random() < 0.5 ? 1 : -1, j = 0.03;
          p[0] = Math.cos(a) * R * s + (Math.random() - 0.5) * j; p[1] = y + (Math.random() - 0.5) * j; p[2] = Math.sin(a) * R * s + (Math.random() - 0.5) * j;
        }
      });
    }

    const geo = new THREE.BufferGeometry();
    const aFrom = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
    const aTo = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
    geo.setAttribute('position', aFrom);
    geo.setAttribute('aTo', aTo);
    const aCus = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
    geo.setAttribute('aCustom', aCus);
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    const cloud = new THREE.Points(geo, mat);
    cloud.frustumCulled = false;
    scene.add(cloud);

    /* ---- the portrait: its own cloud, drawn behind the name, only in the hero ---- */
    const PU = {
      uTime: U.uTime, uIntro: U.uIntro, uPx: U.uPx, uMouse: U.uMouse, uBoom: U.uBoom,      /* shared with the main cloud */
      uSize: { value: 2.4 }, uFade: { value: 1 }, uLight: { value: 0 }, uGain: { value: 0.8 },
      uBox: { value: new THREE.Vector3(0, 0, 1) }, uTurn: { value: new THREE.Vector2() },
      uColA: { value: new THREE.Color() }, uColB: { value: new THREE.Color() },
      uPhoto: { value: null }, uPaint: { value: null }, uHasPhoto: { value: 0 }
    };

    /* Paint: a small mask over the portrait. One pass of the pointer reveals the photo's real
       colours; they hold for PAINT_HOLD seconds, then that patch vaporises: its points lift off
       as particles, lose the colour, and settle back home as the glow. */
    const PAINT = 64, PAINT_RADIUS = 11, PAINT_HOLD = 5, PAINT_VAPOUR = 1.2;
    const paintMask = new Float32Array(PAINT * PAINT), paintAge = new Float32Array(PAINT * PAINT), paintVap = new Float32Array(PAINT * PAINT);
    const paintPx = new Uint8Array(PAINT * PAINT * 4);
    const paintTex = new THREE.DataTexture(paintPx, PAINT, PAINT, THREE.RGBAFormat);
    paintTex.magFilter = paintTex.minFilter = THREE.LinearFilter;
    paintTex.needsUpdate = true;
    PU.uPaint.value = paintTex;
    let paintLive = false, lastBrush = null;
    if (PORTRAIT_PHOTO) new THREE.TextureLoader().load(PORTRAIT_PHOTO, tex => {
      tex.minFilter = tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      PU.uPhoto.value = tex;
      PU.uHasPhoto.value = 1;
    });
    /* u, v: 0..1 across the portrait, v pointing up */
    function brush(u, v) {
      const r = PAINT_RADIUS, cx = u * PAINT, cy = v * PAINT;
      for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(PAINT - 1, Math.ceil(cy + r)); y++)
        for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(PAINT - 1, Math.ceil(cx + r)); x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
          if (d >= 1) continue;
          const i = y * PAINT + x, full = Math.min(1, (1 - d) / 0.35);   /* solid in the middle, soft rim */
          if (full > paintMask[i] || paintVap[i] > 0) { paintMask[i] = Math.max(full, paintVap[i] > 0 ? 0 : paintMask[i]); paintVap[i] = 0; }
          if (full > 0.3) paintAge[i] = 0;                                /* brushing again restarts the hold */
        }
      paintLive = true;
    }
    function paintStep(dt) {
      if (!paintLive) return;
      let any = false;
      for (let i = 0; i < paintMask.length; i++) {
        if (paintMask[i] > 0) {
          any = true;
          paintAge[i] += dt;
          if (paintAge[i] > PAINT_HOLD) {
            paintVap[i] += dt / PAINT_VAPOUR;
            if (paintVap[i] >= 1) { paintMask[i] = 0; paintVap[i] = 0; paintAge[i] = 0; }
          }
        }
        const vp = paintVap[i];
        paintPx[i * 4] = (paintMask[i] * (1 - vp) * 255) | 0;                /* R: how much colour shows */
        paintPx[i * 4 + 1] = (Math.sin(vp * Math.PI) * 255) | 0;             /* G: how far its points have lifted off */
      }
      paintTex.needsUpdate = true;
      paintLive = any;
    }
    let portrait = null, pmat = null;
    if (PORTRAIT) try {
      const raw = atob(PORTRAIT), all = raw.length / 4, PN = Math.min(all, innerWidth < 760 ? 11000 : all);
      const pos = new Float32Array(PN * 3), lum = new Float32Array(PN), rnd = new Float32Array(PN * 4);
      /* z shares the x/y scale; centre the depth so the bust turns around its middle */
      let zMax = 0;
      for (let n = 0; n < all; n++) zMax = Math.max(zMax, raw.charCodeAt(n * 4 + 2));
      const zMid = zMax / 2;
      for (let n = 0; n < PN; n++) {
        pos[n * 3] = ((raw.charCodeAt(n * 4) + Math.random() - 0.5) / 255) * 2 - 1;
        pos[n * 3 + 1] = 1 - ((raw.charCodeAt(n * 4 + 1) + Math.random() - 0.5) / 255) * 2;
        pos[n * 3 + 2] = ((raw.charCodeAt(n * 4 + 2) - zMid + Math.random() - 0.5) / 255) * 2;
        lum[n] = raw.charCodeAt(n * 4 + 3) / 255;
      }
      for (let n = 0; n < rnd.length; n++) rnd[n] = Math.random();
      const pgeo = new THREE.BufferGeometry();
      pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      pgeo.setAttribute('aLum', new THREE.BufferAttribute(lum, 1));
      pgeo.setAttribute('aSeed', new THREE.BufferAttribute(rnd, 4));
      pmat = new THREE.ShaderMaterial({
        uniforms: PU, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `
      attribute float aLum;
      attribute vec4 aSeed;
      uniform float uTime, uIntro, uPx, uBoom, uSize, uFade, uLight, uGain;
      uniform vec3 uBox, uMouse, uColA, uColB;
      uniform vec2 uTurn;
      uniform sampler2D uPhoto, uPaint;
      uniform float uHasPhoto;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec3 dir = normalize(aSeed.xyz * 2.0 - 1.0 + 0.0001);

        /* where this point sits on the photo, and how much paint is on it */
        vec2 uv = position.xy * 0.5 + 0.5;
        vec4 paintTx = texture2D(uPaint, uv);
        float paint = uHasPhoto * paintTx.r;
        float vapour = uHasPhoto * paintTx.g;          /* 0..1..0 while a patch vaporises */
        vec3 photo = uHasPhoto > 0.5 ? texture2D(uPhoto, uv).rgb : vec3(0.0);

        /* a full bust, turned a little by the pointer */
        vec3 p = position;

        /* the bust is cut flat at the bottom: break that edge into a wavy line and let the
           points below it drift off and fade, like ash. They stay faint and close, so the
           name across the chest and the hero text keep reading cleanly. */
        float edge = -0.72 + 0.07 * sin(position.x * 7.0 + uTime * 0.7) + 0.04 * sin(position.x * 19.0 - uTime * 1.3);
        float melt = smoothstep(edge, -1.0, position.y);           /* 0 above the edge, 1 at the cut */
        float life = fract(uTime * 0.07 + aSeed.w * 3.0);           /* each point loops: leave, fade, return */
        float glow = sin(life * 3.14159265);
        p.x += (aSeed.x - 0.5) * 0.55 * melt * life;
        p.y -= 0.1 * melt * life + 0.04 * melt * sin(uTime * 0.8 + aSeed.z * 20.0);
        p.z += (aSeed.z - 0.5) * 0.35 * melt * life;

        float c = cos(uTurn.x), s = sin(uTurn.x);
        p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
        float ct = cos(uTurn.y), st = sin(uTurn.y);
        p = vec3(p.x, ct * p.y - st * p.z, st * p.y + ct * p.z);
        vec3 w = vec3(uBox.xy, 0.0) + p * uBox.z;
        w += 0.006 * vec3(sin(uTime * 0.9 + aSeed.x * 40.0), cos(uTime * 0.8 + aSeed.y * 40.0), sin(uTime * 0.7 + aSeed.z * 40.0));

        float ie = smoothstep(aSeed.y * 0.5, aSeed.y * 0.5 + 0.5, uIntro);
        ie = 1.0 - pow(1.0 - ie, 3.0);
        w = mix(dir * (3.5 + aSeed.w * 5.0), w, ie);

        /* scrolling on: the portrait drifts apart */
        float gone = 1.0 - uFade;
        w += dir * gone * gone * (0.6 + aSeed.x * 1.8);

        vec2 dm = w.xy - uMouse.xy;
        float f = uMouse.z * exp(-dot(dm, dm) / 0.07);     /* a small stir under the cursor, not a hole in the face */
        w.xy += normalize(dm + 0.0001) * f * 0.1;
        w.z += f * 0.25;

        /* vaporising: the patch's points lift off as particles, curl, and settle back home */
        vec3 rise = vec3((aSeed.x - 0.5) * 0.9, 0.55 + aSeed.y * 0.9, (aSeed.z - 0.5) * 0.6);
        rise.x += 0.25 * sin(uTime * 3.0 + aSeed.w * 30.0) * vapour;
        w += rise * vapour * (0.35 + aSeed.w * 0.45) * uBox.z * 0.5;
        w += dir * uBoom * (1.2 + aSeed.x * 3.2);

        vec4 mv = modelViewMatrix * vec4(w, 1.0);
        gl_Position = projectionMatrix * mv;

        /* dark theme draws the light parts of the photo, light theme draws the dark parts */
        float tone = mix(aLum, 1.0 - aLum, uLight);
        tone = 0.25 + 0.75 * pow(tone, 0.95);
        float low = 0.22 + 0.78 * smoothstep(-0.8, -0.2, position.y);    /* dissolves below the chin, where the name sits */
        float back = 0.3 + 0.7 * smoothstep(-0.5, 0.2, p.z);               /* the back of the head stays dim behind the face */
        float ash = mix(1.0, glow * 0.4, melt);                            /* the drifting bottom is faint */
        /* painted points take the photo's colour. On the dark theme the light adds up, so dark
           colours (hair, suit) are lifted a little to stay visible without losing their hue. */
        paint *= 1.0 - 0.7 * melt;
        vec3 lifted = pow(photo, vec3(0.8)) * 1.05 + 0.05;
        vec3 real = mix(lifted, photo, uLight);
        float m = max(photo.r, max(photo.g, photo.b));
        float paintTone = mix(0.55 + 0.45 * m, 0.95, uLight);
        tone = mix(tone, paintTone, paint);

        gl_PointSize = uSize * (0.7 + 0.7 * tone) * uPx * (6.0 / max(0.5, -mv.z)) * (1.0 + f) * mix(1.0, 0.55 + 0.5 * glow, melt) * (1.0 + 0.3 * paint);
        vColor = mix(mix(uColA, uColB, aLum), real, paint);
        vAlpha = tone * low * back * ash * uFade * ie * uGain * (0.8 + 0.2 * sin(uTime * 2.0 + aSeed.w * 60.0));
        vAlpha *= mix(1.0, 0.6, paint * (1.0 - uLight));     /* overlapping light would wash the colours out to white */
        vAlpha *= 1.0 - 0.55 * vapour;
        gl_PointSize *= 1.0 - 0.35 * vapour;
      }
    `
      });
      portrait = new THREE.Points(pgeo, pmat);
      portrait.frustumCulled = false;
      portrait.renderOrder = -1;                 /* behind the name */
      scene.add(portrait);
    } catch (e) { console.error(e); portrait = null; }

    let W = 1, H = 1, visW = 1, visH = 1, wide = true;
    /* An architecture graph: a hub, the services around it, and the links between them. */
    function graphShape() {
      const nodes = [[0, 0, 0, 0.24], [-0.95, 0.55, 0.2, 0.14], [0.9, 0.6, -0.25, 0.14], [-0.85, -0.6, -0.3, 0.14], [0.95, -0.5, 0.3, 0.14],
      [0, 1.05, -0.1, 0.12], [0, -1.05, 0.15, 0.12], [-0.3, 0.2, 0.9, 0.1], [0.35, -0.25, -0.9, 0.1]];
      const links = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [1, 5], [2, 5], [3, 6], [4, 6], [1, 3], [2, 4]];
      return fill(p => {
        if (Math.random() < 0.48) {
          const n = nodes[Math.random() < 0.25 ? 0 : 1 + ((Math.random() * (nodes.length - 1)) | 0)];
          const y = 1 - 2 * Math.random(), r = Math.sqrt(1 - y * y), a = Math.random() * 6.2832;
          p[0] = n[0] + r * Math.cos(a) * n[3]; p[1] = n[1] + y * n[3]; p[2] = n[2] + r * Math.sin(a) * n[3];
        } else {
          const l = links[(Math.random() * links.length) | 0], a = nodes[l[0]], b = nodes[l[1]], t = Math.random(), j = 0.014;
          p[0] = a[0] + (b[0] - a[0]) * t + (Math.random() - 0.5) * j;
          p[1] = a[1] + (b[1] - a[1]) * t + (Math.random() - 0.5) * j;
          p[2] = a[2] + (b[2] - a[2]) * t + (Math.random() - 0.5) * j;
        }
      });
    }

    /* A box inside a box, corners joined: something being built. */
    function cubeShape() {
      const corner = i => [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1];
      const edges = [];
      for (let i = 0; i < 8; i++) [1, 2, 4].forEach(bit => { if (!(i & bit)) edges.push([i, i | bit]); });
      return fill(p => {
        const r = Math.random(), t = Math.random(), j = 0.014;
        let a, b, sa, sb;
        if (r < 0.86) { const e = edges[(Math.random() * 12) | 0]; a = corner(e[0]); b = corner(e[1]); sa = sb = r < 0.56 ? 0.84 : 0.4; }
        else { a = b = corner((Math.random() * 8) | 0); sa = 0.4; sb = 0.84; }
        for (let k = 0; k < 3; k++) p[k] = a[k] * sa + (b[k] * sb - a[k] * sa) * t + (Math.random() - 0.5) * j;
      });
    }

    /* A commit graph: a main line, two branches that leave and merge back, a dot for each commit. */
    function branchShape() {
      const step = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
      const ax = t => 0.6 * (step(0, 0.2, t) - step(0.8, 1, t)), ay = t => lerp(-0.85, 0.85, t);
      const bx = t => -0.55 * (step(0, 0.25, t) - step(0.75, 1, t)), by = t => lerp(-0.25, 0.5, t);
      const commits = [[0, -1.15], [0, -0.85], [0, -0.25], [0, 0.5], [0, 0.85], [0, 1.15], [ax(0.35), ay(0.35)], [ax(0.6), ay(0.6)], [bx(0.5), by(0.5)]];
      return fill(p => {
        const r = Math.random(), j = 0.016;
        if (r < 0.26) { p[0] = 0; p[1] = lerp(-1.2, 1.2, Math.random()); }
        else if (r < 0.48) { const t = Math.random(); p[0] = ax(t); p[1] = ay(t); }
        else if (r < 0.62) { const t = Math.random(); p[0] = bx(t); p[1] = by(t); }
        else {
          const c = commits[(Math.random() * commits.length) | 0], a = Math.random() * 6.2832, d = Math.random() < 0.6 ? 0.1 : Math.sqrt(Math.random()) * 0.1;
          p[0] = c[0] + Math.cos(a) * d; p[1] = c[1] + Math.sin(a) * d;
        }
        p[0] += (Math.random() - 0.5) * j; p[1] += (Math.random() - 0.5) * j; p[2] = (Math.random() - 0.5) * 0.05;
      });
    }

    /* ---- the name's plates: a soft outline and shadow around every letter, so the
       name reads clearly over the portrait. The colour comes from --name-plate-edge, which
       changes with the theme. ---- */
    const plateCanvas = document.createElement('canvas');
    const plateTex = new THREE.CanvasTexture(plateCanvas);
    plateTex.minFilter = THREE.LinearFilter; plateTex.generateMipmaps = false;
    const PL = {
      uTex: { value: plateTex }, uRect: { value: new THREE.Vector4(-1, 1, 1, -1) },
      uPlace: { value: new THREE.Vector3(0, 0, 1) }, uOff: { value: new THREE.Vector3() }, uOpacity: { value: 0 }
    };
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: PL, transparent: true, depthTest: false, depthWrite: false,
      vertexShader: `
        uniform vec4 uRect;
        uniform vec3 uPlace, uOff;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec2 q = position.xy * 0.5 + 0.5;
          vec3 p = vec3(mix(uRect.x, uRect.y, q.x), mix(uRect.w, uRect.z, q.y), -0.03);
          float c = cos(uPlace.x), s = sin(uPlace.x);
          p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
          float ct = cos(uPlace.y), st = sin(uPlace.y);
          p = vec3(p.x, ct * p.y - st * p.z, st * p.y + ct * p.z);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p * uPlace.z + uOff, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          vec4 c = texture2D(uTex, vUv);
          gl_FragColor = vec4(c.rgb, c.a * uOpacity);
        }`
    }));
    plate.frustumCulled = false;
    plate.renderOrder = -0.5;                    /* in front of the portrait, behind the name's particles */
    plate.visible = false;
    scene.add(plate);
    cloud.renderOrder = 0;

    function drawPlate() {
      const M = shapes[0] && shapes[0].meta;
      if (!M) { plate.visible = false; return; }
      plateCanvas.width = M.cw; plateCanvas.height = M.ch;
      const g = plateCanvas.getContext('2d');
      g.clearRect(0, 0, M.cw, M.ch);
      const edge = token('--name-plate-edge') || 'rgba(6,7,11,0.92)';
      g.textBaseline = 'middle';
      let y = M.pad;
      M.lines.forEach((t, k) => {
        const size = M.sizes[k], mid = y + size * M.gap * 0.5;
        g.font = M.font(size);
        g.textAlign = 'left';
        /* a soft outline around each letter, and its inside darkened, so the particles stand out */
        g.textAlign = 'center';
        g.lineJoin = 'round';
        g.shadowColor = edge; g.shadowBlur = size * 0.14;
        g.strokeStyle = edge; g.lineWidth = size * 0.075;
        g.strokeText(t, M.cw / 2, mid);
        g.shadowBlur = 0;
        g.fillStyle = edge; g.fillText(t, M.cw / 2, mid);
        y += size * M.gap;
      });
      const tall = M.tall;
      PL.uRect.value.set(-M.cx / M.half, (M.cw - M.cx) / M.half, (M.cy / M.half) * tall, (-(M.ch - M.cy) / M.half) * tall);
      plateTex.needsUpdate = true;
    }

    let shapes = [], cur = -1;
    /* the name from content.json: one line on wide screens, split after the first word on tall ones */
    const nameLines = () => {
      const name = content.profile.name.toUpperCase(), cut = name.indexOf(' ');
      return wide || cut < 0 ? [name] : [name.slice(0, cut), name.slice(cut + 1)];
    };
    const sections =$$('[data-chapter]').filter(s => s.dataset.chapter !== '0').sort((a, b) => a.dataset.chapter - b.dataset.chapter);

    /* height of a shape relative to its width */
    const aspectOf = arr => {
      let lo = 9, hi = -9;
      for (let n = 0; n < N; n++) { if (isDust(n)) continue; const y = arr[n * 3 + 1]; if (y < lo) lo = y; if (y > hi) hi = y; }
      return Math.max(0.05, (hi - lo) / 2);
    };

    function build() {
      shapes = [
        textShape(nameLines(), wide ? 1.55 : 2.1),
        globeShape(), stackShape(), graphShape(), cubeShape(), helixShape(),
        textShape(['</>']),
        branchShape(),
        textShape(['HELLO'])
      ];
      nameAspect = aspectOf(shapes[0]);
      drawPlate();
      helloAspect = aspectOf(shapes[LAST]);
      cur = -1;
    }

    /* where each shape sits: x and y are fractions of the visible width and height */
    const LAYOUT = {
      wide: [
        { w: 0.8, x: 0, y: 0.035, a: 1 },                                  /* name */
        { r: 0.29, x: 0.25, y: -0.02, a: 0.95, spin: 1, tilt: 0.32 },     /* globe, right of About */
        { r: 0.3, x: 0.3, y: -0.02, a: 0.75, spin: 1, tilt: 0.5 },        /* stack, right of Work */
        { r: 0.25, x: -0.29, y: 0, a: 0.9, spin: 1, tilt: 0.25 },         /* graph, left of the case study */
        { r: 0.25, x: 0.29, y: 0, a: 0.85, spin: 1, tilt: 0.45 },         /* cube, right of Services */
        { r: 0.31, x: -0.29, y: 0, a: 0.9, spin: 1, tilt: 0.1 },          /* helix, left of Career */
        { w: 0.3, x: 0.27, y: 0, a: 0.9 },                                 /* </>, right of Skills */
        { r: 0.3, x: -0.29, y: 0, a: 0.9 },                                /* branch graph, left of Code */
        { w: 0.5, x: 0, y: 0.27, a: 1 }                                    /* hello */
      ],
      tall: [
        { w: 0.9, x: 0, y: 0.1, a: 1 },
        { rw: 0.4, x: 0, y: 0.06, a: 0.42, spin: 1, tilt: 0.32 },
        { rw: 0.36, x: 0, y: 0.02, a: 0.24, spin: 1, tilt: 0.5 },
        { rw: 0.34, x: 0, y: 0, a: 0.24, spin: 1, tilt: 0.25 },
        { rw: 0.34, x: 0, y: 0, a: 0.24, spin: 1, tilt: 0.45 },
        { rw: 0.3, x: 0, y: 0, a: 0.26, spin: 1, tilt: 0.1 },
        { w: 0.62, x: 0, y: 0.04, a: 0.2 },
        { rw: 0.4, x: 0, y: 0, a: 0.22 },
        { w: 0.8, x: 0, y: 0.3, a: 1 }
      ]
    };
    const scaleOf = L => (L.w ? (L.w * visW) / 2 : L.r ? L.r * visH : L.rw * visW);
    const helloAnchor = $('#contact .plate');
    const heroMeta = $('.hero__meta'), heroFoot = $('.hero__foot');
    let helloAspect = 0.3, nameAspect = 0.2;
    /* the square, in CSS pixels, that the portrait fills: from under the header to just above the hero's text */
    function heroBox() {
      const m = heroMeta.getBoundingClientRect(), bottom = heroFoot.getBoundingClientRect().top - 12;
      const top = wide ? m.top - 26 : m.bottom + 10;
      const base = Math.max(120, Math.min(bottom - top, W * 0.96));     /* the free height */
      return { top, base, size: base * (wide ? 1.12 : 1) };           /* on wide screens the faded shoulders may run on behind the text */
    }
    function layoutOf(k) {
      const L = (wide ? LAYOUT.wide : LAYOUT.tall)[k];
      if (k === 0 && portrait && heroMeta && heroFoot) {
        /* with the portrait, the name sits across its chest */
        const b = heroBox(), band = b.base * (wide ? 0.3 : 0.36), full = L.w * W;
        const wpx = full * Math.min(1, band / (full * nameAspect));
        return { w: wpx / W, x: 0, y: 0.5 - (b.top + b.base * (wide ? 0.84 : 0.82)) / H, a: 1 };
      }
      if (k === 0 && heroMeta && heroFoot) {
        const top = heroMeta.getBoundingClientRect().bottom + 14, bottom = heroFoot.getBoundingClientRect().top - 14;
        const band = Math.max(40, bottom - top);
        const full = L.w * W;
        const wpx = full * Math.min(1, band / (full * nameAspect));
        return { w: wpx / W, x: 0, y: 0.5 - ((top + bottom) / 2) / H, a: 1 };
      }
      if (k !== LAST || !helloAnchor) return L;
      const top = Math.min(H, helloAnchor.getBoundingClientRect().top);
      const band = Math.max(36, top - 92);                      /* px of free space under the header */
      const full = L.w * W;
      const wpx = full * Math.min(1, band / (full * helloAspect));
      const cy = Math.min(H * (0.5 - L.y), 76 + band / 2);
      return { w: wpx / W, x: 0, y: 0.5 - cy / H, a: 1 };
    }

    /* the visitor's own word or a secret shape */
    let custom = null, customGoal = 0;
    function colorCustom() {
      if (!custom) return;
      const dark = Theme.current() === 'dark';
      U.uCusA.value.setHSL(custom.hue / 360, 0.95, dark ? 0.62 : 0.42);
      U.uCusB.value.setHSL(((custom.hue + 48) % 360) / 360, 0.95, dark ? 0.62 : 0.42);
    }
    function setCustom(arr, opts) {
      aCus.array.set(arr); aCus.needsUpdate = true;
      custom = opts; colorCustom();
      U.uCustom.value = Math.min(U.uCustom.value, 0.4);   /* already showing a word: scatter, then re-form */
      customGoal = 1;
    }

    const colors = HUES.map(() => [new THREE.Color(), new THREE.Color()]);
    let chapterShown = -1;
    function recolor() {
      const dark = Theme.current() === 'dark';
      HUES.forEach((_, k) => huesOf(k).forEach((h, j) => colors[k][j].setHSL(h / 360, dark ? 0.96 : 0.86, dark ? 0.62 : 0.42)));
      chapterShown = -1;
      mat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      mat.needsUpdate = true;
      U.uGain.value = dark ? 0.7 : 0.95;
      renderer.setClearColor(new THREE.Color(token('--bg') || (dark ? '#06070B' : '#F6F5F1')), 1);
      if (tintHue !== null) setTint(tintHue);
      colorCustom();
      drawPlate();                                /* the plates follow the theme */
      if (pmat) {
        /* a colour of its own, so the name always reads in front of it: ice blue behind amber, ink behind blue */
        pmat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        pmat.needsUpdate = true;
        PU.uLight.value = dark ? 0 : 1;
        PU.uGain.value = dark ? 1.5 : 1.15;
        if (dark) { PU.uColA.value.setHSL(214 / 360, 0.9, 0.56); PU.uColB.value.setHSL(188 / 360, 1, 0.8); }
        else { PU.uColA.value.setHSL(228 / 360, 0.3, 0.14); PU.uColB.value.setHSL(222 / 360, 0.18, 0.55); }
      }
    }

    function resize() {
      const w = innerWidth, h = innerHeight;
      if (w === W && Math.abs(h - H) < 130) return;   /* ignore the mobile URL bar */
      W = w; H = h;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      renderer.setPixelRatio(ratio);
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      visH = 2 * Math.tan((FOV * Math.PI) / 360) * CAM_Z;
      visW = visH * camera.aspect;
      U.uPx.value = ratio;
      U.uSize.value = W < 760 ? 2.6 : 3.1;
      PU.uSize.value = W < 760 ? 2.4 : 3.0;
      const nowWide = W / H >= 1.05;
      if (nowWide !== wide || !shapes.length) { wide = nowWide; build(); }
    }

    /* how far through the chapters the page is: 0 = name, 5 = hello */
    function progress() {
      let s = 0;
      for (const sec of sections) s += clamp((H - sec.getBoundingClientRect().top) / (H * 0.72));
      return s;
    }

    const pointer = { x: 0, y: 0, sx: 0, sy: 0, on: 0, seen: 0 };
    let tintHue = null, tintGoal = 0, prismGoal = 0, introAt = -1, boomAt = -1;
    const setTint = h => { const dark = Theme.current() === 'dark'; U.uTint.value.setHSL(h / 360, 0.95, dark ? 0.62 : 0.45); };

    let then = performance.now(), sm = 0, started = false;
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden) { then = now; return; }
      const dt = Math.min(0.05, (now - then) / 1000);
      then = now;
      const k = 1 - Math.exp(-dt * 5.5);
      if (!reduce) U.uTime.value += dt;

      const target = progress();
      sm = reduce ? target : sm + (target - sm) * k;
      const i = Math.min(LAST - 1, Math.floor(sm));
      const f = clamp(sm - i);
      if (i !== cur && shapes.length) {
        cur = i;
        aFrom.array.set(shapes[i]); aFrom.needsUpdate = true;
        aTo.array.set(shapes[i + 1]); aTo.needsUpdate = true;
      }
      U.uMix.value = f;

      /* accent hue of the page follows the nearest chapter */
      const near = Math.round(sm);
      if (near !== chapterShown) { chapterShown = near; root.style.setProperty('--hue', String(huesOf(near)[0])); }

      const A = layoutOf(i), B = layoutOf(i + 1);
      pointer.sx += (pointer.x - pointer.sx) * k; pointer.sy += (pointer.y - pointer.sy) * k;
      const t = U.uTime.value;
      const rot = L => (L.spin ? t * 0.26 : 0) + pointer.sx * (L.spin ? 0.35 : 0.09);
      const tilt = L => (L.tilt || 0) - pointer.sy * (L.spin ? 0.14 : 0.07);
      U.uScale.value.set(scaleOf(A), scaleOf(B));
      U.uRot.value.set(rot(A), rot(B));
      U.uTilt.value.set(tilt(A), tilt(B));
      U.uAlpha.value.set(A.a, B.a);
      U.uOffA.value.set(A.x * visW, A.y * visH, 0);
      U.uOffB.value.set(B.x * visW, B.y * visH, 0);
      U.uC1A.value.copy(colors[i][0]); U.uC2A.value.copy(colors[i][1]);
      U.uC1B.value.copy(colors[i + 1][0]); U.uC2B.value.copy(colors[i + 1][1]);

      /* the name's plates ride with the name, and fade as soon as it starts to travel */
      const plateOn = i === 0 ? (1 - clamp(f / 0.3)) * U.uIntro.value * (1 - U.uCustom.value) * (1 - Math.min(1, U.uBoom.value * 3)) : 0;
      PL.uOpacity.value = plateOn;
      plate.visible = plateOn > 0.003;
      if (plate.visible) { PL.uPlace.value.set(U.uRot.value.x, U.uTilt.value.x, U.uScale.value.x); PL.uOff.value.copy(U.uOffA.value); }

      if (!finePointer && now - pointer.seen > 1400) pointer.on = 0;
      U.uMouse.value.x += ((pointer.x * visW) / 2 - U.uMouse.value.x) * Math.min(1, k * 2.2);
      U.uMouse.value.y += ((pointer.y * visH) / 2 - U.uMouse.value.y) * Math.min(1, k * 2.2);
      U.uMouse.value.z += ((reduce ? 0 : pointer.on) - U.uMouse.value.z) * k;
      U.uCustom.value += (customGoal - U.uCustom.value) * (1 - Math.exp(-dt * 2.8));
      if (custom) {
        let sc, ox = 0, oy = 0.03 * visH;
        if (custom.box) {
          /* fitted into a box given in CSS pixels of the viewport */
          const b = custom.box, unit = visH / H;
          sc = Math.min(b.w / 2 / custom.halfW, b.h / 2 / custom.halfH) * unit;
          ox = (b.cx - W / 2) * unit; oy = (H / 2 - b.cy) * unit;
        } else sc = custom.spin ? (wide ? 0.3 * visH : 0.4 * visW) : Math.min(0.36 * visW, (0.16 * visH) / custom.aspect);
        const turn = custom.spin ? t * 0.26 : custom.sway ? Math.sin(t * 0.55) * 0.2 : 0;
        U.uCus.value.set(turn + pointer.sx * 0.12, (custom.tilt || 0) - pointer.sy * 0.08, sc);
        U.uOffC.value.set(ox, oy, 0);
      }
      U.uTintAmt.value += (tintGoal - U.uTintAmt.value) * k;
      U.uPrism.value += (prismGoal - U.uPrism.value) * k;

      if (!reduce && started) {
        if (introAt < 0) introAt = now;
        U.uIntro.value = clamp((now - introAt) / 3000);
      }
      if (boomAt >= 0) {
        const b = (now - boomAt) / 2200;
        U.uBoom.value = b >= 1 ? 0 : Math.pow(Math.sin(Math.PI * Math.pow(b, 0.55)), 2);
        if (b >= 1) boomAt = -1;
      }
      if (portrait) {
        /* only in the hero, and it steps back while the cloud is writing a typed word */
        const show = (1 - clamp((sm - 0.05) / 0.7)) * (1 - 0.92 * U.uCustom.value);
        PU.uFade.value = show;
        portrait.visible = show > 0.003;
        if (portrait.visible && heroMeta && heroFoot) {
          const b = heroBox(), unit = visH / H;
          PU.uBox.value.set(0, (H / 2 - (b.top + b.size / 2)) * unit, (b.size / 2) * unit);
          PU.uTurn.value.set(pointer.sx * 0.4 + Math.sin(t * 0.45) * 0.1, -pointer.sy * 0.22);

          /* the brush: where the pointer crosses the portrait, paint the photo's colours in */
          if (pointer.on && !reduce && show > 0.5) {
            const bx = PU.uBox.value, u = ((pointer.x * visW) / 2 - bx.x) / bx.z * 0.5 + 0.5, v = ((pointer.y * visH) / 2 - bx.y) / bx.z * 0.5 + 0.5;
            if (u > -0.05 && u < 1.05 && v > -0.05 && v < 1.05) {
              const moved = lastBrush ? Math.hypot(u - lastBrush[0], v - lastBrush[1]) : 0;
              /* fill in the stroke between frames so fast moves leave a line, not dots */
              const steps = Math.min(16, Math.ceil(moved / 0.04));
              for (let s = 1; s <= steps; s++) brush(lastBrush[0] + (u - lastBrush[0]) * s / steps, lastBrush[1] + (v - lastBrush[1]) * s / steps);
              if (!steps) brush(u, v);
              lastBrush = [u, v];
            } else lastBrush = null;
          } else lastBrush = null;
        }
        paintStep(dt);
      }
      renderer.render(scene, camera);
    }

    addEventListener('pointermove', e => {
      pointer.x = (e.clientX / W) * 2 - 1; pointer.y = 1 - (e.clientY / H) * 2; pointer.on = 1; pointer.seen = performance.now();
    }, { passive: true });
    root.addEventListener('mouseleave', () => { pointer.on = 0; });
    addEventListener('click', e => {
      if (reduce || e.target.closest('a, button, input, label, .buglog, .menu, .term')) return;
      U.uShock.value.set(((e.clientX / W) * 2 - 1) * visW / 2, (1 - (e.clientY / H) * 2) * visH / 2, U.uTime.value);
    });

    Theme.onChange(recolor);
    addEventListener('resize', resize);
    resize();
    recolor();
    requestAnimationFrame(frame);
    root.classList.add('has-3d');

    api.ready = true;
    api.start = () => { build(); started = true; };            /* fonts are in: rebuild the lettering and fly in */
    api.boom = () => { if (!reduce) boomAt = performance.now(); };
    api.tint = h => { tintHue = h; if (h === null) tintGoal = 0; else { setTint(h); tintGoal = 0.85; } };
    api.prism = on => { prismGoal = on ? 1 : 0; };
    api.spell = text => {
      const arr = textShape([text], 1.4);
      let h = 0; for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
      setCustom(arr, { aspect: aspectOf(arr), hue: h, owner: 'spell' });
    };
    api.shape = n => {
      const L = LAYOUT.wide[n];
      setCustom(shapes[n], L.spin ? { spin: 1, tilt: L.tilt, hue: HUES[n][0], owner: 'spell' } : { aspect: aspectOf(shapes[n]), hue: HUES[n][0], owner: 'spell' });
    };
    /* shapes made for hovers are kept for a while, since the same few come up again and again */
    const made = new Map();
    const keep = (key, make) => {
      if (made.has(key)) return made.get(key);
      if (made.size > 9) made.delete(made.keys().next().value);
      const arr = make();
      made.set(key, arr);
      return arr;
    };
    api.place = (pins, label, box, hue) => {
      const arr = keep(`place ${label} ${pins.join(';')}`, () => placeShape(pins, label));
      setCustom(arr, { box, halfW: PLACE.halfW, halfH: PLACE.halfH, sway: 1, hue, owner: 'hover' });
    };
    api.word = (text, box, hue) => {
      const arr = keep(`word ${text}`, () => textShape([text], 1.3));
      setCustom(arr, { box, halfW: 1, halfH: aspectOf(arr), hue, owner: 'hover' });
    };
    /* with an owner, only that owner's shape is cleared */
    api.clear = owner => { if (!owner || !custom || custom.owner === owner) customGoal = 0; };
  } catch (err) {
    console.error(err);
    root.classList.remove('has-3d');
    return fail();
  }
  if (wantStart) api.start();
  return api;
  };
  return api;
})();
