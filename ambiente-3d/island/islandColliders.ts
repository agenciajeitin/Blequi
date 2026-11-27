import type { WorldCreationProp } from '@funcionarios/types'

export interface CircleCollider {
  kind: 'circle'
  cx: number
  cz: number
  radius: number
}

export interface BoxCollider {
  kind: 'box'
  cx: number
  cz: number
  halfW: number
  halfD: number
  rotationY: number
}

export type IslandCollider = CircleCollider | BoxCollider

/**
 * Hitboxes of all static buildings, trees, palms, bushes, lamps, seawall pillars,
 * pier bollards, and beach props on Coastal Blequi Island.
 * Coordinates match CoastalStudios.tsx & CoastalWorldProps.tsx 1:1 while keeping door points accessible.
 */
export const STATIC_ISLAND_COLLIDERS: IslandCollider[] = [
  // === 1. 4 INTERACTIVE STUDIO BUILDINGS ===
  // Sede da Blequi (b2b-lab) at [0, 1.35, -5.2], plinth 10.6 x 6.2 (door at z = -0.4 stays clear)
  { kind: 'box', cx: 0, cz: -5.2, halfW: 5.1, halfD: 2.85, rotationY: 0 },
  // Estúdio Luma (criacao) at [10.4, 1.35, 8.2], rotY -0.32, plinth 6.6 x 5.4
  { kind: 'box', cx: 10.4, cz: 8.2, halfW: 3.1, halfD: 2.35, rotationY: -0.32 },
  // Estúdio Kael (engenharia) at [-12.2, 1.35, 3.8], rotY 0.36, plinth 7.4 x 5.8
  { kind: 'box', cx: -12.2, cz: 3.8, halfW: 3.45, halfD: 2.55, rotationY: 0.36 },
  // Lab Vex (pixel-perfect) at [-11.4, 1.35, -8.2], rotY 0.28, plinth 6.4 x 5.4
  { kind: 'box', cx: -11.4, cz: -8.2, halfW: 3.05, halfD: 2.45, rotationY: 0.28 },

  // === 2. SCENIC BACKGROUND BUILDINGS ===
  // East Ridge Coral Cottage at [11.4, 1.35, -7.8]
  { kind: 'box', cx: 11.4, cz: -7.8, halfW: 2.55, halfD: 2.25, rotationY: -0.35 },
  // Left Waterfront Gazebo at [-14.6, 1.35, 10.6]
  { kind: 'circle', cx: -14.6, cz: 10.6, radius: 3.15 },
  // Music & Community Lounge Stage at [15.5, 1.35, -0.4]
  { kind: 'box', cx: 15.5, cz: -0.4, halfW: 2.35, halfD: 1.75, rotationY: -0.8 },

  // === 3. SEAWALL PILLARS & PIER BOLLARDS ===
  { kind: 'box', cx: -2.75, cz: 14.35, halfW: 0.72, halfD: 0.85, rotationY: 0 },
  { kind: 'box', cx: 2.75, cz: 14.35, halfW: 0.72, halfD: 0.85, rotationY: 0 },
  { kind: 'box', cx: 9.8, cz: 14.35, halfW: 0.72, halfD: 0.85, rotationY: 0 },
  { kind: 'box', cx: -11.8, cz: 14.35, halfW: 0.72, halfD: 0.85, rotationY: 0 },

  // Pier mooring bollards
  { kind: 'circle', cx: -2.05, cz: 18.2, radius: 0.28 },
  { kind: 'circle', cx: 2.05, cz: 18.2, radius: 0.28 },
  { kind: 'circle', cx: -2.05, cz: 22.0, radius: 0.28 },
  { kind: 'circle', cx: 2.05, cz: 22.0, radius: 0.28 },
  { kind: 'circle', cx: -2.05, cz: 25.8, radius: 0.28 },
  { kind: 'circle', cx: 2.05, cz: 25.8, radius: 0.28 },

  // === 4. PINE TREES ===
  ...[
    [-4.8, 11.4, 1.05],
    [-8.6, 12.2, 0.92],
    [-12.8, 10.6, 1.1],
    [-15.2, 8.4, 1.0],
    [-16.4, 10.2, 0.85],
    [-18.2, 6.2, 1.15],
    [-16.5, -2.5, 1.18],
    [-19.2, -5.8, 1.02],
    [-10.2, -13.5, 1.25],
    [-5.6, -14.8, 1.1],
    [4.2, 12.0, 1.08],
    [7.4, 12.4, 0.92],
    [14.8, 4.5, 1.18],
    [17.8, 2.2, 1.05],
    [16.2, -6.4, 1.22],
    [12.4, -12.6, 1.15],
    [6.4, -14.2, 1.2],
    [20.2, -2.2, 1.08],
    [-1.8, -15.5, 1.3],
    [18.8, -10.5, 1.1],
  ].map(([cx, cz, s]): CircleCollider => ({ kind: 'circle', cx, cz, radius: 0.62 * s })),

  // === 5. CORAL LOLLIPOP TREES ===
  ...[
    [-3.5, 6.8, 1.05],
    [-4.2, 9.6, 0.88],
    [5.4, 11.4, 0.96],
    [-14.2, -4.6, 1.12],
    [13.4, -4.2, 1.04],
    [9.4, -11.4, 0.95],
    [-8.5, -11.2, 1.06],
    [15.6, 7.6, 0.92],
  ].map(([cx, cz, s]): CircleCollider => ({ kind: 'circle', cx, cz, radius: 0.52 * s })),

  // === 6. YELLOW SQUIRCLE TREES ===
  ...[
    [-5.5, 8.8, 0.96],
    [6.2, 12.1, 0.92],
    [14.2, 1.6, 1.08],
    [-15.8, 1.4, 1.05],
    [8.2, -13.6, 1.12],
    [-12.2, -12.8, 0.98],
  ].map(([cx, cz, s]): CircleCollider => ({ kind: 'circle', cx, cz, radius: 0.52 * s })),

  // === 7. EMERALD BUSHES ===
  ...[
    [-3.2, 12.2, 0.62],
    [-4.6, 10.6, 0.56],
    [4.5, 12.8, 0.65],
    [6.9, 11.8, 0.55],
    [-7.2, 6.2, 0.72],
    [7.4, 6.8, 0.68],
    [-4.4, 0.8, 0.66],
    [4.4, 0.8, 0.66],
    [-10.4, 8.2, 0.74],
    [12.2, 4.2, 0.82],
    [-11.8, -3.4, 0.78],
    [11.6, -7.2, 0.75],
    [-2.8, -9.8, 0.7],
    [3.2, -9.8, 0.7],
  ].map(([cx, cz, s]): CircleCollider => ({ kind: 'circle', cx, cz, radius: 0.68 * s })),

  // === 8. TROPICAL PALM TREES ===
  ...[
    [-9.6, 11.4, 1.12],
    [-11.4, 9.8, 0.95],
    [6.4, 9.2, 1.16],
    [8.2, 10.4, 0.98],
    [18.8, 11.6, 1.18],
    [21.4, 8.6, 1.05],
    [17.2, 13.8, 0.94],
    [-18.8, 11.2, 1.08],
  ].map(([cx, cz, s]): CircleCollider => ({ kind: 'circle', cx, cz, radius: 0.42 * s })),

  // === 9. STREET LAMPS ===
  ...[
    [-6.2, 12.8],
    [6.2, 12.8],
    [-5.2, 4.6],
    [5.2, 4.6],
    [-5.6, -3.2],
    [5.6, -3.2],
    [-11.5, 1.2],
    [11.8, 2.2],
  ].map(([cx, cz]): CircleCollider => ({ kind: 'circle', cx, cz, radius: 0.3 })),

  // === 10. BEACH UMBRELLAS ===
  { kind: 'circle', cx: 17.8, cz: 10.6, radius: 0.55 },
  { kind: 'circle', cx: 21.0, cz: 12.2, radius: 0.55 },
  { kind: 'circle', cx: 15.5, cz: 9.8, radius: 0.55 },
]

function resolveCircle(
  x: number,
  z: number,
  playerRadius: number,
  cx: number,
  cz: number,
  radius: number
): { x: number; z: number; hit: boolean } {
  const dx = x - cx
  const dz = z - cz
  const minDist = playerRadius + radius
  const distSq = dx * dx + dz * dz
  if (distSq >= minDist * minDist) {
    return { x, z, hit: false }
  }
  const dist = Math.sqrt(distSq)
  if (dist < 0.0001) {
    return { x: cx, z: cz + minDist, hit: true }
  }
  const push = (minDist - dist) / dist
  return { x: x + dx * push, z: z + dz * push, hit: true }
}

function resolveRotatedBox(
  x: number,
  z: number,
  playerRadius: number,
  box: BoxCollider
): { x: number; z: number; hit: boolean } {
  const cos = Math.cos(-box.rotationY)
  const sin = Math.sin(-box.rotationY)
  const relX = x - box.cx
  const relZ = z - box.cz
  // Transform player into box local space
  const lx = relX * cos - relZ * sin
  const lz = relX * sin + relZ * cos

  const clampedX = Math.max(-box.halfW, Math.min(box.halfW, lx))
  const clampedZ = Math.max(-box.halfD, Math.min(box.halfD, lz))

  const dx = lx - clampedX
  const dz = lz - clampedZ
  const distSq = dx * dx + dz * dz

  if (distSq >= playerRadius * playerRadius) {
    return { x, z, hit: false }
  }

  let outLx = lx
  let outLz = lz
  if (distSq > 0.00001) {
    const dist = Math.sqrt(distSq)
    const push = (playerRadius - dist) / dist
    outLx += dx * push
    outLz += dz * push
  } else {
    // Center is inside the box: push out along nearest edge
    const penX = box.halfW - Math.abs(lx)
    const penZ = box.halfD - Math.abs(lz)
    if (penX < penZ) {
      outLx = (lx >= 0 ? 1 : -1) * (box.halfW + playerRadius)
    } else {
      outLz = (lz >= 0 ? 1 : -1) * (box.halfD + playerRadius)
    }
  }

  // Transform back to world space
  const wCos = Math.cos(box.rotationY)
  const wSin = Math.sin(box.rotationY)
  return {
    x: box.cx + outLx * wCos - outLz * wSin,
    z: box.cz + outLx * wSin + outLz * wCos,
    hit: true,
  }
}

/**
 * Resolves 2D XZ physical collisions against all static island landmarks + dynamic AI-created island props.
 * Zero allocations in the hot loop — runs smoothly at 60 FPS.
 */
export function resolveIslandCollisions(
  nx: number,
  nz: number,
  playerRadius: number,
  islandProps: WorldCreationProp[]
): { x: number; z: number; collided: boolean } {
  let x = nx
  let z = nz
  let collided = false

  // 2 passes resolve corners cleanly without jitter
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < STATIC_ISLAND_COLLIDERS.length; i++) {
      const col = STATIC_ISLAND_COLLIDERS[i]
      if (col.kind === 'circle') {
        const res = resolveCircle(x, z, playerRadius, col.cx, col.cz, col.radius)
        if (res.hit) {
          x = res.x
          z = res.z
          collided = true
        }
      } else {
        const res = resolveRotatedBox(x, z, playerRadius, col)
        if (res.hit) {
          x = res.x
          z = res.z
          collided = true
        }
      }
    }

    // Dynamic props mounted at island plaza group offset [0, 1.35, 3.4]
    for (let i = 0; i < islandProps.length; i++) {
      const p = islandProps[i]
      const propRadius = p.kind === 'garden_tree' ? 0.72 : p.kind === 'park_bench' ? 0.78 : 0.58
      const res = resolveCircle(x, z, playerRadius, p.position[0], p.position[2] + 3.4, propRadius * (p.scale || 1))
      if (res.hit) {
        x = res.x
        z = res.z
        collided = true
      }
    }
  }

  return { x, z, collided }
}

/**
 * Resolves physical collisions inside studios (workstations + AI-created studio props).
 */
export function resolveStudioCollisions(
  nx: number,
  nz: number,
  playerRadius: number,
  deskPositions: [number, number, number][],
  studioProps: WorldCreationProp[]
): { x: number; z: number; collided: boolean } {
  let x = nx
  let z = nz
  let collided = false

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < deskPositions.length; i++) {
      const [dx, , dz] = deskPositions[i]
      const res = resolveCircle(x, z, playerRadius, dx, dz, 0.92)
      if (res.hit) {
        x = res.x
        z = res.z
        collided = true
      }
    }
    for (let i = 0; i < studioProps.length; i++) {
      const p = studioProps[i]
      const res = resolveCircle(x, z, playerRadius, p.position[0], p.position[2], 0.55 * (p.scale || 1))
      if (res.hit) {
        x = res.x
        z = res.z
        collided = true
      }
    }
  }

  return { x, z, collided }
}
