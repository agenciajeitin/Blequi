import { useState } from 'react'
import { Bot, User, X } from 'lucide-react'
import {
  AGENT_PROVIDERS,
  PROVIDER_ORDER,
  STUDIO_ZONES,
} from '@funcionarios/providers'
import type {
  AgentProviderId,
  MemberEntityType,
  StudioZoneId,
} from '@funcionarios/types'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'

const ZONES = Object.values(STUDIO_ZONES)

export function CreateAgentModal() {
  const isOpen = useAgencyStore((s) => s.isCreateModalOpen)
  const setCreateModalOpen = useAgencyStore((s) => s.setCreateModalOpen)
  const createAgent = useAgencyStore((s) => s.createAgent)

  const [entityType, setEntityType] = useState<MemberEntityType>('ai')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [zone, setZone] = useState<StudioZoneId>('engenharia')
  const [provider, setProvider] = useState<AgentProviderId>('gemini')
  const [skillsText, setSkillsText] = useState('')
  const [currentTask, setCurrentTask] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !role.trim()) return

    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    createAgent({
      name,
      entityType,
      role,
      zone,
      provider: entityType === 'ai' ? provider : undefined,
      currentTask,
      systemPrompt: `Você é ${name}, atuando como ${role} na Ilha Blequi.`,
      skills,
    })

    setName('')
    setRole('')
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
        className="cw-pop-in relative w-full max-w-lg rounded-[32px] bg-white shadow-[0_28px_70px_rgba(24,42,88,0.34)]"
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
          <h2 className="text-lg font-black text-[#3b3777]">Novo Especialista na Ilha Blequi</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-black text-[#3b3777]">Estúdio na Ilha</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as StudioZoneId)}
                className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-3.5 py-2 text-xs font-bold text-[#3b3777] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
              >
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.shortName}
                  </option>
                ))}
              </select>
            </div>
            {entityType === 'ai' && (
              <div>
                <label className="mb-1 block text-xs font-black text-[#3b3777]">Motor de IA</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as AgentProviderId)}
                  className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-3.5 py-2 text-xs font-bold text-[#3b3777] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
                >
                  {PROVIDER_ORDER.map((id) => {
                    const p = AGENT_PROVIDERS[id]
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.badge})
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-[#3b3777]">
              Skills (separadas por vírgula)
            </label>
            <input
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Three.js, Shaders, Direção de Arte, UI"
              className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-4 py-2 text-xs font-bold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
            />
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
                Adicionar à Ilha
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
