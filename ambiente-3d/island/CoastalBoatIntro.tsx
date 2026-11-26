import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CoastalIntroStage } from '@funcionarios/types'
import { CoastalCharacterMesh } from '../avatars/CoastalCharacterMesh'

interface CoastalBoatIntroProps {
  introStage: CoastalIntroStage
}

/**
 * 1:1 Coastal World Intro Boat Scene:
 * - Iconic yellow-and-olive-white motorboat bobbing gently in the foreground bay
 * - Stylized teal/lavender beanie guide (Nori) standing on the bow
 * - Background fishing boat drifting softly on the left bay
 */
export function CoastalBoatIntro({ introStage }: CoastalBoatIntroProps) {
  const boatRef = useRef<THREE.Group>(null)
  const flagRef = useRef<THREE.Mesh>(null)
  const distantBoatRef = useRef<THREE.Group>(null)

  const flagGeom = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, -0.22)
    s.lineTo(0, 0.24)
    s.lineTo(0.76, 0.02)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false })
  }, [])

  useEffect(() => {
    return () => flagGeom.dispose()
  }, [flagGeom])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (boatRef.current) {
      boatRef.current.position.y = -0.34 + Math.sin(t * 1.45) * 0.1
      boatRef.current.rotation.z = Math.sin(t * 1.1) * 0.032
      boatRef.current.rotation.x = Math.cos(t * 0.95) * 0.022
    }
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(t * 5.2) * 0.28
    }
    if (distantBoatRef.current) {
      distantBoatRef.current.position.y = -0.42 + Math.sin(t * 1.3 + 1.4) * 0.08
      distantBoatRef.current.rotation.z = Math.sin(t * 0.9 + 1) * 0.04
    }
  })

  return (
    <group>
      {/* Hero Yellow Motorboat in Bay Foreground (matches Coastal World intro 1:1) */}
      <group ref={boatRef} position={[3.35, -0.34, 44.6]} rotation={[0, -1.42, 0]}>
        {/* Lower dark slate hull keel */}
        <mesh position={[0, -0.35, 0.1]} castShadow>
          <boxGeometry args={[2.1, 0.48, 4.1]} />
          <meshStandardMaterial color="#708094" roughness={0.62} />
        </mesh>

        {/* Olive-green waterline hull band */}
        <mesh position={[0, -0.02, 0.15]} castShadow receiveShadow>
          <boxGeometry args={[2.45, 0.36, 4.7]} />
          <meshStandardMaterial color="#9bb268" roughness={0.55} />
        </mesh>

        {/* Crisp white hull trim stripe */}
        <mesh position={[0, 0.18, 0.18]}>
          <boxGeometry args={[2.56, 0.1, 4.86]} />
          <meshStandardMaterial color="#ffffff" roughness={0.42} />
        </mesh>

        {/* Iconic ochre-gold upper hull */}
        <mesh position={[0, 0.5, 0.15]} castShadow receiveShadow>
          <boxGeometry args={[2.54, 0.56, 4.85]} />
          <meshStandardMaterial color="#ad9318" roughness={0.5} />
        </mesh>

        {/* Pointed bow prow */}
        <mesh position={[0, 0.36, 2.95]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <boxGeometry args={[1.78, 0.72, 1.78]} />
          <meshStandardMaterial color="#ad9318" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.06, 2.9]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[1.68, 0.25, 1.68]} />
          <meshStandardMaterial color="#ffffff" roughness={0.45} />
        </mesh>

        {/* Recessed warm teak wooden deck */}
        <mesh position={[0, 0.79, 0.35]} receiveShadow>
          <boxGeometry args={[2.16, 0.08, 4.4]} />
          <meshStandardMaterial color="#967f6e" roughness={0.78} />
        </mesh>

        {/* White bow platform where Nori stands */}
        <mesh position={[0, 0.86, 2.05]} receiveShadow>
          <boxGeometry args={[1.05, 0.12, 1.15]} />
          <meshStandardMaterial color="#eef4f9" roughness={0.45} />
        </mesh>

        {/* Boat Cabin (yellow trapezoidal house + frosted sky windshield + white overhang roof) */}
        <group position={[0, 1.38, -0.45]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.82, 1.18, 1.9]} />
            <meshStandardMaterial color="#cca217" roughness={0.48} />
          </mesh>
          {/* Front & side frosted cyan windshields */}
          <mesh position={[0, 0.14, 0.96]} rotation={[-0.18, 0, 0]}>
            <planeGeometry args={[1.48, 0.68]} />
            <meshStandardMaterial color="#98c8db" roughness={0.22} metalness={0.12} />
          </mesh>
          <mesh position={[0.92, 0.14, 0.08]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.38, 0.62]} />
            <meshStandardMaterial color="#9ccbd9" roughness={0.25} />
          </mesh>
          <mesh position={[-0.92, 0.14, 0.08]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[1.38, 0.62]} />
            <meshStandardMaterial color="#9ccbd9" roughness={0.25} />
          </mesh>
          {/* Crisp white cabin roof overhang */}
          <mesh position={[0, 0.68, 0.14]} castShadow>
            <boxGeometry args={[2.02, 0.18, 2.35]} />
            <meshStandardMaterial color="#edf2f7" roughness={0.45} />
          </mesh>
          {/* Mast pole & fluttering yellow pennant flag */}
          <mesh position={[0.42, 1.24, -0.45]} rotation={[0, 0, -0.06]} castShadow>
            <cylinderGeometry args={[0.045, 0.055, 1.2, 8]} />
            <meshStandardMaterial color="#4a5568" roughness={0.6} />
          </mesh>
          <mesh ref={flagRef} geometry={flagGeom} position={[0.46, 1.56, -0.47]} rotation={[0, -Math.PI / 2, 0]}>
            <meshStandardMaterial color="#d4b11a" roughness={0.5} />
          </mesh>
        </group>

        {/* Outboard Motor on Stern */}
        <group position={[0, 0.56, -2.52]}>
          <mesh rotation={[0.24, 0, 0]} castShadow>
            <boxGeometry args={[0.56, 1.05, 0.52]} />
            <meshStandardMaterial color="#4e5968" roughness={0.52} />
          </mesh>
          <mesh position={[0, -0.45, -0.18]}>
            <boxGeometry args={[0.28, 0.65, 0.42]} />
            <meshStandardMaterial color="#8391a3" roughness={0.45} />
          </mesh>
        </group>

        {/* Wrap-around White Safety Railing around Bow */}
        <group position={[0, 1.15, 1.55]}>
          <mesh position={[-1.12, 0, -0.1]}>
            <boxGeometry args={[0.06, 0.06, 2.5]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
          </mesh>
          <mesh position={[1.12, 0, -0.1]}>
            <boxGeometry args={[0.06, 0.06, 2.5]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
          </mesh>
          <mesh position={[-0.6, 0, 1.55]} rotation={[0, -0.68, 0]}>
            <boxGeometry args={[0.06, 0.06, 1.4]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
          </mesh>
          <mesh position={[0.6, 0, 1.55]} rotation={[0, 0.68, 0]}>
            <boxGeometry args={[0.06, 0.06, 1.4]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
          </mesh>
          {/* Vertical railing posts */}
          {[
            [-1.12, -0.9],
            [-1.12, 0.1],
            [-1.12, 1.05],
            [1.12, -0.9],
            [1.12, 0.1],
            [1.12, 1.05],
            [0, 1.98],
          ].map(([px, pz], idx) => (
            <mesh key={idx} position={[px, -0.19, pz]}>
              <cylinderGeometry args={[0.026, 0.026, 0.42, 6]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.45} />
            </mesh>
          ))}
        </group>

        {/* White water foam ring hugging the boat hull */}
        <mesh position={[0, -0.16, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.65, 2.25, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.48} depthWrite={false} />
        </mesh>

        {/* Nori Guide Character standing proudly on the bow (matching Coastal World intro character!) */}
        <group position={[0, 0.92, 2.02]} rotation={[0, 1.38, 0]}>
          <CoastalCharacterMesh
            appearance={{
              colorIndex: 3, // Vibrant cyan + purple beanie + cyan boots (exact intro character look!)
              faceStyle: 'lashes',
              headAccessory: 'beanie',
              bodyAccessory: 'fannypack',
              shoeStyle: 'boots',
            }}
            pose={introStage === 'welcome' ? 'crossed' : 'idle'}
            scale={1.32}
            showGroundShadow={false}
          />
        </group>
      </group>

      {/* Distant Cute Green Fishing Boat bobbing in the Left Bay (matching steps/38/media_0.png) */}
      <group ref={distantBoatRef} position={[-12.5, -0.42, 33.5]} rotation={[0, 0.35, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 0.65, 3.2]} />
          <meshStandardMaterial color="#4b9468" roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.55, -0.3]} castShadow>
          <boxGeometry args={[1.2, 0.72, 1.25]} />
          <meshStandardMaterial color="#c97d5d" roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.0, -0.3]}>
          <boxGeometry args={[1.38, 0.14, 1.4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.75, 18]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.45} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}
