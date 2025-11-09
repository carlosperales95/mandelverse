<template>
  <div class="relative w-full h-screen overflow-hidden">
    <canvas 
      ref="canvas" 
      :width="width" 
      :height="height"
      @mousedown="zoom"
      class="cursor-crosshair absolute inset-0"
    ></canvas>
    
    <!-- Menu Toggle Button -->
    <button 
      @click="showMenu = !showMenu"
      class="fixed top-4 right-4 z-50 bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all shadow-lg"
    >
      <svg v-if="!showMenu" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>

    <!-- Info Badge (Always Visible) -->
    <div class="fixed top-4 left-4 z-40 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm shadow-lg">
      <p class="font-semibold">{{ interestingPoints[currentPointIndex].name }}</p>
      <p class="text-xs opacity-75">Scale: {{ scale.toFixed(2) }}</p>
    </div>

    <!-- Warning Badge -->
    <div v-if="isAutoZooming && sameFrameCount > 0" 
         class="fixed top-20 left-4 z-40 bg-orange-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm shadow-lg">
      ⚠ Boring region: {{ sameFrameCount }}/{{ maxSameFrames }}
    </div>

    <!-- Overlay Menu Panel -->
    <transition name="slide">
      <div v-if="showMenu" class="fixed right-0 top-0 h-full w-96 bg-black/90 backdrop-blur-md text-white z-40 overflow-y-auto shadow-2xl">
        <div class="p-6 pt-20">
          <h2 class="text-2xl font-bold mb-6 text-emerald-400">Controls</h2>
          
          <!-- Color Scheme -->
          <div class="mb-6">
            <label class="block text-sm font-semibold mb-2">Color Scheme</label>
            <select 
              v-model="colorScheme" 
              @change="mandel"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded focus:outline-none focus:border-emerald-400 text-white"
            >
                <option value="rgb">RGB (Classic)</option>
                <option value="hacker">Hacker Green </option>
                <option value="matrix">Matrix</option>
                <option value="cyberpunk">Cyberpunk</option>
                <option value="matrix-pro">💚 Matrix Pro</option>
                <option value="hacker-pro">🖥️ Hacker Pro</option>
                <option value="cyberpunk-pro">💜 Cyberpunk Pro</option>
                <option value="fire">🔥 Fire</option>
                <option value="ocean">🌊 Ocean</option>
                <option value="sunset">🌅 Sunset</option>
                <option value="forest">🌲 Forest</option>
                <option value="lavender">💜 Lavender</option>
                <option value="copper">🟤 Copper</option>
                <option value="ice">❄️ Ice</option>
                <option value="cherry">🌸 Cherry Blossom</option>
                <option value="midnight">🌙 Midnight</option>
                <option value="autumn">🍂 Autumn</option>
                <option value="mint">🌿 Mint</option>
                <option value="peacock">🦚 Peacock</option>
                <option value="rainbow">🌈 Rainbow</option>
                <option value="firestorm">🔥 Firestorm</option>
                <option value="oceanic">🌊 Oceanic</option>
                <option value="aurora">✨ Aurora</option>
                <option value="glacier">🧊 Glacier</option>
                <option value="royal">👑 Royal</option>
                <option value="spectrum">🎨 Spectrum</option>
                <option value="grayscale">Grayscale</option>
            </select>
          </div>

          <!-- Region Selection -->
          <div class="mb-6">
            <label class="block text-sm font-semibold mb-2">Jump to Region</label>
            <select 
              v-model="selectedRegion" 
              @change="jumpToRegion"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded focus:outline-none focus:border-emerald-400 text-white"
            >
              <option :value="null">-- Choose a region --</option>
              <option v-for="(point, index) in interestingPoints" :key="index" :value="index">
                {{ point.name }}
              </option>
            </select>
          </div>

          <!-- Control Buttons -->
          <div class="space-y-3 mb-6">
            <button 
              @click="toggleAutoZoom" 
              :class="[
                'w-full px-4 py-3 rounded-lg font-semibold transition-all',
                isAutoZooming ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
              ]"
            >
              {{ isAutoZooming ? '⏸ Stop Auto Zoom' : '▶️ Start Auto Zoom' }}
            </button>
            
            <button 
              @click="reset" 
              class="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-all"
            >
              🔄 Reset View
            </button>

            <button 
              @click="clickAutoZoomMode = !clickAutoZoomMode"
              :class="[
                'w-full px-4 py-3 rounded-lg font-semibold transition-all',
                clickAutoZoomMode ? 'bg-purple-500 hover:bg-purple-600' : 'bg-gray-600 hover:bg-gray-700'
              ]"
            >
              {{ clickAutoZoomMode ? '✓ Click AutoZoom' : '✗ Click AutoZoom' }}
            </button>

            <button 
              @click="randomExploreMode = !randomExploreMode"
              :class="[
                'w-full px-4 py-3 rounded-lg font-semibold transition-all',
                randomExploreMode ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-600 hover:bg-gray-700'
              ]"
            >
              {{ randomExploreMode ? '✓ Random Explore' : '✗ Random Explore' }}
            </button>
          </div>

          <!-- Zoom Speed -->
          <div class="mb-6">
            <label class="block text-sm font-semibold mb-2">
              Zoom Speed: {{ zoomSpeed }}ms ({{ Math.round(1000/zoomSpeed) }} fps)
            </label>
            <input 
              v-model.number="zoomSpeed" 
              type="range" 
              min="16" 
              max="200" 
              step="16"
              class="w-full"
              :disabled="isAutoZooming"
            />
            <div class="flex justify-between text-xs opacity-75 mt-1">
              <span>Fast (60fps)</span>
              <span>Slow (5fps)</span>
            </div>
          </div>

          <!-- Instructions -->
          <div class="mt-8 p-4 bg-white/5 rounded-lg text-sm space-y-2">
            <p class="font-semibold text-emerald-400">How to Use:</p>
            <p>• Click anywhere to zoom in</p>
            <p>• Enable Click AutoZoom for smooth zoom</p>
            <p>• Auto Zoom explores interesting regions</p>
            <p>• Random Explore jumps when bored</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const canvas = ref(null);
const xmin = ref(-2);
const ymin = ref(-2);
const scale = ref(80);
const isAutoZooming = ref(false);
const clickAutoZoomMode = ref(false);
const zoomSpeed = ref(50);
const colorScheme = ref('fire');
const selectedRegion = ref(null);
const showMenu = ref(false);

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
const similarityThreshold = 0.95;

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

const interestingPoints = [
  // Classics
  { x: -0.7453, y: 0.1127, name: "Elephant Valley" },
  { x: -0.743643887037151, y: 0.13182590420533, name: "Triple Spiral Valley" },
  { x: -0.745, y: 0.105, name: "Elephant Trunk Detail" },
  { x: -0.7269, y: 0.1889, name: "Double Spiral" },
  { x: 0.3, y: 0.0, name: "Seahorse Valley" },
  { x: -0.1592, y: 1.0317, name: "Needle" },
  { x: -0.1011, y: 0.9563, name: "Satellite" },
  
  // Fractal vortexes
  { x: -1.25066, y: 0.02012, name: "Mandelbrot Mini (Left Arm)" },
  { x: -1.3107, y: 0.0659, name: "Mini Spiral Cluster" },
  { x: -0.7435669, y: 0.1314023, name: "Double Spiral Galaxy" },
  { x: -0.77568377, y: 0.13646737, name: "Whirlpool Cluster" },
  { x: -0.7435, y: 0.1314, name: "Celtic Spiral" },
  { x: -0.8008, y: 0.166, name: "Spiral Nebula" },
  { x: -0.748, y: 0.1, name: "Micro Spiral Chain" },
  { x: -0.744, y: 0.133, name: "The Heart of Spirals" },
  
  // Organic shapes
  { x: -1.543689012, y: 0.00005204, name: "Tendril Canyon" },
  { x: -1.05, y: 0.266, name: "Coral Branching" },
  { x: -1.38, y: 0.005, name: "Root Forest" },
  { x: -0.17, y: 1.05, name: "Northern Needle" },
  { x: -0.1592, y: -1.0317, name: "Southern Needle" },
  { x: -0.1015, y: -0.956, name: "Southern Satellite" },

  // Ultra-deep “microcosms” (great for slow autozoom)
  { x: -0.743643887037158704752191506114774, y: 0.131825904205311970493132056385139, name: "Deep Valley of Spirals (Zoom-Ready)" },
  { x: -0.743643887037151, y: 0.13182590420533, name: "Deep Spiral Cluster" },
  { x: -0.7435669, y: 0.1314023, name: "Galactic Core" },
  { x: -1.94006, y: 0.0001, name: "Far Tendril Island" },
  { x: -0.77568377, y: 0.13646737, name: "Whirlpool Nexus" },
  
  // Aesthetic symmetry / interesting geometry
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
const randomExploreMode = ref(true);

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
    toggleAutoZoom();
  } else {
    toggleAutoZoom();
  }
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

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>