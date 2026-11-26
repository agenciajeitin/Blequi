import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { AgentEmployee, StudioZoneId, WorldTimeOfDay } from '@funcionarios/types'
import { STUDIO_ZONES } from '@funcionarios/providers'

export interface CoastalStudioLocation {
  zoneId: StudioZoneId
  position: [number, number, number]
  rotationY: number
  doorPoint: [number, number, number]
  teleportPoint: [number, number, number]
  mapCoords: { x: number; y: number } // Percentage 0..100 on the Phone interactive map
  badgeColor: string
}

export const COASTAL_STUDIO_LOCATIONS: Record<
  Exclude<StudioZoneId, 'editorial'>,
  CoastalStudioLocation
> = {
  'b2b-lab': {
    zoneId: 'b2b-lab',
    position: [0, 1.35, -5.2],
    rotationY: 0,
    doorPoint: [0, 1.35, -0.4],
    teleportPoint: [0, 1.35, 2.2],
    mapCoords: { x: 50, y: 36 },
    badgeColor: '#de6e82',
  },
  criacao: {
    zoneId: 'criacao',
    position: [10.4, 1.35, 8.2],
    rotationY: -0.32,
    doorPoint: [8.6, 1.35, 10.6],
    teleportPoint: [7.6, 1.35, 11.4],
    mapCoords: { x: 74, y: 63 },
    badgeColor: '#f97316',
  },
  engenharia: {
    zoneId: 'engenharia',
    position: [-12.2, 1.35, 3.8],
    rotationY: 0.36,
    doorPoint: [-8.8, 1.35, 5.2],
    teleportPoint: [-7.2, 1.35, 6.2],
    mapCoords: { x: 24, y: 52 },
    badgeColor: '#6366f1',
  },
  'pixel-perfect': {
    zoneId: 'pixel-perfect',
    position: [-11.4, 1.35, -8.2],
    rotationY: 0.28,
    doorPoint: [-9.8, 1.35, -4.8],
    teleportPoint: [-8.6, 1.35, -3.5],
    mapCoords: { x: 27, y: 26 },
    badgeColor: '#02c6a7',
  },
}

interface CoastalStudiosProps {
  agents: AgentEmployee[]
  propCounts: Record<StudioZoneId, number>
  timeOfDay: WorldTimeOfDay
  showLabels: boolean
  onEnterStudio: (zone: StudioZoneId) => void
}

function StudioFloatingSign({
  title,
  accent,
  propCount,
  hovered,
  y,
  onClick,
}: {
  title: string
  accent: string
  propCount: number
  hovered: boolean
  y: number
  onClick: () => void
}) {
  return (
    <Html position={[0, y, 0]} center distanceFactor={22} zIndexRange={[10, 0]} style={{ pointerEvents: 'auto' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1 whitespace-nowrap shadow-lg transition-all duration-200 ${
          hovered
            ? 'scale-110 border-white bg-[#3b3777] text-white shadow-[#3b3777]/30'
            : 'border-white/90 bg-white/95 text-[#3b3777] hover:scale-105'
        }`}
      >
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
        <span className="text-[11px] font-extrabold tracking-tight">{title}</span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            hovered ? 'bg-[#02c6a7] text-white' : 'bg-[#eef3f9] text-[#02c6a7]'
          }`}
        >
          {hovered ? 'Entrar →' : `${propCount}`}
        </span>
      </button>
    </Html>
  )
}

/**
 * All 4 Interactive Blequi Studios + Scenic Coastal World Town Buildings.
 * Visual architecture directly mirrors Coastal World's pastel stucco, coral/mint/navy roofs,
 * recessed mint-glass windows, iconic Clocktower Town Hall, Tilted-Mug Harbor Cafe, and Beach Pavilion.
 */
export function CoastalStudios({
  agents,
  propCounts,
  timeOfDay,
  showLabels,
  onEnterStudio,
}: CoastalStudiosProps) {
  const [hoveredZone, setHoveredZone] = useState<StudioZoneId | null>(null)
  const mugRef = useRef<THREE.Group>(null)
  const prismRef = useRef<THREE.Mesh>(null)
  const radarRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (mugRef.current) {
      mugRef.current.position.y = 3.85 + Math.sin(t * 1.9) * 0.14
      mugRef.current.rotation.z = -0.34 + Math.sin(t * 1.2) * 0.06
    }
    if (prismRef.current) {
      prismRef.current.rotation.y = t * 0.85
      prismRef.current.position.y = 5.45 + Math.sin(t * 2.1) * 0.12
    }
    if (radarRef.current) {
      radarRef.current.rotation.y = t * 1.15
    }
  })

  const windowGlow = timeOfDay === 'dusk' ? 0.95 : timeOfDay === 'golden' ? 0.3 : 0.12
  const windowColor = timeOfDay === 'dusk' ? '#fff3c4' : '#cfe9e0'

  const getTheme = (zoneId: StudioZoneId) => {
    const owner = agents.find((a) => a.zone === zoneId)
    const meta = STUDIO_ZONES[zoneId]
    return {
      name: owner?.studioTheme.studioName || meta.shortName,
      accent: owner?.studioTheme.roofAccent || meta.color,
      facade: owner?.studioTheme.facadeColor || '#f7fafc',
    }
  }

  const noriTheme = getTheme('b2b-lab')
  const lumaTheme = getTheme('criacao')
  const kaelTheme = getTheme('engenharia')
  const vexTheme = getTheme('pixel-perfect')

  const makeHandlers = (zoneId: StudioZoneId) => ({
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      setHoveredZone(zoneId)
    },
    onPointerOut: () => setHoveredZone((cur) => (cur === zoneId ? null : cur)),
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      onEnterStudio(zoneId)
    },
  })

  return (
    <group>
      {/* ========================================================================
          1. SEDE BLEQUI / PAVILHÃO NORI — Iconic Coral-Roofed Clocktower Town Hall
          Directly ahead of the wooden pier (1:1 steps/62/media_0.png center hero!)
      ======================================================================== */}
      <group
        position={COASTAL_STUDIO_LOCATIONS['b2b-lab'].position}
        rotation={[0, COASTAL_STUDIO_LOCATIONS['b2b-lab'].rotationY, 0]}
        {...makeHandlers('b2b-lab')}
      >
        {/* Raised stone terrace plinth */}
        <mesh position={[0, 0.22, 0.2]} castShadow receiveShadow>
          <boxGeometry args={[10.6, 0.44, 6.2]} />
          <meshStandardMaterial color="#e7eef3" roughness={0.78} />
        </mesh>

        {/* Left & Right symmetrical wings */}
        <mesh position={[-3.35, 2.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.4, 3.7, 4.6]} />
          <meshStandardMaterial color="#f5f8fb" roughness={0.65} />
        </mesh>
        <mesh position={[3.35, 2.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.4, 3.7, 4.6]} />
          <meshStandardMaterial color="#f5f8fb" roughness={0.65} />
        </mesh>

        {/* Central Portico Pavilion */}
        <mesh position={[0, 2.45, 0.35]} castShadow receiveShadow>
          <boxGeometry args={[3.6, 4.1, 5.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>

        {/* Signature Coral-Rose Pitched Roof (matches steps/62/media_0.png!) */}
        <mesh position={[-3.35, 4.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[3.45, 1.55, 4]} />
          <meshStandardMaterial color="#de6c80" roughness={0.58} />
        </mesh>
        <mesh position={[3.35, 4.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[3.45, 1.55, 4]} />
          <meshStandardMaterial color="#de6c80" roughness={0.58} />
        </mesh>
        {/* Central Gable Pediment */}
        <mesh position={[0, 5.0, 0.4]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[3.5, 1.6, 4]} />
          <meshStandardMaterial color="#e47488" roughness={0.58} />
        </mesh>

        {/* Tall Central Clocktower Spire */}
        <mesh position={[0, 6.4, 0.25]} castShadow>
          <boxGeometry args={[1.95, 2.5, 1.95]} />
          <meshStandardMaterial color="#ffffff" roughness={0.55} />
        </mesh>
        {/* Golden Clock Face */}
        <mesh position={[0, 6.55, 1.25]}>
          <circleGeometry args={[0.58, 24]} />
          <meshStandardMaterial color="#f6c744" roughness={0.35} />
        </mesh>
        <mesh position={[0, 6.55, 1.265]}>
          <ringGeometry args={[0.54, 0.62, 24]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
        </mesh>
        {/* Clock Hands */}
        <mesh position={[0, 6.68, 1.28]}>
          <boxGeometry args={[0.055, 0.34, 0.02]} />
          <meshBasicMaterial color="#3b3777" />
        </mesh>
        <mesh position={[0.14, 6.55, 1.28]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.055, 0.26, 0.02]} />
          <meshBasicMaterial color="#3b3777" />
        </mesh>
        {/* Coral Clocktower Cap */}
        <mesh position={[0, 8.15, 0.25]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.55, 1.15, 4]} />
          <meshStandardMaterial color="#de6c80" roughness={0.55} />
        </mesh>

        {/* Recessed Mint Arched Windows (2 floors across wings + center) */}
        {[-4.1, -2.6, 2.6, 4.1].map((wx, i) => (
          <group key={`win-${i}`}>
            <mesh position={[wx, 3.05, 2.33]}>
              <boxGeometry args={[0.85, 1.15, 0.08]} />
              <meshStandardMaterial
                color={windowColor}
                emissive="#ffe8a3"
                emissiveIntensity={windowGlow}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[wx, 1.4, 2.33]}>
              <boxGeometry args={[0.85, 1.15, 0.08]} />
              <meshStandardMaterial
                color={windowColor}
                emissive="#ffe8a3"
                emissiveIntensity={windowGlow}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}

        {/* Grand Entrance Archway Door */}
        <mesh position={[0, 1.45, 2.93]}>
          <boxGeometry args={[1.5, 2.1, 0.12]} />
          <meshStandardMaterial color="#6d4c5b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 3.25, 2.93]}>
          <boxGeometry args={[1.15, 1.05, 0.08]} />
          <meshStandardMaterial color={windowColor} emissive="#ffe8a3" emissiveIntensity={windowGlow} />
        </mesh>

        {/* Horizontal coral architectural belt trim */}
        <mesh position={[0, 2.28, 2.35]}>
          <boxGeometry args={[10.3, 0.14, 0.16]} />
          <meshStandardMaterial color="#e8b8c0" roughness={0.6} />
        </mesh>

        {/* Cute entrance flower planters */}
        {[-2.2, 2.2].map((fx, i) => (
          <group key={i} position={[fx, 0.65, 3.1]}>
            <mesh castShadow>
              <boxGeometry args={[1.1, 0.45, 0.55]} />
              <meshStandardMaterial color="#d8a25e" roughness={0.78} />
            </mesh>
            <mesh position={[0, 0.34, 0]} castShadow>
              <dodecahedronGeometry args={[0.38, 1]} />
              <meshStandardMaterial color="#38c973" roughness={0.8} flatShading />
            </mesh>
          </group>
        ))}

        {showLabels && hoveredZone === 'b2b-lab' && (
          <StudioFloatingSign
            title={noriTheme.name}
            accent={noriTheme.accent}
            propCount={propCounts['b2b-lab'] ?? 0}
            hovered={true}
            y={9.4}
            onClick={() => onEnterStudio('b2b-lab')}
          />
        )}
      </group>

      {/* ========================================================================
          2. ESTÚDIO LUMA · DIORAMAS — Iconic Tilted-Roof Wood Harbor Cafe/Atelier
          Right of pier with giant tilted white cup on roof (1:1 steps/62/media_0.png!)
      ======================================================================== */}
      <group
        position={COASTAL_STUDIO_LOCATIONS.criacao.position}
        rotation={[0, COASTAL_STUDIO_LOCATIONS.criacao.rotationY, 0]}
        {...makeHandlers('criacao')}
      >
        {/* Warm stone deck */}
        <mesh position={[0, 0.14, 0.3]} receiveShadow castShadow>
          <boxGeometry args={[6.6, 0.28, 5.4]} />
          <meshStandardMaterial color="#e6dfd3" roughness={0.82} />
        </mesh>

        {/* Warm caramel wood main cabin */}
        <mesh position={[0, 1.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.4, 2.6, 4.1]} />
          <meshStandardMaterial color="#a87c56" roughness={0.74} />
        </mesh>

        {/* Slanted modern coastal roof slab with crisp white fascia */}
        <mesh position={[0, 3.12, 0.05]} rotation={[0.14, 0, -0.18]} castShadow>
          <boxGeometry args={[6.2, 0.28, 4.85]} />
          <meshStandardMaterial color="#f5ede2" roughness={0.52} />
        </mesh>
        <mesh position={[0, 2.95, 0.05]} rotation={[0.14, 0, -0.18]}>
          <boxGeometry args={[5.8, 0.16, 4.5]} />
          <meshStandardMaterial color="#c98e59" roughness={0.7} />
        </mesh>

        {/* Iconic Round Porthole Showcase Windows on front (steps/62/media_0.png!) */}
        {[-1.35, 0.1, 1.45].map((wx, i) => (
          <group key={i} position={[wx, 1.25, 2.08]}>
            <mesh>
              <circleGeometry args={[0.58, 22]} />
              <meshStandardMaterial
                color="#b8dfd5"
                emissive="#ffe3a8"
                emissiveIntensity={windowGlow + 0.12}
                roughness={0.28}
              />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <ringGeometry args={[0.54, 0.64, 22]} />
              <meshStandardMaterial color="#eef5f7" roughness={0.45} />
            </mesh>
          </group>
        ))}

        {/* Iconic Oversized Tilted White Mug/Diorama Sculpture floating on the roof! */}
        <group ref={mugRef} position={[-0.4, 3.85, 0.2]} rotation={[0.12, 0.4, -0.34]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.88, 0.72, 1.32, 18]} />
            <meshStandardMaterial color="#f6f9fc" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.78, 16]} />
            <meshStandardMaterial color="#915636" roughness={0.5} />
          </mesh>
          {/* Cup Handle */}
          <mesh position={[0.92, 0.06, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <torusGeometry args={[0.38, 0.11, 10, 18, Math.PI]} />
            <meshStandardMaterial color="#edf2f7" roughness={0.35} />
          </mesh>
        </group>

        {/* Warm wooden awning & outdoor signage */}
        <mesh position={[0, 2.15, 2.38]} rotation={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[4.8, 0.1, 0.85]} />
          <meshStandardMaterial color={lumaTheme.accent} roughness={0.55} />
        </mesh>

        {showLabels && hoveredZone === 'criacao' && (
          <StudioFloatingSign
            title={lumaTheme.name}
            accent={lumaTheme.accent}
            propCount={propCounts.criacao ?? 0}
            hovered={true}
            y={5.5}
            onClick={() => onEnterStudio('criacao')}
          />
        )}
      </group>

      {/* ========================================================================
          3. ESTÚDIO KAEL · WEBGL — Modern Coastal White/Mint Glass & Coral Studio
          Left side of main plaza (1:1 steps/113/media_0.png background!)
      ======================================================================== */}
      <group
        position={COASTAL_STUDIO_LOCATIONS.engenharia.position}
        rotation={[0, COASTAL_STUDIO_LOCATIONS.engenharia.rotationY, 0]}
        {...makeHandlers('engenharia')}
      >
        <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
          <boxGeometry args={[7.4, 0.32, 5.8]} />
          <meshStandardMaterial color="#e5edf3" roughness={0.76} />
        </mesh>

        {/* Crisp white modern glass-grid block */}
        <mesh position={[0.4, 2.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.4, 4.1, 4.5]} />
          <meshStandardMaterial color="#f5f9fc" roughness={0.5} />
        </mesh>

        {/* Bold Coastal World Coral-Red Angled Feature Wall on left side */}
        <mesh position={[-2.55, 2.45, 0.15]} rotation={[0, 0, -0.05]} castShadow>
          <boxGeometry args={[1.3, 4.4, 4.75]} />
          <meshStandardMaterial color="#f06673" roughness={0.52} />
        </mesh>

        {/* 2x3 Mint-Cyan Modern Glass Grid Windows */}
        {[-1.1, 0.4, 1.9].map((wx, ix) =>
          [1.3, 3.05].map((wy, iy) => (
            <mesh key={`kw-${ix}-${iy}`} position={[wx, wy, 2.28]}>
              <boxGeometry args={[1.18, 1.28, 0.08]} />
              <meshStandardMaterial
                color={windowColor}
                emissive="#8be9e0"
                emissiveIntensity={windowGlow + 0.15}
                roughness={0.22}
              />
            </mesh>
          ))
        )}

        {/* Rooftop Deck Trim & Spinning Indigo/Cyan WebGL Octahedron */}
        <mesh position={[0.4, 4.52, 0]} castShadow>
          <boxGeometry args={[5.7, 0.24, 4.8]} />
          <meshStandardMaterial color={kaelTheme.accent} roughness={0.45} />
        </mesh>
        <mesh ref={prismRef} position={[0.4, 5.45, 0]} castShadow>
          <octahedronGeometry args={[0.72, 0]} />
          <meshStandardMaterial
            color="#7289fa"
            emissive="#6366f1"
            emissiveIntensity={0.7}
            roughness={0.22}
            metalness={0.3}
          />
        </mesh>

        {showLabels && hoveredZone === 'engenharia' && (
          <StudioFloatingSign
            title={kaelTheme.name}
            accent={kaelTheme.accent}
            propCount={propCounts.engenharia ?? 0}
            hovered={true}
            y={6.65}
            onClick={() => onEnterStudio('engenharia')}
          />
        )}
      </group>

      {/* ========================================================================
          4. LAB VEX · 60 FPS — Mint Coastal Cottage with Navy Roof & Dormer
          Northwest overlooking the bay (1:1 steps/121/media_0.png mint house!)
      ======================================================================== */}
      <group
        position={COASTAL_STUDIO_LOCATIONS['pixel-perfect'].position}
        rotation={[0, COASTAL_STUDIO_LOCATIONS['pixel-perfect'].rotationY, 0]}
        {...makeHandlers('pixel-perfect')}
      >
        <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
          <boxGeometry args={[6.4, 0.32, 5.4]} />
          <meshStandardMaterial color="#e6eef3" roughness={0.78} />
        </mesh>

        {/* Soft Pastel Mint Stucco Walls */}
        <mesh position={[0, 1.85, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.2, 3.1, 4.4]} />
          <meshStandardMaterial color="#a8ded5" roughness={0.68} />
        </mesh>

        {/* Deep Coastal Navy Pitched Roof */}
        <mesh position={[0, 4.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[4.45, 1.9, 4]} />
          <meshStandardMaterial color="#343c59" roughness={0.6} />
        </mesh>

        {/* Cute White Rooftop Dormer + Spinning 60 FPS Performance Beacon */}
        <mesh position={[0, 4.15, 1.45]} castShadow>
          <boxGeometry args={[1.4, 1.1, 1.2]} />
          <meshStandardMaterial color="#f5f9fc" roughness={0.55} />
        </mesh>
        <mesh position={[0, 4.88, 1.45]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.15, 0.65, 4]} />
          <meshStandardMaterial color="#343c59" roughness={0.55} />
        </mesh>
        <mesh ref={radarRef} position={[0, 5.65, 0]} castShadow>
          <octahedronGeometry args={[0.52, 0]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#02c6a7"
            emissiveIntensity={0.8}
            roughness={0.25}
          />
        </mesh>

        {/* Crisp White Front Door & Cross-Pane Window */}
        <mesh position={[1.35, 1.35, 2.23]}>
          <boxGeometry args={[1.05, 1.95, 0.08]} />
          <meshStandardMaterial color="#ffffff" roughness={0.48} />
        </mesh>
        <mesh position={[-1.05, 1.75, 2.23]}>
          <boxGeometry args={[1.45, 1.28, 0.08]} />
          <meshStandardMaterial
            color={windowColor}
            emissive="#fff1b8"
            emissiveIntensity={windowGlow + 0.1}
            roughness={0.28}
          />
        </mesh>

        {showLabels && hoveredZone === 'pixel-perfect' && (
          <StudioFloatingSign
            title={vexTheme.name}
            accent={vexTheme.accent}
            propCount={propCounts['pixel-perfect'] ?? 0}
            hovered={true}
            y={6.65}
            onClick={() => onEnterStudio('pixel-perfect')}
          />
        )}
      </group>

      {/* ========================================================================
          5. SCENIC COASTAL WORLD BACKGROUND HOUSES & PAVILIONS (skyline richness!)
      ======================================================================== */}
      {/* Coral-Roofed Gable Cottage on East Ridge (matches steps/121/media_0.png!) */}
      <group position={[11.4, 1.35, -7.8]} rotation={[0, -0.35, 0]}>
        <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.8, 3.8, 4.2]} />
          <meshStandardMaterial color="#f6eee4" roughness={0.72} />
        </mesh>
        <mesh position={[0, 4.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[4.1, 2.1, 4]} />
          <meshStandardMaterial color="#d96779" roughness={0.62} />
        </mesh>
        <mesh position={[-1.0, 1.25, 2.14]}>
          <boxGeometry args={[1.05, 1.95, 0.08]} />
          <meshStandardMaterial color="#a94352" roughness={0.6} />
        </mesh>
        <mesh position={[1.1, 1.55, 2.14]}>
          <boxGeometry args={[1.2, 1.15, 0.08]} />
          <meshStandardMaterial color={windowColor} roughness={0.3} />
        </mesh>
        <mesh position={[0, 3.25, 2.14]}>
          <boxGeometry args={[1.45, 1.55, 0.08]} />
          <meshStandardMaterial color={windowColor} roughness={0.3} />
        </mesh>
      </group>

      {/* Teal-Roofed Crimson-Pillar Coastal Waterfront Gazebo on Left Pier (1:1 steps/113/media_0.png!) */}
      <group position={[-14.6, 1.35, 10.6]}>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3.1, 3.25, 0.7, 14]} />
          <meshStandardMaterial color="#d43d63" roughness={0.62} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 2.5, 1.75, Math.sin(a) * 2.5]} castShadow>
              <cylinderGeometry args={[0.12, 0.14, 2.4, 8]} />
              <meshStandardMaterial color="#c9355b" roughness={0.6} />
            </mesh>
          )
        })}
        <mesh position={[0, 3.25, 0]} castShadow>
          <coneGeometry args={[3.65, 1.25, 12]} />
          <meshStandardMaterial color="#19c69a" roughness={0.55} flatShading />
        </mesh>
      </group>

      {/* Coastal Music & Community Lounge Stage (matches steps/121/media_0.png!) */}
      <group position={[15.5, 1.35, -0.4]} rotation={[0, -0.8, 0]}>
        <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.4, 0.5, 3.2]} />
          <meshStandardMaterial color="#585478" roughness={0.72} />
        </mesh>
        {/* Playful stylized speakers */}
        <mesh position={[-1.25, 1.25, -0.4]} castShadow>
          <boxGeometry args={[1.15, 1.65, 0.9]} />
          <meshStandardMaterial color="#34374c" roughness={0.5} />
        </mesh>
        <mesh position={[0.1, 1.55, -0.4]} castShadow>
          <boxGeometry args={[1.35, 2.25, 0.95]} />
          <meshStandardMaterial color="#2b2e42" roughness={0.5} />
        </mesh>
        <mesh position={[1.4, 1.15, -0.4]} castShadow>
          <boxGeometry args={[1.05, 1.45, 0.85]} />
          <meshStandardMaterial color="#34374c" roughness={0.5} />
        </mesh>
        {/* Turquoise glowing woofer rings */}
        <mesh position={[0.1, 1.95, 0.1]}>
          <ringGeometry args={[0.28, 0.42, 18]} />
          <meshBasicMaterial color="#02c6a7" />
        </mesh>
        <mesh position={[0.1, 1.05, 0.1]}>
          <ringGeometry args={[0.32, 0.46, 18]} />
          <meshBasicMaterial color="#f6d35f" />
        </mesh>
      </group>
    </group>
  )
}
