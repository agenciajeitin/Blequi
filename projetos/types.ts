import type { StudioZoneId } from '@funcionarios/types'

export interface ProjectDeliverable {
  id: string
  title: string
  done: boolean
}

export interface AgencyProject {
  id: string
  code: string
  name: string
  phase: 'Fase 0' | 'Fase 1' | 'Fase 1.5' | 'Fase 2' | 'Frente Ray' | 'Frente Kafu' | 'Infraestrutura'
  status: 'active' | 'planning' | 'queued'
  progress: number
  zone: StudioZoneId
  assignedAgentIds: string[]
  stack: string[]
  description: string
  deliverables: ProjectDeliverable[]
}
