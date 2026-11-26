import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MeshStandardMaterial } from 'three'
import type { AgentStatus } from '@funcionarios/types'

interface WorkstationProps {
  position: [number, number, number]
  rotationY?: number
  accentColor: string
  status: AgentStatus
  isSelected: boolean
  onSelect: () => void
}

/**
 * Bright, cozy Coastal World stylized studio workstation (warm natural oak top,
 * white architectural legs, soft pastel rounded monitor, and comfy studio chair).
 */
export function Workstation({
  position,
  rotationY = 0,
  accentColor,
  status,
  isSelected,
  onSelect,
}: WorkstationProps) {
  const screenMatRef = useRef<MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    if (!screenMatRef.current) return
    if (status === 'working' || status === 'reviewing') {
      screenMatRef.current.emissiveIntensity = 0.52 + Math.sin(clock.elapsedTime * 3.0) * 0.14
    } else if (status === 'thinking') {
      screenMatRef.current.emissiveIntensity = 0.45 + Math.sin(clock.elapsedTime * 6.0) * 0.28
    } else {
      screenMatRef.current.emissiveIntensity = 0.14
    }
  })

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Crisp Coastal Mint Selection Floor Ring */}
      {isSelected && (
        <mesh position={[0, 0.03, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.12, 1.24, 36]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.85} />
        </mesh>
      )}

      {/* Warm Natural Oak Desk Top */}
      <mesh position={[0, 0.74, -0.25]} castShadow receiveShadow>
        <boxGeometry args={[1.82, 0.08, 0.9]} />
        <meshStandardMaterial color="#e6ba84" roughness={0.62} />
      </mesh>

      {/* Crisp White Tapered Coastal Desk Legs */}
      {[
        [-0.78, -0.58],
        [0.78, -0.58],
        [-0.78, 0.08],
        [0.78, 0.08],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.36, lz]} castShadow>
          <cylinderGeometry args={[0.042, 0.034, 0.72, 10]} />
          <meshStandardMaterial color="#f5f8fc" roughness={0.5} />
        </mesh>
      ))}

      {/* Clean White Monitor Stand */}
      <mesh position={[0, 0.89, -0.5]} castShadow>
        <cylinderGeometry args={[0.045, 0.075, 0.24, 12]} />
        <meshStandardMaterial color="#eef3f8" roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.79, -0.5]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.03, 16]} />
        <meshStandardMaterial color="#eef3f8" roughness={0.42} />
      </mesh>

      {/* Pastel White Ultrawide Studio Monitor */}
      <mesh position={[0, 1.15, -0.48]} castShadow>
        <boxGeometry args={[1.22, 0.54, 0.06]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} />
      </mesh>

      {/* Glowing Creative Screen */}
      <mesh position={[0, 1.15, -0.448]}>
        <planeGeometry args={[1.12, 0.44]} />
        <meshStandardMaterial
          ref={screenMatRef}
          color="#e8f6ff"
          emissive={status === 'vacant' ? '#94a3b8' : accentColor}
          emissiveIntensity={0.45}
          roughness={0.22}
        />
      </mesh>

      {/* Cute White Keyboard + Pastel Coffee Cup */}
      <mesh position={[-0.08, 0.79, -0.1]} castShadow>
        <boxGeometry args={[0.48, 0.025, 0.16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.45} />
      </mesh>
      <mesh position={[0.56, 0.85, -0.08]} castShadow>
        <cylinderGeometry args={[0.06, 0.052, 0.13, 12]} />
        <meshStandardMaterial color={accentColor} roughness={0.4} />
      </mesh>

      {/* Cute Rounded Pastel Studio Chair */}
      <group position={[0, 0, 0.56]}>
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.3, 0.06, 16]} />
          <meshStandardMaterial color="#e8eef5" roughness={0.48} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 10]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.26, 0.09, 18]} />
          <meshStandardMaterial color={accentColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.8, 0.22]} castShadow>
          <boxGeometry args={[0.5, 0.52, 0.09]} />
          <meshStandardMaterial color={accentColor} roughness={0.62} />
        </mesh>
      </group>
    </group>
  )
}
