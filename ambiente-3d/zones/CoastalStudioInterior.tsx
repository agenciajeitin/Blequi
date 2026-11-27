import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Grid, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { RoomScaleId, StudioThemeConfig, StudioZoneId } from '@funcionarios/types'
import { ROOM_SCALES } from '@funcionarios/providers'

export interface CoastalStudioInteriorProps {
  zone: StudioZoneId
  roomScale: RoomScaleId
  showFloorGrid: boolean
  studioTheme?: StudioThemeConfig
  onExitToIsland: () => void
}

interface ZonePalette {
  floor: string
  floorPlankAlt: string
  wall: string
  wallSide: string
  trim: string
  accent: string
  rug: string
  rugBorder: string
  screenTitle: string
  screenSubtitle: string
}

const ZONE_PALETTES: Record<StudioZoneId, ZonePalette> = {
  criacao: {
    floor: '#dfb07c',
    floorPlankAlt: '#d39f68',
    wall: '#fff6ec',
    wallSide: '#fcecdf',
    trim: '#f28b50',
    accent: '#f97316',
    rug: '#ffdbc9',
    rugBorder: '#f2676f',
    screenTitle: 'ATELIÊ LUMA · DIORAMAS 3D',
    screenSubtitle: 'Paletas Costeiras · Luz Quente · Maquetes Miniatura',
  },
  engenharia: {
    floor: '#dccbb8',
    floorPlankAlt: '#d1beaa',
    wall: '#f5f9fd',
    wallSide: '#ebf3fa',
    trim: '#f06673',
    accent: '#6366f1',
    rug: '#e0e7ff',
    rugBorder: '#6366f1',
    screenTitle: 'LAB KAEL · WEBGL & SHADERS',
    screenSubtitle: 'Three.js · React Three Fiber · Oceano GLSL 60 FPS',
  },
  'pixel-perfect': {
    floor: '#d2dfe8',
    floorPlankAlt: '#c5d4df',
    wall: '#e3f7f2',
    wallSide: '#d6f0ea',
    trim: '#343c59',
    accent: '#02c6a7',
    rug: '#cff6ee',
    rugBorder: '#02c6a7',
    screenTitle: 'OBS. VEX · GUARDIÃO 60 FPS',
    screenSubtitle: 'InstancedMesh · 1 Shadow Light · Adaptive DPR',
  },
  'b2b-lab': {
    floor: '#e2c39a',
    floorPlankAlt: '#d7b589',
    wall: '#fffaf7',
    wallSide: '#f8eff0',
    trim: '#de6c80',
    accent: '#de6c80',
    rug: '#fde8ed',
    rugBorder: '#f6d35f',
    screenTitle: 'SEDE BLEQUI · PAVILHÃO NORI',
    screenSubtitle: 'Lounge das Co-CEOs · Bem-Estar & Celebrações',
  },
  editorial: {
    floor: '#e5cfa7',
    floorPlankAlt: '#d9c195',
    wall: '#fffcf2',
    wallSide: '#f8f2e2',
    trim: '#f6b93b',
    accent: '#eab308',
    rug: '#fef3c7',
    rugBorder: '#f59e0b',
    screenTitle: 'MIRANTE EDITORIAL · EXPANSÃO',
    screenSubtitle: 'Espaço pronto para novos especialistas Blequi',
  },
}

/** Creates a crisp warm sunlit plank or coastal tile CanvasTexture for the studio floor */
function createCoastalFloorTexture(c1: string, c2: string, isTile: boolean): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = c1
  ctx.fillRect(0, 0, size, size)

  if (isTile) {
    const step = size / 4
    for (let gx = 0; gx < 4; gx++) {
      for (let gy = 0; gy < 4; gy++) {
        ctx.fillStyle = (gx + gy) % 2 === 0 ? c1 : c2
        ctx.fillRect(gx * step + 2, gy * step + 2, step - 4, step - 4)
      }
    }
  } else {
    const rows = 8
    const rowH = size / rows
    for (let r = 0; r < rows; r++) {
      const y = r * rowH
      ctx.fillStyle = r % 2 === 0 ? c1 : c2
      ctx.fillRect(0, y, size, rowH - 2)
      ctx.fillStyle = 'rgba(110, 72, 38, 0.14)'
      ctx.fillRect(0, y + rowH - 2, size, 2)
      const splitX = ((r * 173 + 91) % 320) + 90
      ctx.fillRect(splitX, y, 2, rowH)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}

/** Creates a vibrant Coastal World CanvasTexture for each studio's signature wall board */
function createZoneBoardTexture(zone: StudioZoneId, pal: ZonePalette): THREE.CanvasTexture {
  const w = 1024
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#ffffff')
  bg.addColorStop(1, '#f0f7ff')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Top playful pill bar
  ctx.fillStyle = pal.accent
  ctx.beginPath()
  ctx.roundRect(48, 38, 220, 42, 21)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = '800 20px "Nunito", sans-serif'
  ctx.fillText('ILHA BLEQUI', 90, 66)

  ctx.fillStyle = '#3b3777'
  ctx.font = '900 44px "Nunito", sans-serif'
  ctx.fillText(pal.screenTitle, 48, 144)

  ctx.fillStyle = '#6c6996'
  ctx.font = '700 24px "Nunito", sans-serif'
  ctx.fillText(pal.screenSubtitle, 48, 186)

  // Zone-specific graphic illustration
  if (zone === 'criacao') {
    const swatches = ['#f2676f', '#f97316', '#f6d35f', '#02c6a7', '#60c8f2', '#9b8ec9']
    swatches.forEach((hex, i) => {
      ctx.fillStyle = hex
      ctx.beginPath()
      ctx.roundRect(48 + i * 154, 240, 134, 188, 28)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.font = '800 18px "JetBrains Mono", monospace'
      ctx.fillText(hex.toUpperCase(), 66 + i * 154, 404)
    })
  } else if (zone === 'engenharia') {
    // Stylized WebGL wave & shader graph
    ctx.fillStyle = '#e8f7ff'
    ctx.beginPath()
    ctx.roundRect(48, 232, 928, 224, 28)
    ctx.fill()
    ctx.strokeStyle = '#00b4ff'
    ctx.lineWidth = 10
    ctx.beginPath()
    for (let x = 80; x <= 940; x += 12) {
      const y = 340 + Math.sin(x * 0.022) * 52
      if (x === 80) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 7
    ctx.beginPath()
    for (let x = 80; x <= 940; x += 12) {
      const y = 355 + Math.cos(x * 0.018) * 38
      if (x === 80) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  } else if (zone === 'pixel-perfect') {
    // 60 FPS green telemetry bars
    const metrics = [
      { label: 'FPS LOCK', val: '60', pct: 0.96, col: '#02c6a7' },
      { label: 'SHADOWS', val: '1 DIR', pct: 0.85, col: '#3b82f6' },
      { label: 'INSTANCING', val: 'MAX', pct: 0.92, col: '#f6b93b' },
      { label: 'VRAM', val: 'LEVE', pct: 0.88, col: '#f2676f' },
    ]
    metrics.forEach((m, i) => {
      const bx = 48 + i * 236
      ctx.fillStyle = '#f4f8ff'
      ctx.beginPath()
      ctx.roundRect(bx, 236, 214, 214, 26)
      ctx.fill()
      ctx.fillStyle = m.col
      ctx.font = '900 48px "Nunito", sans-serif'
      ctx.fillText(m.val, bx + 24, 326)
      ctx.fillStyle = '#3b3777'
      ctx.font = '800 18px "JetBrains Mono", monospace'
      ctx.fillText(m.label, bx + 24, 376)
      ctx.fillStyle = '#e2eaf5'
      ctx.beginPath()
      ctx.roundRect(bx + 24, 398, 166, 16, 8)
      ctx.fill()
      ctx.fillStyle = m.col
      ctx.beginPath()
      ctx.roundRect(bx + 24, 398, 166 * m.pct, 16, 8)
      ctx.fill()
    })
  } else {
    // Nori Lounge / Co-CEO celebration cards
    const cards = [
      { title: '2 Co-CEOs', desc: 'Acesso privado em LAN', col: '#de6c80' },
      { title: 'Bem-Estar', desc: 'Cada criação celebra a equipe', col: '#02c6a7' },
      { title: 'Gemini Live', desc: 'Estúdios vivos & modulares', col: '#f6b93b' },
    ]
    cards.forEach((c, i) => {
      const cx = 48 + i * 316
      ctx.fillStyle = c.col
      ctx.beginPath()
      ctx.roundRect(cx, 240, 294, 206, 28)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = '900 34px "Nunito", sans-serif'
      ctx.fillText(c.title, cx + 26, 320)
      ctx.font = '700 22px "Nunito", sans-serif'
      ctx.fillText(c.desc, cx + 26, 372)
    })
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Instanced potted faceted Coastal World plants placed neatly in room corners */
function StudioPottedPlants({ half }: { half: number }) {
  const potsRef = useRef<THREE.InstancedMesh>(null)
  const leavesRef = useRef<THREE.InstancedMesh>(null)

  const positions = useMemo(
    () =>
      [
        [-half + 1.15, -half + 1.15, 1.08],
        [half - 1.15, -half + 1.15, 1.0],
        [-half + 1.15, half - 1.35, 0.92],
        [half - 1.15, half - 1.35, 0.96],
      ] as [number, number, number][],
    [half]
  )

  useEffect(() => {
    const dummy = new THREE.Object3D()
    positions.forEach(([x, z, s], i) => {
      dummy.position.set(x, 0.32 * s, z)
      dummy.scale.set(s, s, s)
      dummy.rotation.set(0, i * 0.8, 0)
      dummy.updateMatrix()
      potsRef.current?.setMatrixAt(i, dummy.matrix)

      dummy.position.set(x, 0.98 * s, z)
      dummy.scale.set(s * 1.1, s * 1.05, s * 1.1)
      dummy.updateMatrix()
      leavesRef.current?.setMatrixAt(i, dummy.matrix)
    })
    if (potsRef.current) potsRef.current.instanceMatrix.needsUpdate = true
    if (leavesRef.current) leavesRef.current.instanceMatrix.needsUpdate = true
  }, [positions])

  return (
    <group>
      <instancedMesh ref={potsRef} args={[undefined, undefined, positions.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.26, 0.64, 14]} />
        <meshStandardMaterial color="#e08d67" roughness={0.78} />
      </instancedMesh>
      <instancedMesh ref={leavesRef} args={[undefined, undefined, positions.length]} castShadow>
        <icosahedronGeometry args={[0.56, 1]} />
        <meshStandardMaterial color="#2ec772" roughness={0.76} flatShading />
      </instancedMesh>
    </group>
  )
}

/** Instanced hanging warm coastal globe pendants suspended along the back studio walls */
function StudioWarmPendants({ half, wallHeight }: { half: number; wallHeight: number }) {
  const cordsRef = useRef<THREE.InstancedMesh>(null)
  const globesRef = useRef<THREE.InstancedMesh>(null)
  const count = 4

  useEffect(() => {
    const dummy = new THREE.Object3D()
    const spacing = (half * 1.3) / (count - 1)
    for (let i = 0; i < count; i++) {
      const x = -half * 0.65 + i * spacing
      const z = -half + 1.55
      dummy.position.set(x, wallHeight - 0.55, z)
      dummy.scale.set(1, 1, 1)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      cordsRef.current?.setMatrixAt(i, dummy.matrix)

      dummy.position.set(x, wallHeight - 1.08, z)
      dummy.updateMatrix()
      globesRef.current?.setMatrixAt(i, dummy.matrix)
    }
    if (cordsRef.current) cordsRef.current.instanceMatrix.needsUpdate = true
    if (globesRef.current) globesRef.current.instanceMatrix.needsUpdate = true
  }, [half, wallHeight])

  return (
    <group>
      <instancedMesh ref={cordsRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.02, 0.02, 1.0, 6]} />
        <meshStandardMaterial color="#3b3777" roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={globesRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.24, 12, 10]} />
        <meshStandardMaterial
          color="#fff6d6"
          emissive="#ffd666"
          emissiveIntensity={0.85}
          roughness={0.25}
        />
      </instancedMesh>
    </group>
  )
}

/**
 * 4 Bespoke, sunlit, walkable Coastal World 3D Studio Interiors crafted in Luma + Kael + Vex style.
 * - Full pastel walls on North (-Z) & West (-X) with sunlit coastal windows & bespoke wall art
 * - Low open coastal balcony rails on East (+X) & South (+Z) so the 3rd-person walk camera NEVER clips!
 * - Interactive Coastal Exit Archway on the South edge returning Co-CEOs right outside the studio door!
 */
export function CoastalStudioInterior({
  zone,
  roomScale,
  showFloorGrid,
  studioTheme,
  onExitToIsland,
}: CoastalStudioInteriorProps) {
  const [exitHovered, setExitHovered] = useState(false)
  const heroSpinRef = useRef<THREE.Group>(null)

  const scaleMeta = ROOM_SCALES[roomScale]
  const roomSize = scaleMeta.size
  const wallHeight = scaleMeta.wallHeight
  const half = roomSize / 2
  const wallThick = 0.42

  const pal = ZONE_PALETTES[zone] ?? ZONE_PALETTES.criacao
  const accentColor = studioTheme?.roofAccent || pal.accent

  const floorTex = useMemo(
    () => createCoastalFloorTexture(pal.floor, pal.floorPlankAlt, zone === 'pixel-perfect'),
    [pal.floor, pal.floorPlankAlt, zone]
  )
  const boardTex = useMemo(() => createZoneBoardTexture(zone, pal), [zone, pal])

  useEffect(() => {
    const rep = Math.max(2, roomSize / 4.5)
    floorTex.repeat.set(rep, rep)
    floorTex.needsUpdate = true
  }, [floorTex, roomSize])

  useEffect(() => {
    return () => {
      floorTex.dispose()
      boardTex.dispose()
    }
  }, [floorTex, boardTex])

  useFrame(({ clock }) => {
    if (heroSpinRef.current) {
      heroSpinRef.current.rotation.y = clock.elapsedTime * 0.65
    }
  })

  const boardW = Math.min(6.4, roomSize * 0.44)
  const boardH = boardW * 0.5
  const heroOffset = Math.min(4.2, half * 0.44)

  return (
    <group>
      {/* Crisp Coastal Sand & White Diorama Plinth Base underneath floor */}
      <mesh position={[0, -0.34, 0]} receiveShadow>
        <boxGeometry args={[roomSize + 1.2, 0.52, roomSize + 1.2]} />
        <meshStandardMaterial color="#f0d599" roughness={0.86} />
      </mesh>
      <mesh position={[0, -0.07, 0]} receiveShadow>
        <boxGeometry args={[roomSize + 0.45, 0.14, roomSize + 0.45]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>

      {/* Main Warm Sunlit Hardwood / Coastal Tile Floor (top flush at y = 0) */}
      <mesh position={[0, -0.025, 0]} receiveShadow>
        <boxGeometry args={[roomSize, 0.05, roomSize]} />
        <meshStandardMaterial map={floorTex} roughness={0.68} />
      </mesh>

      {/* Cozy Center Pastel Coastal Rug */}
      <mesh position={[0, 0.012, -0.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[Math.min(3.5, half * 0.48), 36]} />
        <meshStandardMaterial color={pal.rug} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.015, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(3.32, half * 0.45), Math.min(3.52, half * 0.48), 36]} />
        <meshStandardMaterial color={pal.rugBorder} roughness={0.85} />
      </mesh>

      {/* === NORTH BACK WALL (z = -half) === */}
      <mesh position={[0, wallHeight / 2, -half - wallThick / 2]} castShadow receiveShadow>
        <boxGeometry args={[roomSize + wallThick * 2, wallHeight, wallThick]} />
        <meshStandardMaterial color={pal.wall} roughness={0.78} />
      </mesh>
      {/* Crisp Coastal Crown Molding & Baseboard */}
      <mesh position={[0, wallHeight + 0.14, -half - wallThick / 2]} castShadow>
        <boxGeometry args={[roomSize + wallThick * 2 + 0.25, 0.28, wallThick + 0.22]} />
        <meshStandardMaterial color={pal.trim} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.1, -half + 0.04]}>
        <boxGeometry args={[roomSize, 0.2, 0.08]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>

      {/* === WEST SIDE WALL (x = -half) === */}
      <mesh position={[-half - wallThick / 2, wallHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThick, wallHeight, roomSize]} />
        <meshStandardMaterial color={pal.wallSide} roughness={0.78} />
      </mesh>
      <mesh position={[-half - wallThick / 2, wallHeight + 0.14, 0]} castShadow>
        <boxGeometry args={[wallThick + 0.22, 0.28, roomSize + 0.2]} />
        <meshStandardMaterial color={pal.trim} roughness={0.55} />
      </mesh>
      <mesh position={[-half + 0.04, 0.1, 0]}>
        <boxGeometry args={[0.08, 0.2, roomSize]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>

      {/* === LOW OPEN SUNLIT COASTAL BALCONY PARAPETS (East + South edges — ZERO camera clipping!) === */}
      <mesh position={[half + 0.16, 0.34, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.68, roomSize]} />
        <meshStandardMaterial color="#eef5fa" roughness={0.65} />
      </mesh>
      <mesh position={[half + 0.16, 0.72, 0]}>
        <boxGeometry args={[0.42, 0.1, roomSize + 0.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      {/* South low parapet leaving center exit archway wide open */}
      <mesh position={[-half / 2 - 1.1, 0.34, half + 0.16]} receiveShadow>
        <boxGeometry args={[Math.max(1, half - 2.2), 0.68, 0.32]} />
        <meshStandardMaterial color="#eef5fa" roughness={0.65} />
      </mesh>
      <mesh position={[half / 2 + 1.1, 0.34, half + 0.16]} receiveShadow>
        <boxGeometry args={[Math.max(1, half - 2.2), 0.68, 0.32]} />
        <meshStandardMaterial color="#eef5fa" roughness={0.65} />
      </mesh>

      {/* === SIGNATURE SUNLIT COASTAL BAY WINDOWS ON WEST WALL === */}
      {zone === 'criacao' ? (
        // Round Porthole Sunlit Windows matching Luma's harbor cafe exterior 1:1!
        [-half * 0.42, 0.2, half * 0.42].map((wz, i) => (
          <group key={i} position={[-half + 0.03, wallHeight * 0.48, wz]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <circleGeometry args={[0.92, 24]} />
              <meshBasicMaterial color="#7be0f7" />
            </mesh>
            <mesh position={[0, -0.36, 0.01]}>
              <circleGeometry args={[0.46, 14]} />
              <meshBasicMaterial color="#eefcff" />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <ringGeometry args={[0.88, 1.04, 24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.45} />
            </mesh>
          </group>
        ))
      ) : (
        // Panoramic Bright Coastal Windows looking out onto sky & pastel sea
        [-half * 0.38, half * 0.25].map((wz, i) => (
          <group key={i} position={[-half + 0.03, wallHeight * 0.5, wz]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <planeGeometry args={[2.5, 2.35]} />
              <meshBasicMaterial color="#8ae3f8" />
            </mesh>
            <mesh position={[-0.45, 0.4, 0.01]}>
              <circleGeometry args={[0.42, 14]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.4, -0.5, 0.01]}>
              <planeGeometry args={[2.46, 0.72]} />
              <meshBasicMaterial color="#58bde8" />
            </mesh>
            {/* White window frame & cross mullions */}
            <mesh position={[0, 0, 0.03]}>
              <boxGeometry args={[0.1, 2.42, 0.06]} />
              <meshStandardMaterial color="#ffffff" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.1, 0.03]}>
              <boxGeometry args={[2.56, 0.1, 0.06]} />
              <meshStandardMaterial color="#ffffff" roughness={0.45} />
            </mesh>
            <mesh position={[0, -1.24, 0.06]}>
              <boxGeometry args={[2.75, 0.14, 0.24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.45} />
            </mesh>
          </group>
        ))
      )}

      {/* === LUMINOUS STUDIO SIGNATURE WALL BOARD ON NORTH WALL === */}
      <group position={[0, wallHeight * 0.52, -half + 0.08]}>
        <mesh castShadow>
          <boxGeometry args={[boardW + 0.24, boardH + 0.24, 0.12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.075]}>
          <planeGeometry args={[boardW, boardH]} />
          <meshStandardMaterial
            map={boardTex}
            emissiveMap={boardTex}
            emissive="#ffffff"
            emissiveIntensity={0.14}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* === BESPOKE 3D ART HERO INSTALLATIONS PER STUDIO ZONE === */}

      {/* 1. LUMA (criacao): Rotating Mini-Island Diorama Showcase Table + Pastel Art Easel */}
      {zone === 'criacao' && (
        <group>
          <group position={[-heroOffset, 0, -heroOffset * 0.78]}>
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[1.15, 0.98, 0.9, 24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.93, 0]}>
              <cylinderGeometry args={[1.05, 1.05, 0.06, 24]} />
              <meshStandardMaterial color="#67d2ec" roughness={0.35} />
            </mesh>
            {/* Rotating miniature Coastal Blequi Island maquette! */}
            <group ref={heroSpinRef} position={[0, 1.04, 0]}>
              <mesh receiveShadow castShadow>
                <cylinderGeometry args={[0.72, 0.82, 0.18, 16]} />
                <meshStandardMaterial color="#f0d599" roughness={0.85} />
              </mesh>
              <mesh position={[0, 0.12, 0]} castShadow>
                <cylinderGeometry args={[0.62, 0.66, 0.12, 16]} />
                <meshStandardMaterial color="#58cb76" roughness={0.8} />
              </mesh>
              {/* Tiny Clocktower & Coral House on Maquette */}
              <mesh position={[0, 0.34, -0.1]} castShadow>
                <boxGeometry args={[0.38, 0.32, 0.26]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.56, -0.1]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[0.28, 0.18, 4]} />
                <meshStandardMaterial color="#de6c80" roughness={0.55} />
              </mesh>
              {/* Tiny Lighthouse */}
              <mesh position={[-0.44, 0.38, 0.18]}>
                <cylinderGeometry args={[0.06, 0.09, 0.46, 10]} />
                <meshStandardMaterial color="#58697c" roughness={0.6} />
              </mesh>
              <mesh position={[0.42, 0.34, 0.15]}>
                <coneGeometry args={[0.14, 0.34, 6]} />
                <meshStandardMaterial color="#2ed66d" flatShading />
              </mesh>
            </group>
          </group>

          {/* Warm Ceramic Espresso & Matcha Counter on East side */}
          <group position={[heroOffset, 0, -heroOffset * 0.85]}>
            <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.1, 0.92, 0.88]} />
              <meshStandardMaterial color="#f28b50" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.96, 0]} castShadow>
              <boxGeometry args={[2.24, 0.1, 0.98]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
            <mesh position={[-0.45, 1.24, 0]} castShadow>
              <boxGeometry args={[0.52, 0.46, 0.42]} />
              <meshStandardMaterial color="#3b3777" roughness={0.4} />
            </mesh>
            <mesh position={[0.45, 1.12, 0.1]} castShadow>
              <cylinderGeometry args={[0.12, 0.1, 0.22, 14]} />
              <meshStandardMaterial color="#f6d35f" roughness={0.4} />
            </mesh>
          </group>
        </group>
      )}

      {/* 2. KAEL (engenharia): Bold Coral Accent Pillar + Iridescent Rotating WebGL TorusKnot Sculpture */}
      {zone === 'engenharia' && (
        <group>
          {/* Signature Coral Vertical Feature Strip on North Wall matching Kael's exterior */}
          <mesh position={[-half + 1.2, wallHeight / 2, -half + 0.06]}>
            <boxGeometry args={[1.4, wallHeight, 0.14]} />
            <meshStandardMaterial color="#f06673" roughness={0.55} />
          </mesh>

          <group position={[heroOffset, 0, -heroOffset * 0.78]}>
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.92, 1.05, 1.0, 20]} />
              <meshStandardMaterial color="#ffffff" roughness={0.42} />
            </mesh>
            <mesh position={[0, 1.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.68, 0.82, 28]} />
              <meshBasicMaterial color="#02c6a7" />
            </mesh>
            <group ref={heroSpinRef} position={[0, 1.75, 0]}>
              <mesh castShadow>
                <torusKnotGeometry args={[0.48, 0.16, 64, 10]} />
                <meshStandardMaterial
                  color="#6366f1"
                  emissive="#4f46e5"
                  emissiveIntensity={0.45}
                  roughness={0.22}
                  metalness={0.35}
                />
              </mesh>
            </group>
          </group>

          {/* Cozy Pastel Beanbag Coding Corner */}
          <group position={[-heroOffset, 0, -heroOffset * 0.65]}>
            <mesh position={[0, 0.34, 0]} scale={[1.2, 0.75, 1.1]} castShadow>
              <sphereGeometry args={[0.75, 16, 12]} />
              <meshStandardMaterial color="#60c8f2" roughness={0.82} />
            </mesh>
            <mesh position={[1.15, 0.3, 0.45]} scale={[1.1, 0.7, 1.05]} castShadow>
              <sphereGeometry args={[0.64, 16, 12]} />
              <meshStandardMaterial color="#f2676f" roughness={0.82} />
            </mesh>
          </group>
        </group>
      )}

      {/* 3. VEX (pixel-perfect): Navy Timber Ceiling Beam + Spinning 60 FPS Cyan Octahedron Observatory */}
      {zone === 'pixel-perfect' && (
        <group>
          {/* Coastal Navy Overhead Architectural Beam matching Vex's roof exterior */}
          <mesh position={[0, wallHeight - 0.16, -half + 1.4]} castShadow>
            <boxGeometry args={[roomSize - 0.5, 0.28, 0.32]} />
            <meshStandardMaterial color="#343c59" roughness={0.55} />
          </mesh>

          <group position={[-heroOffset, 0, -heroOffset * 0.76]}>
            <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[1.05, 1.18, 0.84, 8]} />
              <meshStandardMaterial color="#343c59" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.88, 0]}>
              <cylinderGeometry args={[0.92, 0.92, 0.08, 20]} />
              <meshStandardMaterial color="#02c6a7" emissive="#02c6a7" emissiveIntensity={0.5} />
            </mesh>
            <group ref={heroSpinRef} position={[0, 1.72, 0]}>
              <mesh castShadow>
                <octahedronGeometry args={[0.62, 0]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#02c6a7"
                  emissiveIntensity={0.65}
                  roughness={0.2}
                />
              </mesh>
              <mesh rotation={[Math.PI / 3, 0, 0]}>
                <torusGeometry args={[0.88, 0.04, 8, 28]} />
                <meshStandardMaterial color="#f6d35f" roughness={0.35} />
              </mesh>
            </group>
          </group>

          {/* Zen Coastal Bench + Faceted Bonsai on East side */}
          <group position={[heroOffset, 0, -heroOffset * 0.65]}>
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.1, 0.12, 0.68]} />
              <meshStandardMaterial color="#e0b27c" roughness={0.7} />
            </mesh>
            <mesh position={[-0.85, 0.2, 0]} castShadow>
              <boxGeometry args={[0.14, 0.4, 0.58]} />
              <meshStandardMaterial color="#343c59" roughness={0.55} />
            </mesh>
            <mesh position={[0.85, 0.2, 0]} castShadow>
              <boxGeometry args={[0.14, 0.4, 0.58]} />
              <meshStandardMaterial color="#343c59" roughness={0.55} />
            </mesh>
          </group>
        </group>
      )}

      {/* 4. NORI (b2b-lab): Grand Clocktower Interior + Playful Rainbow Arch + Co-CEO Celebration Lounge */}
      {(zone === 'b2b-lab' || zone === 'editorial') && (
        <group>
          {/* Giant Golden Interior Town Hall Clock above the Wall Board */}
          <group position={[0, wallHeight - 0.82, -half + 0.12]}>
            <mesh>
              <circleGeometry args={[0.62, 24]} />
              <meshStandardMaterial color="#f6d35f" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, 0.015]}>
              <ringGeometry args={[0.58, 0.68, 24]} />
              <meshStandardMaterial color="#de6c80" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.14, 0.025]}>
              <boxGeometry args={[0.055, 0.34, 0.02]} />
              <meshBasicMaterial color="#3b3777" />
            </mesh>
            <mesh position={[0.14, 0, 0.025]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.055, 0.28, 0.02]} />
              <meshBasicMaterial color="#3b3777" />
            </mesh>
          </group>

          {/* Playful Coastal Rainbow Arch Sculpture in Northwest Lounge */}
          <group position={[-heroOffset, 0, -heroOffset * 0.72]} rotation={[0, 0.35, 0]}>
            <mesh position={[0, 0.1, 0]} castShadow>
              <torusGeometry args={[1.38, 0.22, 12, 28, Math.PI]} />
              <meshStandardMaterial color="#02c6a7" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.1, 0.02]}>
              <torusGeometry args={[1.08, 0.18, 10, 26, Math.PI]} />
              <meshStandardMaterial color="#f6d35f" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.1, 0.04]}>
              <torusGeometry args={[0.8, 0.15, 10, 24, Math.PI]} />
              <meshStandardMaterial color="#f2676f" roughness={0.45} />
            </mesh>
          </group>

          {/* Cozy Curved Co-CEO Lounge Sofa & Coffee Table on East side */}
          <group position={[heroOffset, 0, -heroOffset * 0.68]} rotation={[0, -0.45, 0]}>
            <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.3, 0.44, 0.95]} />
              <meshStandardMaterial color="#f8a4b0" roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.72, -0.36]} castShadow>
              <boxGeometry args={[2.3, 0.56, 0.26]} />
              <meshStandardMaterial color="#f28898" roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.24, 1.15]} castShadow receiveShadow>
              <cylinderGeometry args={[0.68, 0.62, 0.46, 20]} />
              <meshStandardMaterial color="#ffffff" roughness={0.48} />
            </mesh>
            {/* Rotating Golden Co-CEO Star Trophy on Coffee Table */}
            <group ref={heroSpinRef} position={[0, 0.78, 1.15]}>
              <mesh castShadow>
                <octahedronGeometry args={[0.24, 0]} />
                <meshStandardMaterial color="#f6d35f" emissive="#fbbf24" emissiveIntensity={0.45} />
              </mesh>
            </group>
          </group>
        </group>
      )}

      {/* === SHARED INSTANCED BOTANICAL PLANTS & WARM PENDANTS (Vex 60 FPS Standard) === */}
      <StudioPottedPlants half={half} />
      <StudioWarmPendants half={half} wallHeight={wallHeight} />

      {/* === GLOWING COASTAL EXIT ARCHWAY ON SOUTH EDGE (Click OR walk up to exit!) === */}
      <group
        position={[0, 0, half - 0.12]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setExitHovered(true)
        }}
        onPointerOut={() => setExitHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          onExitToIsland()
        }}
      >
        {/* Cozy Pastel Welcome/Exit Mat */}
        <mesh position={[0, 0.018, -0.48]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.45, 1.1]} />
          <meshStandardMaterial color={exitHovered ? '#02c6a7' : '#86e0cf'} roughness={0.85} />
        </mesh>
        {/* Low Open-Air Coastal Entrance Bollards (never obstructs 3rd-person camera!) */}
        <mesh position={[-1.38, 0.48, 0.08]} castShadow>
          <boxGeometry args={[0.3, 0.96, 0.34]} />
          <meshStandardMaterial color="#ffffff" roughness={0.45} />
        </mesh>
        <mesh position={[-1.38, 1.06, 0.08]}>
          <sphereGeometry args={[0.14, 12, 10]} />
          <meshStandardMaterial
            color="#fff6d6"
            emissive={exitHovered ? '#02c6a7' : accentColor}
            emissiveIntensity={exitHovered ? 1.2 : 0.75}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[1.38, 0.48, 0.08]} castShadow>
          <boxGeometry args={[0.3, 0.96, 0.34]} />
          <meshStandardMaterial color="#ffffff" roughness={0.45} />
        </mesh>
        <mesh position={[1.38, 1.06, 0.08]}>
          <sphereGeometry args={[0.14, 12, 10]} />
          <meshStandardMaterial
            color="#fff6d6"
            emissive={exitHovered ? '#02c6a7' : accentColor}
            emissiveIntensity={exitHovered ? 1.2 : 0.75}
            roughness={0.25}
          />
        </mesh>

        {exitHovered && (
          <Html position={[0, 1.65, 0]} center distanceFactor={16} zIndexRange={[10, 0]} style={{ pointerEvents: 'auto' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onExitToIsland()
              }}
              className="rounded-full border-2 border-white bg-[#02c6a7] px-3.5 py-1 text-xs font-extrabold text-white shadow-lg whitespace-nowrap"
            >
              ← Sair para a Ilha Blequi
            </button>
          </Html>
        )}
      </group>

      {/* Optional Architectural Modular Floor Grid */}
      {showFloorGrid && (
        <group position={[0, 0.022, 0]}>
          <Grid
            args={[roomSize - 0.4, roomSize - 0.4]}
            cellSize={1.5}
            cellThickness={0.55}
            cellColor="#7b96b2"
            sectionSize={6}
            sectionThickness={1.0}
            sectionColor="#3b3777"
            fadeDistance={roomSize * 2.2}
            fadeStrength={0.5}
          />
        </group>
      )}
    </group>
  )
}
