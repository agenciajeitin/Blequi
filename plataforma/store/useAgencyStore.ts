import { create } from 'zustand'
import type {
  AgencyUserProfile,
  AgentEmployee,
  ChatAttachment,
  ChatGroup,
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
import type { ExternalAiProviderId, ExternalAiProviderStatus } from '@funcionarios/aiProvidersCatalog'
import { COASTAL_STUDIO_LOCATIONS } from '@ambiente/island/CoastalStudios'
import type { AgencyProject } from '@projetos/types'
import { INITIAL_PROJECTS } from '@projetos/catalog'

const STORAGE_KEY = 'blequi.agency.userProfile.v2'
const CEO_CODE_STORAGE_KEY = 'blequi.agency.ceoCode.v1'
const REMEMBER_CEO_STORAGE_KEY = 'blequi.agency.rememberCeo.v1'
const AVATAR_STORAGE_KEY = 'blequi.coastal.avatar.v1'
const PLAYER_POS_STORAGE_KEY = 'blequi.coastal.lastPosition.v1'

export type CameraPreset = 'overview' | StudioZoneId

export interface ServerMeta {
  geminiConfigured: boolean
  geminiModel: string
  usingDefaultCeoCode: boolean
  networkUrls: string[]
  onlineCeos: OnlineCeoPresence[]
  agentCount: number
  propCount: number
  aiProviders?: ExternalAiProviderStatus[]
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
  rememberPassword?: boolean
}

interface NewAgentInput {
  name: string
  entityType: MemberEntityType
  role: string
  zone: StudioZoneId
  provider?: AgentProviderId
  modelLabel?: string
  apiKey?: string
  model?: string
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

function loadSavedPlayerPosition(): { x: number; y: number; z: number; rotationY: number } {
  const fallback = { x: 0, y: 0.26, z: 22.8, rotationY: Math.PI }
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(PLAYER_POS_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<{ x: number; y: number; z: number; rotationY: number }>
    if (
      typeof parsed.x === 'number' &&
      Number.isFinite(parsed.x) &&
      typeof parsed.y === 'number' &&
      Number.isFinite(parsed.y) &&
      typeof parsed.z === 'number' &&
      Number.isFinite(parsed.z)
    ) {
      return {
        x: Math.max(-22, Math.min(22, parsed.x)),
        y: Math.max(0.2, Math.min(3, parsed.y)),
        z: Math.max(-16, Math.min(25.5, parsed.z)),
        rotationY: typeof parsed.rotationY === 'number' && Number.isFinite(parsed.rotationY) ? parsed.rotationY : Math.PI,
      }
    }
    return fallback
  } catch {
    return fallback
  }
}

export function persistPlayerIslandPosition(x: number, y: number, z: number, rotationY: number) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      PLAYER_POS_STORAGE_KEY,
      JSON.stringify({
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3)),
        z: Number(z.toFixed(3)),
        rotationY: Number(rotationY.toFixed(3)),
      })
    )
  } catch {
    // Ignore storage errors
  }
}

const initialSavedPos = loadSavedPlayerPosition()

/** Shared mutable world coordinates for zero-rerender 60 FPS player & minimap sync */
export const playerLiveTransform = {
  x: initialSavedPos.x,
  y: initialSavedPos.y,
  z: initialSavedPos.z,
  rotationY: initialSavedPos.rotationY,
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
  rememberPassword: boolean
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
  groups: ChatGroup[]
  /** Conversa aberta no app de mensagens do celular */
  activeThread: { kind: 'group' | 'agent'; id: string } | null
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
  tryAutoLogin: () => Promise<boolean>
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

  sendChatMessage: (agentId: string, message: string, attachments?: ChatAttachment[]) => Promise<void>
  uploadAttachment: (file: File) => Promise<ChatAttachment | null>
  attachmentUrl: (att: ChatAttachment) => string
  setActiveThread: (thread: { kind: 'group' | 'agent'; id: string } | null) => void
  createGroup: (input: { name: string; category: string; memberAgentIds: string[] }) => Promise<string | null>
  updateGroup: (groupId: string, patch: { name?: string; category?: string; memberAgentIds?: string[] }) => Promise<void>
  deleteGroup: (groupId: string) => Promise<void>
  sendGroupMessage: (groupId: string, message: string, attachments?: ChatAttachment[]) => Promise<void>
  triggerSelfBuild: (agentId: string, customPrompt?: string) => Promise<void>
  rewardAgentOrProp: (opts: { agentId?: string; propId?: string; reason?: string }) => Promise<void>
  resolveProposal: (proposalId: string, approve: boolean) => Promise<void>

  updateAgentStatus: (id: string, status: AgentStatus) => Promise<void>
  updateAgentProvider: (id: string, provider: AgentProviderId) => Promise<void>
  assignTaskToAgent: (id: string, task: string) => Promise<void>
  createAgent: (input: NewAgentInput) => Promise<void>
  removeAgent: (id: string) => Promise<void>
  removeProp: (propId: string) => Promise<void>
  saveServerConfig: (payload: {
    providerId?: ExternalAiProviderId
    apiKey?: string
    model?: string
    baseUrl?: string
    geminiApiKey?: string
    newCeoCode?: string
  }) => Promise<{ ok: boolean; error?: string }>
  testProviderConfig: (payload: {
    providerId: ExternalAiProviderId
    apiKey?: string
    baseUrl?: string
  }) => Promise<{ ok: boolean; message?: string; error?: string; models?: string[] }>
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

function loadRememberPassword(): boolean {
  try {
    const raw = window.localStorage.getItem(REMEMBER_CEO_STORAGE_KEY)
    if (raw === '0') return false
    if (raw === '1') return true
    return Boolean(window.localStorage.getItem(CEO_CODE_STORAGE_KEY))
  } catch {
    return false
  }
}

function loadSavedCeoCode(): string {
  try {
    if (!loadRememberPassword()) return ''
    return window.localStorage.getItem(CEO_CODE_STORAGE_KEY) || ''
  } catch {
    return ''
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

function persistProfile(profile: AgencyUserProfile, ceoCode: string, rememberPassword = true) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    window.localStorage.setItem(REMEMBER_CEO_STORAGE_KEY, rememberPassword ? '1' : '0')
    if (rememberPassword && ceoCode) {
      window.localStorage.setItem(CEO_CODE_STORAGE_KEY, ceoCode)
    } else {
      window.localStorage.removeItem(CEO_CODE_STORAGE_KEY)
    }
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

    // Batimento de presença com a posição atual: a outra CEO vê você mesmo se você estiver parada
    const sendPresence = () => {
      const state = get()
      if (!state.hasEnteredAgency || !state.currentUser) return
      const t = state.worldView === 'studio' ? studioPlayerLiveTransform : playerLiveTransform
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
          position: [t.x, t.y, t.z],
          rotationY: t.rotationY,
          isMoving: t.isMoving,
          avatar: state.playerAvatar,
        }),
      }).catch(() => {})
    }
    setTimeout(sendPresence, 1500)
    presenceTimer = setInterval(sendPresence, 10_000)
  }

  return {
    currentUser: typeof window !== 'undefined' ? loadSavedProfile() : null,
    ceoCode: typeof window !== 'undefined' ? loadSavedCeoCode() : '',
    rememberPassword: typeof window !== 'undefined' ? loadRememberPassword() : true,
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
    phoneTab: 'messages',
    isMenuOpen: false,
    isCustomizerOpen: false,
    soundEnabled: false,
    hasMovedPlayer: false,
    teleportTarget: null,
    nearbyInteractable: null,
    speechBubble: null,

    agents: initialWorld.agents,
    groups: initialWorld.groups,
    activeThread: null,
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
        groups: Array.isArray(shared.groups) ? shared.groups : [],
        activeThread:
          state.activeThread?.kind === 'group' &&
          !(shared.groups ?? []).some((g) => g.id === state.activeThread?.id)
            ? null
            : state.activeThread,
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

    tryAutoLogin: async () => {
      const state = get()
      if (state.hasEnteredAgency) return true
      if (!state.rememberPassword || !state.currentUser?.name || !state.ceoCode) {
        return false
      }
      const res = await state.enterAgency({
        name: state.currentUser.name,
        entityType: 'human',
        role: state.currentUser.role || 'CEO',
        skills: state.currentUser.skills?.length ? state.currentUser.skills : ['Ilha Blequi'],
        roomScale: state.roomScale,
        ceoSlot: state.currentUser.ceoSlot || 'ceo-1',
        ceoCode: state.ceoCode,
        rememberPassword: true,
      })
      if (res.ok) {
        set({ introStage: 'playing', hasEnteredAgency: true, isCeoLoginOpen: false })
        return true
      }
      return false
    },

    quickStartJourney: async () => {
      const saved = get().currentUser
      // Navegador novo (ex.: PC do Kafuzinho): pede o login em vez de entrar como Raynocas por engano
      if (!saved?.name) {
        set({ isCeoLoginOpen: true })
        return
      }
      const code = get().ceoCode || 'blequi-ceo'
      const result = await get().enterAgency({
        name: saved.name,
        entityType: 'human',
        role: saved.role || 'CEO',
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
      const t = playerLiveTransform
      get().broadcastCeoMove([t.x, t.y, t.z], t.rotationY, false)
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
          return { ok: false, error: data.error || 'Login ou senha inválidos.' }
        }

        const resolvedProfile: AgencyUserProfile = data.ceo
          ? {
              ...profile,
              id: `ceo-${data.ceo.slot}`,
              name: data.ceo.name,
              role: data.ceo.role,
              ceoSlot: data.ceo.slot,
            }
          : profile

        const shouldRemember = input.rememberPassword ?? get().rememberPassword
        persistProfile(resolvedProfile, input.ceoCode.trim(), shouldRemember)
        set({
          currentUser: resolvedProfile,
          ceoCode: input.ceoCode.trim(),
          rememberPassword: shouldRemember,
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
        const normalized = input.name
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        if (
          normalized !== 'raynocas' &&
          normalized !== 'ray' &&
          normalized !== 'kafuzinho' &&
          normalized !== 'kafu' &&
          normalized !== 'kafuzin'
        ) {
          return {
            ok: false,
            error: 'Login não reconhecido. Apenas os CEOs Raynocas e Kafuzinho podem entrar.',
          }
        }
        const isKafu = normalized === 'kafuzinho' || normalized === 'kafu' || normalized === 'kafuzin'
        const resolvedProfile: AgencyUserProfile = {
          ...profile,
          id: isKafu ? 'ceo-ceo-2' : 'ceo-ceo-1',
          name: isKafu ? 'Kafuzinho' : 'Raynocas',
          role: isKafu ? 'CEO · Edifícios & Animações' : 'CEO · Ambientação & Estética',
          ceoSlot: isKafu ? 'ceo-2' : 'ceo-1',
        }
        const shouldRemember = input.rememberPassword ?? get().rememberPassword
        persistProfile(resolvedProfile, input.ceoCode.trim(), shouldRemember)
        set({
          currentUser: resolvedProfile,
          ceoCode: input.ceoCode.trim(),
          rememberPassword: shouldRemember,
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
      set({
        worldView,
        activeStudioZone: nextZone,
        isPhoneOpen: false,
        isMenuOpen: false,
        isCustomizerOpen: false,
      })
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
      set({
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
      })
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
          : ([playerLiveTransform.x, playerLiveTransform.y, playerLiveTransform.z] as [number, number, number])
      persistPlayerIslandPosition(doorExit[0], doorExit[1], doorExit[2], 0)
      set({
        worldView: 'island',
        selectedAgentId: null,
        nearbyInteractable: null,
        teleportTarget: doorExit,
        isPhoneOpen: false,
        isMenuOpen: false,
        isCustomizerOpen: false,
      })
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

    sendChatMessage: async (agentId, message, attachments) => {
      const ceoName = get().currentUser?.name || 'CEO'
      const ceoSlot = get().currentUser?.ceoSlot
      set((s) => ({ chatPendingByAgent: { ...s.chatPendingByAgent, [agentId]: true } }))
      try {
        const res = await fetch('/api/agency/chat', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ agentId, message, ceoName, ceoSlot, attachments }),
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

    uploadAttachment: async (file) => {
      if (file.size > 15 * 1024 * 1024) {
        get().showToast(`⚠️ "${file.name}" passa de 15 MB.`)
        return null
      }
      try {
        const dataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        })
        const res = await fetch('/api/agency/upload', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            dataBase64,
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          get().showToast(`⚠️ ${data.error || 'Não consegui enviar o arquivo.'}`)
          return null
        }
        return data.attachment as ChatAttachment
      } catch {
        get().showToast('⚠️ Sem conexão para enviar o arquivo.')
        return null
      }
    },

    attachmentUrl: (att) => `${att.url}?code=${encodeURIComponent(get().ceoCode)}`,

    setActiveThread: (activeThread) => set({ activeThread }),

    createGroup: async (input) => {
      try {
        const res = await fetch('/api/agency/groups', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ action: 'create', ceoName: get().currentUser?.name || 'CEO', ...input }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
        if (!res.ok || !data.ok) {
          get().showToast(`⚠️ ${data.error || 'Não consegui criar o grupo.'}`)
          return null
        }
        return String(data.groupId)
      } catch {
        get().showToast('⚠️ Sem conexão com o servidor local da Blequi.')
        return null
      }
    },

    updateGroup: async (groupId, patch) => {
      try {
        const res = await fetch('/api/agency/groups', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ action: 'update', groupId, ceoName: get().currentUser?.name || 'CEO', ...patch }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
      } catch {
        get().showToast('⚠️ Sem conexão com o servidor local da Blequi.')
      }
    },

    deleteGroup: async (groupId) => {
      try {
        const res = await fetch('/api/agency/groups', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({ action: 'delete', groupId }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
        set((s) => ({ activeThread: s.activeThread?.id === groupId ? null : s.activeThread }))
      } catch {
        get().showToast('⚠️ Sem conexão com o servidor local da Blequi.')
      }
    },

    sendGroupMessage: async (groupId, message, attachments) => {
      const user = get().currentUser
      try {
        const res = await fetch('/api/agency/group-message', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({
            groupId,
            message,
            attachments,
            ceoName: user?.name || 'CEO',
            ceoSlot: user?.ceoSlot,
          }),
        })
        const data = await res.json()
        if (data.state) get().applySharedState(data.state)
        if (!res.ok || data.ok === false) {
          get().showToast(`⚠️ ${data.error || 'Não consegui enviar no grupo.'}`)
        }
      } catch {
        get().showToast('⚠️ Sem conexão com o servidor local da Blequi.')
      }
    },

    triggerSelfBuild: async (agentId, customPrompt) => {
      const ceoName = get().currentUser?.name || 'CEO'
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
      const ceoName = get().currentUser?.name || 'CEO'
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
      const ceoName = get().currentUser?.name || 'CEO'
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
        if (input.apiKey || input.model) {
          void get().fetchServerMeta()
        }
        get().showToast(`✨ ${input.name} entrou na Sede da Blequi pronto(a) para responder!`)
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

    testProviderConfig: async (payload) => {
      try {
        const res = await fetch('/api/agency/test-provider', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        return data
      } catch {
        return { ok: false, error: 'Erro ao testar conexão com o servidor local.' }
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
