import { useEffect, useState } from 'react'
import { Bot, Building2, KeyRound, User, X } from 'lucide-react'
import { AGENT_PROVIDERS, PROVIDER_ORDER } from '@funcionarios/providers'
import { SEDE_ZONE, agentProviderToExternal as toExternalId } from '@funcionarios/sede'
import { EXTERNAL_AI_PROVIDER_MAP } from '@funcionarios/aiProvidersCatalog'
import type { AgentProviderId, MemberEntityType } from '@funcionarios/types'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { AiProviderLogo } from './AiProviderLogo'


export function CreateAgentModal() {
  const isOpen = useAgencyStore((s) => s.isCreateModalOpen)
  const serverMeta = useAgencyStore((s) => s.serverMeta)
  const setCreateModalOpen = useAgencyStore((s) => s.setCreateModalOpen)
  const createAgent = useAgencyStore((s) => s.createAgent)

  const [entityType, setEntityType] = useState<MemberEntityType>('ai')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [provider, setProvider] = useState<AgentProviderId>('opencode')
  const [apiKeyDraft, setApiKeyDraft] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [currentTask, setCurrentTask] = useState('')

  // Auto-select the first configured AI provider when opening the modal
  useEffect(() => {
    if (!isOpen || !serverMeta?.aiProviders) return
    const firstConfigured = PROVIDER_ORDER.find((id) =>
      serverMeta.aiProviders?.some((p) => p.id === toExternalId(id) && p.configured)
    )
    if (firstConfigured) setProvider(firstConfigured)
    setApiKeyDraft('')
  }, [isOpen, serverMeta?.aiProviders])

  if (!isOpen) return null

  const selectedExtId = toExternalId(provider)
  const selectedExtMeta = EXTERNAL_AI_PROVIDER_MAP[selectedExtId]
  const selectedStatus = serverMeta?.aiProviders?.find((p) => p.id === selectedExtId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !role.trim()) return

    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    void createAgent({
      name,
      entityType,
      role,
      zone: SEDE_ZONE,
      provider: entityType === 'ai' ? provider : undefined,
      apiKey: entityType === 'ai' && apiKeyDraft.trim() ? apiKeyDraft.trim() : undefined,
      model: entityType === 'ai' ? selectedStatus?.model || selectedExtMeta.defaultModel : undefined,
      currentTask,
      systemPrompt: `Você é ${name}, atuando como ${role} na Sede da Blequi junto com os CEOs Raynocas e Kafuzinho.`,
      skills,
    })

    setName('')
    setRole('')
    setApiKeyDraft('')
    setSkillsText('')
    setCurrentTask('')
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#23325b]/45 p-4 backdrop-blur-sm"
      onClick={() => setCreateModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cw-pop-in relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-[32px] bg-white shadow-[0_28px_70px_rgba(24,42,88,0.34)]"
      >
        <button
          type="button"
          onClick={() => setCreateModalOpen(false)}
          aria-label="Fechar"
          className="absolute -top-5 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#20e4c4] to-[#02c6a7] text-white shadow-[0_8px_20px_rgba(2,198,167,0.45)] transition-transform hover:scale-110"
        >
          <X className="h-5 w-5 stroke-[3]" />
        </button>

        <div className="border-b border-[#edf2f9] px-6 pt-8 pb-4 text-center">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#02c6a7]">
            Expansão da Equipe
          </p>
          <h2 className="text-lg font-black text-[#3b3777]">Novo Especialista na Sede da Blequi</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEntityType('human')}
              className={`flex items-center justify-center gap-2 rounded-full border-2 py-2.5 text-xs font-extrabold transition-all ${
                entityType === 'human'
                  ? 'border-[#f2676f] bg-[#fff0f1] text-[#3b3777]'
                  : 'border-[#edf2f9] bg-[#f7f9fd] text-[#7c79a6]'
              }`}
            >
              <User className="h-4 w-4 text-[#f2676f]" />
              Pessoa real
            </button>
            <button
              type="button"
              onClick={() => setEntityType('ai')}
              className={`flex items-center justify-center gap-2 rounded-full border-2 py-2.5 text-xs font-extrabold transition-all ${
                entityType === 'ai'
                  ? 'border-[#02c6a7] bg-[#e9fbf7] text-[#3b3777]'
                  : 'border-[#edf2f9] bg-[#f7f9fd] text-[#7c79a6]'
              }`}
            >
              <Bot className="h-4 w-4 text-[#02c6a7]" />
              Agente de IA
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-black text-[#3b3777]">Nome</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sofia Mendes"
                className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-4 py-2 text-xs font-bold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#3b3777]">Cargo</label>
              <input
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Motion Designer 3D"
                className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-4 py-2 text-xs font-bold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {entityType === 'ai' && (
            <div className="space-y-2.5 rounded-[22px] bg-[#f5f9ff] p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#3b3777]">
                  Escolha a IA deste agente (puxa os dados salvos da API)
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PROVIDER_ORDER.map((id) => {
                  const p = AGENT_PROVIDERS[id]
                  const extId = toExternalId(id)
                  const st = serverMeta?.aiProviders?.find((x) => x.id === extId)
                  const active = provider === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setProvider(id)}
                      className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-2.5 text-left transition-all ${
                        active
                          ? 'border-[#02c6a7] bg-white shadow-sm'
                          : 'border-transparent bg-white/80 hover:border-[#d5e0f0]'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <AiProviderLogo id={extId} className="h-5 w-5" />
                        <span
                          className={`h-2 w-2 rounded-full ${
                            st?.configured ? 'bg-[#02c6a7]' : 'bg-[#cbd5e1]'
                          }`}
                        />
                      </div>
                      <span className="truncate text-[11px] font-black text-[#3b3777]">{p.name}</span>
                      <span
                        className={`truncate text-[9px] font-bold ${
                          st?.configured ? 'text-[#01967e]' : 'text-[#9ea4be]'
                        }`}
                      >
                        {st?.configured ? st.model : 'Sem chave'}
                      </span>
                    </button>
                  )
                })}
              </div>

              {selectedStatus?.configured ? (
                <p className="rounded-xl bg-[#e9fbf7] px-3 py-1.5 text-[11px] font-bold text-[#01967e]">
                  ✓ API de {selectedExtMeta.name} já salva ({selectedStatus.model}) — pronto para responder na hora!
                </p>
              ) : (
                <div>
                  <label className="mb-1 flex items-center gap-1 text-[11px] font-black text-[#3b3777]">
                    <KeyRound className="h-3 w-3 text-[#02c6a7]" />
                    Chave API de {selectedExtMeta.name} (salva automaticamente)
                  </label>
                  <input
                    type="password"
                    value={apiKeyDraft}
                    onChange={(e) => setApiKeyDraft(e.target.value)}
                    placeholder={selectedExtMeta.keyPlaceholder}
                    className="w-full rounded-full border-2 border-[#edf2f9] bg-white px-3.5 py-2 font-mono text-xs font-semibold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-[#f5f9ff] px-3 py-2 text-[11px] font-bold text-[#6c6996]">
              <Building2 className="h-4 w-4 shrink-0 text-[#02c6a7]" />
              Mesa própria na Sede da Blequi
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#3b3777]">
                Skills (separadas por vírgula)
              </label>
              <input
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Three.js, Shaders, Arte"
                className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-4 py-2 text-xs font-bold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-full bg-[#eef2f8] px-5 py-2.5 text-xs font-extrabold text-[#6c6996] hover:bg-[#e1e8f3]"
            >
              Cancelar
            </button>
            <button type="submit" className="cw-cta cw-cta-mint">
              <span className="cw-cta-inner px-6 py-2.5 text-xs font-extrabold">
                Criar e Ativar Agente
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
