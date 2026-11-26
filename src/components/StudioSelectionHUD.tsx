import { useState, useCallback, useEffect, useRef } from 'react'
import { Bot, User, X, Loader2 } from 'lucide-react'
import { gsap } from 'gsap'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import type { AgentEmployee } from '@funcionarios/types'

export function StudioSelectionHUD() {
  const isOpen = useAgencyStore((s) => s.isCeoLoginOpen || false)
  const setCeoLoginOpen = useAgencyStore((s) => s.setCeoLoginOpen)
  const currentUser = useAgencyStore((s) => s.currentUser)
  const agents = useAgencyStore((s) => s.agents)
  const worldView = useAgencyStore((s) => s.worldView)
  const activeStudioZone = useAgencyStore((s) => s.activeStudioZone)

  const [open, setOpen] = useState<boolean>(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [entering, setEntering] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // GSAP refs
  const hudEnterRef = useRef<HTMLDivElement>(null)
  const agentsListRef = useRef<HTMLDivElement>(null)

  // Effect: animate HUD entrance when open changes
  useEffect(() => {
    if (!open) return

    // HUD entrance sequence
    if (hudEnterRef.current) {
      // Background fade-in
      gsap.fromTo(
        hudEnterRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      )

      // Stagger agent entries
      const agents = useAgencyStore.getState().agents.filter(
        (a) => a.entityType === 'ai'
      )

      if (agentsListRef.current && agents.length > 0) {
        const agentElements = agentsListRef.current.querySelectorAll(
          '[role="button"]'
        )

        if (agentElements.length > 0) {
          gsap.fromTo(
            [...agentElements].map((el) => el as Element),
            { opacity: 0, x: -30, scale: 0.9 },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              duration: 0.5,
              stagger: 0.1,
              ease: 'back.out(1.7)',
              delay: 0.2,
            }
          )
        }
      }
    }
  }, [open])

  // Effect: animate HUD exit when open changes to false
  useEffect(() => {
    if (open) return

    if (hudEnterRef.current) {
      gsap.to(hudEnterRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => setOpen(false),
      })
    }
  }, [open])

  const handleOpen = useCallback(() => {
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setSelectedAgentId(null)
    setEntering(false)
  }, [])

  const handleAgentSelect = useCallback(
    (agentId: string) => {
      setSelectedAgentId(agentId)
      setEntering(true)
    },
    [setSelectedAgentId, setEntering]
  )

  const handleEnterStudio = useCallback(
    async (agentId: string) => {
      setLoading(true)
      try {
        // Find the agent's zone
        const agent = agents.find((a) => a.id === agentId)
        if (!agent) return

        // Enter the studio zone
        const enterStudio = useAgencyStore.getState().enterStudioZone
        await enterStudio(agent.zone)

        // Fade out the HUD
        setOpen(false)
        setEntering(false)

        // Show toast
        useAgencyStore.getState().showToast(
          `🏗️ Entrando no estúdio de ${agent.name}...`
        )
      } catch (error) {
        console.error('Error entering studio:', error)
        useAgencyStore.getState().showToast('❌ Erro ao entrar no estúdio')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  if (!isOpen) return null

  // Filter to only show AI agents that can be entered
  const aiAgents = agents.filter((a) => a.entityType === 'ai')

  return (
    <div
      ref={hudEnterRef}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#23325b]/80 backdrop-blur-sm"
      onClick={() => handleClose()}
    >
      <div
        ref={agentsListRef}
        onClick={(e) => e.stopPropagation()}
        className="cw-pop-in relative w-full max-w-2xl bg-white shadow-[0_28px_70px_rgba(24,42,88,0.34)] max-h-[80vh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => handleClose()}
          aria-label="Fechar seleção de estúdio"
          className="absolute -top-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-[#3b3777]">
              🏢 Selecionar Estúdio
            </h2>
            <p className="text-xs font-medium text-[#7c79a6]">
              Escolha qual especialista você quer visitar
            </p>
          </div>

          {/* Agents list with photos */}
          {aiAgents.length === 0 && (
            <div className="p-4 text-center text-[#6c6996]">
              <p>Nenhum agente disponível no momento.</p>
            </div>
          )}

          <div className="space-y-3">
            {aiAgents.map((agent) => (
              <div
                key={agent.id}
                className="cw-pop-in relative flex items-center gap-3 rounded-2xl border px-4 py-3 hover:border-[#02c6a7] cursor-pointer group hover:shadow-xl hover:shadow-[#02c6a7]/25 transition-all duration-300"
                onClick={() => handleAgentSelect(agent.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleAgentSelect(agent.id)}
              >
                {/* Agent photo/avatar preview */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot
                    className={`h-5 w-5 ${agent.accentColor === '#f97316' ? 'text-[#f97316]' : agent.accentColor === '#6366f1' ? 'text-[#6366f1]' : agent.accentColor === '#0ea5e9' ? 'text-[#0ea5e9]' : agent.accentColor === '#10b981' ? 'text-[#10b981]' : 'text-[#a855f1]'}`}
                  />
                  <span className="text-xs font-bold text-[#3b3777] truncate max-w-[60px]">{agent.name[0]}</span>
                </div>

                {/* Agent info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#3b3777] line-clamp-1">{agent.name}</p>
                  <p className="text-xs text-[#7c79a6] line-clamp-1">
                    {agent.role}
                  </p>
                </div>

                {/* Enter arrow */}
                <div className="w-2 h-2 rounded-full bg-[#02c6a7] flex-shrink-0 transform group-hover:translate-x-1.5 transition-transform"></div>
              </div>
            ))}
          </div>

          {/* Selected preview */}
          {selectedAgentId && (
            <div className="p-4 bg-[#e9fbf7] rounded-2xl border border-[#02c6a7]/20 mb-4">
              <p className="font-medium text-[#02c6a7]">
                ✨ Selecionado: {agents.find((a) => a.id === selectedAgentId)?.name || '---'}
              </p>
              <p className="text-xs text-[#7c79a6]">
                Pressione Enter para entrar ou ESC para cancelar
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => handleClose()}
              className="flex-1 rounded-full bg-[#eef2f8] px-4 py-2.5 text-xs font-extrabold text-[#6c6996] hover:bg-[#e1e8f3] transition-colors"
              type="button"
            >
              Cancelar
            </button>
            <button
              onClick={() => selectedAgentId && handleEnterStudio(selectedAgentId)}
              className="cw-cta cw-cta-mint flex-1"
              disabled={entering || !selectedAgentId || loading}
            >
              <span className="cw-cta-inner px-4 py-2 text-xs font-extrabold">
                {entering ? 'Entrando...' : 'Entrar no Estúdio'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}