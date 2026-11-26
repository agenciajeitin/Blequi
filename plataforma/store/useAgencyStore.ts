import { create } from 'zustand'
import type {
  AgencyUserProfile,
  AgentEmployee,
  AgentProviderId,
  AgentStatus,
  CoastalIntroStage,
  CoastalPhoneTab,
  MemberEntityType,
  NearbyInteractable,
  OnlineCeoPresence,
  PendingEmployeeProposal,
  PlayerAvatarConfig,
  RoomScaleId,
  SharedWorldState,
  SpeechBubbleState,
  StudioCameraMode,
  StudioZoneId,
  WorldCreationProp,
  WorldTimeOfDay,
  WorldViewMode,
} from '@funcionarios/types'
import { createInitialWorldState } from '@funcionarios/roster'
import { AGENT_PROVIDERS } from '@funcionarios/providers'
import { COASTAL_STUDIO_LOCATIONS } from '@ambiente/island/CoastalStudios'
import type { AgencyProject } from '@projetos/types'
import { INITIAL_PROJECTS } from '@projetos/catalog'

const STORAGE_KEY = 'blequi.agency.userProfile.v2'
const CEO_CODE_STORAGE_KEY = 'blequi.agency.ceoCode.v1'
const AVATAR_STORAGE_KEY = 'blequi.coastal.avatar.v1'

export type CameraPreset = 'overview' | StudioZoneId

export interface ServerMeta {
  geminiConfigured: boolean
  geminiModel: string
  usingDefaultCeoCode: boolean
  networkUrls: string[]
  onlineCeos: OnlineCeoPresence[]
  agentCount: number
  propCount: number
}

interface EntryInput {
  name: string
  entityType: MemberEntityType
  provider?: AgentProviderId
  role: string
  skills: string[]
  roomScale: RoomScaleId
  ceoSlot: 'ceo-1' | 'ceo-2'
  ceoCode: string
}

interface NewAgentInput {
  name: string
  entityType: MemberEntityType
  role: string
  zone: StudioZoneId
  provider?: AgentProviderId
  modelLabel?: string
  systemPrompt: string
  currentTask: string
  skills: string[]
}

export const DEFAULT_PLAYER_AVATAR: PlayerAvatarConfig = {
  colorIndex: 4, // Signature Coastal World berry-plum (#7b3759)
  faceStyle: 'lashes',
  headAccessory: 'headphones',
  bodyAccessory: 'fannypack',
  shoeStyle: 'sneakers',
}

/** Shared mutable world coordinates for zero-rerender 60 FPS player & minimap sync */
export const playerLiveTransform = {
  x: 0,
  y: 0.25,
  z: 22.8,
  rotationY: Math.PI, // Facing North (-Z) down the pier toward the Clocktower Plaza
  isMoving: false,
}

/** Separate walkable player transform inside Private Studios */
export const studioPlayerLiveTransform = {
  x: 0,
  y: 0,
  z: 5.5,
  rotationY: Math.PI, // Facing inward toward the studio interior
  isMoving: false,
}

interface AgencyState {
  currentUser: AgencyUserProfile | null
  ceoCode: string
  hasEnteredAgency: boolean
  introStage: CoastalIntroStage
  isCeoLoginOpen: boolean
  isStudioPickerOpen: boolean
  liveConnected: boolean
  liveFps: number
  serverMeta: ServerMeta | null

  worldView: WorldViewMode
  activeStudioZone: StudioZoneId
  timeOfDay: WorldTimeOfDay
  roomScale: RoomScaleId
  comfortScore: number
  allowSelfBuildWithoutApproval: boolean
  showFloorGrid: boolean
  cameraResetTick: number

  // Coastal World interactive HUD & player state
  playerAvatar: PlayerAvatarConfig
  studioCameraMode: StudioCameraMode
  isPhoneOpen: boolean
  phoneTab: CoastalPhoneTab
  isMenuOpen: boolean
  isCustomizerOpen: boolean
  soundEnabled: boolean
  hasMovedPlayer: boolean
  teleportTarget: [number, number, number] | null
  nearbyInteractable: NearbyInteractable | null
  speechBubble: SpeechBubbleState | null

  agents: AgentEmployee[]
  props: WorldCreationProp[]
  proposals: PendingEmployeeProposal[]
  onlineCeos: OnlineCeoPresence[]
  projects: AgencyProject[]

  selectedAgentId: string | null
  cameraPreset: CameraPreset
  isProjectsOpen: boolean
  isCreateModalOpen: boolean
  isSettingsOpen: boolean
  chatPendingByAgent: Record<string, boolean>
  toastMessage: string | null

  fetchServerMeta: () => Promise<void>
  enterAgency: (input: EntryInput) => Promise<{ ok: boolean; error?: string }>
  quickStartJourney: () => Promise<void>
  finishWelcomeIntro: () => void
  openEntryHud: () => void
  setCeoLoginOpen: (open: boolean) => void
  setStudioPickerOpen: (open: boolean) => void
  applySharedState: (shared: SharedWorldState) => void

  setPlayerAvatar: (avatar: PlayerAvatarConfig) => void
  setStudioCameraMode: (mode: StudioCameraMode) => void
  broadcastCeoMove: (pos: [number, number, number], rotationY: number, isMoving: boolean) => void
  setPhoneOpen: (open: boolean, tab?: CoastalPhoneTab) => void
  setPhoneTab: (tab: CoastalPhoneTab) => void
  setMenuOpen: (open: boolean) => void
  setCustomizerOpen: (open: boolean) => void
  toggleSound: () => void
  markPlayerMoved: () => void
  teleportPlayerTo: (pos: [number, number, number]) => void
  clearTeleportTarget: () => void
  setNearbyInteractable: (item: NearbyInteractable | null) => void
  setSpeechBubble: (bubble: SpeechBubbleState | null) => void

  setLiveFps: (fps: number) => void
  setWorldView: (view: WorldViewMode, zone?: StudioZoneId) => Promise<void>
  enterStudioZone: (zone: StudioZoneId) => Promise<void>
  returnToIsland: () => Promise<void>
  setTimeOfDay: (timeOfDay: WorldTimeOfDay) => Promise<void>
  setRoomScale: (scale: RoomScaleId) => Promise<void>
  setAutoBuildWithoutApproval: (value: boolean) => Promise<void>
  toggleFloorGrid: () => void
  resetCamera: () => void

  selectAgent: (id: string | null) => void
  setCameraPreset: (preset: CameraPreset) => void
  setProjectsOpen: (open: boolean) => void
  setCreateModalOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  showToast: (message: string) => void

  sendChatMessage: (agentId: string, message: string) => Promise<void>
  triggerSelfBuild: (agentId: string, customPrompt?: string) => Promise<void>
  rewardAgentOrProp: (opts: { agentId?: string; propId?: string; reason?: string }) => Promise<void>
  resolveProposal: (proposalId: string, approve: boolean) => Promise<void>

  updateAgentStatus: (id: string, status: AgentStatus) => Promise<void>
  updateAgentProvider: (id: string, provider: AgentProviderId) => Promise<void>
  assignTaskToAgent: (id: string, task: string) => Promise<void>
  createAgent: (input: NewAgentInput) => Promise<void>
  removeAgent: (id: string) => Promise<void>
  removeProp: (propId: string) => Promise<void>
  saveServerConfig: (payload: { geminiApiKey?: string; newCeoCode?: string }) => Promise<{ ok: boolean; error?: string }>
  toggleDeliverable: (projectId: string, deliverableId: string) => void
}

let activeEventSource: EventSource | null = null
let presenceTimer: ReturnType<typeof setInterval> | null = null
let toastTimer: ReturnType<typeof setTimeout> | null = null

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function loadSavedProfile(): AgencyUserProfile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AgencyUserProfile
    if (!parsed || typeof parsed.name !== 'string') return null
    if (parsed.provider && !(parsed.provider in AGENT_PROVIDERS)) {
      parsed.provider = 'gemini'
    }
    return parsed
  } catch {
    return null
  }
}

function loadSavedCeoCode(): string {
  try {
    return window.localStorage.getItem(CEO_CODE_STORAGE_KEY) || 'blequi-ceo'
  } catch {
    return 'blequi-ceo'
  }
}

function loadSavedAvatar(): PlayerAvatarConfig {
  try {
    const raw = window.localStorage.getItem(AVATAR_STORAGE_KEY)
    if (!raw) return DEFAULT_PLAYER_AVATAR
    const parsed = JSON.parse(raw) as Partial<PlayerAvatarConfig>
    return {
      colorIndex: typeof parsed.colorIndex === 'number' ? Math.max(0, Math.min(4, parsed.colorIndex)) : DEFAULT_PLAYER_AVATAR.colorIndex,
      faceStyle: parsed.faceStyle === 'classic' ? 'classic' : 'lashes',
      headAccessory: parsed.headAccessory ?? DEFAULT_PLAYER_AVATAR.headAccessory,
      bodyAccessory: parsed.bodyAccessory ?? DEFAULT_PLAYER_AVATAR.bodyAccessory,
      shoeStyle: parsed.shoeStyle ?? DEFAULT_PLAYER_AVATAR.shoeStyle,
    }
  } catch {
    return DEFAULT_PLAYER_AVATAR
  }
}

function persistProfile(profile: AgencyUserProfile, ceoCode: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    window.localStorage.setItem(CEO_CODE_STORAGE_KEY, ceoCode)
  } catch {
    // Ignore storage errors
  }
}

function persistAvatar(avatar: PlayerAvatarConfig) {
  try {
    window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatar))
  } catch {
    // Ignore storage errors
  }
}

const initialWorld = createInitialWorldState()

export const useAgencyStore = create<AgencyState>((set, get) => {
  const apiHeaders = () => ({
    'Content-Type': 'application/json',
    'x-blequi-ceo-code': get().ceoCode,
  })

  const startLiveSync = (ceoCode: string) => {
    if (typeof window === 'undefined') return
    if (activeEventSource) {
      activeEventSource.close()
      activeEventSource = null
    }
    if (presenceTimer) {
      clearInterval(presenceTimer)
      presenceTimer = null
    }

    const es = new EventSource(`/api/agency/events?code=${encodeURIComponent(ceoCode)}`)
    es.addEventListener('state', (evt) => {
      try {
        const shared = JSON.parse((evt as MessageEvent).data) as SharedWorldState
        get().applySharedState(shared)
        set({ liveConnected: true })
      } catch {
        // Ignore malformed frame
      }
    })
    // O servidor envia os passos das Co-CEOs como `ceo-move` (sem gravar em disco, ~4Hz)
    const onPresenceFrame = (evt: Event) => {
      try {
        const ceos = JSON.parse((evt as MessageEvent).data) as OnlineCeoPresence[]
        if (Array.isArray(ceos)) {
          set({ onlineCeos: ceos })
        }
      } catch {
        // Ignore malformed frame
      }
    }
    es.addEventListener('ceo-move', onPresenceFrame)
    es.addEventListener('presence', onPresenceFrame)
    es.onopen = () => {
      set({ liveConnected: true })
    }
    es.onerror = () => {
      set({ liveConnected: false })
    }
    activeEventSource = es

    presenceTimer = setInterval(() => {
      const state = get()
      if (!state.hasEnteredAgency || !state.currentUser) return
      fetch('/api/agency/presence', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          id: state.currentUser.id,
          name: state.currentUser.name,
          role: state.currentUser.role,
          ceoSlot: state.currentUser.ceoSlot || 'ceo-1',
          activeView: state.worldView,
          activeZone: state.activeStudioZone,
        }),
      }).catch(() => {})
    }, 25_000)
  }

  return {
    currentUser: typeof window !== 'undefined' ? loadSavedProfile() : null,
    ceoCode: typeof window !== 'undefined' ? loadSavedCeoCode() : 'blequi-ceo',
    hasEnteredAgency: false,
    introStage: 'boat',
    isCeoLoginOpen: false,
    isStudioPickerOpen: false,
    liveConnected: false,
    liveFps: 60,
    serverMeta: null,

    worldView: 'island',
    activeStudioZone: initialWorld.activeStudioZone,
    timeOfDay: 'daylight',
    roomScale: initialWorld.roomScale,
    comfortScore: initialWorld.comfortScore,
    allowSelfBuildWithoutApproval: initialWorld.allowSelfBuildWithoutApproval,
    showFloorGrid: false,
    cameraResetTick: 0,

    playerAvatar: typeof window !== 'undefined' ? loadSavedAvatar() : DEFAULT_PLAYER_AVATAR,
    studioCameraMode: 'walk',
    isPhoneOpen: false,
    phoneTab: 'map',
    isMenuOpen: false,
    isCustomizerOpen: false,
    soundEnabled: false,
    hasMovedPlayer: false,
    teleportTarget: null,
    nearbyInteractable: null,
    speechBubble: null,

    agents: initialWorld.agents,
    props: initialWorld.props,
    proposals: initialWorld.proposals,
    onlineCeos: initialWorld.onlineCeos,
    projects: INITIAL_PROJECTS,

    selectedAgentId: null,
    cameraPreset: 'overview',
    isProjectsOpen: false,
    isCreateModalOpen: false,
    isSettingsOpen: false,
    chatPendingByAgent: {},
    toastMessage: null,

    showToast: (message) => {
      if (toastTimer) clearTimeout(toastTimer)
      set({ toastMessage: message })
      toastTimer = setTimeout(() => set({ toastMessage: null }), 4200)
    },

    setLiveFps: (liveFps) => set({ liveFps }),

    setPlayerAvatar: (avatar) => {
      persistAvatar(avatar)
      set({ playerAvatar: avatar })
      const t = get().worldView === 'studio' ? studioPlayerLiveTransform : playerLiveTransform
      get().broadcastCeoMove([t.x, t.y, t.z], t.rotationY, false)
    },

    setStudioCameraMode: (studioCameraMode) => set({ studioCameraMode }),

    broadcastCeoMove: (pos, rotationY, isMoving) => {
      const state = get()
      if (!state.hasEnteredAgency || !state.currentUser) return
      fetch('/api/agency/ceo-move', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          id: state.currentUser.id,
          name: state.currentUser.name,
          role: state.currentUser.role,
          ceoSlot: state.currentUser.ceoSlot || 'ceo-1',
          activeView: state.worldView,
          activeZone: state.activeStudioZone,
          position: pos,
          rotationY,
          isMoving,
          avatar: state.playerAvatar,
        }),
      }).catch(() => {})
    },

    setPhoneOpen: (open, tab) =>
      set((s) => ({
        isPhoneOpen: open,
        phoneTab: tab ?? s.phoneTab,
        isMenuOpen: open ? false : s.isMenuOpen,
        isCustomizerOpen: open ? false : s.isCustomizerOpen,
      })),

    setPhoneTab: (phoneTab) => set({ phoneTab }),

    setMenuOpen: (open) =>
      set((s) => ({
        isMenuOpen: open,
        isPhoneOpen: open ? false : s.isPhoneOpen,
        isCustomizerOpen: open ? false : s.isCustomizerOpen,
      })),

    setCustomizerOpen: (open) =>
      set((s) => ({
        isCustomizerOpen: open,
        isPhoneOpen: open ? false : s.isPhoneOpen,
        isMenuOpen: open ? false : s.isMenuOpen,
        selectedAgentId: open ? null : s.selectedAgentId,
      })),

    toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    markPlayerMoved: () => {
      if (!get().hasMovedPlayer) set({ hasMovedPlayer: true })
    },
    teleportPlayerTo: (pos) =>
      set({
        worldView: 'island',
        teleportTarget: pos,
        isPhoneOpen: false,
        isMenuOpen: false,
      }),
    clearTeleportTarget: () => set({ teleportTarget: null }),
    setNearbyInteractable: (nearbyInteractable) => set({ nearbyInteractable }),
    setSpeechBubble: (speechBubble) => set({ speechBubble }),

    applySharedState: (shared) =>
      set((state) => ({
        // Keep each Co-CEO's view (island vs studio) local so SSE sync never yanks the camera away
        activeStudioZone: state.worldView === 'studio' ? state.activeStudioZone : shared.activeStudioZone,
        roomScale: shared.roomScale,
        timeOfDay: shared.timeOfDay ?? state.timeOfDay,
        comfortScore: shared.comfortScore,
        allowSelfBuildWithoutApproval: shared.allowSelfBuildWithoutApproval,
        agents: shared.agents,
        props: shared.props,
        proposals: shared.proposals,
        onlineCeos: shared.onlineCeos,
        selectedAgentId:
          state.selectedAgentId && shared.agents.some((a) => a.id === state.selectedAgentId)
            ? state.selectedAgentId
            : null, // funcionário removido pela outra Co-CEO: fecha o inspector
      })),

    fetchServerMeta: async () => {
      try {
        const res = await fetch('/api/agency/meta')
        if (!res.ok) return
        const meta = (await res.json()) as ServerMeta
        set({ serverMeta: meta, onlineCeos: meta.onlineCeos ?? [] })
      } catch {
        // Offline static preview fallback
      }
    },

    quickStartJourney: async () => {
      const saved = get().currentUser
      const code = get().ceoCode || 'blequi-ceo'
      const result = await get().enterAgency({
        name: saved?.name || 'Co-CEO Blequi',
        entityType: 'human',
        role: saved?.role || 'Co-CEO & Fundadora',
        skills: saved?.skills?.length ? saved.skills : ['Direção de Arte', 'Diorama 3D'],
        roomScale: get().roomScale,
        ceoSlot: saved?.ceoSlot || 'ceo-1',
        ceoCode: code,
      })
      if (result.ok) {
        set({ introStage: 'welcome', worldView: 'island', isCeoLoginOpen: false })
      } else {
        set({ isCeoLoginOpen: true })
      }
    },

    finishWelcomeIntro: () => {
      set({
        introStage: 'playing',
        hasEnteredAgency: true,
        worldView: 'island',
        speechBubble: null,
      })
    },

    enterAgency: async (input) => {
      const profile: AgencyUserProfile = {
        id: `ceo-${input.ceoSlot}`,
        name: input.name.trim(),
        entityType: input.entityType,
        provider: input.entityType === 'ai' ? input.provider ?? 'gemini' : undefined,
        role: input.role.trim(),
        skills: input.skills,
        joinedAt: nowTime(),
        isCeo: true,
        ceoSlot: input.ceoSlot,
      }

      try {
        const res = await fetch('/api/agency/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: profile.id,
            name: profile.name,
            role: profile.role,
            ceoSlot: input.ceoSlot,
            ceoCode: input.ceoCode.trim(),
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          return { ok: false, error: data.error || 'Chave CEO inválida.' }
        }

        persistProfile(profile, input.ceoCode.trim())
        set({
          currentUser: profile,
          ceoCode: input.ceoCode.trim(),
          hasEnteredAgency: true,
          isCeoLoginOpen: false,
          worldView: 'island',
          cameraPreset: 'overview',
        })
        if (data.state) {
          get().applySharedState({ ...(data.state as SharedWorldState), worldView: 'island' })
        }
        startLiveSync(input.ceoCode.trim())
        get().fetchServerMeta()
        return { ok: true }
      } catch {
        persistProfile(profile, input.ceoCode.trim())
        set({
          currentUser: profile,
          ceoCode: input.ceoCode.trim(),
          hasEnteredAgency: true,
          isCeoLoginOpen: false,
          worldView: 'island',
          roomScale: input.roomScale,
          cameraPreset: 'overview',
        })
        return { ok: true }
      }
    },

    openEntryHud: () => set({ isCeoLoginOpen: true, isMenuOpen: false }),
    setCeoLoginOpen: (isCeoLoginOpen) => set({ isCeoLoginOpen }),
    setStudioPickerOpen: (isStudioPickerOpen) =>
      set(isStudioPickerOpen ? { isStudioPickerOpen, isMenuOpen: false, isPhoneOpen: false } : { isStudioPickerOpen }),

    setWorldView: async (worldView, zone) => {
      const nextZone = zone ?? get().activeStudioZone
      set((state) => ({
        worldView,
        activeStudioZone: nextZone,
        isPhoneOpen: false,
        isMenuOpen: false,
        isCustomizerOpen: false,
        cameraResetTick: state.cameraResetTick + 1,
      }))
      try {
        const res = await fetch('/api/agency/patch', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ action: 'setWorldView', worldView, activeStudioZone: nextZone }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
      } catch {}
    },

    enterStudioZone: async (zone) => {
      set((state) => ({
        worldView: 'studio',
        activeStudioZone: zone,
        isStudioPickerOpen: false,
        selectedAgentId: null,
        nearbyInteractable: null,
        studioCameraMode: 'walk',
        isPhoneOpen: false,
        isMenuOpen: false,
        isCustomizerOpen: false,
        speechBubble: null,
        cameraResetTick: state.cameraResetTick + 1,
      }))
      get().broadcastCeoMove([0, 0, 4.8], Math.PI, false)
      try {
        const res = await fetch('/api/agency/patch', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ action: 'setWorldView', worldView: 'studio', activeStudioZone: zone }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
      } catch {}
    },

    returnToIsland: async () => {
      const prevZone = get().activeStudioZone
      const doorExit =
        prevZone !== 'editorial' && prevZone in COASTAL_STUDIO_LOCATIONS
          ? COASTAL_STUDIO_LOCATIONS[prevZone].teleportPoint
          : ([0, 0.26, 22.8] as [number, number, number])
      set((state) => ({
        worldView: 'island',
        selectedAgentId: null,
        nearbyInteractable: null,
        teleportTarget: doorExit,
        isPhoneOpen: false,
        isMenuOpen: false,
        isCustomizerOpen: false,
        cameraResetTick: state.cameraResetTick + 1,
      }))
      get().broadcastCeoMove(doorExit, 0, false)
      try {
        const res = await fetch('/api/agency/patch', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ action: 'setWorldView', worldView: 'island' }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
      } catch {}
    },

    setTimeOfDay: async (timeOfDay) => {
      set({ timeOfDay })
      try {
        const res = await fetch('/api/agency/patch', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ action: 'setTimeOfDay', timeOfDay }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
      } catch {}
    },

    setRoomScale: async (roomScale) => {
      set((state) => ({
        roomScale,
        cameraPreset: 'overview',
        cameraResetTick: state.cameraResetTick + 1,
      }))
      try {
        const res = await fetch('/api/agency/patch', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ action: 'setRoomScale', roomScale }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
      } catch {}
    },

    setAutoBuildWithoutApproval: async (value) => {
      set({ allowSelfBuildWithoutApproval: value })
      try {
        const res = await fetch('/api/agency/patch', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ action: 'setAutoBuild', value }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
      } catch {}
    },

    toggleFloorGrid: () => set((state) => ({ showFloorGrid: !state.showFloorGrid })),

    resetCamera: () =>
      set((state) => ({
        cameraPreset: 'overview',
        cameraResetTick: state.cameraResetTick + 1,
      })),

    selectAgent: (id) =>
      set((state) => {
        if (!id) return { selectedAgentId: null }
        const found = state.agents.find((a) => a.id === id)
        return {
          selectedAgentId: id,
          isPhoneOpen: false,
          isMenuOpen: false,
          cameraPreset: found ? found.zone : state.cameraPreset,
        }
      }),

    setCameraPreset: (preset) => set({ cameraPreset: preset }),
    setProjectsOpen: (open) =>
      set((s) => ({
        isProjectsOpen: open,
        isPhoneOpen: open ? true : s.isPhoneOpen,
        phoneTab: open ? 'projects' : s.phoneTab,
      })),
    setCreateModalOpen: (open) => set({ isCreateModalOpen: open, isMenuOpen: false, isPhoneOpen: false }),
    setSettingsOpen: (open) => set({ isSettingsOpen: open, isMenuOpen: false, isPhoneOpen: false }),

    sendChatMessage: async (agentId, message) => {
      const ceoName = get().currentUser?.name || 'Co-CEO'
      set((s) => ({ chatPendingByAgent: { ...s.chatPendingByAgent, [agentId]: true } }))
      try {
        const res = await fetch('/api/agency/chat', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ agentId, message, ceoName }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
        if (Array.isArray(data.actions) && data.actions.length > 0) {
          get().showToast(`✨ ${data.actions.join(' · ')}`)
        }
        if (!res.ok || data.ok === false) {
          get().showToast(`⚠️ ${data.error || 'O servidor não conseguiu responder agora.'}`)
        }
      } catch {
        get().showToast('⚠️ Sem conexão com o servidor local da Blequi.')
      } finally {
        set((s) => ({ chatPendingByAgent: { ...s.chatPendingByAgent, [agentId]: false } }))
      }
    },

    triggerSelfBuild: async (agentId, customPrompt) => {
      const ceoName = get().currentUser?.name || 'Co-CEO'
      set((s) => ({ chatPendingByAgent: { ...s.chatPendingByAgent, [agentId]: true } }))
      try {
        const res = await fetch('/api/agency/self-build', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ agentId, ceoName, prompt: customPrompt }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
        if (Array.isArray(data.actions) && data.actions.length > 0) {
          get().showToast(`🏗️ Auto-criação concluída: ${data.actions.join(' · ')}`)
        }
        if (!res.ok || data.ok === false) {
          get().showToast(`⚠️ ${data.error || 'O servidor não conseguiu responder agora.'}`)
        }
      } catch {
        get().showToast('⚠️ Sem conexão com o servidor local da Blequi.')
      } finally {
        set((s) => ({ chatPendingByAgent: { ...s.chatPendingByAgent, [agentId]: false } }))
      }
    },

    rewardAgentOrProp: async ({ agentId, propId, reason }) => {
      const ceoName = get().currentUser?.name || 'Co-CEO'
      const res = await fetch('/api/agency/reward', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ agentId, propId, reason, ceoName }),
      })
      const data = await res.json()
      if (data.state) get().applySharedState(data.state)
      get().showToast('💛 Recompensa positiva enviada! Bem-estar e conforto da ilha aumentaram.')
    },

    resolveProposal: async (proposalId, approve) => {
      const ceoName = get().currentUser?.name || 'Co-CEO'
      const res = await fetch('/api/agency/proposal', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ proposalId, approve, ceoName }),
      })
      const data = await res.json()
      if (data.state) get().applySharedState(data.state)
      get().showToast(
        approve
          ? '🎉 Novo funcionário aprovado e já caminhando pela Ilha Blequi!'
          : 'Proposta arquivada.'
      )
    },

    updateAgentStatus: async (id, status) => {
      const res = await fetch('/api/agency/patch', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ action: 'updateAgentStatus', agentId: id, status }),
      })
      const data = await res.json()
      if (data.state) get().applySharedState(data.state)
    },

    updateAgentProvider: async (id, provider) => {
      const res = await fetch('/api/agency/patch', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ action: 'updateAgentProvider', agentId: id, provider }),
      })
      const data = await res.json()
      if (data.state) get().applySharedState(data.state)
    },

    assignTaskToAgent: async (id, task) => {
      await get().sendChatMessage(id, task)
    },

    createAgent: async (input) => {
      const res = await fetch('/api/agency/patch', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ action: 'createAgent', input }),
      })
      const data = await res.json()
      if (data.state) {
        get().applySharedState(data.state)
        const last = (data.state as SharedWorldState).agents.at(-1)
        set({ selectedAgentId: last?.id ?? null, isCreateModalOpen: false })
        get().showToast(`✨ ${input.name} entrou na Ilha Blequi!`)
      }
    },

    removeAgent: async (id) => {
      const res = await fetch('/api/agency/patch', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ action: 'removeAgent', agentId: id }),
      })
      const data = await res.json()
      if (data.state) {
        get().applySharedState(data.state)
        set((s) => ({ selectedAgentId: s.selectedAgentId === id ? null : s.selectedAgentId }))
      }
    },

    removeProp: async (propId) => {
      const res = await fetch('/api/agency/patch', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ action: 'removeProp', propId }),
      })
      const data = await res.json()
      if (data.state) get().applySharedState(data.state)
    },

    saveServerConfig: async (payload) => {
      try {
        const res = await fetch('/api/agency/config-key', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          return { ok: false, error: data.error || 'Falha ao salvar configuração.' }
        }
        if (payload.newCeoCode && payload.newCeoCode.trim().length >= 4) {
          const nextCode = payload.newCeoCode.trim()
          set({ ceoCode: nextCode })
          if (get().currentUser) persistProfile(get().currentUser!, nextCode)
          startLiveSync(nextCode)
        }
        await get().fetchServerMeta()
        get().showToast('✅ Configuração salva localmente no servidor Blequi!')
        return { ok: true }
      } catch {
        return { ok: false, error: 'Não foi possível conectar ao servidor local.' }
      }
    },

    toggleDeliverable: (projectId, deliverableId) =>
      set((state) => ({
        projects: state.projects.map((proj) => {
          if (proj.id !== projectId) return proj
          const deliverables = proj.deliverables.map((d) =>
            d.id === deliverableId ? { ...d, done: !d.done } : d
          )
          const doneCount = deliverables.filter((d) => d.done).length
          const progress = Math.round((doneCount / Math.max(deliverables.length, 1)) * 100)
          return { ...proj, deliverables, progress }
        }),
      })),
  }
})
