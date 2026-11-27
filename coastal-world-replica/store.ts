import { create } from 'zustand'
import { COASTAL_AVATAR_PALETTES } from '@ambiente/shaders/coastalShaders'
import type { WorldTimeOfDay } from '@funcionarios/types'

export type HatAccessory = 'none' | 'cap' | 'beanie' | 'crown' | 'headphones'
export type PhoneAppTab = 'map' | 'quests' | 'passport' | 'style'

export interface CoastalLandmark {
  id: string
  name: string
  subtitle: string
  emoji: string
  badgeColor: string
  position: [number, number, number]
  teleportTo: [number, number, number]
  npcName: string
  npcRole: string
  npcPaletteIndex: number
  dialogLines: string[]
  rewardCp: number
}

export const COASTAL_LANDMARKS: CoastalLandmark[] = [
  {
    id: 'pier',
    name: 'Arrival Pier',
    subtitle: 'Welcome Kiosk & Ferry Dock',
    emoji: '⛵',
    badgeColor: '#02c6a7',
    position: [0, 0.8, 17.5],
    teleportTo: [0, 0.8, 15.2],
    npcName: 'Captain Lou',
    npcRole: 'Harbor Welcome Guide',
    npcPaletteIndex: 2,
    dialogLines: [
      'Welcome to Coastal World! You arrived right on time with the morning ferry.',
      'Explore all 5 island districts, collect golden CP coins, and customize your style anytime from your phone!',
    ],
    rewardCp: 50,
  },
  {
    id: 'lighthouse',
    name: 'Beacon Lighthouse',
    subtitle: 'North Harbor & Sailboat Cove',
    emoji: '🗼',
    badgeColor: '#f2676f',
    position: [-14.5, 1.3, -9.5],
    teleportTo: [-11.5, 1.1, -7.2],
    npcName: 'Mina',
    npcRole: 'Lighthouse Keeper',
    npcPaletteIndex: 0,
    dialogLines: [
      'From up here you can see every boat crossing the turquoise bay.',
      'Try switching between Daylight, Golden Hour, and Coastal Dusk in the top-right corner!',
    ],
    rewardCp: 60,
  },
  {
    id: 'cafe',
    name: 'Surf & Sip Café',
    subtitle: 'Pastel Boardwalk & Espresso Bar',
    emoji: '☕',
    badgeColor: '#f6d35f',
    position: [13.5, 1.0, 5.5],
    teleportTo: [10.4, 0.9, 5.5],
    npcName: 'Theo',
    npcRole: 'Island Barista',
    npcPaletteIndex: 3,
    dialogLines: [
      'Nothing beats an iced matcha by the lagoon after a morning surf session.',
      'Grab the floating CP coins along the sandy path to unlock your full island passport!',
    ],
    rewardCp: 50,
  },
  {
    id: 'hub',
    name: 'Coastal Hub Pavilion',
    subtitle: 'Central Plaza & CP Vault',
    emoji: '🏛️',
    badgeColor: '#9e9bbe',
    position: [0, 1.35, -1.5],
    teleportTo: [0, 1.2, 3.2],
    npcName: 'Nova',
    npcRole: 'Coastal Concierge',
    npcPaletteIndex: 1,
    dialogLines: [
      'Welcome to the heart of Coastal World! Every district here was crafted for smooth 60 FPS exploration.',
      'Open your hand-held smartphone in the bottom-right corner to fast-travel anywhere on the island.',
    ],
    rewardCp: 75,
  },
  {
    id: 'overlook',
    name: 'Sunset Overlook',
    subtitle: 'Palm Terrace & Telescope Deck',
    emoji: '🔭',
    badgeColor: '#00b4ff',
    position: [12.5, 1.5, -11.5],
    teleportTo: [9.8, 1.3, -9.2],
    npcName: 'Kai',
    npcRole: 'Horizon Watcher',
    npcPaletteIndex: 4,
    dialogLines: [
      'Take a breath and watch the pastel clouds drift over the horizon.',
      'You earned a Sunset Overlook stamp in your Coastal Passport!',
    ],
    rewardCp: 65,
  },
]

export interface CollectibleCoin {
  id: string
  position: [number, number, number]
}

export const ISLAND_COINS: CollectibleCoin[] = [
  { id: 'c1', position: [0, 1.3, 12.2] },
  { id: 'c2', position: [0, 1.5, 7.2] },
  { id: 'c3', position: [6.8, 1.4, 5.8] },
  { id: 'c4', position: [10.2, 1.4, -1.2] },
  { id: 'c5', position: [7.6, 1.6, -7.8] },
  { id: 'c6', position: [-6.8, 1.5, -6.5] },
  { id: 'c7', position: [-10.5, 1.4, 1.5] },
  { id: 'c8', position: [-5.4, 1.4, 7.6] },
  { id: 'c9', position: [2.8, 1.7, -8.5] },
  { id: 'c10', position: [-12.2, 1.5, -4.2] },
]

export function syncDesignSystemAvatarTokens(paletteIndex: number) {
  if (typeof document === 'undefined') return
  const pal = COASTAL_AVATAR_PALETTES[paletteIndex] ?? COASTAL_AVATAR_PALETTES[4]
  const root = document.documentElement
  root.style.setProperty('--cw-avatar-body', pal.body)
  root.style.setProperty('--cw-avatar-phone', pal.phoneCase)
  root.style.setProperty('--cw-avatar-hand', pal.handColor)
  root.style.setProperty('--cw-avatar-face', pal.face)
}

interface ReplicaState {
  phase: 'intro' | 'playing'
  paletteIndex: number
  hat: HatAccessory
  timeOfDay: WorldTimeOfDay
  audioEnabled: boolean
  cp: number
  collectedCoins: string[]
  visitedLandmarks: string[]
  rewardedLandmarks: string[]
  customizedOnce: boolean

  playerPosition: [number, number, number]
  teleportTarget: [number, number, number] | null
  nearbyLandmarkId: string | null

  activeDialogLandmarkId: string | null
  dialogLineIndex: number

  phoneOpen: boolean
  phoneTab: PhoneAppTab
  customizerOpen: boolean
  menuOpen: boolean
  loginModalOpen: boolean
  toastMessage: string | null

  startJourney: () => void
  setPaletteIndex: (idx: number) => void
  setHat: (hat: HatAccessory) => void
  cycleTimeOfDay: () => void
  setTimeOfDay: (tod: WorldTimeOfDay) => void
  setAudioEnabled: (on: boolean) => void
  setPlayerPosition: (pos: [number, number, number]) => void
  requestTeleport: (pos: [number, number, number], landmarkId?: string) => void
  clearTeleport: () => void
  setNearbyLandmark: (id: string | null) => void
  collectCoin: (id: string) => void

  openDialog: (landmarkId: string) => void
  advanceDialog: () => void
  closeDialog: () => void

  openPhone: (tab?: PhoneAppTab) => void
  closePhone: () => void
  setPhoneTab: (tab: PhoneAppTab) => void
  toggleCustomizer: (open?: boolean) => void
  setMenuOpen: (open: boolean) => void
  setLoginModalOpen: (open: boolean) => void
  showToast: (msg: string) => void
  resetJourney: () => void
}

let toastTimer: number | null = null

export const useReplicaStore = create<ReplicaState>((set, get) => ({
  phase: 'intro',
  paletteIndex: 4, // Signature Berry by default (matches tokens.css)
  hat: 'cap',
  timeOfDay: 'daylight',
  audioEnabled: false,
  cp: 100,
  collectedCoins: [],
  visitedLandmarks: ['pier'],
  rewardedLandmarks: [],
  customizedOnce: false,

  playerPosition: [0, 0.85, 16.5],
  teleportTarget: null,
  nearbyLandmarkId: null,

  activeDialogLandmarkId: null,
  dialogLineIndex: 0,

  phoneOpen: false,
  phoneTab: 'map',
  customizerOpen: false,
  menuOpen: false,
  loginModalOpen: false,
  toastMessage: null,

  startJourney: () => {
    set({ phase: 'playing', loginModalOpen: false })
    get().showToast('⛵ Welcome to Coastal World! Explore & collect CP coins.')
  },

  setPaletteIndex: (idx) => {
    syncDesignSystemAvatarTokens(idx)
    const wasCustomized = get().customizedOnce
    set((s) => ({
      paletteIndex: idx,
      customizedOnce: true,
      cp: wasCustomized ? s.cp : s.cp + 25,
    }))
    if (!wasCustomized) {
      get().showToast('✨ Style Quest complete! +25 CP')
    }
  },

  setHat: (hat) => {
    const wasCustomized = get().customizedOnce
    set((s) => ({
      hat,
      customizedOnce: true,
      cp: wasCustomized ? s.cp : s.cp + 25,
    }))
    if (!wasCustomized) {
      get().showToast('✨ Style Quest complete! +25 CP')
    }
  },

  cycleTimeOfDay: () => {
    const order: WorldTimeOfDay[] = ['daylight', 'golden', 'dusk']
    const next = order[(order.indexOf(get().timeOfDay) + 1) % order.length]
    set({ timeOfDay: next })
    const labels: Record<WorldTimeOfDay, string> = {
      daylight: '☀️ Daylight Lagoon',
      golden: '🌅 Golden Hour',
      dusk: '🌙 Coastal Dusk',
    }
    get().showToast(labels[next])
  },

  setTimeOfDay: (tod) => set({ timeOfDay: tod }),

  setAudioEnabled: (on) => set({ audioEnabled: on }),

  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  requestTeleport: (pos, landmarkId) => {
    set((s) => ({
      teleportTarget: pos,
      phoneOpen: false,
      menuOpen: false,
      phase: 'playing',
      visitedLandmarks:
        landmarkId && !s.visitedLandmarks.includes(landmarkId)
          ? [...s.visitedLandmarks, landmarkId]
          : s.visitedLandmarks,
    }))
    if (landmarkId) {
      const lm = COASTAL_LANDMARKS.find((l) => l.id === landmarkId)
      if (lm) get().showToast(`${lm.emoji} Fast-traveled to ${lm.name}`)
    }
  },

  clearTeleport: () => set({ teleportTarget: null }),

  setNearbyLandmark: (id) => {
    const s = get()
    if (id && !s.visitedLandmarks.includes(id)) {
      const lm = COASTAL_LANDMARKS.find((l) => l.id === id)
      set({
        nearbyLandmarkId: id,
        visitedLandmarks: [...s.visitedLandmarks, id],
      })
      if (lm) {
        get().showToast(`🛂 Passport Stamp unlocked: ${lm.name}!`)
      }
    } else if (s.nearbyLandmarkId !== id) {
      set({ nearbyLandmarkId: id })
    }
  },

  collectCoin: (id) => {
    const s = get()
    if (s.collectedCoins.includes(id)) return
    const nextCoins = [...s.collectedCoins, id]
    set({
      collectedCoins: nextCoins,
      cp: s.cp + 20,
    })
    get().showToast(`🪙 +20 CP (${nextCoins.length}/${ISLAND_COINS.length} coins)`)
  },

  openDialog: (landmarkId) =>
    set({
      activeDialogLandmarkId: landmarkId,
      dialogLineIndex: 0,
      customizerOpen: false,
      phoneOpen: false,
    }),

  advanceDialog: () => {
    const s = get()
    if (!s.activeDialogLandmarkId) return
    const lm = COASTAL_LANDMARKS.find((l) => l.id === s.activeDialogLandmarkId)
    if (!lm) return
    if (s.dialogLineIndex < lm.dialogLines.length - 1) {
      set({ dialogLineIndex: s.dialogLineIndex + 1 })
    } else {
      const alreadyRewarded = s.rewardedLandmarks.includes(lm.id)
      set({
        activeDialogLandmarkId: null,
        dialogLineIndex: 0,
        rewardedLandmarks: alreadyRewarded
          ? s.rewardedLandmarks
          : [...s.rewardedLandmarks, lm.id],
        cp: alreadyRewarded ? s.cp : s.cp + lm.rewardCp,
      })
      if (!alreadyRewarded) {
        get().showToast(`🎉 ${lm.npcName} gifted you +${lm.rewardCp} CP!`)
      }
    }
  },

  closeDialog: () => set({ activeDialogLandmarkId: null, dialogLineIndex: 0 }),

  openPhone: (tab) =>
    set((s) => ({
      phoneOpen: true,
      phoneTab: tab ?? s.phoneTab,
      customizerOpen: false,
      menuOpen: false,
    })),

  closePhone: () => set({ phoneOpen: false }),

  setPhoneTab: (tab) => {
    if (tab === 'style') {
      set({ phoneOpen: false, customizerOpen: true, phoneTab: 'map' })
    } else {
      set({ phoneTab: tab })
    }
  },

  toggleCustomizer: (open) =>
    set((s) => ({
      customizerOpen: open ?? !s.customizerOpen,
      phoneOpen: false,
    })),

  setMenuOpen: (open) => set({ menuOpen: open, phoneOpen: false }),

  setLoginModalOpen: (open) => set({ loginModalOpen: open }),

  showToast: (msg) => {
    if (toastTimer) window.clearTimeout(toastTimer)
    set({ toastMessage: msg })
    toastTimer = window.setTimeout(() => {
      set({ toastMessage: null })
    }, 3200)
  },

  resetJourney: () => {
    set({
      phase: 'intro',
      cp: 100,
      collectedCoins: [],
      visitedLandmarks: ['pier'],
      rewardedLandmarks: [],
      customizedOnce: false,
      teleportTarget: [0, 0.85, 16.5],
      activeDialogLandmarkId: null,
      phoneOpen: false,
      customizerOpen: false,
      menuOpen: false,
    })
  },
}))
