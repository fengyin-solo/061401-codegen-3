<script setup lang="ts">
import type { Weather } from '@/types/game'

interface Props {
  currentWeather: Weather
  nextWeather: Weather
}

const props = defineProps<Props>()

function getWeatherBgClass(type: Weather['type']): string {
  switch (type) {
    case 'sunny':
      return 'from-yellow-900/30 to-orange-900/30 border-yellow-700/50'
    case 'rainy':
      return 'from-blue-900/30 to-cyan-900/30 border-blue-700/50'
    case 'cold':
      return 'from-sky-900/30 to-indigo-900/30 border-sky-700/50'
    case 'heatwave':
      return 'from-red-900/30 to-orange-900/30 border-red-700/50'
    case 'foggy':
      return 'from-gray-800/30 to-slate-800/30 border-gray-600/50'
    default:
      return 'from-gray-800/30 to-gray-900/30 border-gray-600/50'
  }
}

function getWeatherTextColor(type: Weather['type']): string {
  switch (type) {
    case 'sunny':
      return 'text-yellow-300'
    case 'rainy':
      return 'text-blue-300'
    case 'cold':
      return 'text-sky-300'
    case 'heatwave':
      return 'text-red-300'
    case 'foggy':
      return 'text-gray-300'
    default:
      return 'text-gray-300'
  }
}
</script>

<template>
  <div class="bg-game-card rounded-2xl p-6 border border-game-border shadow-xl">
    <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
      <span>🌤️</span>
      <span>天气预报</span>
    </h2>
    <div class="grid grid-cols-2 gap-3">
      <div
        :class="[
          'rounded-xl p-4 border bg-gradient-to-br transition-all',
          getWeatherBgClass(currentWeather.type),
        ]"
      >
        <div class="text-gray-400 text-xs mb-1">今日天气</div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-4xl">{{ currentWeather.icon }}</span>
          <span :class="['text-lg font-bold', getWeatherTextColor(currentWeather.type)]">
            {{ currentWeather.name }}
          </span>
        </div>
        <p class="text-gray-300 text-xs leading-relaxed">{{ currentWeather.description }}</p>
      </div>

      <div
        :class="[
          'rounded-xl p-4 border bg-gradient-to-br transition-all opacity-90',
          getWeatherBgClass(nextWeather.type),
        ]"
      >
        <div class="text-gray-400 text-xs mb-1">明日预报</div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-4xl">{{ nextWeather.icon }}</span>
          <span :class="['text-lg font-bold', getWeatherTextColor(nextWeather.type)]">
            {{ nextWeather.name }}
          </span>
        </div>
        <p class="text-gray-300 text-xs leading-relaxed">{{ nextWeather.description }}</p>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-game-border">
      <div class="text-xs text-gray-400 mb-2 flex items-center gap-1">
        <span>💡</span>
        <span>天气影响提示</span>
      </div>
      <div class="text-xs text-gray-300 space-y-1">
        <p v-if="currentWeather.type === 'cold'">
          寒潮回合将消耗木材取暖，无木材则损失生命值
        </p>
        <p v-if="currentWeather.type === 'heatwave'">
          酷暑会加剧口渴值消耗
        </p>
        <p v-if="currentWeather.type === 'rainy'">
          雨天可额外补充水源，但采集效率降低
        </p>
        <p v-if="currentWeather.type === 'sunny'">
          晴天采集效率提升，打猎效果更好
        </p>
        <p v-if="currentWeather.type === 'foggy'">
          大雾降低采集和打猎成功率
        </p>
      </div>
    </div>
  </div>
</template>
