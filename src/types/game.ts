export type WeatherType = 'sunny' | 'rainy' | 'cold' | 'heatwave' | 'foggy'

export interface Weather {
  type: WeatherType
  name: string
  icon: string
  description: string
  actionModifiers: Partial<Record<ActionType, ActionEffect>>
}

export interface GameState {
  health: number
  hunger: number
  thirst: number
  wood: number
  stone: number
  turn: number
  currentWeather: Weather
  nextWeather: Weather
  isGameOver: boolean
  logs: LogEntry[]
}

export interface LogEntry {
  id: number
  text: string
  type: 'action' | 'event' | 'system' | 'good' | 'bad'
  turn: number
}

export interface RandomEvent {
  id: string
  text: string
  type: 'good' | 'bad' | 'neutral'
  weather?: WeatherType[]
  effects: {
    health?: number
    hunger?: number
    thirst?: number
    wood?: number
    stone?: number
  }
}

export type ActionType = 'gatherWood' | 'gatherStone' | 'hunt' | 'drink'

export interface ActionEffect {
  health?: number
  hunger?: number
  thirst?: number
  wood?: number
  stone?: number
}
