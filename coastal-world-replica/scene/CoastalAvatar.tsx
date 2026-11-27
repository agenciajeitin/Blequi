import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COASTAL_AVATAR_PALETTES } from '@ambiente/shaders/coastalShaders'
import type { HatAccessory } from '../store'

interface CoastalAvatarProps {
  paletteIndex: number
  hat?: HatAccessory
  isMoving?: boolean
  scale?: number
}

export function CoastalAvatar({
  paletteIndex,
  hat = 'none',
  isMoving = false,
  scale = 1,
}: CoastalAvatarProps) {
  const pal = COASTAL_AVATAR_PALETTES[paletteIndex] ?? COASTAL_AVATAR_PALETTES[4]
  const bodyRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Mesh>(null)
  const rightArmRef = useRef<THREE.Mesh>(null)
  const leftLegRef = useRef<THREE.Mesh>(null)
  const rightLegRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (bodyRef.current) {
      if (isMoving) {
        const stride = Math.sin(t * 11)
        bodyRef.current.position.y = Math.abs(stride) * 0.12
        bodyRef.current.rotation.z = stride * 0.08
      } else {
        bodyRef.current.position.y = Math.sin(t * 2.4) * 0.03
        bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, 0, 0.12)
      }
    }

    const swing = isMoving ? Math.sin(t * 11) * 0.58 : Math.sin(t * 2.2) * 0.06
    if (leftArmRef.current) leftArmRef.current.rotation.x = swing
    if (rightArmRef.current) rightArmRef.current.rotation.x = -swing
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing * 0.9
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing * 0.9
  })

  return (
    <group scale={scale}>
      <group ref={bodyRef}>
        {/* Rounded Coastal World Bean Torso */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <capsuleGeometry args={[0.34, 0.42, 12, 20]} />
          <meshStandardMaterial color={pal.body} roughness={0.55} metalness={0.04} />
        </mesh>

        {/* Cream Face Visor */}
        <mesh position={[0, 0.92, 0.22]}>
          <sphereGeometry args={[0.25, 20, 16]} />
          <meshStandardMaterial color={pal.face} roughness={0.62} />
        </mesh>

        {/* Navy Indigo Eyes (#3b3777) */}
        <mesh position={[-0.085, 0.95, 0.43]}>
          <sphereGeometry args={[0.036, 12, 12]} />
          <meshStandardMaterial color="#3b3777" roughness={0.25} />
        </mesh>
        <mesh position={[0.085, 0.95, 0.43]}>
          <sphereGeometry args={[0.036, 12, 12]} />
          <meshStandardMaterial color="#3b3777" roughness={0.25} />
        </mesh>

        {/* Rosy Cheeks */}
        <mesh position={[-0.145, 0.88, 0.4]}>
          <sphereGeometry args={[0.042, 10, 10]} />
          <meshStandardMaterial color={pal.blush} roughness={0.7} />
        </mesh>
        <mesh position={[0.145, 0.88, 0.4]}>
          <sphereGeometry args={[0.042, 10, 10]} />
          <meshStandardMaterial color={pal.blush} roughness={0.7} />
        </mesh>

        {/* Scarf / Collar Accent */}
        <mesh position={[0, 0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.06, 10, 22]} />
          <meshStandardMaterial color={pal.accent} roughness={0.48} />
        </mesh>

        {/* Little Backpack */}
        <mesh position={[0, 0.66, -0.33]} castShadow>
          <boxGeometry args={[0.34, 0.36, 0.18]} />
          <meshStandardMaterial color={pal.phoneCase} roughness={0.55} />
        </mesh>

        {/* Arms */}
        <mesh ref={leftArmRef} position={[-0.41, 0.66, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.24, 8, 12]} />
          <meshStandardMaterial color={pal.limbs} roughness={0.55} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.41, 0.66, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.24, 8, 12]} />
          <meshStandardMaterial color={pal.limbs} roughness={0.55} />
        </mesh>

        {/* Legs */}
        <mesh ref={leftLegRef} position={[-0.14, 0.22, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.2, 8, 12]} />
          <meshStandardMaterial color={pal.limbs} roughness={0.55} />
        </mesh>
        <mesh ref={rightLegRef} position={[0.14, 0.22, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.2, 8, 12]} />
          <meshStandardMaterial color={pal.limbs} roughness={0.55} />
        </mesh>

        {/* Customizable Hats */}
        {hat === 'cap' && (
          <group position={[0, 1.24, 0.02]}>
            <mesh castShadow>
              <sphereGeometry args={[0.3, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshStandardMaterial color="#02c6a7" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.01, 0.26]} rotation={[0.14, 0, 0]}>
              <boxGeometry args={[0.34, 0.045, 0.24]} />
              <meshStandardMaterial color="#019f86" roughness={0.45} />
            </mesh>
          </group>
        )}

        {hat === 'beanie' && (
          <group position={[0, 1.22, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.31, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial color="#f2676f" roughness={0.75} />
            </mesh>
            <mesh position={[0, 0.34, 0]}>
              <sphereGeometry args={[0.095, 12, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
          </group>
        )}

        {hat === 'crown' && (
          <group position={[0, 1.32, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.2, 0.16, 0.18, 6]} />
              <meshStandardMaterial color="#f6d35f" roughness={0.3} metalness={0.35} />
            </mesh>
            <mesh position={[0, 0.12, 0.12]}>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshStandardMaterial color="#f2676f" roughness={0.25} />
            </mesh>
          </group>
        )}

        {hat === 'headphones' && (
          <group position={[0, 1.04, 0]}>
            <mesh rotation={[0, 0, 0]}>
              <torusGeometry args={[0.35, 0.04, 10, 24, Math.PI]} />
              <meshStandardMaterial color="#3b3777" roughness={0.35} />
            </mesh>
            <mesh position={[-0.36, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.11, 0.09, 14]} />
              <meshStandardMaterial color="#02c6a7" roughness={0.35} />
            </mesh>
            <mesh position={[0.36, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.11, 0.09, 14]} />
              <meshStandardMaterial color="#02c6a7" roughness={0.35} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  )
}
