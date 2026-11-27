import { useEffect, useRef } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import type { AgentChatMessage, AgentEmployee, CeoSlot, ChatAttachment } from '@funcionarios/types'
import { CEO_CHAT_COLORS, resolveCeoSlotFromName } from '@funcionarios/sede'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { AgentPortrait, CeoBadge } from './AgentPortrait'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentView({ att, onDark }: { att: ChatAttachment; onDark: boolean }) {
  const attachmentUrl = useAgencyStore((s) => s.attachmentUrl)
  const href = attachmentUrl(att)
  if (att.kind === 'image') {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl" title={att.name}>
        <img src={href} alt={att.name} loading="lazy" className="max-h-52 w-full object-cover" />
      </a>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      download={att.name}
      className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-bold ${
        onDark ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-[#f1f5fc] text-[#3b3777] hover:bg-[#e4ecf9]'
      }`}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{att.name}</span>
      <span className="shrink-0 font-mono text-[10px] opacity-70">{formatSize(att.size)}</span>
    </a>
  )
}

interface ChatMessageListProps {
  messages: AgentChatMessage[]
  /** Agentes que estão "digitando" (pensando) nesta conversa */
  typingAgents?: AgentEmployee[]
  emptyHint?: string
}

/**
 * Lista de mensagens compartilhada pela conversa individual e pelos grupos.
 * Cada CEO tem a sua cor e cada agente aparece com a foto do personagem e a cor dele.
 */
export function ChatMessageList({ messages, typingAgents = [], emptyHint }: ChatMessageListProps) {
  const agents = useAgencyStore((s) => s.agents)
  const mySlot = useAgencyStore((s) => s.currentUser?.ceoSlot)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, typingAgents.length])

  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-[#fbfdff] p-3.5">
      {messages.length === 0 && emptyHint && (
        <p className="mt-6 text-center text-xs font-semibold text-[#9ea4be]">{emptyHint}</p>
      )}

      {messages.map((msg) => {
        if (msg.sender === 'system') {
          return (
            <div key={msg.id} className="flex justify-center">
              <div className="max-w-[92%] rounded-2xl bg-[#fff8dc] px-3.5 py-2 text-center text-[11px] font-bold text-[#a16207]">
                {msg.text}
              </div>
            </div>
          )
        }

        if (msg.sender === 'ceo') {
          const slot: CeoSlot | undefined = msg.senderCeoSlot ?? resolveCeoSlotFromName(msg.senderName)
          const ceoColor = slot ? CEO_CHAT_COLORS[slot] : { name: msg.senderName, color: '#3b3777', soft: '#eef1fb' }
          const isMine = Boolean(slot && slot === mySlot)
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
              <CeoBadge name={msg.senderName} color={ceoColor.color} size={26} />
              <div
                className="max-w-[80%] rounded-[20px] px-3.5 py-2.5 text-xs font-semibold leading-relaxed text-white shadow-sm"
                style={{ backgroundColor: ceoColor.color }}
              >
                <div className="mb-1 flex items-center justify-between gap-3 text-[10px] opacity-85">
                  <span className="font-extrabold">{msg.senderName}</span>
                  <span className="font-mono">{msg.time}</span>
                </div>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mb-1.5 space-y-1.5">
                    {msg.attachments.map((att) => (
                      <AttachmentView key={att.id} att={att} onDark />
                    ))}
                  </div>
                )}
                {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
              </div>
            </div>
          )
        }

        const agent =
          agents.find((a) => a.id === msg.senderAgentId) ?? agents.find((a) => a.name === msg.senderName)
        const accent = agent?.accentColor ?? '#02c6a7'
        return (
          <div key={msg.id} className="flex items-end gap-2">
            {agent ? (
              <AgentPortrait agent={agent} size={30} />
            ) : (
              <CeoBadge name={msg.senderName} color={accent} size={30} />
            )}
            <div
              className="max-w-[82%] rounded-[20px] border-2 bg-white px-3.5 py-2.5 text-xs font-semibold leading-relaxed text-[#3b3777] shadow-sm"
              style={{ borderColor: `${accent}55` }}
            >
              <div className="mb-1 flex items-center justify-between gap-3 text-[10px]">
                <span className="font-extrabold" style={{ color: accent }}>
                  {msg.senderName}
                </span>
                <span className="font-mono opacity-60">{msg.time}</span>
              </div>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-1.5 space-y-1.5">
                  {msg.attachments.map((att) => (
                    <AttachmentView key={att.id} att={att} onDark={false} />
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.actions.map((act, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-[#e6fbf6] px-2.5 py-0.5 text-[10px] font-extrabold text-[#01967e]"
                    >
                      ✨ {act}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {typingAgents.map((ag) => (
        <div key={`typing-${ag.id}`} className="flex items-center gap-2 text-xs font-bold" style={{ color: ag.accentColor }}>
          <AgentPortrait agent={ag} size={24} />
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="truncate">
            {ag.name} está {ag.currentTask.startsWith('Trabalhando:') ? ag.currentTask.toLowerCase() : 'pensando...'}
          </span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}
