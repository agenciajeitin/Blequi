import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { WorldTimeOfDay } from '@funcionarios/types'

/**
 * High-performance InstancedMesh Coastal World vegetation, street lamps, clouds,
 * wooden harbor pier, sailboats, seawall stairs, boulders, beach umbrellas, and twin lighthouses.
 * Strictly obeys GEMINI.md 60 FPS budget (tiny draw calls + full geometry disposal).
 */
export function CoastalWorldProps({ timeOfDay }: { timeOfDay: WorldTimeOfDay }) {
  const sailboatRef = useRef<THREE.Group>(null)
  const motorLaunchRef = useRef<THREE.Group>(null)
  const cloudsRef = useRef<THREE.Group>(null)

  // === 1. MULTI-COLOR STACKED CONE PINE TREES (InstancedMesh) ===
  const pineData = useMemo(
    () => [
      // [x, y, z, scale, colorHex]
      [-4.8, 1.35, 11.4, 1.05, '#2ed66d'],
      [-8.6, 1.35, 12.2, 0.92, '#34d878'],
      [-12.8, 1.35, 10.6, 1.1, '#f48675'],
      [-15.2, 1.35, 8.4, 1.0, '#2ed66d'],
      [-16.4, 1.35, 10.2, 0.85, '#f6d845'],
      [-18.2, 1.35, 6.2, 1.15, '#30c76b'],
      [-16.5, 1.35, -2.5, 1.18, '#2ed66d'],
      [-19.2, 1.35, -5.8, 1.02, '#f6d845'],
      [-10.2, 1.35, -13.5, 1.25, '#2ed66d'],
      [-5.6, 1.35, -14.8, 1.1, '#f48675'],
      [4.2, 1.35, 12.0, 1.08, '#38d975'],
      [7.4, 1.35, 12.4, 0.92, '#f8d53d'],
      [14.8, 1.35, 4.5, 1.18, '#2ed66d'],
      [17.8, 1.35, 2.2, 1.05, '#f6d845'],
      [16.2, 1.35, -6.4, 1.22, '#2ed66d'],
      [12.4, 1.35, -12.6, 1.15, '#f48675'],
      [6.4, 1.35, -14.2, 1.2, '#34d878'],
      [20.2, 1.35, -2.2, 1.08, '#2ed66d'],
      [-1.8, 1.35, -15.5, 1.3, '#2ed66d'],
      [18.8, 1.35, -10.5, 1.1, '#f6d845'],
    ] as [number, number, number, number, string][],
    []
  )

  // === 2. CORAL / PEACH WAVY LOLLIPOP SPHERE TREES (InstancedMesh) ===
  const roundTreeData = useMemo(
    () => [
      [-3.5, 1.35, 6.8, 1.05, '#f38c6e'],
      [-4.2, 1.35, 9.6, 0.88, '#ee8166'],
      [5.4, 1.35, 11.4, 0.96, '#f48e6c'],
      [-14.2, 1.35, -4.6, 1.12, '#f38c6e'],
      [13.4, 1.35, -4.2, 1.04, '#f07c67'],
      [9.4, 1.35, -11.4, 0.95, '#f49570'],
      [-8.5, 1.35, -11.2, 1.06, '#ef7f6b'],
      [15.6, 1.35, 7.6, 0.92, '#f48e6c'],
    ] as [number, number, number, number, string][],
    []
  )

  // === 3. GOLDEN YELLOW SQUIRCLE BUSH TREES (InstancedMesh) ===
  const yellowCubeTrees = useMemo(
    () => [
      [-5.5, 1.35, 8.8, 0.96],
      [6.2, 1.35, 12.1, 0.92],
      [14.2, 1.35, 1.6, 1.08],
      [-15.8, 1.35, 1.4, 1.05],
      [8.2, 1.35, -13.6, 1.12],
      [-12.2, 1.35, -12.8, 0.98],
    ] as [number, number, number, number][],
    []
  )

  // === 4. EMERALD LOW-POLY ROUND BUSHES (InstancedMesh) ===
  const bushData = useMemo(
    () => [
      [-3.2, 1.35, 12.2, 0.62],
      [-4.6, 1.35, 10.6, 0.56],
      [4.5, 1.35, 12.8, 0.65],
      [6.9, 1.35, 11.8, 0.55],
      [-7.2, 1.35, 6.2, 0.72],
      [7.4, 1.35, 6.8, 0.68],
      [-4.4, 1.35, 0.8, 0.66],
      [4.4, 1.35, 0.8, 0.66],
      [-10.4, 1.35, 8.2, 0.74],
      [12.2, 1.35, 4.2, 0.82],
      [-11.8, 1.35, -3.4, 0.78],
      [11.6, 1.35, -7.2, 0.75],
      [-2.8, 1.35, -9.8, 0.7],
      [3.2, 1.35, -9.8, 0.7],
    ] as [number, number, number, number][],
    []
  )

  // === 5. CURVED TROPICAL PALM TREES (Green + Signature Coastal World Magenta Palms!) ===
  const palmData = useMemo(
    () => [
      // [x, y, z, scale, rotY, frondColor]
      [-9.6, 1.35, 11.4, 1.12, 0.4, '#1eb467'],
      [-11.4, 1.35, 9.8, 0.95, 1.5, '#d6336c'], // Iconic Coastal World magenta tropical palm!
      [6.4, 1.35, 9.2, 1.16, -0.5, '#1eb467'],
      [8.2, 1.35, 10.4, 0.98, 2.1, '#1eb467'],
      [18.8, 0.52, 11.6, 1.18, 0.8, '#20bc6c'],
      [21.4, 0.52, 8.6, 1.05, 1.9, '#20bc6c'],
      [17.2, 0.62, 13.8, 0.94, -1.2, '#d6336c'],
      [-18.8, 1.35, 11.2, 1.08, 0.2, '#1eb467'],
      [-23.5, 0.1, 26.8, 0.92, 0.7, '#22c46e'], // Satellite palm islet in the left bay!
      [-22.6, 0.1, 27.4, 0.76, 2.4, '#22c46e'],
    ] as [number, number, number, number, number, string][],
    []
  )

  // === 6. DARK-IRON COASTAL STREET LAMPS WITH GLOWING YELLOW LANTERNS ===
  const lampPositions = useMemo(
    () => [
      [-6.2, 1.35, 12.8],
      [6.2, 1.35, 12.8],
      [-5.2, 1.35, 4.6],
      [5.2, 1.35, 4.6],
      [-5.6, 1.35, -3.2],
      [5.6, 1.35, -3.2],
      [-11.5, 1.35, 1.2],
      [11.8, 1.35, 2.2],
    ] as [number, number, number][],
    []
  )

  // InstancedMesh Refs
  const pineTrunkRef = useRef<THREE.InstancedMesh>(null)
  const pineCone1Ref = useRef<THREE.InstancedMesh>(null)
  const pineCone2Ref = useRef<THREE.InstancedMesh>(null)
  const pineCone3Ref = useRef<THREE.InstancedMesh>(null)

  const roundTrunkRef = useRef<THREE.InstancedMesh>(null)
  const roundCrownRef = useRef<THREE.InstancedMesh>(null)

  const cubeTrunkRef = useRef<THREE.InstancedMesh>(null)
  const cubeCrownRef = useRef<THREE.InstancedMesh>(null)

  const bushRef = useRef<THREE.InstancedMesh>(null)
  const lampPoleRef = useRef<THREE.InstancedMesh>(null)
  const lampCapRef = useRef<THREE.InstancedMesh>(null)
  const lampBulbRef = useRef<THREE.InstancedMesh>(null)

  const pierPlankRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()

    // Populate Pine Trees (3 stacked faceted tiers)
    pineData.forEach(([x, y, z, s, hex], i) => {
      col.set(hex)
      dummy.position.set(x, y + 0.45 * s, z)
      dummy.scale.set(s, s, s)
      dummy.rotation.set(0, i * 0.7, 0)
      dummy.updateMatrix()
      pineTrunkRef.current?.setMatrixAt(i, dummy.matrix)

      dummy.position.set(x, y + 1.35 * s, z)
      dummy.scale.set(s * 1.05, s * 1.05, s * 1.05)
      dummy.updateMatrix()
      pineCone1Ref.current?.setMatrixAt(i, dummy.matrix)
      pineCone1Ref.current?.setColorAt(i, col)

      dummy.position.set(x, y + 2.25 * s, z)
      dummy.scale.set(s * 0.82, s * 0.9, s * 0.82)
      dummy.rotation.set(0, i * 0.7 + 0.5, 0)
      dummy.updateMatrix()
      pineCone2Ref.current?.setMatrixAt(i, dummy.matrix)
      pineCone2Ref.current?.setColorAt(i, col)

      dummy.position.set(x, y + 3.0 * s, z)
      dummy.scale.set(s * 0.56, s * 0.76, s * 0.56)
      dummy.rotation.set(0, i * 0.7 + 1.0, 0)
      dummy.updateMatrix()
      pineCone3Ref.current?.setMatrixAt(i, dummy.matrix)
      pineCone3Ref.current?.setColorAt(i, col)
    })
    ;[pineTrunkRef, pineCone1Ref, pineCone2Ref, pineCone3Ref].forEach((r) => {
      if (r.current) {
        r.current.instanceMatrix.needsUpdate = true
        if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true
      }
    })

    // Populate Coral/Peach Faceted Lollipop Trees
    roundTreeData.forEach(([x, y, z, s, hex], i) => {
      col.set(hex)
      dummy.position.set(x, y + 0.95 * s, z)
      dummy.scale.set(s, s, s)
      dummy.rotation.set(0, i * 0.5, 0)
      dummy.updateMatrix()
      roundTrunkRef.current?.setMatrixAt(i, dummy.matrix)

      dummy.position.set(x, y + 2.35 * s, z)
      dummy.scale.set(s * 1.08, s * 1.02, s * 1.08)
      dummy.updateMatrix()
      roundCrownRef.current?.setMatrixAt(i, dummy.matrix)
      roundCrownRef.current?.setColorAt(i, col)
    })
    if (roundTrunkRef.current) roundTrunkRef.current.instanceMatrix.needsUpdate = true
    if (roundCrownRef.current) {
      roundCrownRef.current.instanceMatrix.needsUpdate = true
      if (roundCrownRef.current.instanceColor) roundCrownRef.current.instanceColor.needsUpdate = true
    }

    // Populate Yellow Squircle Bush Trees
    yellowCubeTrees.forEach(([x, y, z, s], i) => {
      dummy.position.set(x, y + 0.8 * s, z)
      dummy.scale.set(s, s, s)
      dummy.rotation.set(0, i * 0.4, 0)
      dummy.updateMatrix()
      cubeTrunkRef.current?.setMatrixAt(i, dummy.matrix)

      dummy.position.set(x, y + 1.95 * s, z)
      dummy.scale.set(s * 1.15, s * 1.0, s * 1.15)
      dummy.updateMatrix()
      cubeCrownRef.current?.setMatrixAt(i, dummy.matrix)
    })
    if (cubeTrunkRef.current) cubeTrunkRef.current.instanceMatrix.needsUpdate = true
    if (cubeCrownRef.current) cubeCrownRef.current.instanceMatrix.needsUpdate = true

    // Populate Emerald Faceted Bushes
    bushData.forEach(([x, y, z, s], i) => {
      dummy.position.set(x, y + 0.34 * s, z)
      dummy.scale.set(s * 1.15, s * 0.85, s * 1.15)
      dummy.rotation.set(0, i * 0.9, 0)
      dummy.updateMatrix()
      bushRef.current?.setMatrixAt(i, dummy.matrix)
    })
    if (bushRef.current) bushRef.current.instanceMatrix.needsUpdate = true

    // Populate Street Lamps
    lampPositions.forEach(([x, y, z], i) => {
      dummy.position.set(x, y + 1.45, z)
      dummy.scale.set(1, 1, 1)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      lampPoleRef.current?.setMatrixAt(i, dummy.matrix)

      dummy.position.set(x, y + 3.32, z)
      dummy.updateMatrix()
      lampCapRef.current?.setMatrixAt(i, dummy.matrix)

      dummy.position.set(x, y + 2.98, z)
      dummy.scale.set(1, 1.18, 1)
      dummy.updateMatrix()
      lampBulbRef.current?.setMatrixAt(i, dummy.matrix)
    })
    ;[lampPoleRef, lampCapRef, lampBulbRef].forEach((r) => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true
    })

    // Populate Wooden Pier Planks (crisp planked boardwalk running z = 16.3 -> 26.5)
    const plankCount = 26
    for (let i = 0; i < plankCount; i++) {
      const z = 16.35 + i * 0.41
      dummy.position.set(0, 0.21, z)
      dummy.scale.set(1, 1, 1)
      dummy.rotation.set(0, (i % 2 === 0 ? 1 : -1) * 0.004, 0)
      dummy.updateMatrix()
      pierPlankRef.current?.setMatrixAt(i, dummy.matrix)
    }
    if (pierPlankRef.current) pierPlankRef.current.instanceMatrix.needsUpdate = true
  }, [pineData, roundTreeData, yellowCubeTrees, bushData, lampPositions])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (sailboatRef.current) {
      sailboatRef.current.position.y = -0.35 + Math.sin(t * 1.4) * 0.06
      sailboatRef.current.rotation.z = Math.sin(t * 1.1) * 0.03
    }
    if (motorLaunchRef.current) {
      motorLaunchRef.current.position.y = -0.36 + Math.sin(t * 1.6 + 1.2) * 0.055
      motorLaunchRef.current.rotation.z = Math.cos(t * 1.2) * 0.032
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * 0.006
    }
  })

  const lampEmissive = timeOfDay === 'dusk' ? 2.2 : timeOfDay === 'golden' ? 1.1 : 0.45

  // Main rounded island shape extruded for solid coastal cliff base
  const islandGeoms = useMemo(() => {
    const makeRounded = (w: number, h: number, r: number) => {
      const s = new THREE.Shape()
      const x = -w / 2
      const y = -h / 2
      s.moveTo(x + r, y)
      s.lineTo(x + w - r, y)
      s.quadraticCurveTo(x + w, y, x + w, y + r)
      s.lineTo(x + w, y + h - r)
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      s.lineTo(x + r, y + h)
      s.quadraticCurveTo(x, y + h, x, y + h - r)
      s.lineTo(x, y + r)
      s.quadraticCurveTo(x, y, x + r, y)
      return s
    }

    const grassShape = makeRounded(46, 34, 9.5)
    const grass = new THREE.ExtrudeGeometry(grassShape, {
      depth: 1.9,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.16,
      bevelSegments: 2,
    })
    grass.rotateX(Math.PI / 2)

    const sandShape = makeRounded(50, 38, 11.2)
    const sand = new THREE.ExtrudeGeometry(sandShape, {
      depth: 1.5,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.25,
      bevelSegments: 2,
    })
    sand.rotateX(Math.PI / 2)

    // Sleek flat triangular Coastal World sailboat sails (1:1 steps/62/media_0.png!)
    const mainSailShape = new THREE.Shape()
    mainSailShape.moveTo(0, 0)
    mainSailShape.lineTo(-2.35, 0.12)
    mainSailShape.lineTo(0, 3.35)
    mainSailShape.closePath()
    const mainSail = new THREE.ExtrudeGeometry(mainSailShape, { depth: 0.05, bevelEnabled: false })

    const jibSailShape = new THREE.Shape()
    jibSailShape.moveTo(0, 0)
    jibSailShape.lineTo(1.75, -0.08)
    jibSailShape.lineTo(0, 3.05)
    jibSailShape.closePath()
    const jibSail = new THREE.ExtrudeGeometry(jibSailShape, { depth: 0.05, bevelEnabled: false })

    return { grass, sand, mainSail, jibSail }
  }, [])

  useEffect(() => {
    return () => {
      islandGeoms.grass.dispose()
      islandGeoms.sand.dispose()
      islandGeoms.mainSail.dispose()
      islandGeoms.jibSail.dispose()
    }
  }, [islandGeoms])

  return (
    <group>
      {/* === MAIN COASTAL ISLAND TERRAIN === */}
      {/* Warm golden sand skirt & eastern beach shoreline */}
      <mesh geometry={islandGeoms.sand} position={[0, 0.22, -3.5]} receiveShadow>
        <meshStandardMaterial color="#f0d599" roughness={0.86} />
      </mesh>

      {/* Lush vibrant coastal green upper island plateau (top at y = 1.35) */}
      <mesh geometry={islandGeoms.grass} position={[0, 1.21, -3.5]} receiveShadow>
        <meshStandardMaterial color="#58cb76" roughness={0.84} />
      </mesh>

      {/* Soft green gentle background hill ridge along North edge */}
      <mesh position={[-8, 2.2, -16.5]} scale={[1.6, 0.55, 1]} receiveShadow>
        <dodecahedronGeometry args={[5.5, 1]} />
        <meshStandardMaterial color="#52c46f" roughness={0.86} flatShading />
      </mesh>
      <mesh position={[12, 2.5, -15.5]} scale={[1.4, 0.65, 1]} receiveShadow>
        <dodecahedronGeometry args={[6.2, 1]} />
        <meshStandardMaterial color="#83919c" roughness={0.88} flatShading />
      </mesh>
      <mesh position={[16.5, 1.8, -12.5]} scale={[1.2, 0.52, 1]} receiveShadow>
        <dodecahedronGeometry args={[4.5, 1]} />
        <meshStandardMaterial color="#58cb76" roughness={0.86} flatShading />
      </mesh>

      {/* === CLEAN COASTAL BOULEVARDS & CENTRAL TOWN PLAZA (y = 1.36) === */}
      {/* Main waterfront promenade boulevard */}
      <mesh position={[0, 1.365, 9.6]} receiveShadow>
        <boxGeometry args={[28, 0.06, 5.2]} />
        <meshStandardMaterial color="#b4bcc9" roughness={0.84} />
      </mesh>
      {/* Crisp white curb border along waterfront boulevard */}
      <mesh position={[0, 1.385, 12.35]} receiveShadow>
        <boxGeometry args={[28.2, 0.08, 0.36]} />
        <meshStandardMaterial color="#eef3f7" roughness={0.7} />
      </mesh>
      {/* North-South Central Town Avenue leading from Pier Steps to Clocktower HQ */}
      <mesh position={[0, 1.365, 4.4]} receiveShadow>
        <boxGeometry args={[6.8, 0.06, 15.6]} />
        <meshStandardMaterial color="#b4bcc9" roughness={0.84} />
      </mesh>
      {/* Circular Town Hall Forecourt Plaza */}
      <mesh position={[0, 1.375, 2.4]} receiveShadow>
        <cylinderGeometry args={[6.4, 6.6, 0.07, 32]} />
        <meshStandardMaterial color="#cfd7e3" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.39, 2.4]} receiveShadow>
        <cylinderGeometry args={[4.6, 4.6, 0.06, 32]} />
        <meshStandardMaterial color="#dde4ee" roughness={0.78} />
      </mesh>

      {/* === TERRACED WHITE COASTAL SEAWALL, PILLARS & RECESSED STEPS === */}
      {/* Main concrete seawall overlooking the harbor (z = 14.4) */}
      <mesh position={[-11.8, 0.62, 14.3]} castShadow receiveShadow>
        <boxGeometry args={[18.8, 1.62, 1.35]} />
        <meshStandardMaterial color="#dde6ea" roughness={0.72} />
      </mesh>
      <mesh position={[10.8, 0.62, 14.3]} castShadow receiveShadow>
        <boxGeometry args={[16.2, 1.62, 1.35]} />
        <meshStandardMaterial color="#dde6ea" roughness={0.72} />
      </mesh>
      {/* Top coping cap of seawall */}
      <mesh position={[-11.8, 1.48, 14.3]} receiveShadow>
        <boxGeometry args={[19.0, 0.14, 1.52]} />
        <meshStandardMaterial color="#f1f6f8" roughness={0.62} />
      </mesh>
      <mesh position={[10.8, 1.48, 14.3]} receiveShadow>
        <boxGeometry args={[16.4, 0.14, 1.52]} />
        <meshStandardMaterial color="#f1f6f8" roughness={0.62} />
      </mesh>

      {/* Iconic Square Architectural Seawall Pillars flanking the steps & right corner */}
      {[
        [-2.75, 1.05, 14.35],
        [2.75, 1.05, 14.35],
        [9.8, 1.05, 14.35],
        [-11.8, 1.05, 14.35],
      ].map(([px, py, pz], idx) => (
        <group key={idx} position={[px, py, pz]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.25, 2.2, 1.55]} />
            <meshStandardMaterial color="#dce4e8" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.18, 0]} castShadow>
            <boxGeometry args={[1.48, 0.24, 1.76]} />
            <meshStandardMaterial color="#f3f7f9" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Wide Recessed Concrete Harbor Steps (climbing smoothly from pier y=0.25 -> plaza y=1.35) */}
      {[0, 1, 2, 3, 4, 5].map((step) => (
        <mesh
          key={`center-step-${step}`}
          position={[0, 0.28 + step * 0.19, 15.65 - step * 0.36]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[4.4, 0.2, 0.42]} />
          <meshStandardMaterial color={step % 2 === 0 ? '#e5ecf0' : '#eef4f7'} roughness={0.72} />
        </mesh>
      ))}

      {/* Lower white waterfront quay walkway beside pier */}
      <mesh position={[0, 0.2, 16.05]} receiveShadow>
        <boxGeometry args={[5.4, 0.22, 1.2]} />
        <meshStandardMaterial color="#eef4f8" roughness={0.68} />
      </mesh>
      <mesh position={[-7.8, 0.22, 15.95]} receiveShadow>
        <boxGeometry args={[11.2, 0.24, 2.2]} />
        <meshStandardMaterial color="#9c7e58" roughness={0.82} />
      </mesh>

      {/* === WOODEN HARBOR PIER & ROPE-WRAPPED MOORING BOLLARDS (1:1 steps/62/media_0.png) === */}
      {/* Structural pier stringers */}
      <mesh position={[-1.9, -0.15, 21.4]}>
        <boxGeometry args={[0.26, 0.65, 10.6]} />
        <meshStandardMaterial color="#6e543a" roughness={0.88} />
      </mesh>
      <mesh position={[1.9, -0.15, 21.4]}>
        <boxGeometry args={[0.26, 0.65, 10.6]} />
        <meshStandardMaterial color="#6e543a" roughness={0.88} />
      </mesh>
      {/* Instanced Pier Timber Planks */}
      <instancedMesh ref={pierPlankRef} args={[undefined, undefined, 26]} receiveShadow castShadow>
        <boxGeometry args={[4.45, 0.11, 0.36]} />
        <meshStandardMaterial color="#8f7250" roughness={0.82} />
      </instancedMesh>
      {/* Rope-Wrapped Wooden Bollards flanking Pier */}
      {[
        [-2.05, 18.2],
        [2.05, 18.2],
        [-2.05, 22.0],
        [2.05, 22.0],
        [-2.05, 25.8],
        [2.05, 25.8],
      ].map(([bx, bz], i) => (
        <group key={`bollard-${i}`} position={[bx, 0.18, bz]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.17, 0.19, 1.55, 10]} />
            <meshStandardMaterial color="#7a5e3c" roughness={0.85} />
          </mesh>
          {/* Yellow mooring rope rings */}
          {i < 4 && (
            <>
              <mesh position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0.08, 0]}>
                <torusGeometry args={[0.185, 0.032, 6, 14]} />
                <meshStandardMaterial color="#e8c35c" roughness={0.75} />
              </mesh>
              <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, -0.06, 0]}>
                <torusGeometry args={[0.185, 0.032, 6, 14]} />
                <meshStandardMaterial color="#e0b84f" roughness={0.75} />
              </mesh>
            </>
          )}
        </group>
      ))}

      {/* === MOORED TERRACOTTA SAILBOAT (Exact left-of-pier hero boat from steps/62/media_0.png!) === */}
      <group ref={sailboatRef} position={[-4.9, -0.35, 19.3]} rotation={[0, 0.28, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.4, 0.72, 1.95]} />
          <meshStandardMaterial color="#c97458" roughness={0.55} />
        </mesh>
        <mesh position={[2.4, 0.02, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <boxGeometry args={[1.38, 0.7, 1.38]} />
          <meshStandardMaterial color="#c97458" roughness={0.55} />
        </mesh>
        {/* Cabin with turquoise glass */}
        <mesh position={[0.2, 0.56, 0]} castShadow>
          <boxGeometry args={[2.1, 0.5, 1.38]} />
          <meshStandardMaterial color="#d88266" roughness={0.52} />
        </mesh>
        <mesh position={[0.25, 0.56, 0.7]}>
          <planeGeometry args={[1.65, 0.34]} />
          <meshStandardMaterial color="#9ae2de" roughness={0.25} />
        </mesh>
        <mesh position={[0.25, 0.56, -0.7]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.65, 0.34]} />
          <meshStandardMaterial color="#9ae2de" roughness={0.25} />
        </mesh>
        {/* Mast & Twin Sleek Burgundy-Rose Triangular Sails (1:1 steps/62/media_0.png!) */}
        <mesh position={[0.35, 2.35, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.065, 3.9, 8]} />
          <meshStandardMaterial color="#e5edf2" roughness={0.45} />
        </mesh>
        <mesh geometry={islandGeoms.mainSail} position={[0.26, 0.92, -0.025]} rotation={[0, 0.08, 0]} castShadow>
          <meshStandardMaterial color="#a45463" roughness={0.62} />
        </mesh>
        <mesh geometry={islandGeoms.jibSail} position={[0.45, 1.0, -0.025]} rotation={[0, -0.1, 0]} castShadow>
          <meshStandardMaterial color="#934656" roughness={0.62} />
        </mesh>
        {/* White foam ring */}
        <mesh position={[0.3, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.65, 2.15, 22]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      </group>

      {/* Secondary Orange Harbor Launch Boat on far left of pier */}
      <group ref={motorLaunchRef} position={[-9.6, -0.36, 19.6]} rotation={[0, -0.18, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.5, 0.72, 1.6]} />
          <meshStandardMaterial color="#e07454" roughness={0.55} />
        </mesh>
        <mesh position={[-0.3, 0.58, 0]} castShadow>
          <boxGeometry args={[1.2, 0.65, 1.3]} />
          <meshStandardMaterial color="#f5f8fa" roughness={0.48} />
        </mesh>
        <mesh position={[1.35, 0.18, 0]}>
          <boxGeometry args={[0.45, 0.55, 0.45]} />
          <meshStandardMaterial color="#e89a82" roughness={0.55} />
        </mesh>
      </group>

      {/* === HARBOR SLATE BOULDERS ON RIGHT SIDE OF PIER (1:1 steps/62/media_0.png!) === */}
      <group position={[6.8, -0.1, 18.2]}>
        <mesh position={[0, 0.55, 0]} scale={[1.5, 0.85, 1.15]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.9, 0]} />
          <meshStandardMaterial color="#677580" roughness={0.86} flatShading />
        </mesh>
        <mesh position={[2.2, 0.25, 1.4]} scale={[1.2, 0.65, 1.1]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial color="#5e6b76" roughness={0.86} flatShading />
        </mesh>
        <mesh position={[-1.9, 0.18, 0.9]} scale={[0.95, 0.55, 0.9]} castShadow>
          <dodecahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial color="#73828d" roughness={0.86} flatShading />
        </mesh>
      </group>

      {/* === TINY PALM SATELLITE ISLET IN LEFT BAY (visible in Boat Intro!) === */}
      <group position={[-23.5, -0.45, 27.0]}>
        <mesh scale={[1.35, 0.45, 1.25]} receiveShadow>
          <sphereGeometry args={[2.5, 16, 12]} />
          <meshStandardMaterial color="#f0d599" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.45, 0]} scale={[1.1, 0.35, 1.05]} receiveShadow>
          <sphereGeometry args={[2.0, 14, 10]} />
          <meshStandardMaterial color="#65cf7a" roughness={0.86} />
        </mesh>
      </group>

      {/* === TWIN STRIPED COASTAL LIGHTHOUSES (Iconic Intro Horizon Landmarks!) === */}
      {[
        { pos: [-25.0, 0.3, 6.5] as [number, number, number], scale: 1.08 },
        { pos: [26.5, 0.3, -6.5] as [number, number, number], scale: 1.0 },
      ].map(({ pos, scale }, idx) => (
        <group key={`lighthouse-${idx}`} position={pos} scale={scale}>
          {/* Rocky headland base */}
          <mesh position={[0, 0.35, 0]} scale={[1.4, 0.58, 1.3]} receiveShadow castShadow>
            <dodecahedronGeometry args={[3.4, 0]} />
            <meshStandardMaterial color="#8796a3" roughness={0.88} flatShading />
          </mesh>
          {/* Tapered striped tower (White & Slate-Teal bands) */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[1.35, 1.65, 2.1, 14]} />
            <meshStandardMaterial color="#f2f6fa" roughness={0.62} />
          </mesh>
          <mesh position={[0, 4.15, 0]} castShadow>
            <cylinderGeometry args={[1.1, 1.35, 1.8, 14]} />
            <meshStandardMaterial color="#58697c" roughness={0.65} />
          </mesh>
          <mesh position={[0, 5.95, 0]} castShadow>
            <cylinderGeometry args={[0.88, 1.1, 1.8, 14]} />
            <meshStandardMaterial color="#f2f6fa" roughness={0.62} />
          </mesh>
          {/* Gallery balcony */}
          <mesh position={[0, 6.95, 0]} castShadow>
            <cylinderGeometry args={[1.18, 1.0, 0.25, 14]} />
            <meshStandardMaterial color="#4c5c6e" roughness={0.6} />
          </mesh>
          {/* Glowing beacon lantern room */}
          <mesh position={[0, 7.62, 0]}>
            <cylinderGeometry args={[0.76, 0.76, 1.12, 12]} />
            <meshStandardMaterial
              color="#fff5c0"
              emissive="#ffd54f"
              emissiveIntensity={timeOfDay === 'dusk' ? 2.4 : 0.7}
              roughness={0.25}
            />
          </mesh>
          {/* Pointed lighthouse cupola */}
          <mesh position={[0, 8.55, 0]} castShadow>
            <coneGeometry args={[0.92, 0.9, 12]} />
            <meshStandardMaterial color="#58697c" roughness={0.55} />
          </mesh>
        </group>
      ))}

      {/* === EASTERN SUNNY BEACH UMBRELLAS & PICNIC AREA === */}
      {[
        { pos: [17.8, 0.85, 10.6] as [number, number, number], c1: '#ff6f69', c2: '#ffd15c' },
        { pos: [21.0, 0.65, 12.2] as [number, number, number], c1: '#3ac8e8', c2: '#ffffff' },
        { pos: [15.5, 1.35, 9.8] as [number, number, number], c1: '#ff8a4c', c2: '#ffda59' },
      ].map(({ pos, c1, c2 }, i) => (
        <group key={`umb-${i}`} position={pos}>
          <mesh position={[0, 1.15, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 2.3, 8]} />
            <meshStandardMaterial color="#e8eef2" roughness={0.5} />
          </mesh>
          <mesh position={[0, 2.25, 0]} castShadow>
            <coneGeometry args={[1.55, 0.62, 8]} />
            <meshStandardMaterial color={c1} roughness={0.6} flatShading />
          </mesh>
          <mesh position={[0, 2.27, 0]} rotation={[0, Math.PI / 8, 0]}>
            <coneGeometry args={[1.52, 0.6, 4]} />
            <meshStandardMaterial color={c2} roughness={0.6} flatShading />
          </mesh>
          {/* Cute beach chair / table under umbrella */}
          <mesh position={[0.55, 0.3, 0.45]} castShadow>
            <boxGeometry args={[0.85, 0.12, 0.55]} />
            <meshStandardMaterial color="#a67247" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* === INSTANCED COASTAL VEGETATION & LAMPS === */}
      {/* 1. Stacked Pine Trees */}
      <instancedMesh ref={pineTrunkRef} args={[undefined, undefined, pineData.length]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 0.9, 8]} />
        <meshStandardMaterial color="#87583a" roughness={0.88} />
      </instancedMesh>
      <instancedMesh ref={pineCone1Ref} args={[undefined, undefined, pineData.length]} castShadow receiveShadow>
        <coneGeometry args={[1.05, 1.35, 7]} />
        <meshStandardMaterial roughness={0.74} flatShading />
      </instancedMesh>
      <instancedMesh ref={pineCone2Ref} args={[undefined, undefined, pineData.length]} castShadow receiveShadow>
        <coneGeometry args={[0.98, 1.25, 7]} />
        <meshStandardMaterial roughness={0.74} flatShading />
      </instancedMesh>
      <instancedMesh ref={pineCone3Ref} args={[undefined, undefined, pineData.length]} castShadow receiveShadow>
        <coneGeometry args={[0.92, 1.2, 7]} />
        <meshStandardMaterial roughness={0.74} flatShading />
      </instancedMesh>

      {/* 2. Coral / Peach Wavy Faceted Lollipop Trees */}
      <instancedMesh ref={roundTrunkRef} args={[undefined, undefined, roundTreeData.length]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 1.9, 8]} />
        <meshStandardMaterial color="#996444" roughness={0.86} />
      </instancedMesh>
      <instancedMesh ref={roundCrownRef} args={[undefined, undefined, roundTreeData.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial roughness={0.72} flatShading />
      </instancedMesh>

      {/* 3. Golden Yellow Squircle Bush Trees */}
      <instancedMesh ref={cubeTrunkRef} args={[undefined, undefined, yellowCubeTrees.length]} castShadow>
        <cylinderGeometry args={[0.14, 0.19, 1.6, 8]} />
        <meshStandardMaterial color="#8f5d3c" roughness={0.86} />
      </instancedMesh>
      <instancedMesh ref={cubeCrownRef} args={[undefined, undefined, yellowCubeTrees.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.02, 1]} />
        <meshStandardMaterial color="#f8d22e" roughness={0.7} flatShading />
      </instancedMesh>

      {/* 4. Low-Poly Emerald Bushes */}
      <instancedMesh ref={bushRef} args={[undefined, undefined, bushData.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshStandardMaterial color="#1cb861" roughness={0.78} flatShading />
      </instancedMesh>

      {/* 5. Tropical Curved Palm Trees (Green + Signature Magenta-Coral Palms) */}
      {palmData.map(([px, py, pz, s, rotY, frondColor], idx) => (
        <group key={`palm-${idx}`} position={[px, py, pz]} rotation={[0, rotY, 0]} scale={s}>
          {/* Segmented gently curved palm trunk */}
          <mesh position={[0, 0.85, 0]} rotation={[0.08, 0, 0.05]} castShadow>
            <cylinderGeometry args={[0.17, 0.24, 1.75, 7]} />
            <meshStandardMaterial color="#9c6a4a" roughness={0.86} flatShading />
          </mesh>
          <mesh position={[0.09, 2.42, 0.14]} rotation={[0.14, 0, 0.09]} castShadow>
            <cylinderGeometry args={[0.12, 0.17, 1.65, 7]} />
            <meshStandardMaterial color="#a67452" roughness={0.86} flatShading />
          </mesh>
          {/* 6 Gracefully Arched Drooping Tropical Palm Fronds (1:1 Coastal World palms!) */}
          <group position={[0.18, 3.18, 0.26]}>
            {/* Coconuts cluster under crown */}
            <mesh position={[0.12, -0.14, 0.1]}>
              <sphereGeometry args={[0.13, 8, 8]} />
              <meshStandardMaterial color="#7a4c2e" roughness={0.85} />
            </mesh>
            <mesh position={[-0.1, -0.16, -0.08]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshStandardMaterial color="#6e4226" roughness={0.85} />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((fi) => {
              const a = (fi / 6) * Math.PI * 2 + (idx % 2) * 0.25
              return (
                <group key={fi} rotation={[0, a, 0]}>
                  {/* Inner upward-arching frond blade */}
                  <mesh position={[0, 0.16, 0.62]} rotation={[0.25, 0, 0]} castShadow>
                    <boxGeometry args={[0.42, 0.08, 1.18]} />
                    <meshStandardMaterial color={frondColor} roughness={0.7} />
                  </mesh>
                  {/* Outer gracefully drooping tapered leaf tip */}
                  <mesh position={[0, -0.18, 1.54]} rotation={[1.95, 0, 0]} scale={[1.1, 1.0, 0.22]} castShadow>
                    <coneGeometry args={[0.28, 1.15, 4]} />
                    <meshStandardMaterial color={frondColor} roughness={0.7} flatShading />
                  </mesh>
                </group>
              )
            })}
          </group>
        </group>
      ))}

      {/* 6. Dark-Iron Street Lamps with Warm Yellow Lantern Globes */}
      <instancedMesh ref={lampPoleRef} args={[undefined, undefined, lampPositions.length]} castShadow>
        <cylinderGeometry args={[0.075, 0.13, 2.9, 8]} />
        <meshStandardMaterial color="#4c5563" roughness={0.55} metalness={0.3} />
      </instancedMesh>
      <instancedMesh ref={lampCapRef} args={[undefined, undefined, lampPositions.length]}>
        <coneGeometry args={[0.26, 0.24, 8]} />
        <meshStandardMaterial color="#404856" roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={lampBulbRef} args={[undefined, undefined, lampPositions.length]}>
        <sphereGeometry args={[0.26, 10, 10]} />
        <meshStandardMaterial
          color="#ffe347"
          emissive="#ffcf33"
          emissiveIntensity={lampEmissive}
          roughness={0.3}
        />
      </instancedMesh>

      {/* === FLUFFY STYLIZED LAYERED CLOUDS RINGING THE HORIZON (1:1 Intro & Island Backdrop) === */}
      <group ref={cloudsRef}>
        {[
          [-38, 10.5, -34, 2.5],
          [-16, 13.5, -46, 3.0],
          [14, 12.0, -44, 2.8],
          [40, 11.0, -30, 2.6],
          [-46, 9.5, 4, 2.3],
          [46, 10.2, 8, 2.4],
          [-30, 11.5, 38, 2.2],
          [32, 12.2, 36, 2.4],
        ].map(([cx, cy, cz, cs], i) => (
          <group key={`cloud-${i}`} position={[cx, cy, cz]} scale={cs}>
            <mesh>
              <sphereGeometry args={[1.65, 12, 10]} />
              <meshBasicMaterial color="#e8fbff" transparent opacity={0.86} />
            </mesh>
            <mesh position={[1.45, -0.35, 0.1]}>
              <sphereGeometry args={[1.25, 12, 10]} />
              <meshBasicMaterial color="#effcff" transparent opacity={0.86} />
            </mesh>
            <mesh position={[-1.4, -0.4, -0.1]}>
              <sphereGeometry args={[1.18, 12, 10]} />
              <meshBasicMaterial color="#effcff" transparent opacity={0.86} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
