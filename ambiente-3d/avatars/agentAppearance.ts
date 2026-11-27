import type { AgentEmployee, BodyAccessoryId, HeadAccessoryId, ShoeStyleId } from '@funcionarios/types'
import type { CoastalCharacterAppearance } from './CoastalCharacterMesh'

export type EmployeeAppearance = CoastalCharacterAppearance & {
  colorIndex: number
  customBodyColor: string
  customLimbColor: string
  customAccentColor: string
  faceStyle: 'classic' | 'lashes'
  headAccessory: HeadAccessoryId
  bodyAccessory: BodyAccessoryId
  shoeStyle: ShoeStyleId
}

/**
 * Aparência fixa de cada funcionário (cores do corpo, rosto e acessórios).
 * Usada tanto no personagem 3D quanto na foto de perfil do app de mensagens.
 */
export function getEmployeeAppearance(agent: AgentEmployee, index: number): EmployeeAppearance {
  if (agent.id === 'agent-luma') {
    return {
      colorIndex: 0,
      customBodyColor: '#f2785c',
      customLimbColor: '#c95c48',
      customAccentColor: '#f6d35f',
      faceStyle: 'lashes',
      headAccessory: 'sunhat',
      bodyAccessory: 'backpack',
      shoeStyle: 'sandals',
    }
  }
  if (agent.id === 'agent-kael') {
    return {
      colorIndex: 2,
      customBodyColor: '#4c7be8',
      customLimbColor: '#3758b8',
      customAccentColor: '#02c6a7',
      faceStyle: 'classic',
      headAccessory: 'headphones',
      bodyAccessory: 'fannypack',
      shoeStyle: 'sneakers',
    }
  }
  if (agent.id === 'agent-vex') {
    return {
      colorIndex: 1,
      customBodyColor: '#22a6d4',
      customLimbColor: '#2f659c',
      customAccentColor: '#f6d35f',
      faceStyle: 'classic',
      headAccessory: 'visor',
      bodyAccessory: 'wings',
      shoeStyle: 'fast',
    }
  }
  if (agent.id === 'agent-nori') {
    return {
      colorIndex: 3,
      customBodyColor: '#00bcc7',
      customLimbColor: '#445fa8',
      customAccentColor: '#b79cf2',
      faceStyle: 'lashes',
      headAccessory: 'beanie',
      bodyAccessory: 'fannypack',
      shoeStyle: 'boots',
    }
  }

  const headPresets: HeadAccessoryId[] = ['beanie', 'headphones', 'visor', 'sunhat']
  return {
    colorIndex: index % 5,
    customBodyColor: agent.accentColor,
    customLimbColor: '#434b78',
    customAccentColor: '#02c6a7',
    faceStyle: index % 2 === 0 ? 'lashes' : 'classic',
    headAccessory: headPresets[index % headPresets.length],
    bodyAccessory: 'fannypack',
    shoeStyle: 'sneakers',
  }
}
