import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import type { WorldCreationProp } from '@funcionarios/types'

interface WorldCreationsProps {
  propsList: WorldCreationProp[]
  onSelectProp?: (prop: WorldCreationProp) => void
  selectedPropId?: string | null
}

function SingleWorldProp({
  prop,
  isSelected,
  onSelect,
}: {
  prop: WorldCreationProp
  isSelected: boolean
  onSelect?: () => void
}) {
  const floatRef = useRef<Mesh | Group>(null)

  useFrame(({ clock }) => {
    if (!floatRef.current) return
    const t = clock.elapsedTime
    if (prop.kind === 'mini_diorama_table' || prop.kind === 'trophy_pedestal') {
      floatRef.current.rotation.y = t * 0.7
    } else if (prop.kind === 'holo_screen') {
      floatRef.current.position.y = 1.25 + Math.sin(t * 2.2) * 0.04
    }
  })

  return (
    <group
      position={prop.position}
      rotation={[0, prop.rotationY, 0]}
      scale={prop.scale}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
    >
      {/* Subtle floor ring when pending approval or selected */}
      {(!prop.approved || isSelected) && (
        <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.72, 32]} />
          <meshBasicMaterial
            color={prop.approved ? '#facc15' : '#fb923c'}
            transparent
            opacity={isSelected ? 0.9 : 0.55}
          />
        </mesh>
      )}

      {prop.kind === 'warm_lamp' && (
        <group>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.28, 0.1, 16]} />
            <meshStandardMaterial color="#2a2f3d" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.78, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.04, 1.4, 12]} />
            <meshStandardMaterial color="#d4a373" roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.48, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.34, 0.34, 18]} />
            <meshStandardMaterial
              color="#fff3d6"
              emissive={prop.color}
              emissiveIntensity={1.25}
              roughness={0.55}
            />
          </mesh>
        </group>
      )}

      {prop.kind === 'plant_pot' && (
        <group>
          <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.28, 0.21, 0.48, 16]} />
            <meshStandardMaterial color="#d68c60" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.05, 14]} />
            <meshStandardMaterial color="#4e342e" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.76, 0]} castShadow>
            <dodecahedronGeometry args={[0.32, 1]} />
            <meshStandardMaterial color={prop.color} roughness={0.78} />
          </mesh>
          <mesh position={[0.18, 0.92, 0.08]} castShadow>
            <dodecahedronGeometry args={[0.2, 1]} />
            <meshStandardMaterial color="#22c55e" roughness={0.78} />
          </mesh>
          <mesh position={[-0.16, 0.88, -0.06]} castShadow>
            <dodecahedronGeometry args={[0.18, 1]} />
            <meshStandardMaterial color="#4ade80" roughness={0.78} />
          </mesh>
        </group>
      )}

      {prop.kind === 'coffee_bar' && (
        <group>
          <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.28, 0.88, 0.62]} />
            <meshStandardMaterial color="#b07b4f" roughness={0.68} />
          </mesh>
          <mesh position={[0, 0.91, 0]} castShadow>
            <boxGeometry args={[1.36, 0.07, 0.68]} />
            <meshStandardMaterial color="#f5efe6" roughness={0.4} />
          </mesh>
          {/* Espresso machine */}
          <mesh position={[-0.3, 1.16, -0.06]} castShadow>
            <boxGeometry args={[0.36, 0.42, 0.32]} />
            <meshStandardMaterial color={prop.color} roughness={0.35} metalness={0.3} />
          </mesh>
          {/* Warm cups */}
          <mesh position={[0.25, 1.02, 0.06]} castShadow>
            <cylinderGeometry args={[0.06, 0.05, 0.14, 12]} />
            <meshStandardMaterial color="#fffaf0" roughness={0.4} />
          </mesh>
          <mesh position={[0.42, 1.02, -0.04]} castShadow>
            <cylinderGeometry args={[0.06, 0.05, 0.14, 12]} />
            <meshStandardMaterial color="#fde68a" roughness={0.4} />
          </mesh>
        </group>
      )}

      {prop.kind === 'mini_diorama_table' && (
        <group>
          <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.68, 0.56, 0.72, 20]} />
            <meshStandardMaterial color="#e8dfd3" roughness={0.62} />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.62, 0.62, 0.06, 20]} />
            <meshStandardMaterial color="#86efac" roughness={0.75} />
          </mesh>
          {/* Rotating miniature building hologram/maquette on table */}
          <group ref={floatRef as React.RefObject<Group>} position={[0, 0.96, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.42, 0.34, 0.42]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive={prop.color}
                emissiveIntensity={0.45}
                roughness={0.35}
              />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <boxGeometry args={[0.3, 0.08, 0.3]} />
              <meshStandardMaterial color={prop.color} emissive={prop.color} emissiveIntensity={0.8} />
            </mesh>
          </group>
        </group>
      )}

      {prop.kind === 'holo_screen' && (
        <group>
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.4, 0.16, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh ref={floatRef as React.RefObject<Mesh>} position={[0, 1.25, 0]}>
            <boxGeometry args={[1.2, 0.72, 0.06]} />
            <meshStandardMaterial
              color="#0f172a"
              emissive={prop.color}
              emissiveIntensity={0.95}
              roughness={0.2}
            />
          </mesh>
        </group>
      )}

      {prop.kind === 'cozy_sofa' && (
        <group>
          <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.45, 0.36, 0.78]} />
            <meshStandardMaterial color={prop.color} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.62, -0.28]} castShadow receiveShadow>
            <boxGeometry args={[1.45, 0.46, 0.22]} />
            <meshStandardMaterial color={prop.color} roughness={0.85} />
          </mesh>
          <mesh position={[-0.64, 0.48, 0]} castShadow>
            <boxGeometry args={[0.18, 0.34, 0.76]} />
            <meshStandardMaterial color={prop.color} roughness={0.85} />
          </mesh>
          <mesh position={[0.64, 0.48, 0]} castShadow>
            <boxGeometry args={[0.18, 0.34, 0.76]} />
            <meshStandardMaterial color={prop.color} roughness={0.85} />
          </mesh>
          {/* Warm pillow */}
          <mesh position={[0.25, 0.52, -0.05]} rotation={[0, 0.25, 0.15]}>
            <boxGeometry args={[0.32, 0.24, 0.14]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.9} />
          </mesh>
        </group>
      )}

      {prop.kind === 'garden_tree' && (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 1.1, 10]} />
            <meshStandardMaterial color="#8d5b3a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.38, 0]} castShadow>
            <sphereGeometry args={[0.62, 14, 12]} />
            <meshStandardMaterial color={prop.color} roughness={0.82} />
          </mesh>
          <mesh position={[0.36, 1.18, 0.2]} castShadow>
            <sphereGeometry args={[0.4, 12, 10]} />
            <meshStandardMaterial color="#22c55e" roughness={0.82} />
          </mesh>
          <mesh position={[-0.32, 1.24, -0.18]} castShadow>
            <sphereGeometry args={[0.42, 12, 10]} />
            <meshStandardMaterial color="#86efac" roughness={0.82} />
          </mesh>
        </group>
      )}

      {prop.kind === 'park_bench' && (
        <group>
          <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.38, 0.08, 0.44]} />
            <meshStandardMaterial color={prop.color} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.66, -0.19]} rotation={[-0.14, 0, 0]} castShadow>
            <boxGeometry args={[1.38, 0.32, 0.07]} />
            <meshStandardMaterial color={prop.color} roughness={0.75} />
          </mesh>
          <mesh position={[-0.56, 0.19, 0]} castShadow>
            <boxGeometry args={[0.08, 0.38, 0.38]} />
            <meshStandardMaterial color="#272e3f" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0.56, 0.19, 0]} castShadow>
            <boxGeometry args={[0.08, 0.38, 0.38]} />
            <meshStandardMaterial color="#272e3f" roughness={0.5} metalness={0.5} />
          </mesh>
        </group>
      )}

      {prop.kind === 'trophy_pedestal' && (
        <group>
          <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.56, 0.92, 0.56]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.45} />
          </mesh>
          <mesh ref={floatRef as React.RefObject<Mesh>} position={[0, 1.24, 0]} castShadow>
            <octahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial
              color={prop.color}
              emissive={prop.color}
              emissiveIntensity={1.1}
              metalness={0.5}
              roughness={0.2}
            />
          </mesh>
        </group>
      )}

      {prop.kind === 'neon_sign' && (
        <group>
          <mesh position={[0, 0.85, 0]} castShadow>
            <boxGeometry args={[1.35, 0.52, 0.12]} />
            <meshStandardMaterial color="#181d2a" roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.85, 0.07]}>
            <boxGeometry args={[1.18, 0.34, 0.04]} />
            <meshStandardMaterial
              color={prop.color}
              emissive={prop.color}
              emissiveIntensity={1.5}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[-0.5, 0.32, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.65, 8]} />
            <meshStandardMaterial color="#272e3f" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0.5, 0.32, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.65, 8]} />
            <meshStandardMaterial color="#272e3f" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}

      {isSelected && (
        <Html position={[0, 2.0, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded-xl border border-white/20 bg-[#141822]/92 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl backdrop-blur-md">
            <span className="font-semibold">{prop.title}</span>
            <span className="ml-1.5 text-slate-400">por {prop.createdByName}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

export function WorldCreations({
  propsList,
  onSelectProp,
  selectedPropId,
}: WorldCreationsProps) {
  return (
    <group>
      {propsList.map((prop) => (
        <SingleWorldProp
          key={prop.id}
          prop={prop}
          isSelected={selectedPropId === prop.id}
          onSelect={() => onSelectProp?.(prop)}
        />
      ))}
    </group>
  )
}
