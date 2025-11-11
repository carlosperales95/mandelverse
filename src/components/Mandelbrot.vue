<template>
  <div class="relative w-full h-screen overflow-hidden">
    <canvas 
      ref="canvas" 
      :width="width" 
      :height="height"
      class="cursor-crosshair absolute inset-0"
      @mousedown="zoom"
    ></canvas>

    <!-- Info Badge -->
    <div class="fixed top-4 left-4 z-40 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm shadow-lg">
      <p class="font-semibold">{{ interestingPoints[currentPointIndex].name }}</p>
      <p class="text-xs opacity-75">Scale: {{ scale.toFixed(2) }}</p>
    </div>

    <!-- Warning Badge -->
    <div
      v-if="isAutoZooming && sameFrameCount > 0" 
      class="fixed top-20 left-4 z-40 bg-orange-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm shadow-lg"
    >
      ⚠ Boring region: {{ sameFrameCount }}/{{ maxSameFrames }}
    </div>

    <!-- Overlay Menu Panel -->
    <OverlayMenu
      @change-theme="mandel"
      @reset="reset"
      @jump-region="jumpToRegion"
      @play="toggleAutoZoom"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { interestingPoints } from '@/content/locations';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';
import OverlayMenu from './OverlayMenu.vue';

const canvas = ref(null);
const xmin = ref(-2);
const ymin = ref(-2);
const scale = ref(80);

const settings = useSettingsStore();

const { 
    zoomSpeed,
    colorScheme,
    isAutoZooming,
    clickAutoZoomMode,
    selectedRegion,
    randomExploreMode
} = storeToRefs(settings);

const width = ref(window.innerWidth);
const height = ref(window.innerHeight);
const pixelScale = 4;
const gridWidth = computed(() => width.value / pixelScale);
const gridHeight = computed(() => height.value / pixelScale);

let autoZoomInterval = null;
let clickZoomTarget = null;
let previousFrameData = null;
let sameFrameCount = 0;
const maxSameFrames = 200;
const similarityThreshold = 0.97;

const handleResize = () => {
  width.value = window.innerWidth;
  height.value = window.innerHeight;
  mandel();
};

const generatePalette = (scheme) => {
  const palette = [];
  
  for (let i = 0; i < 256; i++) {
    let r, g, b;
    const t = i / 255;
    
    switch(scheme) {
      case 'fire':
        if (t < 0.25) { r = t * 4 * 255; g = 0; b = 0; }
        else if (t < 0.5) { r = 255; g = (t - 0.25) * 4 * 255; b = 0; }
        else if (t < 0.75) { r = 255; g = 255; b = (t - 0.5) * 4 * 255; }
        else { r = g = b = 255; }
        break;

      case 'ocean':
        r = t * 200; g = t * 255; b = 150 + t * 105; break;

      case 'sunset':
        r = 255 - t * 100; g = 100 + Math.sin(t * Math.PI) * 155; b = 150 + t * 105; break;

      case 'forest':
        r = 34 + t * 150; g = 139 + t * 80; b = 34 + t * 60; break;

      case 'lavender':
        r = 150 + t * 105; g = 100 + t * 155; b = 200 + t * 55; break;

      case 'copper':
        r = 100 + t * 155; g = 50 + t * 150; b = 20 + t * 80; break;

      case 'ice':
        r = 255 - t * 100; g = 255 - t * 80; b = 255; break;

      case 'cherry':
        r = 255 - t * 50; g = 182 + Math.sin(t * Math.PI) * 73; b = 193 + t * 62; break;

      case 'midnight':
        r = 25 + t * 230; g = 25 + t * 100; b = 112 + t * 143; break;

      case 'autumn':
        if (t < 0.33) { r = 139 + t * 3 * 116; g = t * 3 * 100; b = 0; }
        else if (t < 0.66) { r = 255; g = 100 + (t - 0.33) * 3 * 155; b = 0; }
        else { r = 255 - (t - 0.66) * 3 * 100; g = 255 - (t - 0.66) * 3 * 155; b = (t - 0.66) * 3 * 100; }
        break;

      case 'mint':
        r = 152 - t * 100; g = 251 - t * 51; b = 152 + t * 50; break;

      case 'peacock':
        r = Math.sin(t * Math.PI) * 255;
        g = 128 + Math.sin(t * Math.PI * 2) * 127;
        b = 128 + Math.cos(t * Math.PI) * 127;
        break;

      case 'rainbow': {
        const rgb = hslToRgb(t, 1, 0.5);
        [r, g, b] = rgb;
        break;
      }

      case 'grayscale': r = g = b = i; break;

      case 'rgb':
        if (i < 85) { r = i * 3; g = 0; b = 0; }
        else if (i < 171) { r = 0; g = 3 * (i - 84); b = 0; }
        else { r = 0; g = 0; b = 3 * (i - 170); }
        break;

      case 'hacker':
        r = 0; g = 255 * t; b = 255 * Math.pow(t, 2); break;

      case 'matrix': {
        // Matrix: black → deep green → neon green → slight cyan glow
        const gamma = Math.pow(t, 2.2); // nonlinear ramp for darker darks
        r = 0;
        g = Math.min(255, Math.floor(255 * Math.pow(gamma, 0.5))); // brighter neon effect
        b = Math.floor(50 * gamma); // subtle bluish tint near bright end
        break;
        }
        
        case 'matrix-pro': {
        const intensity = Math.pow(t, 3);
        r = Math.floor(10 * intensity);
        g = Math.floor(255 * Math.pow(t, 0.6));
        b = Math.floor(40 * Math.pow(t, 1.5));
        break;
        }

        case 'hacker-pro': {
        // Hacker: deep black → lime → white-green glow
        const glow = Math.pow(t, 1.8);  // smoother mid transition
        r = Math.floor(80 * glow);      // tiny red for warmth
        g = Math.floor(255 * Math.pow(t, 0.5)); // fast bright ramp for lime
        b = Math.floor(120 * glow);     // subtle green-blue hint
        break;
        }

        case 'cyberpunk-pro': {
        // Cyberpunk: magenta → violet → cyan glow
        const glow = Math.pow(t, 0.8);
        r = Math.floor(255 - 155 * glow);           // magenta to purple
        g = Math.floor(50 + 150 * Math.pow(t, 2));  // purple to cyan tone
        b = Math.floor(180 + 75 * glow);            // bright neon cyan accent
        break;
        }

        case 'firestorm': {
        // Black → deep red → orange → yellow → white
        const t2 = Math.pow(t, 0.6);
        r = Math.floor(255 * t2);
        g = Math.floor(120 * Math.pow(t, 2));
        b = Math.floor(30 * Math.pow(t, 3));
        break;
        }

        case 'oceanic': {
        // Dark navy → blue → turquoise → white
        const t2 = Math.pow(t, 0.8);
        r = Math.floor(20 + 100 * t2);
        g = Math.floor(60 + 190 * Math.pow(t, 1.2));
        b = Math.floor(150 + 105 * t2);
        break;
        }

        case 'aurora': {
        // Indigo → green → cyan → magenta → white
        const t2 = Math.pow(t, 0.7);
        r = Math.floor(100 + 155 * Math.sin(2 * Math.PI * t2));
        g = Math.floor(200 * Math.pow(t2, 0.8));
        b = Math.floor(255 * Math.pow(1 - t2, 0.5));
        break;
        }

        case 'glacier': {
        // Near black → steel blue → ice white
        const intensity = Math.pow(t, 1.5);
        r = Math.floor(100 * intensity);
        g = Math.floor(180 * Math.pow(t, 0.8));
        b = Math.floor(255 * Math.pow(t, 0.5));
        break;
        }

        case 'royal': {
        // Deep purple → violet → gold → white
        const t2 = Math.pow(t, 0.6);
        r = Math.floor(180 + 75 * t2);
        g = Math.floor(80 + 100 * Math.pow(t, 1.5));
        b = Math.floor(200 * (1 - t2));
        break;
        }

        case 'spectrum': {
        // Rainbow cycle
        const hue = t * 360;
        const c = (h) => Math.floor(128 + 127 * Math.sin((h + hue) * Math.PI / 180));
        r = c(0); g = c(120); b = c(240);
        break;
        }

      case 'cyberpunk':
        r = 255 - t * 155; g = t * 200; b = 255; break;

      default:
        r = g = b = i;
    }
    
    palette[i] = `#${Math.floor(r).toString(16).padStart(2, '0')}${Math.floor(g).toString(16).padStart(2, '0')}${Math.floor(b).toString(16).padStart(2, '0')}`;
  }
  
  return palette;
};

const hslToRgb = (h, s, l) => {
  let r, g, b;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
  return [r * 255, g * 255, b * 255];
};

const palette = computed(() => generatePalette(colorScheme.value));
let currentPointIndex = 0;

const mandel = () => {  
  if (!canvas.value) return;
  const context = canvas.value.getContext('2d');
  const currentPalette = palette.value;

  for (let x = 0; x < gridWidth.value; x++) {
    for (let y = 0; y < gridHeight.value; y++) {
      let i = 0, zx = 0, zy = 0;
      const cx = xmin.value + x / scale.value;
      const cy = ymin.value + y / scale.value;
      do {
        const xt = zx * zy;
        zx = zx * zx - zy * zy + cx;
        zy = 2 * xt + cy;
        i++;
      } while (i < 255 && (zx * zx + zy * zy) < 4);
      context.fillStyle = currentPalette[i];
      context.fillRect(x * pixelScale, height.value - y * pixelScale, pixelScale, pixelScale);
    }
  }

  if (isAutoZooming.value) checkFrameSimilarity();
};

const checkFrameSimilarity = () => {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext('2d');
  const sampled = [];
  const sampleSize = 40;
  const stepX = Math.floor(width.value / sampleSize);
  const stepY = Math.floor(height.value / sampleSize);
  
  for (let x = 0; x < sampleSize; x++) {
    for (let y = 0; y < sampleSize; y++) {
      const d = ctx.getImageData(x * stepX, y * stepY, 1, 1).data;
      sampled.push((d[0] + d[1] + d[2]) / 3);
    }
  }

  if (previousFrameData) {
    let match = 0;
    for (let i = 0; i < sampled.length; i++) {
      if (Math.abs(sampled[i] - previousFrameData[i]) <= 5) match++;
    }
    const sim = match / sampled.length;
    if (sim >= similarityThreshold) {
      sameFrameCount++;
      if (sameFrameCount >= maxSameFrames) skipToNextPoint();
    } else sameFrameCount = 0;
  }
  previousFrameData = sampled;
};

const skipToNextPoint = () => {
  sameFrameCount = 0;
  previousFrameData = null;
  reset();
  if (randomExploreMode.value) {
    currentPointIndex = Math.floor(Math.random() * interestingPoints.length);
    const point = interestingPoints[currentPointIndex];
    xmin.value = point.x - 2;
    ymin.value = point.y - 2;
    scale.value = 50;
    mandel();
  }
  
  toggleAutoZoom();
};

const zoom = (event) => {
  if (!canvas.value) return;
  const rect = canvas.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const cx = xmin.value + (mouseX / pixelScale) / scale.value;
  const cy = ymin.value + (gridHeight.value - mouseY / pixelScale) / scale.value;

  if (clickAutoZoomMode.value) {
    clickZoomTarget = { x: cx, y: cy };
    if (!isAutoZooming.value) {
      isAutoZooming.value = true;
      previousFrameData = null;
      sameFrameCount = 0;
      autoZoomInterval = setInterval(() => {
        autoZoomToPoint(clickZoomTarget);
      }, zoomSpeed.value);
    }
  } else {
    xmin.value = cx - (gridWidth.value / 2 / scale.value);
    ymin.value = cy - (gridHeight.value / 2 / scale.value);
    scale.value *= 2;
    mandel();
  }
};

const autoZoom = () => {
  const point = interestingPoints[currentPointIndex];
  const zoomFactor = 1.01;
  const centerX = xmin.value + (gridWidth.value / scale.value) / 2;
  const centerY = ymin.value + (gridHeight.value / scale.value) / 2;
  const moveSpeed = 0.02;
  const newCenterX = centerX + (point.x - centerX) * moveSpeed;
  const newCenterY = centerY + (point.y - centerY) * moveSpeed;
  scale.value *= zoomFactor;
  const newViewSizeX = gridWidth.value / scale.value;
  const newViewSizeY = gridHeight.value / scale.value;
  xmin.value = newCenterX - newViewSizeX / 2;
  ymin.value = newCenterY - newViewSizeY / 2;
  mandel();
};

const autoZoomToPoint = (target) => {
  const zoomFactor = 1.02;
  const centerX = xmin.value + (gridWidth.value / scale.value) / 2;
  const centerY = ymin.value + (gridHeight.value / scale.value) / 2;
  const moveSpeed = 0.05;
  const newCenterX = centerX + (target.x - centerX) * moveSpeed;
  const newCenterY = centerY + (target.y - centerY) * moveSpeed;
  scale.value *= zoomFactor;
  const newViewSizeX = gridWidth.value / scale.value;
  const newViewSizeY = gridHeight.value / scale.value;
  xmin.value = newCenterX - newViewSizeX / 2;
  ymin.value = newCenterY - newViewSizeY / 2;
  mandel();
};

const toggleAutoZoom = () => {
  isAutoZooming.value = !isAutoZooming.value;
  if (isAutoZooming.value) {
    previousFrameData = null;
    sameFrameCount = 0;
    autoZoomInterval = setInterval(autoZoom, zoomSpeed.value);
  } else {
    if (autoZoomInterval) {
      clearInterval(autoZoomInterval);
      autoZoomInterval = null;
    }
  }
};

const reset = () => {
  if (isAutoZooming.value) toggleAutoZoom();
  xmin.value = -2;
  ymin.value = -2;
  scale.value = 50;
  currentPointIndex = 0;
  sameFrameCount = 0;
  previousFrameData = null;
  selectedRegion.value = 0;
  mandel();
};

const jumpToRegion = () => {
  if (selectedRegion.value === 0) return;
  if (isAutoZooming.value) toggleAutoZoom();
  currentPointIndex = parseInt(selectedRegion.value);
  sameFrameCount = 0;
  previousFrameData = null;
  const point = interestingPoints[currentPointIndex];
  const viewSize = 4.0;
  xmin.value = point.x - viewSize / 2;
  ymin.value = point.y - viewSize / 2;
  scale.value = gridWidth.value / viewSize;
  mandel();
};

onMounted(() => {
  mandel();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (autoZoomInterval) clearInterval(autoZoomInterval);
  window.removeEventListener('resize', handleResize);
});
</script>