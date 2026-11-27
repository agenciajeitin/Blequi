import { useEffect, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Cpu,
  Heart,
  MessageSquare,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'
import {
  AGENT_PROVIDERS,
  PROP_CATALOG,
  STUDIO_ZONES,
} from '@funcionarios/providers'
import { agentProviderToExternal, getActiveAgentProviders } from '@funcionarios/sede'
import type { AgentMood, AgentProviderId, AgentStatus } from '@funcionarios/types'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { coastalAudio } from '@ambiente/audio/coastalAudio'
import { AgentPortrait } from './chat/AgentPortrait'
import { ChatComposer } from './chat/ChatComposer'
import { ChatMessageList } from './chat/ChatMessageList'

const STATUS_OPTIONS: { id: AgentStatus; label: string; dot: string }[] = [
  { id: 'working', label: 'Trabalhando', dot: 'bg-[#02c6a7]' },
  { id: 'thinking', label: 'Pensando', dot: 'bg-[#f6b93b]' },
  { id: 'reviewing', label: 'Revisando', dot: 'bg-[#3b82f6]' },
  { id: 'idle', label: 'Descansando', dot: 'bg-[#94a3b8]' },
]

const MOOD_META: Record<AgentMood, { label: string; emoji: string; bg: string; text: string }> = {
  radiant: { label: 'Radiante', emoji: '✨', bg: 'bg-[#fff7dc]', text: 'text-[#c27803]' },
  inspired: { label: 'Inspirado(a)', emoji: '🎨', bg: 'bg-[#fff1ea]', text: 'text-[#d9532c]' },
  focused: { label: 'Focado(a)', emoji: '⚡', bg: 'bg-[#ebf3ff]', text: 'text-[#2b62c9]' },
  cozy: { label: 'Aconchegado(a)', emoji: '☀️', bg: 'bg-[#e6fbf6]', text: 'text-[#01967e]' },
  tired: { label: 'Pausa', emoji: '🌙', bg: 'bg-[#f1f3f9]', text: 'text-[#6c6996]' },
}

export function AgentInspector() {
  const agents = useAgencyStore((s) => s.agents)
  const props = useAgencyStore((s) => s.props)
  const worldView = useAgencyStore((s) => s.worldView)
  const selectedAgentId = useAgencyStore((s) => s.selectedAgentId)
  const chatPendingByAgent = useAgencyStore((s) => s.chatPendingByAgent)
  const selectAgent = useAgencyStore((s) => s.selectAgent)
  const enterStudioZone = useAgencyStore((s) => s.enterStudioZone)
  const sendChatMessage = useAgencyStore((s) => s.sendChatMessage)
  const triggerSelfBuild = useAgencyStore((s) => s.triggerSelfBuild)
  const rewardAgentOrProp = useAgencyStore((s) => s.rewardAgentOrProp)
  const updateAgentStatus = useAgencyStore((s) => s.updateAgentStatus)
  const updateAgentProvider = useAgencyStore((s) => s.updateAgentProvider)
  const removeAgent = useAgencyStore((s) => s.removeAgent)
  const removeProp = useAgencyStore((s) => s.removeProp)
  const serverMeta = useAgencyStore((s) => s.serverMeta)
  const groups = useAgencyStore((s) => s.groups)
  const setSettingsOpen = useAgencyStore((s) => s.setSettingsOpen)

  const [tab, setTab] = useState<'chat' | 'wellbeing' | 'config'>('chat')
  const [confirmFire, setConfirmFire] = useState(false)

  const agent = agents.find((a) => a.id === selectedAgentId)

  useEffect(() => {
    setConfirmFire(false)
  }, [selectedAgentId])

  if (!agent) return null

  // Só mostra as contas de IA que têm chave ativa no servidor
  const activeProviders = getActiveAgentProviders(serverMeta?.aiProviders)
  const currentExternal = agentProviderToExternal(agent.provider)
  const currentIsActive = activeProviders.some((p) => agentProviderToExternal(p) === currentExternal)
  const teams = groups.filter((g) => g.memberAgentIds.includes(agent.id))

  const zone = STUDIO_ZONES[agent.zone]
  const provider = agent.provider ? AGENT_PROVIDERS[agent.provider] : null
  const moodInfo = MOOD_META[agent.wellbeing.mood]
  const isPending = Boolean(chatPendingByAgent[agent.id])
  const agentProps = props.filter((p) => p.createdByAgentId === agent.id)


  return (
    <aside className="cw-pop-in pointer-events-auto fixed right-5 top-20 bottom-5 z-30 flex w-[392px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[32px] border-[3px] border-white bg-white shadow-[0_24px_64px_rgba(32,54,102,0.28)]">
      {/* Header */}
      <div className="border-b border-[#edf2f9] bg-gradient-to-b from-[#f6faff] to-white p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <AgentPortrait agent={agent} size={44} showStatus />
              <div className="min-w-0">
                <h2 className="truncate text-base font-black text-[#3b3777]">{agent.name}</h2>
                <p className="truncate text-xs font-bold text-[#7c79a6]">{agent.role}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${moodInfo.bg} ${moodInfo.text}`}
              >
                {moodInfo.emoji} {moodInfo.label} · {agent.wellbeing.score}%
              </span>
              {provider && (
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
                  style={{ backgroundColor: `${provider.color}1a`, color: provider.color }}
                >
                  {provider.name}
                </span>
              )}
              {teams.map((g) => (
                <span
                  key={g.id}
                  className="rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                  style={{ backgroundColor: `${g.color}1f`, color: g.color }}
                  title={`Grupo ${g.name}`}
                >
                  {g.category}
                </span>
              ))}
              <button
                type="button"
                onClick={() => {
                  coastalAudio.playChime()
                  enterStudioZone(agent.zone)
                }}
                className="inline-flex items-center gap-1 rounded-full bg-[#eef4fc] px-2.5 py-0.5 text-[11px] font-extrabold text-[#3b3777] hover:bg-[#e1ecfb]"
              >
                <Building2 className="h-3 w-3 text-[#02c6a7]" />
                {worldView === 'island' ? 'Entrar na Sede' : zone.shortName}
              </button>
              <button
                type="button"
                onClick={() => setConfirmFire((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-full bg-[#fff0f1] px-2.5 py-0.5 text-[11px] font-extrabold text-[#f2676f] hover:bg-[#ffe1e4]"
                title={`Mandar ${agent.name} embora`}
              >
                <Trash2 className="h-3 w-3" />
                Mandar embora
              </button>
            </div>

            {confirmFire && (
              <div className="mt-2.5 rounded-2xl border border-[#fecdd3] bg-[#fff1f2] p-2.5 text-xs">
                <p className="font-extrabold text-[#be123c]">
                  Mandar {agent.name} embora da Blequi?
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      coastalAudio.playPop(360, 0.08)
                      setConfirmFire(false)
                      void removeAgent(agent.id)
                    }}
                    className="rounded-full bg-[#f2676f] px-3 py-1 text-[11px] font-extrabold text-white hover:brightness-105"
                  >
                    Sim, mandar embora
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmFire(false)}
                    className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#6c6996] hover:bg-[#f1f5f9]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              coastalAudio.playPop(460, 0.06)
              selectAgent(null)
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#20e4c4] to-[#02c6a7] text-white shadow-sm transition-transform hover:scale-110"
            aria-label="Fechar painel"
          >
            <X className="h-4 w-4 stroke-[3]" />
          </button>
        </div>

        {/* Playful Coastal Pill Tab Bar */}
        <div className="mt-3.5 grid grid-cols-3 gap-1 rounded-full bg-[#eef3fa] p-1">
          {(
            [
              { id: 'chat', label: 'Conversar', Icon: MessageSquare },
              { id: 'wellbeing', label: 'Bem-Estar', Icon: Heart },
              { id: 'config', label: 'Perfil', Icon: Cpu },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-extrabold transition-all ${
                tab === id
                  ? 'bg-white text-[#3b3777] shadow-sm'
                  : 'text-[#7c79a6] hover:text-[#3b3777]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: LIVE GEMINI CHAT & SELF-BUILDING */}
      {tab === 'chat' && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="grid grid-cols-2 gap-2 border-b border-[#edf2f9] bg-[#f8fbff] px-4 py-2.5">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                coastalAudio.playChime()
                triggerSelfBuild(agent.id)
              }}
              className="flex items-center justify-center gap-1.5 rounded-full bg-[#eef1ff] px-3 py-2 text-[11px] font-extrabold text-[#4f46e5] transition-colors hover:bg-[#e0e6ff] disabled:opacity-50"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Auto-criar 3D
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                coastalAudio.playChime()
                rewardAgentOrProp({
                  agentId: agent.id,
                  reason: `Elogio positivo das CEOs para ${agent.name}!`,
                })
              }}
              className="flex items-center justify-center gap-1.5 rounded-full bg-[#fff5d6] px-3 py-2 text-[11px] font-extrabold text-[#b45309] transition-colors hover:bg-[#ffebb3] disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Celebrar +Bem-estar
            </button>
          </div>

          <ChatMessageList messages={agent.chatHistory} typingAgents={isPending || agent.status === 'thinking' ? [agent] : []} />

          <ChatComposer
            placeholder={`Converse ou peça algo 3D para ${agent.name}...`}
            disabled={isPending}
            onSend={(text, atts) => sendChatMessage(agent.id, text, atts)}
          />
        </div>
      )}

      {/* TAB 2: WELLBEING & SELF-CREATED PROPS */}
      {tab === 'wellbeing' && (
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <section className="space-y-3 rounded-[22px] bg-[#f5f9ff] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#3b3777]">Indicadores de Bem-Estar</span>
              <span className="rounded-full bg-[#fff5d6] px-2.5 py-0.5 text-[11px] font-extrabold text-[#b45309]">
                {agent.wellbeing.approvedCreations} conquistas
              </span>
            </div>

            {[
              { label: 'Bem-estar geral', val: agent.wellbeing.score, color: '#02c6a7' },
              { label: 'Energia criativa', val: agent.wellbeing.energy, color: '#3b82f6' },
              { label: 'Orgulho das criações', val: agent.wellbeing.pride, color: '#f6b93b' },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="mb-1 flex justify-between text-[11px] font-bold">
                  <span className="text-[#6c6996]">{bar.label}</span>
                  <span className="font-mono font-extrabold text-[#3b3777]">{bar.val}/100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${bar.val}%`, backgroundColor: bar.color }}
                  />
                </div>
              </div>
            ))}

            {agent.wellbeing.lastRewardReason && (
              <p className="rounded-2xl bg-[#fff8dc] px-3 py-2 text-[11px] font-bold text-[#a16207]">
                💛 {agent.wellbeing.lastRewardReason}
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-black text-[#3b3777]">
              Criações 3D de {agent.name} ({agentProps.length})
            </h3>
            {agentProps.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-[#dfe6f2] p-3 text-xs font-semibold text-[#8d8bb0]">
                Ainda sem objetos construídos. Clique em &ldquo;Auto-criar 3D&rdquo; na aba Conversar!
              </p>
            ) : (
              <div className="space-y-2">
                {agentProps.map((p) => (
                  <div key={p.id} className="rounded-[20px] border border-[#ebf1fa] bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-black text-[#3b3777]">{p.title}</p>
                        <p className="text-[11px] font-semibold text-[#7c79a6]">
                          {PROP_CATALOG[p.kind]?.label} · {p.placement === 'island' ? 'Na Ilha' : 'No Estúdio'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProp(p.id)}
                        className="rounded-full p-1 text-[#9ea4be] hover:bg-[#fff0f1] hover:text-[#f2676f]"
                        title="Remover objeto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-[#6c6996]">{p.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      {p.approved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#02c6a7]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Aprovado pelas CEOs
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => rewardAgentOrProp({ propId: p.id })}
                          className="rounded-full bg-[#f6d35f] px-3 py-1 text-[11px] font-black text-[#3b3777] hover:brightness-105"
                        >
                          Celebrar +{p.wellbeingBonus} ✨
                        </button>
                      )}
                      <span className="font-mono text-[10px] text-[#9ea4be]">{p.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-black text-[#3b3777]">Memórias da Ilha</h3>
            <div className="space-y-1.5">
              {agent.memories.map((mem, idx) => (
                <div key={idx} className="rounded-2xl bg-[#f5f8fd] px-3 py-2 text-[11px] font-semibold text-[#5a5687]">
                  “{mem}”
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: CONFIG & STUDIO PROFILE */}
      {tab === 'config' && (
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <section className="rounded-[22px] bg-[#f5f9ff] p-4">
            <p className="text-xs font-black text-[#3b3777]">{agent.studioTheme.studioName}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#7c79a6]">{agent.studioTheme.tagline}</p>
            <div className="mt-2.5 flex items-center gap-2 text-[11px] font-bold text-[#6c6996]">
              <span
                className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: agent.studioTheme.facadeColor }}
                title="Fachada"
              />
              <span
                className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: agent.studioTheme.roofAccent }}
                title="Destaque"
              />
              <span
                className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: agent.studioTheme.interiorGlow }}
                title="Luz interna"
              />
              <span className="ml-auto font-mono text-[10px]">Piso: {agent.studioTheme.floorTone}</span>
            </div>
          </section>

          <section>
            <label className="mb-2 block text-xs font-black text-[#3b3777]">Status</label>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateAgentStatus(agent.id, opt.id)}
                  className={`flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                    agent.status === opt.id
                      ? 'border-[#02c6a7] bg-[#e9fbf7] text-[#3b3777]'
                      : 'border-[#edf2f9] bg-white text-[#7c79a6] hover:border-[#d5e0f0]'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {agent.entityType === 'ai' && (
            <section>
              <label className="mb-2 block text-xs font-black text-[#3b3777]">IA deste agente</label>
              {activeProviders.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="w-full rounded-2xl border-2 border-dashed border-[#dfe6f2] p-3 text-left text-[11px] font-semibold text-[#7c79a6] hover:bg-[#f8fbff]"
                >
                  Nenhuma IA ativa ainda. Toque aqui para colar uma chave em Governança Local.
                </button>
              ) : (
                <div className="space-y-1.5">
                  {activeProviders.map((id) => {
                    const prov = AGENT_PROVIDERS[id]
                    const status = serverMeta?.aiProviders?.find((p) => p.id === agentProviderToExternal(id))
                    const selected = agentProviderToExternal(agent.provider) === agentProviderToExternal(id)
                    return (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => updateAgentProvider(agent.id, prov.id as AgentProviderId)}
                        className={`flex w-full items-center justify-between rounded-full border-2 px-3.5 py-2 text-left transition-all ${
                          selected
                            ? 'border-[#3b3777] bg-[#f4f7ff]'
                            : 'border-[#edf2f9] bg-white hover:border-[#d5e0f0]'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-xs font-extrabold text-[#3b3777]">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: prov.color }} />
                          {prov.name}
                        </span>
                        <span className="truncate pl-2 font-mono text-[10px] font-bold" style={{ color: prov.color }}>
                          {status?.model || prov.badge}
                        </span>
                      </button>
                    )
                  })}
                  {!currentIsActive && agent.provider && (
                    <p className="rounded-2xl bg-[#fff8dc] px-3 py-2 text-[11px] font-bold text-[#a16207]">
                      {agent.name} usa {AGENT_PROVIDERS[agent.provider].name}, que está sem chave ativa — escolha uma
                      das IAs acima.
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          <section>
            <label className="mb-2 block text-xs font-black text-[#3b3777]">Skills</label>
            <div className="flex flex-wrap gap-1.5">
              {agent.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[#eef4fc] px-3 py-1 text-xs font-bold text-[#3b3777]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => setConfirmFire(true)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f1] py-2.5 text-xs font-extrabold text-[#f2676f] hover:bg-[#ffe1e4]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Mandar {agent.name} embora
          </button>
        </div>
      )}
    </aside>
  )
}
