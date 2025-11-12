<template>
  <div class="flex flex-col md:w-3/4 w-full max-w-xl h-full mx-4">
    <div class="relative flex items-start justify-center px-1 md:px-0">
      <!-- Tabs left -->
      <BaseTabs
        class="flex flex-col w-fit -gap-1 justify-center h-full"
        :tabs="[
          {
            name: 'Discovery',
            current: currentTab == 'Discovery',
            icon: MapPinIcon,
            colors: ['indigo'],
          },
          {
            name: 'Zoom',
            current: currentTab == 'Zoom',
            icon: AdjustmentsVerticalIcon,
            colors: ['blue'],
          },
          {
            name: 'Other',
            current: currentTab == 'Other',
            icon: Cog6ToothIcon,
            colors: ['emerald'],
          },
        ]"
        @selected="(name: any) => (currentTab = name)"
      />

      <!-- Main Control Panel -->
      <div
        class="p-4 w-full h-60 bg-black/40 backdrop-blur-xl text-white border-emerald-300 border shadow-2xl rounded-2xl z-50 overflow-y-scroll flex flex-col gap-2"
      >
        <!-- Control Buttons Row -->
        <div class="gap-3 w-full justify-start grid grid-cols-5">
          <!-- Main btns -->
          <div class="flex gap-3 justify-start col-span-3">
            <!-- Reset -->
            <BaseButton
              v-tooltip="'Reset view'"
              class="min-w-14"
              :colors="['blue']"
              @click="emit('reset')"
            >
              <ArrowPathIcon />
            </BaseButton>

            <!-- Play/Pause -->
            <BaseButton
              class="min-w-14"
              :active="isAutoZooming"
              :colors="['red', 'emerald']"
              @click="emit('play')"
            >
              <PauseIcon v-if="isAutoZooming" v-tooltip="'Pause auto-zoom'" />
              <PlayIcon v-else v-tooltip="'Start auto-zoom'" />
            </BaseButton>

            <!-- Click AutoZoom -->
            <BaseButton
              class="min-w-14"
              :active="clickAutoZoomMode"
              :colors="['purple']"
              @click="settings.toggleClickAutoZoomMode"
            >
              <ViewfinderCircleIcon
                v-tooltip="'Start zooming to slected point'"
              />
            </BaseButton>
          </div>
          <!-- Extra btns -->
          <div class="flex gap-3 justify-end col-span-2">
            <BeakerIcon
              v-tooltip="'Change theme'"
              class="h-8 w-8 my-auto"
              :class="expandThemeSelector ? 'fill-emerald-400' : 'fill-white'"
              @click="settings.toggleExpandThemeSelector"
            />
            <InformationCircleIcon
              v-tooltip="'More info'"
              class="h-8 w-8 my-auto"
              :class="expandControlPanel ? 'fill-emerald-400' : 'fill-white'"
              @click="settings.toggleExpandControlPanel"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2 w-full">
          <!-- Location settings tab -->
          <template v-if="currentTab == 'Discovery'">
            <SimpleSelector
              v-model="selectedRegion"
              class="w-full flex gap-1"
              :options="interestingPoints"
              @change="emit('jump-region')"
            />
            <div class="mb-2 flex gap-2">
              <BaseButton
                class="min-w-14 min-h-14"
                :active="randomExploreMode"
                :colors="['indigo']"
                @click="settings.toggleRandomExplore"
              >
                <GlobeEuropeAfricaIcon v-tooltip="'Exploration settings'" />
              </BaseButton>
              <div
                v-show="randomExploreMode"
                class="transition-all md:grid md:grid-cols-2 flex flex-col gap-1 w-full"
              >
                <div class="flex col-span-2 gap-2">
                  <!-- <input v-model="randomExploreMode" type="checkbox" /> -->
                  <label>Automatic Explore Mode</label>
                </div>

                <!-- Similarity thres -->
                <SimpleSlider
                  v-model="similarityThreshold"
                  :disabled="isAutoZooming"
                  min="0.01"
                  max="1"
                  step="0.01"
                >
                  <template #label>
                    <p>{{ similarityThreshold }}%</p>
                  </template>
                  <template #min>
                    <span>Low (0.1)</span>
                  </template>
                  <template #max>
                    <span>High (1)</span>
                  </template>
                </SimpleSlider>

                <!-- Boring area limit -->
                <SimpleSlider
                  v-model="maxSameFrames"
                  :disabled="isAutoZooming"
                  min="0"
                  max="1000"
                  step="50"
                >
                  <template #label>
                    <p>{{ maxSameFrames }} frames</p>
                  </template>
                </SimpleSlider>
              </div>
            </div>
          </template>

          <!-- Overall settings tab -->
          <template v-if="currentTab === 'Zoom'">
            <div class="mb-2 flex gap-2 w-full">
              <BaseButton
                v-tooltip="'Zoom Speed settings'"
                class="min-w-14 min-h-14"
                :active="expandSpeedArea"
                :colors="['blue']"
                @click="settings.toggleExpandSpeedArea"
              >
                <ChevronDoubleRightIcon />
              </BaseButton>
              <div
                v-show="expandSpeedArea"
                class="transition-all md:grid md:grid-cols-2 flex flex-col gap-1 w-full"
              >
                <!-- Zoom Speed -->
                <SimpleSlider
                  v-model="zoomSpeed"
                  :disabled="isAutoZooming"
                  min="2"
                  max="192"
                  step="2"
                >
                  <template #label>
                    {{ formattedSpeed }}
                  </template>
                  <template #min>
                    <span>Fast ({{ Math.round(1000 / 2) }}fps)</span>
                  </template>
                  <template #max>
                    <span>Slow ({{ Math.round(1000 / 192) }}fps)</span>
                  </template>
                </SimpleSlider>

                <!-- Move Speed -->
                <SimpleSlider
                  v-model="moveSpeed"
                  :disabled="false"
                  min="0.01"
                  max="1"
                  step="0.01"
                >
                  <template #label>
                    <p>{{ moveSpeed }} mv</p>
                  </template>
                </SimpleSlider>

                <!-- Zoom Factor -->
                <SimpleSlider
                  v-model="zoomFactor"
                  :disabled="false"
                  min="1.01"
                  max="1.5"
                  step="0.01"
                >
                  <template #label>
                    <p>{{ zoomFactor }}x zoom</p>
                  </template>
                </SimpleSlider>
              </div>
            </div>
          </template>

          <!-- Others -->
          <template v-if="currentTab === 'Other'">
            <div class="mb-2 flex gap-2 w-full">Others</div>
          </template>
        </div>
      </div>

      <!-- Slide-Out Info Panel -->
      <transition name="slide-right">
        <div
          v-show="expandControlPanel"
          class="absolute top-0 right-0 translate-x-[100%] p-4 w-1/3 h-full bg-black/40 backdrop-blur-xl text-white border-emerald-300 border-l shadow-2xl rounded-r-2xl z-40"
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

    <!-- Info spans bottom -->
    <div
      class="relative flex gap-1 items-start justify-center text-white font-semibold text-xs py-1 px-1 md:px-0"
    >
      <span class="px-3 py-1 rounded-lg bg-indigo-400">
        {{ interestingPoints[currentPointIndex].name }}
      </span>
      <span class="px-3 py-1 rounded-lg bg-orange-500/80 backdrop-blur-sm">
        ⚠ Boring region: {{ sameFrameCount }}/{{ maxSameFrames }}
      </span>
      <span class="px-3 py-1 rounded-lg bg-emerald-400">
        Scale: {{ scale.toFixed(1) }}
      </span>
    </div>

    <!-- Theme selctor -->
    <div
      v-if="expandThemeSelector"
      class="absolute left-[60%] -top-14 z-50 bg-black/40 backdrop-blur-xl p-4"
    >
      <SimpleSelector
        v-model="colorScheme"
        class="w-full flex gap-1"
        :options="themeOptions"
        @change="emit('change-theme')"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { themeOptions } from "@/content/themes";
import { interestingPoints } from "@/content/locations";
import {
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  ViewfinderCircleIcon,
  GlobeEuropeAfricaIcon,
  MapPinIcon,
  BeakerIcon,
  InformationCircleIcon,
  ChevronDoubleRightIcon,
  AdjustmentsVerticalIcon,
  Cog6ToothIcon,
} from "@heroicons/vue/24/solid";
import SimpleSelector from "@/components/base/SimpleSelector.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import SimpleSlider from "@/components/base/SimpleSlider.vue";
import BaseTabs from "@/components/base/BaseTabs.vue";
import { useSettingsStore } from "@/stores/settings";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const emit = defineEmits(["change-theme", "jump-region", "reset", "play"]);

const settings = useSettingsStore();

const {
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
  zoomFactor,
  moveSpeed,
  currentPointIndex,
  sameFrameCount,
  scale,
  expandThemeSelector,
} = storeToRefs(settings);

type SettingsTab = "Discovery" | "Zoom" | "Other";
const currentTab = ref<SettingsTab>("Discovery");
</script>
