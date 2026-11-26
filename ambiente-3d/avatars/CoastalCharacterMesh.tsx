import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BodyAccessoryId, HeadAccessoryId, ShoeStyleId } from '@funcionarios/types'
import { COASTAL_AVATAR_PALETTES } from '../shaders/coastalShaders'

export interface CoastalCharacterAppearance {
  colorIndex?: number
  customBodyColor?: string
  customLimbColor?: string
  customFaceColor?: string
  customAccentColor?: string
  faceStyle?: 'classic' | 'lashes'
  headAccessory?: HeadAccessoryId
  bodyAccessory?: BodyAccessoryId
  shoeStyle?: ShoeStyleId
}

interface CoastalCharacterMeshProps {
  appearance: CoastalCharacterAppearance
  isMoving?: boolean
  pose?: 'idle' | 'walk' | 'wave' | 'crossed'
  scale?: number
  showGroundShadow?: boolean
}

/**
 * 1:1 Coastal World capsule-bean stylized character:
 * - Smooth tapered pill body + integrated head silhouette
 * - Inset bright oval face with blush cheeks, dark oval eyes (+ optional lashes), sweet smile
 * - Articulated slender arms & legs, fanny pack / backpack / wings / buoy, headphones / beanie / sunhat / crown / visor
 */
export function CoastalCharacterMesh({
  appearance,
  isMoving = false,
  pose = 'idle',
  scale = 1,
  showGroundShadow = true,
}: CoastalCharacterMeshProps) {
  const palette = COASTAL_AVATAR_PALETTES[appearance.colorIndex ?? 4] ?? COASTAL_AVATAR_PALETTES[4]
  const bodyColor = appearance.customBodyColor ?? palette.body
  const limbColor = appearance.customLimbColor ?? palette.limbs
  const faceColor = appearance.customFaceColor ?? palette.face
  const blushColor = palette.blush
  const accentColor = appearance.customAccentColor ?? palette.accent
  const faceStyle = appearance.faceStyle ?? 'lashes'
  const headAcc = appearance.headAccessory ?? 'headphones'
  const bodyAcc = appearance.bodyAccessory ?? 'fannypack'
  const shoeStyle = appearance.shoeStyle ?? 'sneakers'

  const rootBounceRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const wingLeftRef = useRef<THREE.Mesh>(null)
  const wingRightRef = useRef<THREE.Mesh>(null)

  const shoeColors = useMemo(() => {
    if (shoeStyle === 'boots') return { main: '#0ad0c8', sole: '#7f62c9', trim: '#7f62c9' }
    if (shoeStyle === 'sandals') return { main: '#f6b352', sole: '#ffffff', trim: '#f2676f' }
    if (shoeStyle === 'fast') return { main: '#f2676f', sole: '#ffffff', trim: '#f6d35f' }
    return { main: accentColor, sole: '#ffffff', trim: '#f6b352' }
  }, [shoeStyle, accentColor])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const activeWalk = isMoving || pose === 'walk'
    const cycle = activeWalk ? Math.sin(t * 10.5) : 0

    if (rootBounceRef.current) {
      if (activeWalk) {
        rootBounceRef.current.position.y = Math.abs(cycle) * 0.08
        rootBounceRef.current.rotation.z = cycle * 0.05
      } else {
        rootBounceRef.current.position.y = Math.sin(t * 2.4) * 0.02
        rootBounceRef.current.rotation.z = Math.sin(t * 1.4) * 0.015
      }
    }

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = activeWalk ? cycle * 0.62 : 0
      rightLegRef.current.rotation.x = activeWalk ? -cycle * 0.62 : 0
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (pose === 'crossed') {
        leftArmRef.current.rotation.set(-0.75, 0.35, -0.58)
        rightArmRef.current.rotation.set(-0.75, -0.35, 0.58)
      } else if (pose === 'wave') {
        leftArmRef.current.rotation.set(0, 0, 0.22)
        rightArmRef.current.rotation.set(0, 0, -2.45 + Math.sin(t * 7.5) * 0.25)
      } else if (activeWalk) {
        leftArmRef.current.rotation.set(-cycle * 0.55, 0, 0.18)
        rightArmRef.current.rotation.set(cycle * 0.55, 0, -0.18)
      } else {
        leftArmRef.current.rotation.set(Math.sin(t * 2.1) * 0.04, 0, 0.16)
        rightArmRef.current.rotation.set(-Math.sin(t * 2.1) * 0.04, 0, -0.16)
      }
    }

    if (wingLeftRef.current && wingRightRef.current) {
      const flap = Math.sin(t * (activeWalk ? 11 : 4.2)) * 0.24
      wingLeftRef.current.rotation.y = 0.45 + flap
      wingRightRef.current.rotation.y = -0.45 - flap
    }
  })

  return (
    <group scale={scale}>
      {/* Soft pastel blue-indigo ground contact shadow (Coastal World signature look) */}
      {showGroundShadow && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.38, 22]} />
          <meshBasicMaterial color="#4e5d94" transparent opacity={0.26} depthWrite={false} />
        </mesh>
      )}

      <group ref={rootBounceRef}>
        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.145, 0.52, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.056, 0.34, 6, 12]} />
            <meshStandardMaterial color={limbColor} roughness={0.62} />
          </mesh>
          {/* Left Shoe / Boot */}
          <group position={[0, -0.44, 0.05]}>
            <mesh castShadow>
              <boxGeometry args={[0.14, shoeStyle === 'boots' ? 0.2 : 0.11, 0.23]} />
              <meshStandardMaterial color={shoeColors.main} roughness={0.48} />
            </mesh>
            <mesh position={[0, -0.055, 0]}>
              <boxGeometry args={[0.15, 0.03, 0.24]} />
              <meshStandardMaterial color={shoeColors.sole} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.05, 0.02]}>
              <boxGeometry args={[0.13, 0.025, 0.09]} />
              <meshStandardMaterial color={shoeColors.trim} roughness={0.45} />
            </mesh>
          </group>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.145, 0.52, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.056, 0.34, 6, 12]} />
            <meshStandardMaterial color={limbColor} roughness={0.62} />
          </mesh>
          {/* Right Shoe / Boot */}
          <group position={[0, -0.44, 0.05]}>
            <mesh castShadow>
              <boxGeometry args={[0.14, shoeStyle === 'boots' ? 0.2 : 0.11, 0.23]} />
              <meshStandardMaterial color={shoeColors.main} roughness={0.48} />
            </mesh>
            <mesh position={[0, -0.055, 0]}>
              <boxGeometry args={[0.15, 0.03, 0.24]} />
              <meshStandardMaterial color={shoeColors.sole} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.05, 0.02]}>
              <boxGeometry args={[0.13, 0.025, 0.09]} />
              <meshStandardMaterial color={shoeColors.trim} roughness={0.45} />
            </mesh>
          </group>
        </group>

        {/* Iconic Coastal World Bean-Capsule Torso + Head */}
        <mesh position={[0, 1.02, 0]} scale={[1, 1.06, 0.92]} castShadow receiveShadow>
          <capsuleGeometry args={[0.295, 0.52, 12, 24]} />
          <meshStandardMaterial color={bodyColor} roughness={0.52} metalness={0.02} />
        </mesh>

        {/* Inset Oval Bright Faceplate (upper front) */}
        <group position={[0, 1.24, 0.225]}>
          <mesh scale={[1.05, 0.92, 0.42]}>
            <sphereGeometry args={[0.19, 18, 16]} />
            <meshStandardMaterial color={faceColor} roughness={0.42} />
          </mesh>

          {/* Left & Right Dark Cute Pill Eyes */}
          <mesh position={[-0.068, 0.03, 0.078]} scale={[0.85, 1.35, 0.5]}>
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshBasicMaterial color="#1f1b3d" />
          </mesh>
          <mesh position={[0.068, 0.03, 0.078]} scale={[0.85, 1.35, 0.5]}>
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshBasicMaterial color="#1f1b3d" />
          </mesh>

          {/* Optional Cute Lashes */}
          {faceStyle === 'lashes' && (
            <>
              <mesh position={[-0.092, 0.052, 0.076]} rotation={[0, 0, 0.45]}>
                <boxGeometry args={[0.032, 0.011, 0.01]} />
                <meshBasicMaterial color="#1f1b3d" />
              </mesh>
              <mesh position={[0.092, 0.052, 0.076]} rotation={[0, 0, -0.45]}>
                <boxGeometry args={[0.032, 0.011, 0.01]} />
                <meshBasicMaterial color="#1f1b3d" />
              </mesh>
            </>
          )}

          {/* Rosy Blush Cheeks */}
          <mesh position={[-0.12, -0.02, 0.066]} scale={[1.2, 0.8, 0.3]}>
            <sphereGeometry args={[0.038, 10, 10]} />
            <meshBasicMaterial color={blushColor} transparent opacity={0.72} />
          </mesh>
          <mesh position={[0.12, -0.02, 0.066]} scale={[1.2, 0.8, 0.3]}>
            <sphereGeometry args={[0.038, 10, 10]} />
            <meshBasicMaterial color={blushColor} transparent opacity={0.72} />
          </mesh>

          {/* Curved Smile */}
          <mesh position={[0, -0.038, 0.082]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.044, 0.0095, 8, 16, Math.PI * 0.82]} />
            <meshBasicMaterial color="#1f1b3d" />
          </mesh>
        </group>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.29, 0.98, 0]}>
          <mesh position={[-0.03, -0.19, 0]} castShadow>
            <capsuleGeometry args={[0.056, 0.31, 6, 12]} />
            <meshStandardMaterial color={bodyColor} roughness={0.55} />
          </mesh>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.29, 0.98, 0]}>
          <mesh position={[0.03, -0.19, 0]} castShadow>
            <capsuleGeometry args={[0.056, 0.31, 6, 12]} />
            <meshStandardMaterial color={bodyColor} roughness={0.55} />
          </mesh>
        </group>

        {/* === HEAD ACCESSORIES === */}
        {headAcc === 'headphones' && (
          <group position={[0, 1.32, 0]}>
            <mesh rotation={[0, 0, 0]} castShadow>
              <torusGeometry args={[0.31, 0.04, 10, 24, Math.PI]} />
              <meshStandardMaterial color={accentColor} roughness={0.35} />
            </mesh>
            <mesh position={[-0.31, -0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.115, 0.115, 0.09, 16]} />
              <meshStandardMaterial color="#ff8243" roughness={0.42} />
            </mesh>
            <mesh position={[-0.36, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.075, 0.075, 0.03, 16]} />
              <meshStandardMaterial color={accentColor} roughness={0.35} />
            </mesh>
            <mesh position={[0.31, -0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.115, 0.115, 0.09, 16]} />
              <meshStandardMaterial color="#ff8243" roughness={0.42} />
            </mesh>
            <mesh position={[0.36, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.075, 0.075, 0.03, 16]} />
              <meshStandardMaterial color={accentColor} roughness={0.35} />
            </mesh>
          </group>
        )}

        {headAcc === 'beanie' && (
          <group position={[0, 1.44, -0.02]} rotation={[-0.14, 0, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.315, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
              <meshStandardMaterial color="#ad92ea" roughness={0.78} />
            </mesh>
            <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.305, 0.068, 10, 24]} />
              <meshStandardMaterial color="#c4aff5" roughness={0.75} />
            </mesh>
            <mesh position={[0, 0.31, 0]} castShadow>
              <sphereGeometry args={[0.075, 10, 10]} />
              <meshStandardMaterial color="#c4aff5" roughness={0.75} />
            </mesh>
          </group>
        )}

        {headAcc === 'sunhat' && (
          <group position={[0, 1.48, 0]} rotation={[-0.08, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.48, 0.52, 0.04, 22]} />
              <meshStandardMaterial color="#f6d35f" roughness={0.72} />
            </mesh>
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.29, 0.22, 18]} />
              <meshStandardMaterial color="#f6d35f" roughness={0.72} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.295, 0.295, 0.055, 18]} />
              <meshStandardMaterial color="#f2676f" roughness={0.5} />
            </mesh>
          </group>
        )}

        {headAcc === 'crown' && (
          <group position={[0, 1.56, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.22, 0.18, 0.14, 6]} />
              <meshStandardMaterial color="#ffd15c" roughness={0.28} metalness={0.35} />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2
              return (
                <mesh key={i} position={[Math.cos(a) * 0.19, 0.11, Math.sin(a) * 0.19]} castShadow>
                  <coneGeometry args={[0.055, 0.13, 4]} />
                  <meshStandardMaterial color="#ffd15c" roughness={0.28} metalness={0.35} />
                </mesh>
              )
            })}
          </group>
        )}

        {headAcc === 'visor' && (
          <group position={[0, 1.44, 0.04]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.3, 0.045, 8, 22]} />
              <meshStandardMaterial color="#02c6a7" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.02, 0.24]} rotation={[0.18, 0, 0]} castShadow>
              <boxGeometry args={[0.42, 0.035, 0.26]} />
              <meshStandardMaterial color="#02c6a7" roughness={0.35} />
            </mesh>
          </group>
        )}

        {/* === BODY / WAIST ACCESSORIES === */}
        {bodyAcc === 'fannypack' && (
          <group position={[0, 0.67, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.285, 0.032, 8, 24]} />
              <meshStandardMaterial color={accentColor} roughness={0.45} />
            </mesh>
            <mesh position={[0.04, 0.0, 0.27]} castShadow>
              <boxGeometry args={[0.26, 0.13, 0.13]} />
              <meshStandardMaterial color={accentColor} roughness={0.42} />
            </mesh>
            <mesh position={[0.04, 0.035, 0.34]}>
              <boxGeometry args={[0.22, 0.022, 0.02]} />
              <meshStandardMaterial color="#ff9248" roughness={0.4} />
            </mesh>
          </group>
        )}

        {bodyAcc === 'backpack' && (
          <group position={[0, 0.96, -0.29]}>
            <mesh castShadow>
              <boxGeometry args={[0.38, 0.44, 0.22]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.14, -0.08]} castShadow>
              <boxGeometry args={[0.34, 0.16, 0.12]} />
              <meshStandardMaterial color="#f2676f" roughness={0.5} />
            </mesh>
            <mesh position={[-0.14, 0.24, -0.02]}>
              <sphereGeometry args={[0.065, 10, 10]} />
              <meshStandardMaterial color="#3b3777" roughness={0.6} />
            </mesh>
            <mesh position={[0.14, 0.24, -0.02]}>
              <sphereGeometry args={[0.065, 10, 10]} />
              <meshStandardMaterial color="#3b3777" roughness={0.6} />
            </mesh>
          </group>
        )}

        {bodyAcc === 'wings' && (
          <group position={[0, 1.02, -0.27]}>
            <mesh ref={wingLeftRef} position={[-0.28, 0.05, -0.05]} castShadow>
              <boxGeometry args={[0.48, 0.28, 0.05]} />
              <meshStandardMaterial color="#fff7ed" emissive="#fef3c7" emissiveIntensity={0.2} roughness={0.45} />
            </mesh>
            <mesh ref={wingRightRef} position={[0.28, 0.05, -0.05]} castShadow>
              <boxGeometry args={[0.48, 0.28, 0.05]} />
              <meshStandardMaterial color="#fff7ed" emissive="#fef3c7" emissiveIntensity={0.2} roughness={0.45} />
            </mesh>
          </group>
        )}

        {bodyAcc === 'buoy' && (
          <group position={[0, 0.7, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.38, 0.11, 12, 24]} />
              <meshStandardMaterial color="#f2676f" roughness={0.4} />
            </mesh>
            {[0, 1, 2, 3].map((i) => {
              const a = (i / 4) * Math.PI * 2
              return (
                <mesh key={i} position={[Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38]} rotation={[0, -a, 0]}>
                  <boxGeometry args={[0.24, 0.23, 0.08]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.45} />
                </mesh>
              )
            })}
          </group>
        )}
      </group>
    </group>
  )
}
