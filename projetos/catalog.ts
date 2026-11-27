import type { AgencyProject } from './types'

export const INITIAL_PROJECTS: AgencyProject[] = [
  {
    id: 'proj-frente-ray',
    code: 'RAY-01',
    name: 'Ambientação, Água, Luz & Estética (CEO Raynocas)',
    phase: 'Frente Ray',
    status: 'active',
    progress: 25,
    zone: 'criacao',
    assignedAgentIds: ['agent-luma', 'agent-vex'],
    stack: ['Luma', 'Vex', 'Shaders GLSL', 'Plantas & Luz', 'Personagens & Acessórios'],
    description:
      'CEO Raynocas com Luma e Vex: evoluir plantas, iluminação, qualidade da água, objetos da ilha, personagens, acessórios e estética geral.',
    deliverables: [
      { id: 'r1', title: 'Evoluir vegetação e plantas da ilha com variação visual em InstancedMesh', done: false },
      { id: 'r2', title: 'Aprimorar shader da água, espuma na costa e iluminação dia/dourado/noite', done: false },
      { id: 'r3', title: 'Elevar qualidade estética dos objetos, barcos, postes e mobiliário', done: false },
      { id: 'r4', title: 'Criar novos acessórios, expressões e estética para os personagens', done: false },
    ],
  },
  {
    id: 'proj-frente-kafu',
    code: 'KAFU-02',
    name: 'Edifícios, Interiores & Animações (CEO Kafuzinho)',
    phase: 'Frente Kafu',
    status: 'active',
    progress: 40,
    zone: 'b2b-lab',
    assignedAgentIds: ['agent-kael', 'agent-nori'],
    stack: ['Kael', 'Nori', 'Three.js', 'Hitboxes', 'Interiores & Animações'],
    description:
      'CEO Kafuzinho com Kael e Nori: construir novos edifícios, interiores caminháveis, física/hitboxes e animações dos personagens com o mundo e entre si.',
    deliverables: [
      { id: 'k1', title: 'Hitboxes e impacto físico nos objetos da ilha e interiores', done: true },
      { id: 'k2', title: 'Sede da Blequi unificada com todos os funcionários e colaboração entre agentes', done: true },
      { id: 'k3', title: 'Construir novos edifícios e interiores expansivos na ilha', done: false },
      { id: 'k4', title: 'Animações do personagem interagindo com objetos do mundo (sentar, café, portas)', done: false },
      { id: 'k5', title: 'Animações e diálogos vivos entre personagens na Sede da Blequi', done: false },
    ],
  },
  {
    id: 'proj-governanca-blequi',
    code: 'SEDE-03',
    name: 'Governança Local & Ecossistema Multi-IA',
    phase: 'Infraestrutura',
    status: 'active',
    progress: 100,
    zone: 'b2b-lab',
    assignedAgentIds: ['agent-nori', 'agent-kael', 'agent-luma', 'agent-vex'],
    stack: ['Gemini', 'OpenAI', 'Claude', 'OpenRouter', 'LAN / Tailscale'],
    description:
      'Acesso exclusivo dos CEOs Raynocas e Kafuzinho, persistência da posição na ilha e painel de chaves API multi-provedor.',
    deliverables: [
      { id: 'g1', title: 'Login simplificado exclusivo dos CEOs Raynocas e Kafuzinho', done: true },
      { id: 'g2', title: 'Registro de chaves API com logos salvos para múltiplas IAs', done: true },
      { id: 'g3', title: 'Persistência automática do local onde o personagem parou', done: true },
    ],
  },
]
