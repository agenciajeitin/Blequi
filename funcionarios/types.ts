export type AgentProviderId =
  | 'opencode'
  | 'gemini'
  | 'antigravity'
  | 'claude'
  | 'codex'

export type MemberEntityType = 'human' | 'ai'

export type AgentStatus = 'working' | 'thinking' | 'reviewing' | 'idle' | 'vacant'

export type AgentMood = 'radiant' | 'inspired' | 'focused' | 'cozy' | 'tired'

export type RoomScaleId = 'compact' | 'medium' | 'large' | 'giant'

export type WorldViewMode = 'island' | 'studio'

export type WorldTimeOfDay = 'golden' | 'daylight' | 'dusk'

export type CoastalIntroStage = 'boat' | 'welcome' | 'playing'

export type CoastalPhoneTab = 'map' | 'studios' | 'wellbeing' | 'customize' | 'projects'

export type HeadAccessoryId = 'none' | 'headphones' | 'beanie' | 'sunhat' | 'crown' | 'visor'
export type BodyAccessoryId = 'fannypack' | 'backpack' | 'wings' | 'buoy' | 'none'
export type ShoeStyleId = 'sneakers' | 'boots' | 'sandals' | 'fast'

export interface PlayerAvatarConfig {
  colorIndex: number // 0..4 matching Coastal World 5 signature pastel palettes
  faceStyle: 'classic' | 'lashes'
  headAccessory: HeadAccessoryId
  bodyAccessory: BodyAccessoryId
  shoeStyle: ShoeStyleId
}

export type StudioCameraMode = 'walk' | 'orbit'

export interface NearbyInteractable {
  kind: 'agent' | 'studio' | 'prop' | 'exit'
  id: string
  label: string
  sublabel: string
  accentColor: string
  zone?: StudioZoneId
}

export interface SpeechBubbleState {
  speakerName: string
  role: string
  text: string
  accentColor: string
  agentId?: string
  studioZone?: StudioZoneId
}

export type StudioZoneId =
  | 'criacao'
  | 'pixel-perfect'
  | 'engenharia'
  | 'editorial'
  | 'b2b-lab'

export type WorldPropKind =
  | 'warm_lamp'
  | 'plant_pot'
  | 'coffee_bar'
  | 'mini_diorama_table'
  | 'holo_screen'
  | 'cozy_sofa'
  | 'garden_tree'
  | 'park_bench'
  | 'trophy_pedestal'
  | 'neon_sign'

export interface AgencyUserProfile {
  id: string
  name: string
  entityType: MemberEntityType
  provider?: AgentProviderId
  role: string
  skills: string[]
  joinedAt: string
  isCeo?: boolean
  ceoSlot?: 'ceo-1' | 'ceo-2'
}

export interface OnlineCeoPresence {
  id: string
  name: string
  role: string
  ceoSlot: 'ceo-1' | 'ceo-2'
  activeView: WorldViewMode
  activeZone?: StudioZoneId | null
  position?: [number, number, number]
  rotationY?: number
  isMoving?: boolean
  avatar?: PlayerAvatarConfig
  lastSeenAt: string
}

export interface AgentLogEntry {
  id: string
  time: string
  message: string
  kind?: 'info' | 'creation' | 'reward' | 'chat'
}

export interface AgentChatMessage {
  id: string
  sender: 'ceo' | 'agent' | 'system'
  senderName: string
  text: string
  time: string
  actions?: string[]
}

export interface AgentWellbeing {
  score: number // 0..100
  energy: number // 0..100
  pride: number // 0..100
  mood: AgentMood
  approvedCreations: number
  lastRewardReason?: string
}

export interface StudioThemeConfig {
  studioName: string
  tagline: string
  facadeColor: string
  roofAccent: string
  interiorGlow: string
  floorTone: 'oak' | 'sand' | 'slate'
}

export interface WorldCreationProp {
  id: string
  kind: WorldPropKind
  title: string
  description: string
  createdByAgentId: string
  createdByName: string
  placement: 'island' | 'studio'
  zone: StudioZoneId
  position: [number, number, number]
  rotationY: number
  color: string
  scale: number
  approved: boolean
  wellbeingBonus: number
  createdAt: string
}

export interface PendingEmployeeProposal {
  id: string
  proposedByAgentId: string
  proposedByName: string
  name: string
  role: string
  zone: StudioZoneId
  provider: AgentProviderId
  accentColor: string
  skills: string[]
  rationale: string
  createdAt: string
}

export interface AgentEmployee {
  id: string
  name: string
  entityType: MemberEntityType
  role: string
  zone: StudioZoneId
  provider?: AgentProviderId
  modelLabel: string
  status: AgentStatus
  currentTask: string
  systemPrompt: string
  skills: string[]
  accentColor: string
  deskPosition: [number, number, number]
  deskRotationY: number
  islandHome: [number, number, number]
  wellbeing: AgentWellbeing
  studioTheme: StudioThemeConfig
  memories: string[]
  chatHistory: AgentChatMessage[]
  lastInteractionId?: string
  logs: AgentLogEntry[]
}

export interface StudioZoneMeta {
  id: StudioZoneId
  name: string
  shortName: string
  subtitle: string
  color: string
  /** Normalized position inside the room (-0.5..0.5) so zones scale seamlessly as the room expands */
  normalizedCenter: [number, number]
  normalizedSize: [number, number]
  /** Position of the standalone miniature studio building on Coastal Blequi Island */
  islandPosition: [number, number, number]
  islandRotationY: number
  buildingStyle: 'apple-glass' | 'clay-garden' | 'tech-lab' | 'google-pavilion' | 'editorial-loft'
}

export interface RoomScaleMeta {
  id: RoomScaleId
  label: string
  dimensionsLabel: string
  size: number
  wallHeight: number
  modules: number
  description: string
}

export interface SharedWorldState {
  version: number
  worldView: WorldViewMode
  activeStudioZone: StudioZoneId
  timeOfDay: WorldTimeOfDay
  roomScale: RoomScaleId
  comfortScore: number
  allowSelfBuildWithoutApproval: boolean
  agents: AgentEmployee[]
  props: WorldCreationProp[]
  proposals: PendingEmployeeProposal[]
  onlineCeos: OnlineCeoPresence[]
  updatedAt: string
}
