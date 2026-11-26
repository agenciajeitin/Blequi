import { CheckCircle2, Circle, X } from 'lucide-react'
import { STUDIO_ZONES } from '@funcionarios/providers'
import { useAgencyStore } from '@plataforma/store/useAgencyStore'

export function ProjectsDrawer() {
  const isOpen = useAgencyStore((s) => s.isProjectsOpen)
  const projects = useAgencyStore((s) => s.projects)
  const setProjectsOpen = useAgencyStore((s) => s.setProjectsOpen)
  const toggleDeliverable = useAgencyStore((s) => s.toggleDeliverable)

  if (!isOpen) return null

  return (
    <aside className="pointer-events-auto fixed left-4 top-20 bottom-20 z-20 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/12 bg-[#141822]/92 backdrop-blur-2xl shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between border-b border-slate-200/10 p-4">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Projetos da agência
          </h2>
          <p className="text-xs text-slate-400">
            Etapas de construção do estúdio isométrico
          </p>
        </div>
        <button
          type="button"
          onClick={() => setProjectsOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {projects.map((proj) => {
          const zone = STUDIO_ZONES[proj.zone]
          return (
            <div
              key={proj.id}
              className="rounded-2xl border border-slate-200/10 bg-white/[0.025] p-3.5 transition-colors hover:border-slate-200/20"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-200">
                    {proj.code}
                  </span>
                  <span className="text-[11px] font-medium text-blue-300">
                    {proj.phase}
                  </span>
                </div>
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                  {zone.shortName}
                </span>
              </div>

              <h3 className="mt-2 text-sm font-semibold text-white">
                {proj.name}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {proj.description}
              </p>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>Progresso</span>
                  <span className="font-mono text-slate-200">{proj.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${proj.progress}%`,
                      backgroundColor: zone.color,
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                {proj.deliverables.map((del) => (
                  <button
                    key={del.id}
                    type="button"
                    onClick={() => toggleDeliverable(proj.id, del.id)}
                    className="flex w-full items-start gap-2 rounded-lg p-1 text-left text-xs transition-colors hover:bg-white/5 cursor-pointer"
                  >
                    {del.done ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                    )}
                    <span className={del.done ? 'text-slate-500 line-through' : 'text-slate-200'}>
                      {del.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
