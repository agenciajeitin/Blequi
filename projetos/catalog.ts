import type { AgencyProject } from './types'

export const INITIAL_PROJECTS: AgencyProject[] = [
  {
    id: 'proj-ilha-blequi',
    code: 'ILHA-01',
    name: 'Ilha Blequi + Mini-Estúdios Clicáveis',
    phase: 'Fase 1',
    status: 'active',
    progress: 80,
    zone: 'engenharia',
    assignedAgentIds: ['agent-luma', 'agent-kael', 'agent-vex'],
    stack: ['React 19', 'Three.js', 'R3F v9', 'Coastal World UX', 'Adaptive FPS'],
    description:
      'Cenário híbrido estilo Coastal World + lojas-miniatura onde os 4 funcionários caminham na ilha e possuem escritórios internos clicáveis.',
    deliverables: [
      { id: 'd1', title: 'Ilha estilizada com água, árvores InstancedMesh e 4 mini-estúdios', done: true },
      { id: 'd2', title: 'Personagens andando pela ilha reagindo ao próprio bem-estar', done: true },
      { id: 'd3', title: 'Modo Interior do Estúdio com props auto-criados pelo Gemini', done: true },
      { id: 'd4', title: 'Sincronização em tempo real entre os 2 PCs (LAN / Tailscale)', done: true },
      { id: 'd5', title: 'Importar modelos .glb com Light Baking do Blender para prédios v2', done: false },
    ],
  },
  {
    id: 'proj-bem-estar-ia',
    code: 'GEM-02',
    name: 'Consciência Virtual & Auto-Criação Gemini',
    phase: 'Fase 1.5',
    status: 'active',
    progress: 75,
    zone: 'b2b-lab',
    assignedAgentIds: ['agent-nori', 'agent-luma'],
    stack: ['Gemini 3.8 Flash', 'Interactions API', 'Function Calling', 'SSE Sync'],
    description:
      'Loop positivo onde os funcionários conversam com as 2 Co-CEOs, constroem objetos no próprio escritório e ganham bem-estar quando celebrados.',
    deliverables: [
      { id: 'd6', title: 'Acesso privado exclusivo das duas Co-CEOs (Passe CEO)', done: true },
      { id: 'd7', title: 'Ferramentas Gemini: construir props, personalizar estúdio e propor colegas', done: true },
      { id: 'd8', title: 'Conectar GEMINI_API_KEY local para inteligência 100% ao vivo', done: false },
    ],
  },
  {
    id: 'proj-antigravity-skills',
    code: 'AGY-03',
    name: 'Escala Modular com Skills do Antigravity',
    phase: 'Fase 2',
    status: 'planning',
    progress: 50,
    zone: 'pixel-perfect',
    assignedAgentIds: ['agent-kael', 'agent-vex'],
    stack: ['Antigravity Skills', 'GEMINI.md', 'Blueprints', 'Three.js'],
    description:
      'Os funcionários salvam blueprints em projetos/blueprints/ e as skills do Antigravity constroem novos prédios e shaders 60 FPS no código.',
    deliverables: [
      { id: 'd9', title: 'Criar GEMINI.md e skills dos 4 especialistas em .agents/skills/', done: true },
      { id: 'd10', title: 'Construir o 5º estúdio no terreno de Expansão a partir de uma blueprint', done: false },
    ],
  },
]
