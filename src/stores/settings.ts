import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', () => {
  const showControlPanel = ref(false)
  const expandControlPanel = ref(false)
  const expandSpeedArea = ref(false)
  const expandLocationArea = ref(false)
  const zoomSpeed = ref(50)
  const colorScheme = ref<string>('fire')

  const selectedRegion = ref<number>(0);

  const clickAutoZoomMode = ref(false);
  const randomExploreMode = ref(false);
  const isAutoZooming = ref(false)

  const isExpanded = computed(() => expandControlPanel.value)
  const formattedSpeed = computed(() => `${zoomSpeed.value}ms (${Math.round(1000 / zoomSpeed.value)} fps)`)

function toggleRandomExplore() {
    randomExploreMode.value = !randomExploreMode.value;
}

  function togglePanel() {
    showControlPanel.value = !showControlPanel.value
  }

  function toggleExpandControlPanel() {
    expandControlPanel.value = !expandControlPanel.value
  }

function toggleExpandLocationArea() {
    expandLocationArea.value = !expandLocationArea.value
  }

function toggleExpandSpeedArea() {
    expandSpeedArea.value = !expandSpeedArea.value
  }
  function setZoomSpeed(speed: number) {
    zoomSpeed.value = speed
  }

  function setColorScheme(scheme: string) {
    colorScheme.value = scheme
  }

  function toggleClickAutoZoomMode() {
    clickAutoZoomMode.value = !clickAutoZoomMode.value
  }

  function toggleAutoZoom() {
    isAutoZooming.value = !isAutoZooming.value
  }

  function setSelectedRegion(region: number) {
    selectedRegion.value = region;
  }

  return {
    showControlPanel,
    expandControlPanel,
    expandSpeedArea,
    expandLocationArea,
    zoomSpeed,
    colorScheme,
    isExpanded,
    formattedSpeed,
    clickAutoZoomMode,
    isAutoZooming,
    selectedRegion,
    randomExploreMode,
    togglePanel,
    toggleExpandControlPanel,
    setZoomSpeed,
    setColorScheme,
    toggleClickAutoZoomMode,
    toggleAutoZoom,
    toggleExpandLocationArea,
    toggleExpandSpeedArea,
    toggleRandomExplore,
    setSelectedRegion
  }
}, {
  persist: true
})
