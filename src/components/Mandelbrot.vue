<template>
  <div class="mandelbrot-container">
    <canvas 
      ref="canvas" 
      width="800" 
      height="800"
      @mousedown="zoom"
      class="border border-gray-300 cursor-crosshair"
    ></canvas>
    
    <div class="info-panel mt-4 p-4 bg-gray-100 rounded">
      <p class="text-sm"><strong>Click to zoom in!</strong></p>
      <p class="text-xs mt-2">Location: {{ interestingPoints[currentPointIndex].name }}</p>
      <p class="text-xs">X: {{ xmin.toFixed(6) }}</p>
      <p class="text-xs">Y: {{ ymin.toFixed(6) }}</p>
      <p class="text-xs">Scale: {{ scale.toFixed(2) }}</p>
      <p class="text-xs text-orange-600" v-if="isAutoZooming && sameFrameCount > 0">
        ⚠ Boring region detected: {{ sameFrameCount }}/{{ maxSameFrames }}
      </p>
      
      <div class="mt-3">
        <label class="text-xs block mb-1">Color Scheme:</label>
        <select 
          v-model="colorScheme" 
          @change="mandel"
          class="w-full px-3 py-2 border rounded"
        >
          <option value="fire">Fire (Red-Yellow-White)</option>
          <option value="ocean">Ocean (Blue-Cyan-White)</option>
          <option value="sunset">Sunset (Orange-Pink-Purple)</option>
          <option value="forest">Forest (Green-Teal-Brown)</option>
          <option value="lavender">Lavender Dream (Purple-Pink-White)</option>
          <option value="copper">Copper (Brown-Orange-Gold)</option>
          <option value="ice">Ice (White-Cyan-Blue)</option>
          <option value="cherry">Cherry Blossom (Pink-White-Rose)</option>
          <option value="midnight">Midnight (Navy-Purple-Magenta)</option>
          <option value="autumn">Autumn (Red-Orange-Yellow-Brown)</option>
          <option value="mint">Mint (Mint-Teal-Emerald)</option>
          <option value="peacock">Peacock (Teal-Blue-Green-Gold)</option>
          <option value="rainbow">Rainbow</option>
          <option value="grayscale">Grayscale</option>
          <option value="rgb">Red-Green-Blue (Classic)</option>
          <option value="hacker">Hacker Green (Black → Lime → Cyan)</option>
          <option value="matrix">Matrix (Black → Neon Green)</option>
          <option value="cyberpunk">Cyberpunk (Magenta → Purple → Cyan)</option>
          <option value="firestorm">Firestorm</option>
        <option value="oceanic">Oceanic</option>
        <option value="aurora">Aurora</option>
        <option value="glacier">Glacier</option>
        <option value="royal">Royal</option>
        <option value="spectrum">Spectrum</option>
        <option value="hacker-pro">Hacker Green (Black → Lime → Cyan)</option>
          <option value="matrix-pro">Matrix (Black → Neon Green)</option>
          <option value="cyberpunk-pro">Cyberpunk (Magenta → Purple → Cyan)</option>
        </select>
      </div>
      
      <div class="mt-3">
        <label class="text-xs block mb-1">Select Region to Zoom:</label>
        <select 
          v-model="selectedRegion" 
          @change="jumpToRegion"
          class="w-full px-3 py-2 border rounded"
        >
          <option :value="null">-- Choose a region --</option>
          <option v-for="(point, index) in interestingPoints" :key="index" :value="index">
            {{ point.name }}
          </option>
        </select>
      </div>
      
      <div class="flex flex-wrap gap-2 mt-3">
        <button 
          @click="toggleAutoZoom" 
          :class="[
            'px-4 py-2 rounded transition',
            isAutoZooming ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600',
            'text-white'
          ]"
        >
          {{ isAutoZooming ? 'Stop Auto Zoom' : 'Start Auto Zoom' }}
        </button>
        
        <button 
          @click="reset" 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Reset
        </button>

        <button 
          @click="clickAutoZoomMode = !clickAutoZoomMode"
          :class="[
            'px-4 py-2 rounded transition',
            clickAutoZoomMode ? 'bg-purple-500 hover:bg-purple-600' : 'bg-gray-400 hover:bg-gray-500',
            'text-white'
          ]"
        >
          {{ clickAutoZoomMode ? 'Click AutoZoom: ON' : 'Click AutoZoom: OFF' }}
        </button>
        <button 
  @click="randomExploreMode = !randomExploreMode"
  :class="[
    'px-4 py-2 rounded transition',
    randomExploreMode ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-400 hover:bg-gray-500',
    'text-white'
  ]"
>
  {{ randomExploreMode ? 'Random Explore: ON' : 'Random Explore: OFF' }}
</button>
      </div>
      
      <div class="mt-3">
        <label class="text-xs block mb-1">Zoom Speed: {{ zoomSpeed }}ms ({{ Math.round(1000/zoomSpeed) }} fps)</label>
        <input 
          v-model.number="zoomSpeed" 
          type="range" 
          min="16" 
          max="200" 
          step="16"
          class="w-full"
          :disabled="isAutoZooming"
        />
        <div class="flex justify-between text-xs text-gray-500">
          <span>Fast (60fps)</span>
          <span>Slow (5fps)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const canvas = ref(null);
const xmin = ref(-2);
const ymin = ref(-2);
const scale = ref(50);
const isAutoZooming = ref(false);
const clickAutoZoomMode = ref(false);
const zoomSpeed = ref(50);
const colorScheme = ref('fire');
const selectedRegion = ref(null);
let autoZoomInterval = null;
let clickZoomTarget = null;

// Frame comparison for detecting boring regions
let previousFrameData = null;
let sameFrameCount = 0;
const maxSameFrames = 100;
const similarityThreshold = 0.95;

// Color scheme generators
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

const interestingPoints = [
  // 🧠 Classic iconic spots
  { x: -0.7453, y: 0.1127, name: "Elephant Valley" },
  { x: -0.743643887037151, y: 0.13182590420533, name: "Triple Spiral Valley" },
  { x: -0.745, y: 0.105, name: "Elephant Trunk Detail" },
  { x: -0.7269, y: 0.1889, name: "Double Spiral" },
  { x: 0.3, y: 0.0, name: "Seahorse Valley" },
  { x: -0.1592, y: 1.0317, name: "Needle" },
  { x: -0.1011, y: 0.9563, name: "Satellite" },
  
  // 🌪 Fractal vortexes and mini Mandelbrots
  { x: -1.25066, y: 0.02012, name: "Mandelbrot Mini (Left Arm)" },
  { x: -1.3107, y: 0.0659, name: "Mini Spiral Cluster" },
  { x: -0.7435669, y: 0.1314023, name: "Double Spiral Galaxy" },
  { x: -0.77568377, y: 0.13646737, name: "Whirlpool Cluster" },
  { x: -0.7435, y: 0.1314, name: "Celtic Spiral" },
  { x: -0.8008, y: 0.166, name: "Spiral Nebula" },
  { x: -0.748, y: 0.1, name: "Micro Spiral Chain" },
  { x: -0.744, y: 0.133, name: "The Heart of Spirals" },
  
  // 🌊 Organic / tendril shapes
  { x: -1.543689012, y: 0.00005204, name: "Tendril Canyon" },
  { x: -1.05, y: 0.266, name: "Coral Branching" },
  { x: -1.38, y: 0.005, name: "Root Forest" },
  { x: -0.17, y: 1.05, name: "Northern Needle" },
  { x: -0.1592, y: -1.0317, name: "Southern Needle" },
  { x: -0.1015, y: -0.956, name: "Southern Satellite" },

  // 💎 Ultra-deep “microcosms” (great for slow autozoom)
  { x: -0.743643887037158704752191506114774, y: 0.131825904205311970493132056385139, name: "Deep Valley of Spirals (Zoom-Ready)" },
  { x: -0.743643887037151, y: 0.13182590420533, name: "Deep Spiral Cluster" },
  { x: -0.7435669, y: 0.1314023, name: "Galactic Core" },
  { x: -1.94006, y: 0.0001, name: "Far Tendril Island" },
  { x: -0.77568377, y: 0.13646737, name: "Whirlpool Nexus" },
  
  // 💫 Aesthetic symmetry / interesting geometry
  { x: -0.1011, y: 0.9563, name: "Butterfly Wing" },
  { x: -0.745, y: 0.113, name: "Heart Filigree" },
  { x: -0.7451, y: 0.112, name: "Elephant’s Eye" },
  { x: -0.800, y: 0.15, name: "Spiral Cathedral" },
  { x: -1.25, y: 0.02, name: "Mini Mandelbrot (Left Arm)" },
  { x: -1.05, y: 0.31, name: "Seaweed Garden" },
  { x: 0.27334, y: 0.00742, name: "Seahorse Tail" },
  { x: -0.74529, y: 0.113075, name: "Fractal Bloom" },
  { x: -0.11125, y: 0.894, name: "Mushroom Valley" },
  { x: -0.747, y: 0.109, name: "Fractal Fireworks" },
  { x: -0.7453, y: 0.1127, name: "Elephant Canyon" },
  { x: -1.77, y: 0.0, name: "Outer Filament" },
  { x: -1.401155, y: 0.0, name: "Necklace Cluster" },
];

let currentPointIndex = 0;

const mandel = () => {
  if (!canvas.value) return;
  const context = canvas.value.getContext('2d');
  const currentPalette = palette.value;

  for (let x = 0; x < 200; x++) {
    for (let y = 0; y < 200; y++) {
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
      context.fillRect(x * 4, 800 - y * 4, 4, 4);
    }
  }

  if (isAutoZooming.value) checkFrameSimilarity();
};

const checkFrameSimilarity = () => {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext('2d');
  const sampled = [];
  for (let x = 0; x < 40; x++) {
    for (let y = 0; y < 40; y++) {
      const d = ctx.getImageData(x * 20, y * 20, 1, 1).data;
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
const randomExploreMode = ref(true);

const skipToNextPoint = () => {
  sameFrameCount = 0;
  previousFrameData = null;
 reset()
  if (randomExploreMode.value) {
    console.log("✨ Random explore jump!");
    const point = getRandomInterestingPoint();
    xmin.value = point.x - 2;
    ymin.value = point.y - 2;
    scale.value = 50;
    mandel();
    toggleAutoZoom();

  } else {
    console.log("🛑 Autozoom stopped (random explore off)");
    toggleAutoZoom();
}
};


const zoom = (event) => {
  if (!canvas.value) return;
  const rect = canvas.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const cx = xmin.value + (mouseX / 4) / scale.value;
  const cy = ymin.value + (200 - mouseY / 4) / scale.value;

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
    xmin.value = cx - (100 / scale.value);
    ymin.value = cy - (100 / scale.value);
    scale.value *= 2;
    mandel();
  }
};

const autoZoom = () => {
  const point = interestingPoints[currentPointIndex];
  const zoomFactor = 1.01;
  const centerX = xmin.value + (200 / scale.value) / 2;
  const centerY = ymin.value + (200 / scale.value) / 2;
  const moveSpeed = 0.02;
  const newCenterX = centerX + (point.x - centerX) * moveSpeed;
  const newCenterY = centerY + (point.y - centerY) * moveSpeed;
  scale.value *= zoomFactor;
  const newViewSize = 200 / scale.value;
  xmin.value = newCenterX - newViewSize / 2;
  ymin.value = newCenterY - newViewSize / 2;
  mandel();
};

const autoZoomToPoint = (target) => {
  const zoomFactor = 1.02;
  const centerX = xmin.value + (200 / scale.value) / 2;
  const centerY = ymin.value + (200 / scale.value) / 2;
  const moveSpeed = 0.05;
  const newCenterX = centerX + (target.x - centerX) * moveSpeed;
  const newCenterY = centerY + (target.y - centerY) * moveSpeed;
  scale.value *= zoomFactor;
  const newViewSize = 200 / scale.value;
  xmin.value = newCenterX - newViewSize / 2;
  ymin.value = newCenterY - newViewSize / 2;
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
  xmin.value = -2; ymin.value = -2; scale.value = 50;
  currentPointIndex = 0;
  sameFrameCount = 0;
  previousFrameData = null;
  selectedRegion.value = null;
  mandel();
};

const jumpToRegion = () => {
  if (selectedRegion.value === null) return;
  if (isAutoZooming.value) toggleAutoZoom();
  currentPointIndex = selectedRegion.value;
  sameFrameCount = 0;
  previousFrameData = null;
  const point = interestingPoints[currentPointIndex];
  const viewSize = 4.0;
  xmin.value = point.x - viewSize / 2;
  ymin.value = point.y - viewSize / 2;
  scale.value = 200 / viewSize;
  mandel();
};

onMounted(() => mandel());
onUnmounted(() => { if (autoZoomInterval) clearInterval(autoZoomInterval); });
</script>

<style scoped>
.mandelbrot-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}
canvas {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.info-panel {
  max-width: 800px;
  width: 100%;
}
</style>
