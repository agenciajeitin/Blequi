/**
 * Pure WebGL2 Coastal World Sky & Animated Stylized Ocean Engine
 * Zero external bundler dependencies — runs identically on file:// and localhost at 60 FPS!
 */
(function (global) {
  const PALETTES = {
    daylight: {
      skyZenith: [0.0, 0.706, 1.0],
      skyMid: [0.259, 0.824, 0.984],
      skyHorizon: [0.761, 0.961, 0.973],
      waterDeep: [0.396, 0.698, 0.902],
      waterShallow: [0.494, 0.851, 0.949],
      foam: [1.0, 1.0, 1.0],
    },
    golden: {
      skyZenith: [0.055, 0.647, 0.914],
      skyMid: [0.361, 0.827, 0.965],
      skyHorizon: [1.0, 0.91, 0.769],
      waterDeep: [0.282, 0.698, 0.875],
      waterShallow: [0.435, 0.878, 0.91],
      foam: [1.0, 0.99, 0.96],
    },
    dusk: {
      skyZenith: [0.153, 0.208, 0.451],
      skyMid: [0.353, 0.404, 0.722],
      skyHorizon: [0.949, 0.647, 0.714],
      waterDeep: [0.188, 0.4, 0.62],
      waterShallow: [0.278, 0.584, 0.769],
      foam: [0.886, 0.953, 1.0],
    },
  }

  const VERT = `#version 300 es
    in vec2 aPos;
    out vec2 vUv;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `

  const FRAG = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 fragColor;

    uniform float uTime;
    uniform vec2 uRes;
    uniform float uWaveSpeed;
    uniform float uFoamWidth;
    uniform float uShallowGlow;
    uniform float uHorizonY;
    uniform vec3 uSkyZenith;
    uniform vec3 uSkyMid;
    uniform vec3 uSkyHorizon;
    uniform vec3 uWaterDeep;
    uniform vec3 uWaterShallow;
    uniform vec3 uFoam;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float cloudShape(vec2 uv, vec2 center, float s) {
      vec2 p = (uv - center) / s;
      p.x *= (uRes.x / max(uRes.y, 1.0)) * 0.55;
      float c1 = length(p - vec2(0.0, 0.0)) - 0.12;
      float c2 = length(p - vec2(0.11, -0.025)) - 0.095;
      float c3 = length(p - vec2(-0.11, -0.03)) - 0.088;
      float c4 = length(p - vec2(0.04, 0.04)) - 0.085;
      float d = min(min(c1, c2), min(c3, c4));
      return 1.0 - smoothstep(-0.008, 0.008, d);
    }

    void main() {
      vec2 uv = vUv;
      float t = uTime * uWaveSpeed;

      if (uv.y >= uHorizonY) {
        // Coastal World Sky Gradient
        float h = clamp((uv.y - uHorizonY) / (1.0 - uHorizonY), 0.0, 1.0);
        vec3 sky = mix(uSkyHorizon, uSkyMid, smoothstep(0.0, 0.42, h));
        sky = mix(sky, uSkyZenith, smoothstep(0.32, 0.95, h));

        // Soft stylized layered horizon clouds
        float drift = mod(t * 0.012, 1.4) - 0.2;
        float cl = 0.0;
        cl = max(cl, cloudShape(uv, vec2(fract(0.16 + drift), uHorizonY + 0.08), 0.85));
        cl = max(cl, cloudShape(uv, vec2(fract(0.52 + drift * 0.7), uHorizonY + 0.14), 1.05));
        cl = max(cl, cloudShape(uv, vec2(fract(0.84 + drift * 0.9), uHorizonY + 0.07), 0.78));
        sky = mix(sky, mix(uSkyHorizon, vec3(1.0), 0.78), cl * 0.72);

        fragColor = vec4(sky, 1.0);
        return;
      }

      // Stylized Perspective Ocean Plane
      float depth = max(0.012, (uHorizonY - uv.y) / uHorizonY);
      vec2 worldP = vec2((uv.x - 0.5) / depth * 2.2, 1.15 / depth);

      float n1 = noise(worldP * 0.9 + vec2(t * 0.22, -t * 0.16));
      float n2 = noise(worldP * 1.9 - vec2(t * 0.26, t * 0.18));

      // Shallow turquoise glow near horizon coast
      float shallow = smoothstep(0.0, 0.75, 1.0 - depth) * uShallowGlow;
      vec3 col = mix(uWaterDeep, uWaterShallow, clamp(shallow, 0.0, 1.0));

      // Iconic organic flowing pale wave contour ribbons
      float contour = abs(fract(n1 * 3.0 + n2 * 0.65) - 0.5);
      float ribbon = 1.0 - smoothstep(0.015, 0.055, contour);
      col = mix(col, mix(uWaterShallow, uFoam, 0.52), ribbon * 0.36 * smoothstep(0.02, 0.24, depth));

      // Crisp white specular surface glints
      float spark = smoothstep(0.82, 0.87, noise(worldP * 2.8 + vec2(t * 0.5, t * 0.2)));
      col = mix(col, uFoam, spark * 0.68 * smoothstep(0.04, 0.3, depth));

      // Animated horizon shoreline foam ribbon
      float foamWave = sin(worldP.x * 1.8 - t * 2.1 + n1 * 2.8) * 0.008;
      float coastFoam = 1.0 - smoothstep(0.0, uFoamWidth * 0.032, abs(depth - 0.032 - foamWave));
      col = mix(col, uFoam, coastFoam * 0.75);

      // Soft horizon atmospheric blend
      float fog = 1.0 - smoothstep(0.0, 0.22, depth);
      col = mix(col, uSkyHorizon, fog * 0.68);

      fragColor = vec4(col, 1.0);
    }
  `

  function createCoastalCanvas(canvas, options) {
    const opts = Object.assign(
      { timeOfDay: 'daylight', waveSpeed: 1.0, foamWidth: 1.0, shallowGlow: 0.85, horizonY: 0.46 },
      options || {}
    )
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' })
    if (!gl) return null

    const compile = (type, src) => {
      const sh = gl.createShader(type)
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      return sh
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = {
      time: gl.getUniformLocation(prog, 'uTime'),
      res: gl.getUniformLocation(prog, 'uRes'),
      waveSpeed: gl.getUniformLocation(prog, 'uWaveSpeed'),
      foamWidth: gl.getUniformLocation(prog, 'uFoamWidth'),
      shallowGlow: gl.getUniformLocation(prog, 'uShallowGlow'),
      horizonY: gl.getUniformLocation(prog, 'uHorizonY'),
      skyZenith: gl.getUniformLocation(prog, 'uSkyZenith'),
      skyMid: gl.getUniformLocation(prog, 'uSkyMid'),
      skyHorizon: gl.getUniformLocation(prog, 'uSkyHorizon'),
      waterDeep: gl.getUniformLocation(prog, 'uWaterDeep'),
      waterShallow: gl.getUniformLocation(prog, 'uWaterShallow'),
      foam: gl.getUniformLocation(prog, 'uFoam'),
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    const start = performance.now()
    const render = (now) => {
      resize()
      const pal = PALETTES[opts.timeOfDay] || PALETTES.daylight
      gl.uniform1f(u.time, (now - start) * 0.001)
      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform1f(u.waveSpeed, opts.waveSpeed)
      gl.uniform1f(u.foamWidth, opts.foamWidth)
      gl.uniform1f(u.shallowGlow, opts.shallowGlow)
      gl.uniform1f(u.horizonY, opts.horizonY)
      gl.uniform3fv(u.skyZenith, pal.skyZenith)
      gl.uniform3fv(u.skyMid, pal.skyMid)
      gl.uniform3fv(u.skyHorizon, pal.skyHorizon)
      gl.uniform3fv(u.waterDeep, pal.waterDeep)
      gl.uniform3fv(u.waterShallow, pal.waterShallow)
      gl.uniform3fv(u.foam, pal.foam)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return {
      update(patch) {
        Object.assign(opts, patch)
      },
      destroy() {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', resize)
      },
    }
  }

  global.CoastalWebGL = { createCoastalCanvas, PALETTES }
})(window)
