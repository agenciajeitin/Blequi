import { useRef, useState } from 'react'
import { FileText, ImagePlus, Loader2, Paperclip, Send, X } from 'lucide-react'
import type { ChatAttachment } from '@funcionarios/types'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'
import { coastalAudio } from '@ambiente/audio/coastalAudio'

interface ChatComposerProps {
  placeholder: string
  disabled?: boolean
  onSend: (text: string, attachments: ChatAttachment[]) => Promise<void> | void
}

/**
 * Caixa de mensagem com envio de fotos e arquivos (botões, colar com Ctrl/Cmd+V).
 * Os arquivos sobem na hora para o servidor local e ficam só no PC host.
 */
export function ChatComposer({ placeholder, disabled = false, onSend }: ChatComposerProps) {
  const uploadAttachment = useAgencyStore((s) => s.uploadAttachment)
  const attachmentUrl = useAgencyStore((s) => s.attachmentUrl)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState<ChatAttachment[]>([])
  const [uploading, setUploading] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 6 - pending.length)
    if (list.length === 0) return
    setUploading((n) => n + list.length)
    for (const file of list) {
      const att = await uploadAttachment(file)
      setUploading((n) => n - 1)
      if (att) setPending((prev) => [...prev, att])
    }
  }

  const canSend = !disabled && uploading === 0 && (draft.trim().length > 0 || pending.length > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSend) return
    coastalAudio.playPop(640, 0.06)
    const text = draft.trim()
    const atts = pending
    setDraft('')
    setPending([])
    await onSend(text, atts)
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#edf2f9] bg-white p-3">
      {(pending.length > 0 || uploading > 0) && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {pending.map((att) => (
            <span
              key={att.id}
              className="relative flex items-center gap-1.5 rounded-xl bg-[#f1f5fc] p-1 pr-6 text-[10px] font-bold text-[#3b3777]"
            >
              {att.kind === 'image' ? (
                <img src={attachmentUrl(att)} alt={att.name} className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <FileText className="ml-1 h-4 w-4" />
              )}
              <span className="max-w-[110px] truncate">{att.name}</span>
              <button
                type="button"
                onClick={() => setPending((prev) => prev.filter((p) => p.id !== att.id))}
                className="absolute top-1 right-1 rounded-full bg-white p-0.5 text-[#9ea4be] hover:text-[#f2676f]"
                aria-label={`Remover ${att.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {uploading > 0 && (
            <span className="flex items-center gap-1.5 rounded-xl bg-[#e9fbf7] px-2.5 py-1 text-[10px] font-extrabold text-[#01967e]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Enviando {uploading}...
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1f5fc] text-[#3b82f6] hover:bg-[#e4ecf9]"
          title="Enviar foto"
          aria-label="Enviar foto"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1f5fc] text-[#6366f1] hover:bg-[#e4ecf9]"
          title="Enviar arquivo"
          aria-label="Enviar arquivo"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files)
            if (files.length > 0) {
              e.preventDefault()
              void addFiles(files)
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-full border-2 border-[#edf2f9] bg-[#f5f8fd] px-3.5 py-2 text-xs font-bold text-[#3b3777] placeholder:text-[#9ea4be] focus:border-[#02c6a7] focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#20e4c4] to-[#02c6a7] text-white shadow-md transition-transform hover:scale-105 disabled:opacity-45"
          title="Enviar"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
