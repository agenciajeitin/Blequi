import { useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Lock,
  Sparkles,
  UserPlus,
  Wifi,
  X,
} from 'lucide-react'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'

export function CeoSettingsModal() {
  const isOpen = useAgencyStore((s) => s.isSettingsOpen)
  const setSettingsOpen = useAgencyStore((s) => s.setSettingsOpen)
  const serverMeta = useAgencyStore((s) => s.serverMeta)
  const allowSelfBuild = useAgencyStore((s) => s.allowSelfBuildWithoutApproval)
  const proposals = useAgencyStore((s) => s.proposals)
  const setAutoBuild = useAgencyStore((s) => s.setAutoBuildWithoutApproval)
  const saveServerConfig = useAgencyStore((s) => s.saveServerConfig)
  const resolveProposal = useAgencyStore((s) => s.resolveProposal)

  const [geminiKey, setGeminiKey] = useState('')
  const [newCeoCode, setNewCeoCode] = useState('')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch {}
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!geminiKey.trim() && !newCeoCode.trim()) return
    setSaving(true)
    setFeedback(null)
    const res = await saveServerConfig({
      geminiApiKey: geminiKey.trim() || undefined,
      newCeoCode: newCeoCode.trim() || undefined,
    })
    setSaving(false)
    if (res.ok) {
      setGeminiKey('')
      setNewCeoCode('')
      setFeedback('Configuração salva no .env local e ativada na hora!')
    } else {
      setFeedback(res.error || 'Erro ao salvar.')
    }
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#23325b]/45 p-4 backdrop-blur-sm"
      onClick={() => setSettingsOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cw-pop-in relative flex max-h-[88vh] w-full max-w-xl flex-col rounded-[32px] bg-white shadow-[0_28px_70px_rgba(24,42,88,0.34)]"
      >
        {/* Coastal World Floating Mint Close Orb */}
        <button
          type="button"
          onClick={() => setSettingsOpen(false)}
          aria-label="Fechar configurações"
          className="absolute -top-5 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#20e4c4] to-[#02c6a7] text-white shadow-[0_8px_20px_rgba(2,198,167,0.45)] transition-transform hover:scale-110"
        >
          <X className="h-5 w-5 stroke-[3]" />
        </button>

        <div className="border-b border-[#edf2f9] px-6 pt-8 pb-4 text-center">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#02c6a7]">
            Governança Local
          </p>
          <h2 className="text-lg font-black text-[#3b3777]">Painel Privado das Co-CEOs</h2>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* LAN / Tailscale Link */}
          <section className="rounded-[22px] bg-[#e9fbf7] p-4">
            <div className="flex items-center gap-2 text-xs font-black text-[#01967e]">
              <Wifi className="h-4 w-4" />
              Link em Tempo Real para sua Amiga (LAN / Tailscale)
            </div>
            <p className="mt-1 text-xs font-semibold text-[#3b5b6b]">
              Enquanto este computador rodar{' '}
              <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#3b3777]">
                npm run dev
              </code>
              , compartilhe o link abaixo + a Chave CEO:
            </p>
            <div className="mt-2.5 space-y-1.5">
              {serverMeta?.networkUrls && serverMeta.networkUrls.length > 0 ? (
                serverMeta.networkUrls.map((url) => (
                  <div
                    key={url}
                    className="flex items-center justify-between gap-2 rounded-full bg-white px-3.5 py-2 shadow-sm"
                  >
                    <span className="truncate font-mono text-xs font-bold text-[#3b3777]">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(url)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#02c6a7] px-3 py-1 text-[11px] font-extrabold text-white hover:brightness-105"
                    >
                      {copiedUrl === url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedUrl === url ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                ))
              ) : (
                <p className="font-mono text-xs font-bold text-[#3b3777]">http://localhost:5173</p>
              )}
            </div>
          </section>

          {/* Pending New Employee Proposals */}
          {proposals.length > 0 && (
            <section className="space-y-2 rounded-[22px] bg-[#fff7dc] p-4">
              <div className="flex items-center gap-2 text-xs font-black text-[#b45309]">
                <UserPlus className="h-4 w-4" />
                Propostas de Novos Funcionários ({proposals.length})
              </div>
              {proposals.map((prop) => (
                <div key={prop.id} className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-[#3b3777]">
                      {prop.name} · <span className="font-semibold text-[#7c79a6]">{prop.role}</span>
                    </p>
                    <span className="text-[10px] font-bold text-[#8d8bb0]">por {prop.proposedByName}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-[#6c6996]">{prop.rationale}</p>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => resolveProposal(prop.id, true)}
                      className="rounded-full bg-[#02c6a7] px-3.5 py-1 text-xs font-extrabold text-white"
                    >
                      Aprovar contratação
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveProposal(prop.id, false)}
                      className="rounded-full bg-[#eef2f8] px-3.5 py-1 text-xs font-bold text-[#6c6996]"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Autonomy Toggle */}
          <section className="flex items-center justify-between gap-4 rounded-[22px] bg-[#f5f8fd] p-4">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-black text-[#3b3777]">
                <Sparkles className="h-3.5 w-3.5 text-[#f6b93b]" />
                Auto-criação direta no escritório privado
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#7c79a6]">
                Quando ativo, o time instala objetos 3D imediatamente e as CEOs podem celebrá-los depois.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoBuild(!allowSelfBuild)}
              className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${
                allowSelfBuild ? 'bg-[#02c6a7]' : 'bg-[#cbd5e1]'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  allowSelfBuild ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </section>

          {/* Gemini Key & CEO Pass Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-black text-[#3b3777]">
                  <KeyRound className="h-3.5 w-3.5 text-[#3b82f6]" />
                  GEMINI_API_KEY (.env local)
                </label>
                <a
                  href="https://aistudio.google.com/app/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#02c6a7] hover:underline"
                >
                  Gerar no AI Studio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={
                  serverMeta?.geminiConfigured
                    ? 'Chave configurada! Cole outra apenas se quiser trocar.'
                    : 'Cole sua AIza... para ativar Gemini 3.8 Flash ao vivo'
                }
                className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-4 py-2.5 font-mono text-xs font-semibold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-[#3b3777]">
                <Lock className="h-3.5 w-3.5 text-[#f2676f]" />
                Trocar Chave Privada das Co-CEOs (opcional)
              </label>
              <input
                type="password"
                value={newCeoCode}
                onChange={(e) => setNewCeoCode(e.target.value)}
                placeholder="Deixe vazio para manter a chave atual"
                className="w-full rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-4 py-2.5 font-mono text-xs font-semibold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
              />
            </div>

            {feedback && (
              <p className="rounded-2xl bg-[#e9fbf7] px-3.5 py-2 text-center text-xs font-extrabold text-[#01967e]">
                {feedback}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-full bg-[#eef2f8] px-5 py-2.5 text-xs font-extrabold text-[#6c6996] hover:bg-[#e1e8f3]"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={saving || (!geminiKey.trim() && !newCeoCode.trim())}
                className="cw-cta cw-cta-mint disabled:opacity-50"
              >
                <span className="cw-cta-inner px-5 py-2.5 text-xs font-extrabold">
                  {saving ? 'Salvando...' : 'Salvar no Servidor Local'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
