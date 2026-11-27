import { useMemo, useState } from 'react'
import { Check, ChevronLeft, Crown, Plus, Settings2, Trash2, Users } from 'lucide-react'
import type { AgentChatMessage, AgentEmployee, ChatGroup } from '@funcionarios/types'
import { CEO_CHAT_COLORS } from '@funcionarios/sede'
import { STUDIO_ZONES } from '@funcionarios/providers'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { coastalAudio } from '@ambiente/audio/coastalAudio'
import { AgentPortrait } from './chat/AgentPortrait'
import { ChatComposer } from './chat/ChatComposer'
import { ChatMessageList } from './chat/ChatMessageList'

function lastMessagePreview(messages: AgentChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.sender !== 'system') ?? messages[messages.length - 1]
  if (!last) return 'Sem mensagens ainda'
  const prefix = last.sender === 'system' ? '' : `${last.senderName}: `
  const body = last.text || (last.attachments?.length ? '📎 Anexo' : '')
  return `${prefix}${body}`
}

function MemberStack({ members }: { members: AgentEmployee[] }) {
  return (
    <div className="flex -space-x-2">
      {members.slice(0, 4).map((m) => (
        <span key={m.id} className="rounded-full ring-2 ring-white">
          <AgentPortrait agent={m} size={22} />
        </span>
      ))}
      {members.length > 4 && (
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#eef3fa] text-[9px] font-black text-[#3b3777] ring-2 ring-white">
          +{members.length - 4}
        </span>
      )}
    </div>
  )
}

/** Formulário para criar ou editar um grupo (nome, equipe/categoria e agentes) */
function GroupForm({ group, onDone }: { group?: ChatGroup; onDone: (groupId: string | null) => void }) {
  const agents = useAgencyStore((s) => s.agents)
  const createGroup = useAgencyStore((s) => s.createGroup)
  const updateGroup = useAgencyStore((s) => s.updateGroup)
  const deleteGroup = useAgencyStore((s) => s.deleteGroup)

  const [name, setName] = useState(group?.name ?? '')
  const [category, setCategory] = useState(group?.category ?? '')
  const [members, setMembers] = useState<string[]>(group?.memberAgentIds ?? [])
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const aiAgents = agents.filter((a) => a.entityType === 'ai')
  const toggle = (id: string) =>
    setMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    coastalAudio.playChime()
    if (group) {
      await updateGroup(group.id, { name: name.trim(), category: category.trim(), memberAgentIds: members })
      setSaving(false)
      onDone(group.id)
    } else {
      const id = await createGroup({ name: name.trim(), category: category.trim(), memberAgentIds: members })
      setSaving(false)
      if (id) onDone(id)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-3.5 pb-3">
        <div>
          <label className="mb-1 block text-[11px] font-black text-[#3b3777]">Nome do grupo</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Ilha Blequi Manutenções"
            className="w-full rounded-full border-2 border-[#edf2f9] bg-white px-4 py-2 text-xs font-bold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-black text-[#3b3777]">Equipe (categoria dos agentes)</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={name.trim() ? `Igual ao nome: ${name.trim()}` : 'Ex.: Manutenções'}
            className="w-full rounded-full border-2 border-[#edf2f9] bg-white px-4 py-2 text-xs font-bold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:outline-none"
          />
          <p className="mt-1 px-2 text-[10px] font-semibold text-[#9ea4be]">
            Os agentes escolhidos passam a fazer parte desta equipe.
          </p>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-black text-[#3b3777]">Agentes no grupo ({members.length})</p>
          <div className="space-y-1.5">
            {aiAgents.map((ag) => {
              const selected = members.includes(ag.id)
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => toggle(ag.id)}
                  className={`flex w-full items-center gap-2.5 rounded-[18px] border-2 px-2.5 py-1.5 text-left transition-all ${
                    selected ? 'bg-white' : 'border-transparent bg-white/60 hover:bg-white'
                  }`}
                  style={selected ? { borderColor: ag.accentColor } : undefined}
                >
                  <AgentPortrait agent={ag} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-black text-[#3b3777]">{ag.name}</span>
                    <span className="block truncate text-[10px] font-semibold text-[#7976a3]">{ag.role}</span>
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? 'border-transparent text-white' : 'border-[#d5dff0]'
                    }`}
                    style={selected ? { backgroundColor: ag.accentColor } : undefined}
                  >
                    {selected && <Check className="h-3 w-3 stroke-[3.5]" />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {group && (
          <div className="pt-1">
            {confirmDelete ? (
              <div className="flex items-center justify-between rounded-2xl bg-[#fff1f2] px-3 py-2 text-[11px]">
                <span className="font-extrabold text-[#be123c]">Apagar o grupo e as mensagens?</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteGroup(group.id)
                      onDone(null)
                    }}
                    className="rounded-full bg-[#f2676f] px-2.5 py-0.5 font-extrabold text-white"
                  >
                    Apagar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-full bg-white px-2.5 py-0.5 font-bold text-[#6c6996]"
                  >
                    Não
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#fff0f1] py-2 text-[11px] font-extrabold text-[#f2676f] hover:bg-[#ffe1e4]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Apagar grupo
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#edf2f9] bg-white p-3">
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="w-full rounded-full bg-[#02c6a7] py-2.5 text-xs font-extrabold text-white shadow-sm hover:brightness-105 disabled:opacity-50"
        >
          {group ? 'Salvar grupo' : 'Criar grupo'}
        </button>
      </div>
    </form>
  )
}

type View = { kind: 'list' } | { kind: 'new-group' } | { kind: 'edit-group'; id: string }

/**
 * App de Mensagens do celular: grupos centralizados entre Raynocas, Kafuzinho e os agentes,
 * conversas individuais com cada agente e envio de fotos/arquivos.
 */
export function MessagesApp() {
  const agents = useAgencyStore((s) => s.agents)
  const groups = useAgencyStore((s) => s.groups)
  const onlineCeos = useAgencyStore((s) => s.onlineCeos)
  const currentUser = useAgencyStore((s) => s.currentUser)
  const chatPendingByAgent = useAgencyStore((s) => s.chatPendingByAgent)
  const activeThread = useAgencyStore((s) => s.activeThread)
  const setActiveThread = useAgencyStore((s) => s.setActiveThread)
  const sendChatMessage = useAgencyStore((s) => s.sendChatMessage)
  const sendGroupMessage = useAgencyStore((s) => s.sendGroupMessage)

  const [view, setView] = useState<View>({ kind: 'list' })

  const partner = onlineCeos.find((c) => c.ceoSlot !== currentUser?.ceoSlot)
  const aiAgents = useMemo(() => agents.filter((a) => a.entityType === 'ai'), [agents])

  // ---------- Formulários de grupo ----------
  if (view.kind === 'new-group' || view.kind === 'edit-group') {
    const editing = view.kind === 'edit-group' ? groups.find((g) => g.id === view.id) : undefined
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 px-3.5 pb-2">
          <button
            type="button"
            onClick={() => setView({ kind: 'list' })}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#3b3777] shadow-sm"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-4 w-4 stroke-[3]" />
          </button>
          <h3 className="text-sm font-black text-[#3b3777]">{editing ? 'Editar grupo' : 'Novo grupo'}</h3>
        </div>
        <GroupForm
          key={editing?.id ?? 'new'}
          group={editing}
          onDone={(id) => {
            setView({ kind: 'list' })
            setActiveThread(id ? { kind: 'group', id } : null)
          }}
        />
      </div>
    )
  }

  // ---------- Conversa aberta ----------
  if (activeThread) {
    const group = activeThread.kind === 'group' ? groups.find((g) => g.id === activeThread.id) : undefined
    const agent = activeThread.kind === 'agent' ? agents.find((a) => a.id === activeThread.id) : undefined

    if (group || agent) {
      const members = group ? agents.filter((a) => group.memberAgentIds.includes(a.id)) : []
      const typing = group
        ? members.filter((m) => m.status === 'thinking')
        : agent && (chatPendingByAgent[agent.id] || agent.status === 'thinking')
          ? [agent]
          : []
      const teams = agent ? groups.filter((g) => g.memberAgentIds.includes(agent.id)).map((g) => g.category) : []

      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-[#e7eef8] px-3 pb-2">
            <button
              type="button"
              onClick={() => setActiveThread(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#3b3777] shadow-sm"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-4 w-4 stroke-[3]" />
            </button>
            {agent ? (
              <AgentPortrait agent={agent} size={34} showStatus />
            ) : (
              <span
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: group!.color }}
              >
                <Users className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[#3b3777]">{agent ? agent.name : group!.name}</p>
              <p className="truncate text-[10px] font-semibold text-[#7976a3]">
                {agent
                  ? teams.length > 0
                    ? `Equipes: ${teams.join(', ')}`
                    : agent.role
                  : `Equipe ${group!.category} · ${members.map((m) => m.name).join(', ') || 'sem agentes'}`}
              </p>
            </div>
            {group && (
              <button
                type="button"
                onClick={() => setView({ kind: 'edit-group', id: group.id })}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#3b3777] shadow-sm"
                aria-label="Configurar grupo"
                title="Configurar grupo"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <ChatMessageList
            messages={group ? group.messages : agent!.chatHistory}
            typingAgents={typing}
            emptyHint={group ? 'Mande o primeiro pedido para a equipe!' : undefined}
          />

          {group && members.length > 0 && (
            <p className="bg-white px-3 pt-1.5 text-[10px] font-semibold text-[#9ea4be]">
              Dica: cite um nome (ex.: “{members[0].name}, ...”) para só ele(a) responder.
            </p>
          )}
          <ChatComposer
            placeholder={group ? `Mensagem para ${group.name}...` : `Mensagem para ${agent!.name}...`}
            disabled={Boolean(agent && chatPendingByAgent[agent.id])}
            onSend={(text, atts) =>
              group ? sendGroupMessage(group.id, text, atts) : sendChatMessage(agent!.id, text, atts)
            }
          />
        </div>
      )
    }
  }

  // ---------- Lista de conversas ----------
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <h3 className="text-sm font-black text-[#3b3777]">Mensagens</h3>
          <p className="flex items-center gap-1 text-[10px] font-bold text-[#7976a3]">
            {partner ? (
              <>
                <Crown className="h-3 w-3 fill-[#ffd15c] text-[#d97706]" />
                <span style={{ color: CEO_CHAT_COLORS[partner.ceoSlot].color }}>{partner.name}</span> online ·{' '}
                {partner.activeView === 'studio' && partner.activeZone
                  ? STUDIO_ZONES[partner.activeZone]?.shortName ?? 'interior'
                  : 'na ilha'}
              </>
            ) : (
              'A outra CEO está offline'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            coastalAudio.playPop(660, 0.06)
            setView({ kind: 'new-group' })
          }}
          className="flex items-center gap-1 rounded-full bg-[#02c6a7] px-3 py-1.5 text-[11px] font-extrabold text-white shadow-sm hover:brightness-105"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.8]" />
          Novo grupo
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3.5 pb-4">
        <section>
          <h4 className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-wider text-[#7976a3]">
            Grupos ({groups.length})
          </h4>
          {groups.length === 0 ? (
            <button
              type="button"
              onClick={() => setView({ kind: 'new-group' })}
              className="w-full rounded-[20px] border-2 border-dashed border-[#d5dff0] p-3 text-left text-[11px] font-semibold text-[#7976a3] hover:bg-white"
            >
              Crie um grupo (ex.: “Ilha Blequi Manutenções” com Vex) para você e a outra CEO pedirem coisas à equipe em
              um lugar só.
            </button>
          ) : (
            <div className="space-y-1.5">
              {groups.map((g) => {
                const members = agents.filter((a) => g.memberAgentIds.includes(a.id))
                const busy = members.some((m) => m.status === 'thinking')
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      coastalAudio.playPop(620, 0.05)
                      setActiveThread({ kind: 'group', id: g.id })
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[20px] bg-white p-2.5 text-left shadow-[0_6px_16px_rgba(59,55,119,0.07)] hover:bg-[#fbfdff]"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
                      style={{ backgroundColor: g.color }}
                    >
                      <Users className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-black text-[#3b3777]">{g.name}</span>
                        <span
                          className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-extrabold"
                          style={{ backgroundColor: `${g.color}1f`, color: g.color }}
                        >
                          {g.category}
                        </span>
                      </span>
                      <span className="block truncate text-[10px] font-semibold text-[#7976a3]">
                        {busy ? 'digitando...' : lastMessagePreview(g.messages)}
                      </span>
                    </span>
                    <MemberStack members={members} />
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-wider text-[#7976a3]">
            Conversas individuais ({aiAgents.length})
          </h4>
          <div className="space-y-1.5">
            {aiAgents.map((ag) => {
              const busy = chatPendingByAgent[ag.id] || ag.status === 'thinking'
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => {
                    coastalAudio.playPop(620, 0.05)
                    setActiveThread({ kind: 'agent', id: ag.id })
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[20px] bg-white p-2.5 text-left shadow-[0_6px_16px_rgba(59,55,119,0.07)] hover:bg-[#fbfdff]"
                >
                  <AgentPortrait agent={ag} size={40} showStatus />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-black text-[#3b3777]">{ag.name}</span>
                    <span className="block truncate text-[10px] font-semibold text-[#7976a3]">
                      {busy ? 'digitando...' : lastMessagePreview(ag.chatHistory)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
