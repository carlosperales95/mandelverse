<template>
    <div class="flex flex-col fixed bottom-24 h-60 w-full z-50">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-6"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-6"
      >
        <div v-show="showControlPanel" class="h-60 w-full flex justify-center p-2">
          <div class="relative flex items-start justify-center md:w-1/2 w-full h-full">
            <!-- Main Control Panel -->
            <div
              class="p-4 w-4/5 h-full bg-black/40 backdrop-blur-xl text-white border-emerald-300 border shadow-2xl rounded-2xl z-50"
            >
              <div class="grid grid-cols-5 gap-2">
                <div class="flex flex-col gap-2 col-span-3">
                  <!-- Control Buttons -->
                  <div class="flex gap-3">
                    <!-- Reset -->
                    <BaseButton
                        v-tooltip="'Reset view'"
                        class="w-14"
                        :colors="['blue']"
                        @click="emit('reset')"
                    >
                      <ArrowPathIcon/>
                    </BaseButton>

                    <!-- Play/Pause -->
                    <BaseButton
                        v-tooltip="isAutoZooming ? 'Pause auto-zoom'  :'Start auto-zoom'"
                        class="w-14"
                        :active="isAutoZooming"
                        :colors="['red', 'emerald']"
                        @click="emit('play')"
                    >
                      <PauseIcon v-if="isAutoZooming"/>
                      <PlayIcon v-else/>
                    </BaseButton>

                    <!-- Click AutoZoom -->
                    <BaseButton
                        class="w-14"
                        :active="clickAutoZoomMode"
                        :colors="['purple']"
                        @click="settings.toggleClickAutoZoomMode"
                    >
                      <ViewfinderCircleIcon v-tooltip="'Start zooming to slected point'"/>
                    </BaseButton>
                  </div>

                  <div class="mb-2 flex gap-2">
                    <BaseButton
                        class="w-14 h-14"
                        :active="expandLocationArea"
                        :colors="['indigo']"
                        @click="settings.toggleExpandLocationArea"
                    >
                      <GlobeEuropeAfricaIcon v-tooltip="'Exploration settings'" />
                    </BaseButton>
                      <div v-show="expandLocationArea" class="transition-all flex flex-col gap-1">
                        <div class="flex gap-2">
                          <input v-model="randomExploreMode" type="checkbox"/>
                          <label>Automatic Explore Mode</label>
                        </div>
                        <SimpleSelector
                            v-model="selectedRegion"
                            class="w-full flex gap-1"
                            :options="interestingPoints"
                            @change="emit('jump-region')"
                        >
                        </SimpleSelector>
                      </div>
                  </div>

                  <!-- Zoom Speed -->
                  <div class="mb-2 flex gap-2">
                    <BaseButton
                        v-tooltip="'Zoom Speed settings'"
                        class="w-14 h-14"
                        :active="expandSpeedArea"
                        :colors="['blue']"
                        @click="settings.toggleExpandSpeedArea"
                    >
                      <ChevronDoubleRightIcon />
                    </BaseButton>
                    <div v-show="expandSpeedArea">
                        <SimpleSlider v-model="zoomSpeed" :disabled="isAutoZooming" min="16" max="192" step="16" >
                          <template #label>
                            {{ formattedSpeed }}
                          </template>
                        </SimpleSlider>
                        <!-- <SimpleSlider v-model="pixelScale" :disabled="isAutoZooming" min="0.1" max="10" step="0.1" >
                            <template #label>
                                <p>{{ pixelScale }}%</p>
                            </template>
                            <template #min>
                                <span>Small (0.1)</span>
                            </template>
                            <template #max>
                                <span>Big (10)</span>
                            </template>
                        </SimpleSlider> -->
                    </div>
                  </div>
                </div>
                <!-- Color Scheme & info -->
                <div class="col-span-2">
                  <div class="flex flex-col gap-2">
                    <SimpleSelector
                        v-model="colorScheme"
                        class="mb-6 flex gap-1"
                        :options="themeOptions"
                        @change="emit('change-theme')"
                    >
                      <label class="block text-sm font-semibold mb-2">
                          <BeakerIcon class="w-8 h-8" />
                      </label>
                    </SimpleSelector>
                    <div class="w-full flex justify-end">
                        <BaseButton
                            class="w-fit"
                            :active="expandControlPanel"
                            :colors="['gray']"
                            @click="settings.toggleExpandControlPanel"
                        >
                        <InformationCircleIcon v-tooltip="'More info'" class="w-8 h-8" />
                      </BaseButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Slide-Out Info Panel -->
            <transition name="slide-right">
              <div
                v-show="expandControlPanel"
                class="absolute top-0 right-0 translate-x-[70%] p-4 w-1/3 h-full bg-black/40 backdrop-blur-xl text-white border-emerald-300 border-l shadow-2xl rounded-r-2xl z-40"
            >
                <div class="bg-white/5 rounded-lg text-sm space-y-2">
                  <p class="font-semibold text-emerald-400">How to Use:</p>
                  <p>• Click anywhere to zoom in</p>
                  <p>• Enable Click AutoZoom for smooth zoom</p>
                  <p>• Auto Zoom explores interesting regions</p>
                  <p>• Random Explore jumps when bored</p>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </Transition>
      
      <div class="w-full flex justify-center p-2">
        <button 
          class="fixed bottom-8 bg-black/40 bg-opacity-10 text-white p-3 rounded-full hover:bg-black/30 transition-all shadow-lg"
          @click="settings.togglePanel()"
        >
            <Bars3Icon v-if="!showControlPanel" class="h-8 w-8" />
            <XMarkIcon v-else class="h-8 w-8" />
        </button>
      </div>
      </div>
</template>

<script setup lang="ts">
import { themeOptions } from '@/content/themes';
import { interestingPoints } from '@/content/locations';
import { ArrowPathIcon, PlayIcon, PauseIcon, ViewfinderCircleIcon, GlobeEuropeAfricaIcon, MapPinIcon, BeakerIcon, InformationCircleIcon, ChevronDoubleRightIcon, Bars3Icon, XMarkIcon } from '@heroicons/vue/24/solid';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';
import SimpleSelector from './base/SimpleSelector.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import SimpleSlider from '@/components/base/SimpleSlider.vue';

const emit = defineEmits(['change-theme', 'jump-region', 'reset', 'play']);

const settings = useSettingsStore();

const { 
    showControlPanel,
    expandControlPanel,
    expandSpeedArea,
    expandLocationArea,
    zoomSpeed,
    colorScheme,
    isAutoZooming,
    clickAutoZoomMode,
    selectedRegion,
    randomExploreMode,
    maxSameFrames,
    similarityThreshold,
    formattedSpeed,
    pixelScale,
} = storeToRefs(settings);
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(0);
  opacity: 0;
}
.slide-right-enter-to {
  transform: translateX(50%);
  opacity: 1;
}

.slide-right-leave-from {
  transform: translateX(50%);
  opacity: 1;
}
.slide-right-leave-to {
  transform: translateX(0);
  opacity: 0;
}

</style>