import { ref, computed } from 'vue'
import type { GameState, LogEntry, ActionType, ActionEffect, Weather, WeatherType } from '@/types/game'
import { randomEvents } from '@/data/events'

const STORAGE_KEY_HIGH_SCORE = 'survival_game_high_score'
const MAX_STAT = 100

const weatherDefinitions: Record<WeatherType, Weather> = {
  sunny: {
    type: 'sunny',
    name: '晴天',
    icon: '☀️',
    description: '阳光明媚，适合外出活动',
    actionModifiers: {
      gatherWood: { wood: 3 },
      gatherStone: { stone: 2 },
      hunt: { health: 5 },
    },
  },
  rainy: {
    type: 'rainy',
    name: '雨天',
    icon: '🌧️',
    description: '大雨滂沱，水源充足但行动不便',
    actionModifiers: {
      gatherWood: { wood: -4, health: -3 },
      gatherStone: { stone: -3, health: -2 },
      drink: { thirst: -15 },
      hunt: { health: -5, hunger: 5 },
    },
  },
  cold: {
    type: 'cold',
    name: '寒潮',
    icon: '🥶',
    description: '气温骤降，需要消耗更多木材取暖',
    actionModifiers: {
      gatherWood: { health: -5, wood: 2 },
      gatherStone: { health: -6 },
      hunt: { hunger: 8 },
      drink: { wood: -3, thirst: 5 },
    },
  },
  heatwave: {
    type: 'heatwave',
    name: '酷暑',
    icon: '🔥',
    description: '烈日炎炎，水分消耗加剧',
    actionModifiers: {
      gatherWood: { thirst: 8, health: -3 },
      gatherStone: { thirst: 10, health: -4 },
      hunt: { thirst: 6 },
      drink: { thirst: -10 },
    },
  },
  foggy: {
    type: 'foggy',
    name: '大雾',
    icon: '🌫️',
    description: '浓雾弥漫，视野受阻',
    actionModifiers: {
      gatherWood: { wood: -2 },
      gatherStone: { stone: -2 },
      hunt: { health: -8, hunger: 5 },
    },
  },
}

const weatherTypes: WeatherType[] = ['sunny', 'rainy', 'cold', 'heatwave', 'foggy']

const weatherWeights: Record<WeatherType, number> = {
  sunny: 35,
  rainy: 20,
  cold: 15,
  heatwave: 15,
  foggy: 15,
}

function generateWeather(): Weather {
  const totalWeight = weatherTypes.reduce((sum, t) => sum + weatherWeights[t], 0)
  let random = Math.random() * totalWeight
  for (const type of weatherTypes) {
    random -= weatherWeights[type]
    if (random <= 0) {
      return { ...weatherDefinitions[type] }
    }
  }
  return { ...weatherDefinitions.sunny }
}

const actionEffects: Record<ActionType, ActionEffect> = {
  gatherWood: {
    health: -5, hunger: 5, thirst: 3, wood: 10, stone: 0 },
  gatherStone: {
    health: -8, hunger: 6, thirst: 4, wood: 0, stone: 8 },
  hunt: {
    health: 15, hunger: -20, thirst: 5, wood: -5, stone: 0 },
  drink: {
    health: 0, hunger: 2, thirst: -25, wood: -3, stone: 0 },
}

const actionNames: Record<ActionType, string> = {
  gatherWood: '采集木头',
  gatherStone: '采集石头',
  hunt: '打猎',
  drink: '喝水',
}

export function useGame() {
  const state = ref<GameState>({
    health: 80,
    hunger: 30,
    thirst: 30,
    wood: 10,
    stone: 5,
    turn: 0,
    currentWeather: generateWeather(),
    nextWeather: generateWeather(),
    isGameOver: false,
    logs: [],
  })

  const highScore = ref<number>(0)
  let logIdCounter = 0

  const canAct = computed(() => !state.value.isGameOver)

  function loadHighScore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGH_SCORE)
      if (saved) {
        highScore.value = parseInt(saved, 10) || 0
      }
    } catch (e) {
      highScore.value = 0
    }
  }

  function saveHighScore() {
    if (state.value.turn > highScore.value) {
      highScore.value = state.value.turn
      try {
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(highScore.value))
      } catch (e) {
        // ignore
      }
    }
  }

  function addLog(text: string, type: LogEntry['type'] = 'action') {
    state.value.logs.unshift({
      id: ++logIdCounter,
      text,
      type,
      turn: state.value.turn,
    })
    if (state.value.logs.length > 50) {
      state.value.logs.pop()
    }
  }

  function clampStat(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  function applyEffects(effects: ActionEffect) {
    if (effects.health !== undefined) {
      state.value.health = clampStat(state.value.health + effects.health, 0, MAX_STAT)
    }
    if (effects.hunger !== undefined) {
      state.value.hunger = clampStat(state.value.hunger + effects.hunger, 0, MAX_STAT)
    }
    if (effects.thirst !== undefined) {
      state.value.thirst = clampStat(state.value.thirst + effects.thirst, 0, MAX_STAT)
    }
    if (effects.wood !== undefined) {
      state.value.wood = Math.max(0, state.value.wood + effects.wood)
    }
    if (effects.stone !== undefined) {
      state.value.stone = Math.max(0, state.value.stone + effects.stone)
    }
  }

  function mergeEffects(base: ActionEffect, modifier?: ActionEffect): ActionEffect {
    if (!modifier) return { ...base }
    const result: ActionEffect = { ...base }
    const keys: (keyof ActionEffect)[] = ['health', 'hunger', 'thirst', 'wood', 'stone']
    for (const key of keys) {
      if (modifier[key] !== undefined) {
        result[key] = (result[key] || 0) + modifier[key]
      }
    }
    return result
  }

  function getModifiedEffects(action: ActionType): ActionEffect {
    const base = actionEffects[action]
    const modifier = state.value.currentWeather.actionModifiers[action]
    return mergeEffects(base, modifier)
  }

  function getActionModifierDescription(action: ActionType): string[] {
    const modifier = state.value.currentWeather.actionModifiers[action]
    if (!modifier) return []
    const descs: string[] = []
    if (modifier.health) descs.push(`生命${modifier.health > 0 ? '+' : ''}${modifier.health}`)
    if (modifier.hunger) descs.push(`饥饿${modifier.hunger > 0 ? '+' : ''}${modifier.hunger}`)
    if (modifier.thirst) descs.push(`口渴${modifier.thirst > 0 ? '+' : ''}${modifier.thirst}`)
    if (modifier.wood) descs.push(`木材${modifier.wood > 0 ? '+' : ''}${modifier.wood}`)
    if (modifier.stone) descs.push(`石头${modifier.stone > 0 ? '+' : ''}${modifier.stone}`)
    return descs
  }

  function applyWeatherPassiveEffectsFor(weather: Weather) {
    if (weather.type === 'cold') {
      if (state.value.wood > 0) {
        applyEffects({ wood: -2 })
        addLog('寒潮消耗了 2 木材用于取暖', 'event')
      } else {
        applyEffects({ health: -8 })
        addLog('没有木材取暖，寒潮使你的生命值 -8', 'bad')
      }
    }
    if (weather.type === 'heatwave') {
      applyEffects({ thirst: 6 })
      addLog('酷暑使你的口渴值 +6', 'event')
    }
    if (weather.type === 'rainy') {
      applyEffects({ thirst: -4 })
      addLog('雨水缓解了你的口渴 -4', 'good')
    }
  }

  function checkGameOver() {
    if (state.value.health <= 0 || state.value.hunger >= MAX_STAT || state.value.thirst >= MAX_STAT) {
      state.value.isGameOver = true
      saveHighScore()
      addLog('你没能在荒野中生存下来...', 'system')
    }
  }

  function canPerformAction(action: ActionType): boolean {
    if (state.value.isGameOver) return false
    const effects = getModifiedEffects(action)
    if (effects.wood !== undefined && state.value.wood + effects.wood < 0) {
      return false
    }
    if (effects.stone !== undefined && state.value.stone + effects.stone < 0) {
      return false
    }
    return true
  }

  function performAction(action: ActionType) {
    if (!canPerformAction(action)) return

    const activeWeather = state.value.currentWeather

    const base = actionEffects[action]
    const modifier = activeWeather.actionModifiers[action]
    const effects = mergeEffects(base, modifier)
    applyEffects(effects)
    state.value.turn++

    addLog(
      `第 ${state.value.turn} 回合：${actionNames[action]}（${activeWeather.icon}${activeWeather.name}）`,
      'action'
    )

    if (modifier) {
      const modDescs: string[] = []
      if (modifier.health) modDescs.push(`生命${modifier.health > 0 ? '+' : ''}${modifier.health}`)
      if (modifier.hunger) modDescs.push(`饥饿${modifier.hunger > 0 ? '+' : ''}${modifier.hunger}`)
      if (modifier.thirst) modDescs.push(`口渴${modifier.thirst > 0 ? '+' : ''}${modifier.thirst}`)
      if (modifier.wood) modDescs.push(`木材${modifier.wood > 0 ? '+' : ''}${modifier.wood}`)
      if (modifier.stone) modDescs.push(`石头${modifier.stone > 0 ? '+' : ''}${modifier.stone}`)
      if (modDescs.length > 0) {
        addLog(`天气影响：${modDescs.join('，')}`, 'event')
      }
    }

    applyWeatherPassiveEffectsFor(activeWeather)

    const weatherType = activeWeather.type
    const weatherEvents = randomEvents.filter(
      (e) => e.weather && e.weather.includes(weatherType)
    )
    const neutralEvents = randomEvents.filter((e) => !e.weather)
    const pool = weatherEvents.length > 0 && Math.random() < 0.6
      ? weatherEvents
      : neutralEvents
    const event = pool[Math.floor(Math.random() * pool.length)]

    applyEffects(event.effects)
    const eventLogType = event.type === 'good' ? 'good' : event.type === 'bad' ? 'bad' : 'event'
    addLog(event.text, eventLogType)

    state.value.currentWeather = state.value.nextWeather
    state.value.nextWeather = generateWeather()

    addLog(`明日天气预报：${state.value.nextWeather.icon} ${state.value.nextWeather.name} - ${state.value.nextWeather.description}`, 'system')

    checkGameOver()
  }

  function gatherWood() {
    performAction('gatherWood')
  }

  function gatherStone() {
    performAction('gatherStone')
  }

  function hunt() {
    performAction('hunt')
  }

  function drink() {
    performAction('drink')
  }

  function restart() {
    state.value = {
      health: 80,
      hunger: 30,
      thirst: 30,
      wood: 10,
      stone: 5,
      turn: 0,
      currentWeather: generateWeather(),
      nextWeather: generateWeather(),
      isGameOver: false,
      logs: [],
    }
    logIdCounter = 0
    addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')
    addLog(
      `今日天气：${state.value.currentWeather.icon} ${state.value.currentWeather.name} - ${state.value.currentWeather.description}`,
      'system'
    )
    addLog(
      `明日天气预报：${state.value.nextWeather.icon} ${state.value.nextWeather.name} - ${state.value.nextWeather.description}`,
      'system'
    )
  }

  loadHighScore()
  addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')
  addLog(
    `今日天气：${state.value.currentWeather.icon} ${state.value.currentWeather.name} - ${state.value.currentWeather.description}`,
    'system'
  )
  addLog(
    `明日天气预报：${state.value.nextWeather.icon} ${state.value.nextWeather.name} - ${state.value.nextWeather.description}`,
    'system'
  )

  return {
    state,
    highScore,
    canAct,
    canPerformAction,
    getActionModifierDescription,
    gatherWood,
    gatherStone,
    hunt,
    drink,
    restart,
  }
}
