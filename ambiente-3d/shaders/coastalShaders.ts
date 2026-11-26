import * as THREE from 'three'
import type { WorldTimeOfDay } from '@funcionarios/types'

/** Exact 5 signature Coastal World pastel character palettes (matching the customizer bar 1:1) */
export const COASTAL_AVATAR_PALETTES = [
  {
    id: 'peach',
    swatch: '#f2b99b',
    body: '#e9ae8c',
    limbs: '#d98f70',
    face: '#fff3d6',
    blush: '#f5989d',
    accent: '#49c6e5',
    phoneCase: '#f4c8b0',
    handColor: '#e2a382',
  },
  {
    id: 'lavender',
    swatch: '#bfb6de',
    body: '#9b8ec9',
    limbs: '#7a6cb0',
    face: '#fff1d9',
    blush: '#f29cb5',
    accent: '#02c6a7',
    phoneCase: '#cbc3e6',
    handColor: '#a699d2',
  },
  {
    id: 'cobalt',
    swatch: '#89a2c9',
    body: '#3e84d6',
    limbs: '#2f65b5',
    face: '#fff1d9',
    blush: '#f49ca8',
    accent: '#f6d35f',
    phoneCase: '#a6bee0',
    handColor: '#5c96db',
  },
  {
    id: 'aqua',
    swatch: '#8bcbb8',
    body: '#00bcc7',
    limbs: '#3f5ea8',
    face: '#d7b4e4',
    blush: '#e394be',
    accent: '#9f82df',
    phoneCase: '#9ed7c7',
    handColor: '#2ec8cf',
  },
  {
    id: 'berry',
    swatch: '#a14e61',
    body: '#7b3556',
    limbs: '#6c4972',
    face: '#fff0c4',
    blush: '#ea939c',
    accent: '#30c5f0',
    phoneCase: '#d8aeb2',
    handColor: '#b76c79',
  },
] as const

export function getSkyPalette(timeOfDay: WorldTimeOfDay) {
  if (timeOfDay === 'dusk') {
    return {
      zenith: new THREE.Color('#273573'),
      mid: new THREE.Color('#5a67b8'),
      horizon: new THREE.Color('#f2a5b6'),
      fog: '#8d88c4',
      waterDeep: new THREE.Color('#30669e'),
      waterShallow: new THREE.Color('#4795c4'),
      foamColor: new THREE.Color('#e2f3ff'),
      sunColor: '#ffd4b8',
      sunIntensity: 1.15,
      hemiSky: '#a8b7ff',
      hemiGround: '#4a4775',
      hemiIntensity: 0.9,
      ambientIntensity: 0.45,
    }
  }
  if (timeOfDay === 'golden') {
    return {
      zenith: new THREE.Color('#0ea5e9'),
      mid: new THREE.Color('#5cd3f6'),
      horizon: new THREE.Color('#ffe8c4'),
      fog: '#bfeff4',
      waterDeep: new THREE.Color('#48b2df'),
      waterShallow: new THREE.Color('#6fe0e8'),
      foamColor: new THREE.Color('#ffffff'),
      sunColor: '#fff0d4',
      sunIntensity: 1.55,
      hemiSky: '#d9f4ff',
      hemiGround: '#b6a88a',
      hemiIntensity: 1.05,
      ambientIntensity: 0.56,
    }
  }
  // Default: Iconic crisp vibrant Coastal World daylight
  return {
    zenith: new THREE.Color('#00b4ff'),
    mid: new THREE.Color('#42d2fb'),
    horizon: new THREE.Color('#c2f5f8'),
    fog: '#bceef5',
    waterDeep: new THREE.Color('#65b2e6'),
    waterShallow: new THREE.Color('#7ed9f2'),
    foamColor: new THREE.Color('#ffffff'),
    sunColor: '#fffdf4',
    sunIntensity: 1.55,
    hemiSky: '#d4f6ff',
    hemiGround: '#8ec4b0',
    hemiIntensity: 1.12,
    ambientIntensity: 0.58,
  }
}

export function createCoastalSkyMaterial(timeOfDay: WorldTimeOfDay): THREE.ShaderMaterial {
  const pal = getSkyPalette(timeOfDay)
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uZenith: { value: pal.zenith.clone() },
      uMid: { value: pal.mid.clone() },
      uHorizon: { value: pal.horizon.clone() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      varying vec3 vWorldPos;

      void main() {
        vec3 dir = normalize(vWorldPos);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.24, h));
        col = mix(col, uZenith, smoothstep(0.18, 0.68, h));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  })
}

/**
 * Stylized Coastal World Ocean Shader:
 * - Smooth pastel turquoise-to-sky-blue gradient with shallow glow near island
 * - Organic flowing pale wave contour ribbons & shimmering white surface glints
 * - Bright crisp white animated foam outlining the main island, beach, pier & islets
 */
export function createCoastalOceanMaterial(timeOfDay: WorldTimeOfDay): THREE.ShaderMaterial {
  const pal = getSkyPalette(timeOfDay)
  return new THREE.ShaderMaterial({
    transparent: false,
    uniforms: {
      uTime: { value: 0 },
      uWaterDeep: { value: pal.waterDeep.clone() },
      uWaterShallow: { value: pal.waterShallow.clone() },
      uFoamColor: { value: pal.foamColor.clone() },
      uHorizonColor: { value: new THREE.Color(pal.fog) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying float vWave;

      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float wave = sin(wp.x * 0.16 + uTime * 1.15) * 0.06
                   + cos(wp.z * 0.14 - uTime * 0.95) * 0.05;
        wp.y += wave;
        vWave = wave;
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uWaterDeep;
      uniform vec3 uWaterShallow;
      uniform vec3 uFoamColor;
      uniform vec3 uHorizonColor;
      varying vec3 vWorldPos;
      varying float vWave;

      // Simple crisp hash & 2D value noise for stylized wave ribbons
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      // Signed distance to rounded box (island footprint)
      float sdRoundedBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
      }

      void main() {
        vec2 p = vWorldPos.xz;

        // Distance to main island (centered at [0, -3], half-size [25.5, 20.5], radius 8.5)
        float dMain = sdRoundedBox(p - vec2(0.0, -3.5), vec2(25.5, 19.5), 8.5);
        // Distance to tiny palm islet on left bay (-23.5, 27.0)
        float dIslet1 = length(p - vec2(-23.5, 27.0)) - 3.6;
        // Distance to eastern lighthouse rock cape (26.5, -6.5)
        float dIslet2 = length(p - vec2(26.5, -6.5)) - 5.2;
        // Distance to western lighthouse rock headland (-25.0, 6.5)
        float dIslet3 = length(p - vec2(-25.0, 6.5)) - 5.5;
        // Distance to harbor boulder cluster right of pier (7.0, 18.2)
        float dRocks = length(p - vec2(7.2, 18.2)) - 3.6;
        // Distance to wooden pier footprint
        float dPier = sdRoundedBox(p - vec2(0.0, 21.6), vec2(2.35, 5.4), 0.35);

        float dist = min(min(dMain, min(dIslet1, dIslet2)), min(dIslet3, dRocks));
        float distWithPier = min(dist, dPier);

        // Shallow turquoise water halo near coast
        float shallowMask = 1.0 - smoothstep(0.0, 15.0, dist);
        vec3 col = mix(uWaterDeep, uWaterShallow, shallowMask);

        // Stylized animated wave contour lines (Coastal World signature look!)
        float n1 = noise(p * 0.14 + vec2(uTime * 0.18, -uTime * 0.12));
        float n2 = noise(p * 0.28 - vec2(uTime * 0.22, uTime * 0.15));
        float contour = abs(fract(n1 * 3.2 + n2 * 0.65) - 0.5);
        float ribbon = 1.0 - smoothstep(0.012, 0.045, contour);
        col = mix(col, mix(uWaterShallow, uFoamColor, 0.42), ribbon * 0.34);

        // Crisp bright white surface sparkle spots
        float sparkleNoise = noise(p * 0.65 + vec2(uTime * 0.45, uTime * 0.22));
        float sparkle = smoothstep(0.83, 0.87, sparkleNoise) * (0.45 + 0.55 * shallowMask);
        col = mix(col, uFoamColor, sparkle * 0.75);

        // Animated crisp white shoreline foam outline wrapping island & rocks (1:1 thin coastal rim!)
        float foamWave = sin(dist * 2.5 - uTime * 2.4 + n1 * 2.5);
        float innerFoam = 1.0 - smoothstep(0.0, 0.62 + n2 * 0.26, max(0.0, distWithPier));
        float rippleFoam = smoothstep(0.68, 0.9, foamWave) * (1.0 - smoothstep(0.5, 2.8, dist)) * step(0.25, dist);
        float foamMask = clamp(innerFoam * 0.88 + rippleFoam * 0.48, 0.0, 1.0);
        col = mix(col, uFoamColor, foamMask);

        // Subtle atmospheric horizon blend matching sky dome horizon
        float camDist = length(vWorldPos.xz - cameraPosition.xz);
        float fogAmt = smoothstep(66.0, 168.0, camDist);
        col = mix(col, uHorizonColor, fogAmt);

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  })
}
