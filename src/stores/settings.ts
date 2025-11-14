import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    const showControlPanel = ref(false);
    const expandControlPanel = ref(false);
    const expandSpeedArea = ref(false);
    const expandLocationArea = ref(false);
    const expandThemeSelector = ref(false);

    const maxSameFrames = ref(200);
    const similarityThreshold = ref<number>(1);
    const zoomSpeed = ref(50);

    const selectedRegion = ref<number>(0);
    const clickAutoZoomMode = ref(false);
    const randomExploreMode = ref(false);
    const isAutoZooming = ref(false);

    const moveSpeed = ref(0.05);
    const zoomFactor = ref(1.01);

    const currentPointIndex = ref(0);
    const scale = ref(10);
    const sameFrameCount = ref(0);

    const maxIterations = ref(255);
    const pixelScale = ref(4);

    const mode = ref("video");

    const isExpanded = computed(() => expandControlPanel.value);
    const formattedSpeed = computed(
      () => `${zoomSpeed.value}ms (${Math.round(1000 / zoomSpeed.value)} fps)`,
    );

    function toggleRandomExplore() {
      randomExploreMode.value = !randomExploreMode.value;
    }

    function togglePanel() {
      showControlPanel.value = !showControlPanel.value;
    }

    function toggleExpandControlPanel() {
      expandControlPanel.value = !expandControlPanel.value;
    }

    function toggleExpandThemeSelector() {
      expandThemeSelector.value = !expandThemeSelector.value;
    }

    function toggleExpandLocationArea() {
      expandLocationArea.value = !expandLocationArea.value;
    }

    function toggleExpandSpeedArea() {
      expandSpeedArea.value = !expandSpeedArea.value;
    }
    function setZoomSpeed(speed: number) {
      zoomSpeed.value = speed;
    }

    function toggleClickAutoZoomMode() {
      clickAutoZoomMode.value = !clickAutoZoomMode.value;
    }

    function toggleAutoZoom() {
      isAutoZooming.value = !isAutoZooming.value;
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
      isExpanded,
      formattedSpeed,
      clickAutoZoomMode,
      isAutoZooming,
      selectedRegion,
      randomExploreMode,
      maxSameFrames,
      similarityThreshold,
      moveSpeed,
      zoomFactor,
      currentPointIndex,
      scale,
      sameFrameCount,
      maxIterations,
      expandThemeSelector,
      pixelScale,
      mode,
      toggleExpandThemeSelector,
      togglePanel,
      toggleExpandControlPanel,
      setZoomSpeed,
      toggleClickAutoZoomMode,
      toggleAutoZoom,
      toggleExpandLocationArea,
      toggleExpandSpeedArea,
      toggleRandomExplore,
      setSelectedRegion,
    };
  },
  {
    persist: true,
  },
);
