import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  createCoastalSkyMaterial,
  createCoastalOceanMaterial,
  getSkyPalette,
} from '@ambiente/shaders/coastalShaders'
import { coastalAudio } from '@ambiente/audio/coastalAudio'
import {
  COASTAL_LANDMARKS,
  ISLAND_COINS,
  useReplicaStore,
} from '../store'
import { CoastalAvatar } from './CoastalAvatar'

export interface DragInputRef {
  active: boolean
  dx: number
  dz: number
}

function getIslandHeight(x: number, z: number): number {
  // Wooden arrival pier corridor
  if (Math.abs(x) < 2.25 && z >= 10.5 && z <= 21.2) {
    return 0.85
  }
  const dist = Math.hypot(x, z)
  if (dist > 20.5) return 0.15
  // Gentle terraced pastel hill
  const norm = Math.max(0, 1 - dist / 20.5)
  const hill = Math.pow(norm, 1.35) * 1.35
  const subtleWave = Math.sin(x * 0.22) * Math.cos(z * 0.22) * 0.12 * norm
  return 0.35 + hill + subtleWave
}

/** Instanced pine trees, palm trees, bushes, rocks & drifting clouds (60 FPS) */
function InstancedCoastalNature() {
  const pineTrunksRef = useRef<THREE.InstancedMesh>(null)
  const pineTopsRef = useRef<THREE.InstancedMesh>(null)
  const bushesRef = useRef<THREE.InstancedMesh>(null)
  const rocksRef = useRef<THREE.InstancedMesh>(null)
  const cloudsRef = useRef<THREE.Group>(null)

  const { pines, bushes, rocks, clouds } = useMemo(() => {
    const pineCoords: [number, number, number][] = [
      [-8.5, 10.2, 1.0],
      [-11.8, 7.6, 1.15],
      [-15.2, 2.2, 0.95],
      [-15.4, -3.6, 1.2],
      [-9.8, -13.5, 1.05],
      [-4.2, -15.4, 1.15],
      [4.5, -15.2, 1.0],
      [9.4, -14.2, 0.92],
      [15.6, -5.8, 1.18],
      [16.2, -0.5, 1.0],
      [9.2, 11.4, 0.95],
      [5.8, 12.6, 1.1],
      [-5.5, 12.5, 0.95],
      [-13.5, 5.1, 0.88],
      [14.2, 10.2, 0.92],
    ]

    const bushCoords: [number, number, number][] = [
      [-6.5, 9.2, 0.9],
      [-10.2, 5.4, 1.05],
      [-13.0, -0.8, 0.85],
      [-8.2, -11.4, 1.0],
      [2.5, -13.0, 0.95],
      [8.2, -11.8, 1.1],
      [13.4, -3.5, 0.9],
      [11.4, 9.2, 1.0],
      [4.4, 9.8, 0.85],
      [-4.6, 9.6, 0.88],
      [-4.8, -4.4, 0.95],
      [4.8, -4.2, 0.95],
    ]

    const rockCoords: [number, number, number][] = [
      [-17.2, 6.2, 1.1],
      [-17.8, -7.2, 1.35],
      [-10.4, -16.8, 1.2],
      [7.2, -16.8, 1.15],
      [17.6, -8.4, 1.25],
      [17.8, 4.4, 1.05],
      [12.5, 14.2, 0.95],
      [-12.2, 14.0, 1.1],
    ]

    const cloudList = [
      { pos: [-48, 22, -55] as [number, number, number], scale: 2.3, speed: 0.35 },
      { pos: [12, 26, -68] as [number, number, number], scale: 2.9, speed: 0.25 },
      { pos: [54, 20, -45] as [number, number, number], scale: 2.1, speed: 0.3 },
      { pos: [-56, 19, 18] as [number, number, number], scale: 1.9, speed: 0.28 },
      { pos: [48, 24, 24] as [number, number, number], scale: 2.4, speed: 0.22 },
      { pos: [-10, 28, 56] as [number, number, number], scale: 2.2, speed: 0.26 },
    ]

    return { pines: pineCoords, bushes: bushCoords, rocks: rockCoords, clouds: cloudList }
  }, [])

  useEffect(() => {
    const dummy = new THREE.Object3D()

    pines.forEach(([x, z, s], i) => {
      const y = getIslandHeight(x, z)
      dummy.position.set(x, y + 0.55 * s, z)
      dummy.scale.set(s, s, s)
      dummy.rotation.set(0, i * 1.1, 0)
      dummy.updateMatrix()
      pineTrunksRef.current?.setMatrixAt(i, dummy.matrix)

      dummy.position.set(x, y + 1.85 * s, z)
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      pineTopsRef.current?.setMatrixAt(i, dummy.matrix)
    })
    if (pineTrunksRef.current) pineTrunksRef.current.instanceMatrix.needsUpdate = true
    if (pineTopsRef.current) pineTopsRef.current.instanceMatrix.needsUpdate = true

    bushes.forEach(([x, z, s], i) => {
      const y = getIslandHeight(x, z)
      dummy.position.set(x, y + 0.35 * s, z)
      dummy.scale.set(s * 1.15, s * 0.82, s * 1.15)
      dummy.rotation.set(0, i * 0.8, 0)
      dummy.updateMatrix()
      bushesRef.current?.setMatrixAt(i, dummy.matrix)
    })
    if (bushesRef.current) bushesRef.current.instanceMatrix.needsUpdate = true

    rocks.forEach(([x, z, s], i) => {
      const y = getIslandHeight(x, z)
      dummy.position.set(x, y + 0.25 * s, z)
      dummy.scale.set(s * 1.2, s * 0.72, s)
      dummy.rotation.set(0.15, i * 1.4, 0.1)
      dummy.updateMatrix()
      rocksRef.current?.setMatrixAt(i, dummy.matrix)
    })
    if (rocksRef.current) rocksRef.current.instanceMatrix.needsUpdate = true
  }, [pines, bushes, rocks])

  useFrame((state, delta) => {
    if (!cloudsRef.current) return
    cloudsRef.current.children.forEach((child, idx) => {
      const spd = clouds[idx]?.speed ?? 0.25
      child.position.x += delta * spd
      if (child.position.x > 75) child.position.x = -75
      child.position.y += Math.sin(state.clock.elapsedTime * 0.4 + idx) * 0.003
    })
  })

  return (
    <group>
      {/* Instanced Pine Trunks */}
      <instancedMesh ref={pineTrunksRef} args={[undefined, undefined, pines.length]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 1.2, 8]} />
        <meshStandardMaterial color="#c9956b" roughness={0.85} />
      </instancedMesh>

      {/* Instanced Pastel Mint Pine Canopies */}
      <instancedMesh ref={pineTopsRef} args={[undefined, undefined, pines.length]} castShadow receiveShadow>
        <coneGeometry args={[1.05, 2.35, 10]} />
        <meshStandardMaterial color="#5ad1a8" roughness={0.72} />
      </instancedMesh>

      {/* Instanced Rounded Coastal Bushes */}
      <instancedMesh ref={bushesRef} args={[undefined, undefined, bushes.length]} receiveShadow>
        <dodecahedronGeometry args={[0.62, 1]} />
        <meshStandardMaterial color="#7ce3b8" roughness={0.78} />
      </instancedMesh>

      {/* Instanced Coastal Shoreline Rocks */}
      <instancedMesh ref={rocksRef} args={[undefined, undefined, rocks.length]} receiveShadow>
        <dodecahedronGeometry args={[0.72, 0]} />
        <meshStandardMaterial color="#d8e3f2" roughness={0.88} />
      </instancedMesh>

      {/* Fluffy Drifting Cumulus Clouds */}
      <group ref={cloudsRef}>
        {clouds.map((c, idx) => (
          <group key={idx} position={c.pos} scale={c.scale}>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[2.1, 14, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.95} />
            </mesh>
            <mesh position={[-1.9, -0.35, 0.2]}>
              <sphereGeometry args={[1.55, 12, 10]} />
              <meshStandardMaterial color="#f6fbff" roughness={0.95} />
            </mesh>
            <mesh position={[1.95, -0.4, -0.1]}>
              <sphereGeometry args={[1.65, 12, 10]} />
              <meshStandardMaterial color="#f6fbff" roughness={0.95} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

/** 5 Iconic Coastal World Landmarks + Friendly NPCs */
function CoastalLandmarksGroup() {
  const lighthouseBeamRef = useRef<THREE.Group>(null)
  const hubCoinRef = useRef<THREE.Mesh>(null)
  const sailboatRef = useRef<THREE.Group>(null)
  const openDialog = useReplicaStore((s) => s.openDialog)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (lighthouseBeamRef.current) {
      lighthouseBeamRef.current.rotation.y = t * 0.9
    }
    if (hubCoinRef.current) {
      hubCoinRef.current.rotation.y = t * 1.4
      hubCoinRef.current.position.y = 4.35 + Math.sin(t * 2.2) * 0.16
    }
    if (sailboatRef.current) {
      sailboatRef.current.position.y = 0.22 + Math.sin(t * 1.8) * 0.08
      sailboatRef.current.rotation.z = Math.sin(t * 1.3) * 0.05
    }
  })

  return (
    <group>
      {/* 1. ARRIVAL PIER & WELCOME ARCH */}
      <group position={[0, 0, 15.8]}>
        {/* Wooden Pier Deck */}
        <mesh position={[0, 0.72, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.4, 0.26, 11.2]} />
          <meshStandardMaterial color="#e8c396" roughness={0.82} />
        </mesh>
        {/* Pier Pilings */}
        {[-1.9, 1.9].map((px) =>
          [-4.2, -1.2, 1.8, 4.8].map((pz) => (
            <mesh key={`${px}-${pz}`} position={[px, 0.0, pz]}>
              <cylinderGeometry args={[0.16, 0.18, 1.8, 8]} />
              <meshStandardMaterial color="#b98a5b" roughness={0.9} />
            </mesh>
          )),
        )}
        {/* Welcome Archway */}
        <group position={[0, 0.85, -3.2]}>
          <mesh position={[-1.95, 1.65, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.16, 3.3, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
          <mesh position={[1.95, 1.65, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.16, 3.3, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
          <mesh position={[0, 3.25, 0]} castShadow>
            <boxGeometry args={[4.5, 0.65, 0.34]} />
            <meshStandardMaterial color="#02c6a7" roughness={0.42} />
          </mesh>
          <mesh position={[0, 3.66, 0]}>
            <boxGeometry args={[2.4, 0.22, 0.24]} />
            <meshStandardMaterial color="#f6d35f" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* 2. BEACON LIGHTHOUSE & HARBOR SAILBOAT */}
      <group position={[-14.5, getIslandHeight(-14.5, -9.5), -9.5]}>
        <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.5, 2.8, 0.7, 16]} />
          <meshStandardMaterial color="#eef3fa" roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.9, 0]} castShadow>
          <cylinderGeometry args={[1.35, 1.75, 2.5, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.55} />
        </mesh>
        <mesh position={[0, 3.8, 0]} castShadow>
          <cylinderGeometry args={[1.15, 1.35, 1.4, 16]} />
          <meshStandardMaterial color="#f2676f" roughness={0.5} />
        </mesh>
        <mesh position={[0, 5.1, 0]} castShadow>
          <cylinderGeometry args={[1.0, 1.15, 1.2, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.55} />
        </mesh>
        {/* Lantern Glass & Rotating Warm Glow */}
        <mesh position={[0, 6.0, 0]}>
          <cylinderGeometry args={[0.88, 0.88, 0.78, 16]} />
          <meshStandardMaterial color="#fff3b0" emissive="#ffd166" emissiveIntensity={1.2} />
        </mesh>
        <group ref={lighthouseBeamRef} position={[0, 6.0, 0]}>
          <mesh position={[0, 0, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.9, 4.2, 12, 1, true]} />
            <meshBasicMaterial color="#fff3b0" transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>
        </group>
        {/* Dome Roof */}
        <mesh position={[0, 6.75, 0]} castShadow>
          <coneGeometry args={[1.18, 1.1, 16]} />
          <meshStandardMaterial color="#3b3777" roughness={0.45} />
        </mesh>
      </group>

      {/* Docked Pastel Sailboat near Lighthouse */}
      <group ref={sailboatRef} position={[-22.5, 0.22, -11.5]} rotation={[0, 0.55, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.55, 3.8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.48} />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[1.3, 0.12, 3.3]} />
          <meshStandardMaterial color="#02c6a7" roughness={0.55} />
        </mesh>
        <mesh position={[0, 2.0, -0.2]}>
          <cylinderGeometry args={[0.06, 0.08, 3.4, 8]} />
          <meshStandardMaterial color="#3b3777" />
        </mesh>
        <mesh position={[0, 2.15, 0.55]} rotation={[0, Math.PI / 2, 0]}>
          <coneGeometry args={[1.1, 2.6, 3]} />
          <meshStandardMaterial color="#f8b3b7" roughness={0.65} />
        </mesh>
      </group>

      {/* 3. SURF & SIP CAFÉ */}
      <group position={[13.5, getIslandHeight(13.5, 5.5), 5.5]} rotation={[0, -0.55, 0]}>
        <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.4, 2.3, 3.2]} />
          <meshStandardMaterial color="#fffaf0" roughness={0.65} />
        </mesh>
        {/* Pastel Mint Roof */}
        <mesh position={[0, 2.52, 0]} castShadow>
          <boxGeometry args={[4.9, 0.42, 3.7]} />
          <meshStandardMaterial color="#02c6a7" roughness={0.45} />
        </mesh>
        {/* Coral Striped Awning */}
        <mesh position={[0, 1.95, 1.95]} rotation={[0.32, 0, 0]} castShadow>
          <boxGeometry args={[4.2, 0.14, 1.25]} />
          <meshStandardMaterial color="#f2676f" roughness={0.5} />
        </mesh>
        {/* Espresso Counter */}
        <mesh position={[0, 0.72, 1.72]} castShadow>
          <boxGeometry args={[3.4, 0.95, 0.55]} />
          <meshStandardMaterial color="#f6d35f" roughness={0.55} />
        </mesh>
        {/* Surfboards leaning on the side */}
        <mesh position={[2.45, 1.05, 0.5]} rotation={[0.12, 0.2, -0.18]} castShadow>
          <capsuleGeometry args={[0.24, 1.35, 8, 12]} />
          <meshStandardMaterial color="#00b4ff" roughness={0.35} />
        </mesh>
        <mesh position={[2.6, 0.95, -0.2]} rotation={[-0.1, 0.2, -0.22]} castShadow>
          <capsuleGeometry args={[0.22, 1.25, 8, 12]} />
          <meshStandardMaterial color="#f2676f" roughness={0.35} />
        </mesh>
      </group>

      {/* 4. COASTAL HUB PAVILION (Central Plaza) */}
      <group position={[0, getIslandHeight(0, -1.5), -1.5]}>
        <mesh position={[0, 0.22, 0]} receiveShadow>
          <cylinderGeometry args={[4.3, 4.7, 0.44, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.68} />
        </mesh>
        {/* 6 Rounded Pillars */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 3.1, 1.65, Math.sin(angle) * 3.1]}
              castShadow
            >
              <cylinderGeometry args={[0.22, 0.26, 2.5, 12]} />
              <meshStandardMaterial color="#eef3fa" roughness={0.55} />
            </mesh>
          )
        })}
        {/* Mint Pastel Dome */}
        <mesh position={[0, 2.95, 0]} castShadow>
          <sphereGeometry args={[3.35, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#86e0cf" roughness={0.42} />
        </mesh>
        {/* Floating Spinning Golden CP Coin Emblem */}
        <mesh ref={hubCoinRef} position={[0, 4.35, 0]} castShadow>
          <cylinderGeometry args={[0.72, 0.72, 0.2, 20]} />
          <meshStandardMaterial color="#f6d35f" roughness={0.28} metalness={0.35} />
        </mesh>
      </group>

      {/* 5. SUNSET OVERLOOK TERRACE */}
      <group position={[12.5, getIslandHeight(12.5, -11.5), -11.5]} rotation={[0, -2.35, 0]}>
        <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[3.4, 3.8, 0.9, 16]} />
          <meshStandardMaterial color="#f4f8ff" roughness={0.7} />
        </mesh>
        {/* Navy Indigo Observatory Railing */}
        <mesh position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.15, 0.08, 8, 24, Math.PI * 1.4]} />
          <meshStandardMaterial color="#3b3777" roughness={0.45} />
        </mesh>
        {/* Brass Horizon Telescope */}
        <group position={[0, 1.0, 2.0]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.13, 1.1, 10]} />
            <meshStandardMaterial color="#3b3777" roughness={0.45} />
          </mesh>
          <mesh position={[0, 1.12, 0.25]} rotation={[1.25, 0, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.11, 0.95, 12]} />
            <meshStandardMaterial color="#f6d35f" roughness={0.3} metalness={0.4} />
          </mesh>
        </group>
      </group>

      {/* FRIENDLY ISLAND NPCs AT EACH LANDMARK */}
      {COASTAL_LANDMARKS.map((lm) => {
        const npcX = lm.teleportTo[0] + (lm.id === 'pier' ? 1.55 : -1.45)
        const npcZ = lm.teleportTo[2] + (lm.id === 'pier' ? -0.6 : -0.8)
        const npcY = getIslandHeight(npcX, npcZ)
        return (
          <group
            key={lm.id}
            position={[npcX, npcY, npcZ]}
            onClick={(e) => {
              e.stopPropagation()
              openDialog(lm.id)
            }}
          >
            <CoastalAvatar paletteIndex={lm.npcPaletteIndex} hat={lm.id === 'pier' ? 'cap' : lm.id === 'hub' ? 'crown' : 'none'} />
            {/* Floating pastel ring beneath NPC */}
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.55, 0.72, 24]} />
              <meshBasicMaterial color={lm.badgeColor} transparent opacity={0.75} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** Floating collectible CP Coins */
function CollectibleCoinsGroup() {
  const collected = useReplicaStore((s) => s.collectedCoins)
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      child.rotation.y = t * 2.2 + i
      child.position.y = (ISLAND_COINS[i]?.position[1] ?? 1.4) + Math.sin(t * 2.8 + i) * 0.14
    })
  })

  return (
    <group ref={groupRef}>
      {ISLAND_COINS.map((coin) => {
        if (collected.includes(coin.id)) return null
        return (
          <group key={coin.id} position={coin.position}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.38, 0.38, 0.12, 16]} />
              <meshStandardMaterial
                color="#ffd44d"
                emissive="#f59e0b"
                emissiveIntensity={0.28}
                roughness={0.28}
                metalness={0.35}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** Intro Ferry Boat gliding smoothly toward the Arrival Pier */
function CoastalFerryBoat() {
  const phase = useReplicaStore((s) => s.phase)
  const paletteIndex = useReplicaStore((s) => s.paletteIndex)
  const hat = useReplicaStore((s) => s.hat)
  const boatRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!boatRef.current) return
    const t = state.clock.elapsedTime
    if (phase === 'intro') {
      boatRef.current.position.set(
        Math.sin(t * 0.45) * 0.65,
        0.24 + Math.sin(t * 1.9) * 0.08,
        29.5 + Math.cos(t * 0.5) * 0.9,
      )
      boatRef.current.rotation.set(
        Math.sin(t * 1.5) * 0.025,
        Math.PI + Math.sin(t * 0.45) * 0.05,
        Math.cos(t * 1.6) * 0.03,
      )
    } else {
      // Gently docked beside the Arrival Pier
      boatRef.current.position.lerp(new THREE.Vector3(3.8, 0.22, 22.8), 0.03)
      boatRef.current.rotation.y = THREE.MathUtils.lerp(boatRef.current.rotation.y, Math.PI * 0.92, 0.03)
    }
  })

  return (
    <group ref={boatRef} position={[0, 0.24, 29.5]} rotation={[0, Math.PI, 0]}>
      {/* White Rounded Hull */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[2.3, 0.72, 5.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.45} />
      </mesh>
      {/* Navy Trim Stripe */}
      <mesh position={[0, 0.56, 0]}>
        <boxGeometry args={[2.36, 0.16, 5.26]} />
        <meshStandardMaterial color="#3b3777" roughness={0.5} />
      </mesh>
      {/* Warm Wooden Deck */}
      <mesh position={[0, 0.66, 0]}>
        <boxGeometry args={[2.0, 0.08, 4.7]} />
        <meshStandardMaterial color="#e8c396" roughness={0.8} />
      </mesh>
      {/* Mint Cabin */}
      <mesh position={[0, 1.25, -0.95]} castShadow>
        <boxGeometry args={[1.65, 1.15, 1.85]} />
        <meshStandardMaterial color="#02c6a7" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.92, -0.95]}>
        <boxGeometry args={[1.85, 0.18, 2.05]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      {/* Player standing on bow during intro */}
      {phase === 'intro' && (
        <group position={[0, 0.72, 1.25]}>
          <CoastalAvatar paletteIndex={paletteIndex} hat={hat} />
        </group>
      )}
    </group>
  )
}

/** Playable 3rd-person Character + Camera Rig (Intro Boat -> Walkable Island) */
function PlayableCharacterAndCamera({ dragRef }: { dragRef: React.MutableRefObject<DragInputRef> }) {
  const phase = useReplicaStore((s) => s.phase)
  const paletteIndex = useReplicaStore((s) => s.paletteIndex)
  const hat = useReplicaStore((s) => s.hat)
  const teleportTarget = useReplicaStore((s) => s.teleportTarget)
  const clearTeleport = useReplicaStore((s) => s.clearTeleport)
  const setPlayerPosition = useReplicaStore((s) => s.setPlayerPosition)
  const setNearbyLandmark = useReplicaStore((s) => s.setNearbyLandmark)
  const collectCoin = useReplicaStore((s) => s.collectCoin)
  const collectedCoins = useReplicaStore((s) => s.collectedCoins)
  const customizerOpen = useReplicaStore((s) => s.customizerOpen)
  const audioEnabled = useReplicaStore((s) => s.audioEnabled)

  const playerRef = useRef<THREE.Group>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const posRef = useRef(new THREE.Vector3(0, 0.85, 16.5))
  const rotYRef = useRef(Math.PI)
  const [isMoving, setIsMoving] = useState(false)
  const movingRef = useRef(false)
  const syncTimerRef = useRef(0)

  const { camera } = useThree()
  const camTarget = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      keysRef.current[e.code] = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    if (teleportTarget) {
      posRef.current.set(teleportTarget[0], getIslandHeight(teleportTarget[0], teleportTarget[2]), teleportTarget[2])
      if (playerRef.current) {
        playerRef.current.position.copy(posRef.current)
      }
      setPlayerPosition([posRef.current.x, posRef.current.y, posRef.current.z])
      clearTeleport()
    }
  }, [teleportTarget, clearTeleport, setPlayerPosition])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)

    if (phase === 'intro') {
      // Iconic Coastal World boat arrival camera framing
      const t = state.clock.elapsedTime
      camTarget.set(Math.sin(t * 0.22) * 2.4, 5.2, 38.8)
      lookTarget.set(0, 1.8, 12.0)
      camera.position.lerp(camTarget, 0.06)
      camera.lookAt(lookTarget)
      return
    }

    // Compute WASD / Arrow / Click-and-Drag movement vector
    let ix = 0
    let iz = 0
    const k = keysRef.current
    if (k.KeyW || k.ArrowUp) iz -= 1
    if (k.KeyS || k.ArrowDown) iz += 1
    if (k.KeyA || k.ArrowLeft) ix -= 1
    if (k.KeyD || k.ArrowRight) ix += 1

    if (dragRef.current.active) {
      ix += dragRef.current.dx
      iz += dragRef.current.dz
    }

    const mag = Math.hypot(ix, iz)
    const nowMoving = mag > 0.08
    if (nowMoving !== movingRef.current) {
      movingRef.current = nowMoving
      setIsMoving(nowMoving)
    }

    if (nowMoving) {
      const nx = ix / Math.max(1, mag)
      const nz = iz / Math.max(1, mag)
      const speed = 7.4
      const nextX = posRef.current.x + nx * speed * dt
      const nextZ = posRef.current.z + nz * speed * dt

      // Allow walking on main island OR down the wooden Arrival Pier
      const onPier = Math.abs(nextX) < 1.85 && nextZ >= 10.0 && nextZ <= 20.6
      const onIsland = Math.hypot(nextX, nextZ) <= 18.6

      if (onPier || onIsland) {
        posRef.current.x = nextX
        posRef.current.z = nextZ
      }

      const desiredAngle = Math.atan2(nx, nz)
      let diff = desiredAngle - rotYRef.current
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      rotYRef.current += diff * Math.min(1, dt * 11)
    }

    posRef.current.y = getIslandHeight(posRef.current.x, posRef.current.z)

    if (playerRef.current) {
      playerRef.current.position.copy(posRef.current)
      playerRef.current.rotation.y = rotYRef.current
    }

    // Smooth 3rd-person camera (zooms in closer when customizer bar is open!)
    if (customizerOpen) {
      camTarget.set(
        posRef.current.x + Math.sin(rotYRef.current) * 4.2,
        posRef.current.y + 1.9,
        posRef.current.z + Math.cos(rotYRef.current) * 4.2,
      )
      lookTarget.set(posRef.current.x, posRef.current.y + 0.9, posRef.current.z)
    } else {
      camTarget.set(posRef.current.x, posRef.current.y + 7.2, posRef.current.z + 11.4)
      lookTarget.set(posRef.current.x, posRef.current.y + 1.0, posRef.current.z - 0.6)
    }

    camera.position.lerp(camTarget, Math.min(1, dt * 4.8))
    camera.lookAt(lookTarget)

    // Coin collection check
    for (const coin of ISLAND_COINS) {
      if (collectedCoins.includes(coin.id)) continue
      const d = Math.hypot(
        posRef.current.x - coin.position[0],
        posRef.current.z - coin.position[2],
      )
      if (d < 1.55) {
        collectCoin(coin.id)
        if (audioEnabled) coastalAudio.playChime()
      }
    }

    // Throttled minimap position + landmark proximity check
    syncTimerRef.current += dt
    if (syncTimerRef.current > 0.14) {
      syncTimerRef.current = 0
      setPlayerPosition([posRef.current.x, posRef.current.y, posRef.current.z])

      let closestId: string | null = null
      let closestDist = 4.6
      for (const lm of COASTAL_LANDMARKS) {
        const d = Math.hypot(
          posRef.current.x - lm.teleportTo[0],
          posRef.current.z - lm.teleportTo[2],
        )
        if (d < closestDist) {
          closestDist = d
          closestId = lm.id
        }
      }
      setNearbyLandmark(closestId)
    }
  })

  if (phase === 'intro') return null

  return (
    <group ref={playerRef} position={[0, 0.85, 16.5]} rotation={[0, Math.PI, 0]}>
      <CoastalAvatar paletteIndex={paletteIndex} hat={hat} isMoving={isMoving} />
      {/* Soft shadow ring beneath feet */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 18]} />
        <meshBasicMaterial color="#3b3777" transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

export function CoastalIslandScene({
  dragRef,
}: {
  dragRef: React.MutableRefObject<DragInputRef>
}) {
  const timeOfDay = useReplicaStore((s) => s.timeOfDay)
  const pal = useMemo(() => getSkyPalette(timeOfDay), [timeOfDay])

  const skyMaterial = useMemo(() => createCoastalSkyMaterial(timeOfDay), [timeOfDay])
  const waterMaterial = useMemo(() => createCoastalOceanMaterial(timeOfDay), [timeOfDay])

  useEffect(() => {
    return () => {
      skyMaterial.dispose()
      waterMaterial.dispose()
    }
  }, [skyMaterial, waterMaterial])

  useFrame((state) => {
    if (waterMaterial.uniforms?.uTime) {
      waterMaterial.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <>
      <fog attach="fog" args={[pal.fog, 55, 175]} />

      {/* Coastal World 60 FPS Lighting Rig: Max 1 shadow-casting directionalLight */}
      <ambientLight intensity={pal.ambientIntensity} />
      <hemisphereLight args={[pal.hemiSky, pal.hemiGround, pal.hemiIntensity]} />
      <directionalLight
        position={[24, 34, 18]}
        intensity={pal.sunIntensity}
        color={pal.sunColor}
        castShadow
        shadow-mapSize={[1536, 1536]}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-camera-near={4}
        shadow-camera-far={95}
        shadow-bias={-0.0005}
      />

      {/* GLSL Sky Dome */}
      <mesh material={skyMaterial}>
        <sphereGeometry args={[170, 28, 20]} />
      </mesh>

      {/* GLSL Animated Turquoise Ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={waterMaterial}>
        <planeGeometry args={[320, 320, 64, 64]} />
      </mesh>

      {/* Terraced Pastel Coastal Island */}
      <group>
        {/* Warm Sandy Beach Base */}
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <cylinderGeometry args={[19.8, 21.8, 0.72, 42]} />
          <meshStandardMaterial color="#f8e3ba" roughness={0.92} />
        </mesh>

        {/* Lush Pastel Mint Grass Plateau */}
        <mesh position={[0, 0.52, 0]} receiveShadow>
          <cylinderGeometry args={[16.8, 18.6, 0.78, 42]} />
          <meshStandardMaterial color="#91e0b4" roughness={0.88} />
        </mesh>

        {/* Central Elevated Plaza Mound */}
        <mesh position={[0, 0.92, -1.5]} receiveShadow>
          <cylinderGeometry args={[7.4, 9.6, 0.58, 32]} />
          <meshStandardMaterial color="#a4e8c2" roughness={0.85} />
        </mesh>

        {/* Sandy Winding Ring Path */}
        <mesh position={[0, 0.94, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[8.4, 10.6, 40]} />
          <meshStandardMaterial color="#f7e7c4" roughness={0.95} />
        </mesh>
        {/* Connector path from Pier to Central Plaza */}
        <mesh position={[0, 0.95, 5.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.6, 10.5]} />
          <meshStandardMaterial color="#f7e7c4" roughness={0.95} />
        </mesh>
      </group>

      <InstancedCoastalNature />
      <CoastalLandmarksGroup />
      <CollectibleCoinsGroup />
      <CoastalFerryBoat />
      <PlayableCharacterAndCamera dragRef={dragRef} />
    </>
  )
}
