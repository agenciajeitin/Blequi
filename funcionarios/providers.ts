import type {
  AgentProviderId,
  RoomScaleId,
  RoomScaleMeta,
  StudioZoneId,
  StudioZoneMeta,
  WorldPropKind,
} from './types'

export interface ProviderConfig {
  id: AgentProviderId
  name: string
  badge: string
  description: string
  color: string
  defaultModel: string
  endpointHint: string
}

export const AGENT_PROVIDERS: Record<AgentProviderId, ProviderConfig> = {
  opencode: {
    id: 'opencode',
    name: 'OpenCode',
    badge: 'OPC',
    description: 'Agente CLI veloz para engenharia de código, refatoração e UI.',
    color: '#10b981',
    defaultModel: 'OpenCode Runtime',
    endpointHint: 'opencode://cli-bridge',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    badge: 'GEM',
    description: 'Raciocínio multimodal, diálogo vivo no mundo 3D, arte e auto-criação.',
    color: '#3b82f6',
    defaultModel: 'gemini-3.8-flash',
    endpointHint: 'gemini://interactions-api',
  },
  antigravity: {
    id: 'antigravity',
    name: 'Antigravity',
    badge: 'AGY',
    description: 'Orquestração autônoma full-stack, cenários WebGL/R3F e skills locais.',
    color: '#6366f1',
    defaultModel: 'Antigravity + gemini-3.8-flash',
    endpointHint: 'antigravity://workspace-skills',
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    badge: 'CLD',
    description: 'Arquitetura limpa, escrita técnica precisa e revisão profunda.',
    color: '#e07a3f',
    defaultModel: 'Claude Sonnet / Opus',
    endpointHint: 'claude://api-runtime',
  },
  codex: {
    id: 'codex',
    name: 'OpenAI',
    badge: 'OAI',
    description: 'Modelos OpenAI GPT / Codex com execução de ferramentas e código.',
    color: '#10a37f',
    defaultModel: 'gpt-4.1',
    endpointHint: 'openai://chat-completions',
  },
}

export const PROVIDER_ORDER: AgentProviderId[] = [
  'antigravity',
  'opencode',
  'codex',
  'claude',
]

export const ROOM_SCALES: Record<RoomScaleId, RoomScaleMeta> = {
  compact: {
    id: 'compact',
    label: 'Pequena',
    dimensionsLabel: '12 × 12m',
    size: 12,
    wallHeight: 5.9,
    modules: 1,
    description: 'Estúdio inicial enxuto para começar a operação.',
  },
  medium: {
    id: 'medium',
    label: 'Média',
    dimensionsLabel: '18 × 18m',
    size: 18,
    wallHeight: 6.3,
    modules: 2,
    description: 'Planta expandida para múltiplas ilhas de trabalho.',
  },
  large: {
    id: 'large',
    label: 'Grande',
    dimensionsLabel: '28 × 28m',
    size: 28,
    wallHeight: 6.9,
    modules: 3,
    description: 'Sede completa com alas dedicadas por disciplina.',
  },
  giant: {
    id: 'giant',
    label: 'Gigante',
    dimensionsLabel: '42 × 42m',
    size: 42,
    wallHeight: 7.6,
    modules: 5,
    description: 'Campus operacional em escala máxima sem perder performance.',
  },
}

export const ROOM_SCALE_ORDER: RoomScaleId[] = [
  'compact',
  'medium',
  'large',
  'giant',
]

export const ROLE_PRESETS: string[] = [
  'CEO · Ambientação & Estética',
  'CEO · Edifícios & Animações',
  'Diretor de Arte 3D',
  'Creative Developer WebGL',
  'Technical Artist (FPS)',
  'Curadora do Mundo Vivo',
  'Engenheiro Full-Stack',
  'Product Designer',
]

export const SKILL_PRESETS: string[] = [
  'Three.js',
  'React Three Fiber',
  'Diorama 3D',
  'Baked Lighting',
  'Coastal World UX',
  'Shaders GLSL',
  'Gemini API',
  'Antigravity Skills',
  'Design System',
  'TypeScript',
  'Direção de Arte',
  'Otimização 60 FPS',
]

export const PROP_CATALOG: Record<
  WorldPropKind,
  { label: string; defaultColor: string; wellbeingBonus: number; placementHint: 'studio' | 'island' }
> = {
  warm_lamp: {
    label: 'Luminária Quente',
    defaultColor: '#fbbf24',
    wellbeingBonus: 8,
    placementHint: 'studio',
  },
  plant_pot: {
    label: 'Vaso Botânico',
    defaultColor: '#34d399',
    wellbeingBonus: 7,
    placementHint: 'studio',
  },
  coffee_bar: {
    label: 'Cantinho do Café',
    defaultColor: '#d97706',
    wellbeingBonus: 11,
    placementHint: 'studio',
  },
  mini_diorama_table: {
    label: 'Mesa de Maquete 3D',
    defaultColor: '#60a5fa',
    wellbeingBonus: 12,
    placementHint: 'studio',
  },
  holo_screen: {
    label: 'Tela Criativa',
    defaultColor: '#818cf8',
    wellbeingBonus: 9,
    placementHint: 'studio',
  },
  cozy_sofa: {
    label: 'Poltrona Lounge',
    defaultColor: '#f472b6',
    wellbeingBonus: 10,
    placementHint: 'studio',
  },
  garden_tree: {
    label: 'Árvore Diorama',
    defaultColor: '#4ade80',
    wellbeingBonus: 9,
    placementHint: 'island',
  },
  park_bench: {
    label: 'Banco da Praça',
    defaultColor: '#c08457',
    wellbeingBonus: 8,
    placementHint: 'island',
  },
  trophy_pedestal: {
    label: 'Pedestal de Conquista',
    defaultColor: '#facc15',
    wellbeingBonus: 14,
    placementHint: 'studio',
  },
  neon_sign: {
    label: 'Letreiro Luminoso',
    defaultColor: '#38bdf8',
    wellbeingBonus: 9,
    placementHint: 'studio',
  },
}

export const STUDIO_ZONES: Record<StudioZoneId, StudioZoneMeta> = {
  criacao: {
    id: 'criacao',
    name: 'Estúdio Luma · Arte & Dioramas',
    shortName: 'Criação',
    subtitle: 'Direção de arte, paletas aconchegantes e maquetes estilizadas',
    color: '#f97316',
    normalizedCenter: [-0.24, -0.22],
    normalizedSize: [0.36, 0.34],
    islandPosition: [-6.8, 0, -5.2],
    islandRotationY: 0.25,
    buildingStyle: 'clay-garden',
  },
  engenharia: {
    id: 'engenharia',
    name: 'Estúdio Kael · WebGL & Mundos',
    shortName: 'Engenharia',
    subtitle: 'Three.js, R3F, shaders leves e interações da ilha',
    color: '#6366f1',
    normalizedCenter: [-0.24, 0.22],
    normalizedSize: [0.36, 0.34],
    islandPosition: [6.8, 0, -5.0],
    islandRotationY: -0.25,
    buildingStyle: 'apple-glass',
  },
  'pixel-perfect': {
    id: 'pixel-perfect',
    name: 'Lab Vex · Performance & 60 FPS',
    shortName: 'Performance',
    subtitle: 'Baked lighting, InstancedMesh e qualidade adaptativa',
    color: '#0ea5e9',
    normalizedCenter: [0.22, -0.22],
    normalizedSize: [0.38, 0.34],
    islandPosition: [-6.6, 0, 5.4],
    islandRotationY: -0.18,
    buildingStyle: 'tech-lab',
  },
  'b2b-lab': {
    id: 'b2b-lab',
    name: 'Sede da Blequi',
    shortName: 'Sede da Blequi',
    subtitle: 'Edifício central da equipe Blequi e dos CEOs Raynocas & Kafuzinho',
    color: '#de6c80',
    normalizedCenter: [0, 0],
    normalizedSize: [0.22, 0.22],
    islandPosition: [6.4, 0, 5.2],
    islandRotationY: 0.22,
    buildingStyle: 'google-pavilion',
  },
  editorial: {
    id: 'editorial',
    name: 'Mirante Editorial · Expansão',
    shortName: 'Expansão',
    subtitle: 'Terreno livre na ilha pronto para novos estúdios criados pela equipe',
    color: '#eab308',
    normalizedCenter: [0.22, 0.22],
    normalizedSize: [0.38, 0.34],
    islandPosition: [0, 0, -8.8],
    islandRotationY: 0,
    buildingStyle: 'editorial-loft',
  },
}
