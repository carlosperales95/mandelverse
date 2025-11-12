<template>
  <div class="relative w-full h-screen overflow-hidden">
    <canvas
      ref="canvas"
      :width="width"
      :height="height"
      class="cursor-crosshair absolute inset-0"
      @mousedown="zoom"
    ></canvas>
    <!-- <Mandelbrot
        class="cursor-crosshair absolute inset-0"
        :width="width"
        :height="height"
        @zoom="zoom"
    /> -->

    <!-- Overlay Menu Panel -->
    <OverlayMenu
      @change-theme="mandel"
      @reset="reset"
      @jump-region="jumpToRegion"
      @play="toggleAutoZoom"
    />

    <!-- Recording Button -->
    <button
      class="group fixed top-8 right-8 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all duration-300 shadow-lg border-2 p-3 z-50"
      :class="isRecording ? 'border-red-500 animate-pulse' : 'border-white'"
      @click="toggleRecording"
    >
      <VideoCameraIcon v-if="!isRecording" class="h-6 w-6" />
      <StopIcon v-else class="h-6 w-6 text-red-500" />
    </button>

    <!-- Recording Indicator -->
    <div
      v-if="isRecording"
      class="fixed top-8 left-8 bg-red-500/80 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse z-50"
    >
      <div class="w-3 h-3 bg-white rounded-full"></div>
      <span class="font-semibold">Recording {{ recordingTime }}</span>
    </div>

    <!-- Export Options Modal -->
    <div
      v-if="showExportOptions"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="showExportOptions = false"
    >
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Export Recording</h2>
        <p class="text-gray-600 mb-6">Choose your export format:</p>

        <div class="space-y-3">
          <button
            class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
            @click="downloadAsWebM"
          >
            <span>Download as WebM (Video)</span>
            <span class="text-sm opacity-80">Best Quality</span>
          </button>

          <button
            class="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
            @click="downloadAsGIF"
          >
            <span>Download as GIF</span>
            <span class="text-sm opacity-80">Easy Sharing</span>
          </button>
        </div>

        <button
          class="w-full mt-4 text-gray-600 hover:text-gray-800 font-medium py-2"
          @click="showExportOptions = false"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { interestingPoints } from "@/content/locations";
import { useSettingsStore } from "@/stores/settings";
import { storeToRefs } from "pinia";
import OverlayMenu from "@/components/OverlayMenu.vue";
import Decimal from "decimal.js";
import Mandelbrot from "@/components/Mandelbrot.vue";
import { VideoCameraIcon, StopIcon } from "@heroicons/vue/24/solid";

const canvas = ref(null);
const xmin = ref(-2);
const ymin = ref(-2);

const settings = useSettingsStore();

const {
  zoomSpeed,
  colorScheme,
  isAutoZooming,
  clickAutoZoomMode,
  selectedRegion,
  randomExploreMode,
  maxSameFrames,
  similarityThreshold,
  moveSpeed,
  zoomFactor,
  currentPointIndex,
  scale,
  sameFrameCount,
} = storeToRefs(settings);

// Recording state
const isRecording = ref(false);
const mediaRecorder = ref(null);
const recordedChunks = ref([]);
const recordedFrames = ref([]); // For GIF export
const recordingTime = ref("0:00");
const showExportOptions = ref(false);
let recordingInterval = null;
let recordingStartTime = 0;
let gifCaptureInterval = null;

const pixelScale = 4;

const width = ref(window.innerWidth);
const height = ref(window.innerHeight);
const gridWidth = computed(() => width.value / pixelScale);
const gridHeight = computed(() => height.value / pixelScale);

let autoZoomInterval = null;
let clickZoomTarget = null;
let previousFrameData = null;

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

    switch (scheme) {
      case "fire":
        if (t < 0.25) {
          r = t * 4 * 255;
          g = 0;
          b = 0;
        } else if (t < 0.5) {
          r = 255;
          g = (t - 0.25) * 4 * 255;
          b = 0;
        } else if (t < 0.75) {
          r = 255;
          g = 255;
          b = (t - 0.5) * 4 * 255;
        } else {
          r = g = b = 255;
        }
        break;

      case "ocean":
        r = t * 200;
        g = t * 255;
        b = 150 + t * 105;
        break;

      case "sunset":
        r = 255 - t * 100;
        g = 100 + Math.sin(t * Math.PI) * 155;
        b = 150 + t * 105;
        break;

      case "forest":
        r = 34 + t * 150;
        g = 139 + t * 80;
        b = 34 + t * 60;
        break;

      case "lavender":
        r = 150 + t * 105;
        g = 100 + t * 155;
        b = 200 + t * 55;
        break;

      case "copper":
        r = 100 + t * 155;
        g = 50 + t * 150;
        b = 20 + t * 80;
        break;

      case "ice":
        r = 255 - t * 100;
        g = 255 - t * 80;
        b = 255;
        break;

      case "cherry":
        r = 255 - t * 50;
        g = 182 + Math.sin(t * Math.PI) * 73;
        b = 193 + t * 62;
        break;

      case "midnight":
        r = 25 + t * 230;
        g = 25 + t * 100;
        b = 112 + t * 143;
        break;

      case "autumn":
        if (t < 0.33) {
          r = 139 + t * 3 * 116;
          g = t * 3 * 100;
          b = 0;
        } else if (t < 0.66) {
          r = 255;
          g = 100 + (t - 0.33) * 3 * 155;
          b = 0;
        } else {
          r = 255 - (t - 0.66) * 3 * 100;
          g = 255 - (t - 0.66) * 3 * 155;
          b = (t - 0.66) * 3 * 100;
        }
        break;

      case "mint":
        r = 152 - t * 100;
        g = 251 - t * 51;
        b = 152 + t * 50;
        break;

      case "peacock":
        r = Math.sin(t * Math.PI) * 255;
        g = 128 + Math.sin(t * Math.PI * 2) * 127;
        b = 128 + Math.cos(t * Math.PI) * 127;
        break;

      case "rainbow": {
        const rgb = hslToRgb(t, 1, 0.5);
        [r, g, b] = rgb;
        break;
      }

      case "grayscale":
        r = g = b = i;
        break;

      case "rgb":
        if (i < 85) {
          r = i * 3;
          g = 0;
          b = 0;
        } else if (i < 171) {
          r = 0;
          g = 3 * (i - 84);
          b = 0;
        } else {
          r = 0;
          g = 0;
          b = 3 * (i - 170);
        }
        break;

      case "hacker":
        r = 0;
        g = 255 * t;
        b = 255 * Math.pow(t, 2);
        break;

      case "matrix": {
        // Matrix: black → deep green → neon green → slight cyan glow
        const gamma = Math.pow(t, 2.2); // nonlinear ramp for darker darks
        r = 0;
        g = Math.min(255, Math.floor(255 * Math.pow(gamma, 0.5))); // brighter neon effect
        b = Math.floor(50 * gamma); // subtle bluish tint near bright end
        break;
      }

      case "matrix-pro": {
        const intensity = Math.pow(t, 3);
        r = Math.floor(10 * intensity);
        g = Math.floor(255 * Math.pow(t, 0.6));
        b = Math.floor(40 * Math.pow(t, 1.5));
        break;
      }

      case "hacker-pro": {
        // Hacker: deep black → lime → white-green glow
        const glow = Math.pow(t, 1.8); // smoother mid transition
        r = Math.floor(80 * glow); // tiny red for warmth
        g = Math.floor(255 * Math.pow(t, 0.5)); // fast bright ramp for lime
        b = Math.floor(120 * glow); // subtle green-blue hint
        break;
      }

      case "cyberpunk-pro": {
        // Cyberpunk: magenta → violet → cyan glow
        const glow = Math.pow(t, 0.8);
        r = Math.floor(255 - 155 * glow); // magenta to purple
        g = Math.floor(50 + 150 * Math.pow(t, 2)); // purple to cyan tone
        b = Math.floor(180 + 75 * glow); // bright neon cyan accent
        break;
      }

      case "firestorm": {
        // Black → deep red → orange → yellow → white
        const t2 = Math.pow(t, 0.6);
        r = Math.floor(255 * t2);
        g = Math.floor(120 * Math.pow(t, 2));
        b = Math.floor(30 * Math.pow(t, 3));
        break;
      }

      case "oceanic": {
        // Dark navy → blue → turquoise → white
        const t2 = Math.pow(t, 0.8);
        r = Math.floor(20 + 100 * t2);
        g = Math.floor(60 + 190 * Math.pow(t, 1.2));
        b = Math.floor(150 + 105 * t2);
        break;
      }

      case "aurora": {
        // Indigo → green → cyan → magenta → white
        const t2 = Math.pow(t, 0.7);
        r = Math.floor(100 + 155 * Math.sin(2 * Math.PI * t2));
        g = Math.floor(200 * Math.pow(t2, 0.8));
        b = Math.floor(255 * Math.pow(1 - t2, 0.5));
        break;
      }

      case "glacier": {
        // Near black → steel blue → ice white
        const intensity = Math.pow(t, 1.5);
        r = Math.floor(100 * intensity);
        g = Math.floor(180 * Math.pow(t, 0.8));
        b = Math.floor(255 * Math.pow(t, 0.5));
        break;
      }

      case "royal": {
        // Deep purple → violet → gold → white
        const t2 = Math.pow(t, 0.6);
        r = Math.floor(180 + 75 * t2);
        g = Math.floor(80 + 100 * Math.pow(t, 1.5));
        b = Math.floor(200 * (1 - t2));
        break;
      }

      case "spectrum": {
        // Rainbow cycle
        const hue = t * 360;
        const c = (h) =>
          Math.floor(128 + 127 * Math.sin(((h + hue) * Math.PI) / 180));
        r = c(0);
        g = c(120);
        b = c(240);
        break;
      }

      case "cyberpunk":
        r = 255 - t * 155;
        g = t * 200;
        b = 255;
        break;

      default:
        r = g = b = i;
    }

    palette[i] =
      `#${Math.floor(r).toString(16).padStart(2, "0")}${Math.floor(g).toString(16).padStart(2, "0")}${Math.floor(b).toString(16).padStart(2, "0")}`;
  }

  return palette;
};

const hslToRgb = (h, s, l) => {
  let r, g, b;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  r = hue2rgb(p, q, h + 1 / 3);
  g = hue2rgb(p, q, h);
  b = hue2rgb(p, q, h - 1 / 3);
  return [r * 255, g * 255, b * 255];
};

const palette = computed(() => generatePalette(colorScheme.value));

const mandel = () => {
  if (!canvas.value) return;
  const context = canvas.value.getContext("2d");
  const currentPalette = palette.value;

  for (let x = 0; x < gridWidth.value; x++) {
    for (let y = 0; y < gridHeight.value; y++) {
      let i = 0,
        zx = 0,
        zy = 0;
      const cx = xmin.value + x / scale.value;
      const cy = ymin.value + y / scale.value;
      do {
        const xt = zx * zy;
        zx = zx * zx - zy * zy + cx;
        zy = 2 * xt + cy;
        i++;
      } while (i < 255 && zx * zx + zy * zy < 4);
      context.fillStyle = currentPalette[i];
      context.fillRect(
        x * pixelScale,
        height.value - y * pixelScale,
        pixelScale,
        pixelScale,
      );
    }
  }

  if (isAutoZooming.value) checkFrameSimilarity();
};

const checkFrameSimilarity = () => {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext("2d");
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
    if (sim >= similarityThreshold.value) {
      sameFrameCount.value++;
      if (sameFrameCount.value >= maxSameFrames.value) skipToNextPoint();
    } else sameFrameCount.value = 0;
  }
  previousFrameData = sampled;
};

const skipToNextPoint = () => {
  sameFrameCount.value = 0;
  previousFrameData = null;
  reset();
  if (randomExploreMode.value) {
    currentPointIndex.value = Math.floor(
      Math.random() * interestingPoints.length,
    );
    const point = interestingPoints[currentPointIndex.value];
    xmin.value = new Decimal(point.x) - 2;
    ymin.value = new Decimal(point.y) - 2;
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
  const cx = xmin.value + mouseX / pixelScale / scale.value;
  const cy =
    ymin.value + (gridHeight.value - mouseY / pixelScale) / scale.value;

  if (clickAutoZoomMode.value) {
    clickZoomTarget = { x: cx, y: cy };
    if (!isAutoZooming.value) {
      isAutoZooming.value = true;
      previousFrameData = null;
      sameFrameCount.value = 0;
      autoZoomInterval = setInterval(() => {
        autoZoomToPoint(clickZoomTarget);
      }, zoomSpeed.value);
    }
  } else {
    xmin.value = cx - gridWidth.value / 2 / scale.value;
    ymin.value = cy - gridHeight.value / 2 / scale.value;
    scale.value *= 2;
    mandel();
  }
};

const autoZoom = () => {
  const point = interestingPoints[currentPointIndex.value];
  const centerX = xmin.value + gridWidth.value / scale.value / 2;
  const centerY = ymin.value + gridHeight.value / scale.value / 2;
  const newCenterX =
    centerX + (new Decimal(point.x) - centerX) * moveSpeed.value;
  const newCenterY =
    centerY + (new Decimal(point.y) - centerY) * moveSpeed.value;
  scale.value *= zoomFactor.value;
  const newViewSizeX = gridWidth.value / scale.value;
  const newViewSizeY = gridHeight.value / scale.value;
  xmin.value = newCenterX - newViewSizeX / 2;
  ymin.value = newCenterY - newViewSizeY / 2;
  mandel();
};

const autoZoomToPoint = (target) => {
  const centerX = xmin.value + gridWidth.value / scale.value / 2;
  const centerY = ymin.value + gridHeight.value / scale.value / 2;
  const newCenterX = centerX + (target.x - centerX) * moveSpeed.value;
  const newCenterY = centerY + (target.y - centerY) * moveSpeed.value;
  scale.value *= zoomFactor.value;
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
    sameFrameCount.value = 0;
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
  currentPointIndex.value = 0;
  sameFrameCount.value = 0;
  previousFrameData = null;
  selectedRegion.value = 0;
  mandel();
};

const jumpToRegion = () => {
  if (selectedRegion.value === 0) return;
  if (isAutoZooming.value) toggleAutoZoom();
  currentPointIndex.value = parseInt(selectedRegion.value);
  sameFrameCount.value = 0;
  previousFrameData = null;
  const point = interestingPoints[currentPointIndex.value];
  const viewSize = 4.0;
  xmin.value = new Decimal(point.x) - viewSize / 2;
  ymin.value = new Decimal(point.y) - viewSize / 2;
  scale.value = gridWidth.value / viewSize;
  mandel();
};

onMounted(() => {
  nextTick(() => mandel());
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  // Clean up recording if active
  if (isRecording.value) {
    stopRecording();
  }
  if (recordingInterval) {
    clearInterval(recordingInterval);
  }
  if (gifCaptureInterval) {
    clearInterval(gifCaptureInterval);
  }
  if (autoZoomInterval) clearInterval(autoZoomInterval);
  window.removeEventListener("resize", handleResize);
});

// Recording functions
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

const startRecording = async () => {
  if (!canvas.value) return;

  try {
    // Create a stream from the canvas
    const stream = canvas.value.captureStream(30); // 30 FPS

    // Set up MediaRecorder with appropriate codec
    const options = { mimeType: "video/webm;codecs=vp9" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = "video/webm;codecs=vp8";
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm";
      }
    }

    mediaRecorder.value = new MediaRecorder(stream, options);
    recordedChunks.value = [];
    recordedFrames.value = [];

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data);
      }
    };

    mediaRecorder.value.onstop = () => {
      showExportOptions.value = true;
    };

    mediaRecorder.value.start();
    isRecording.value = true;

    // Capture frames for GIF export (at lower fps to reduce size)
    gifCaptureInterval = setInterval(() => {
      if (canvas.value) {
        recordedFrames.value.push(canvas.value.toDataURL("image/png"));
      }
    }, 100); // Capture every 100ms = 10 FPS for GIF

    // Start recording timer
    recordingStartTime = Date.now();
    recordingInterval = setInterval(updateRecordingTime, 1000);
  } catch (error) {
    console.error("Failed to start recording:", error);
    alert("Failed to start recording. Please check browser permissions.");
  }
};

const stopRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
    mediaRecorder.value.stop();
    isRecording.value = false;

    // Stop GIF capture
    if (gifCaptureInterval) {
      clearInterval(gifCaptureInterval);
      gifCaptureInterval = null;
    }

    // Stop recording timer
    if (recordingInterval) {
      clearInterval(recordingInterval);
      recordingInterval = null;
    }
    recordingTime.value = "0:00";
  }
};

const updateRecordingTime = () => {
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  recordingTime.value = `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const downloadAsWebM = () => {
  const blob = new Blob(recordedChunks.value, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mandelbrot-${Date.now()}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  recordedChunks.value = [];
  showExportOptions.value = false;
};

const downloadAsGIF = async () => {
  if (recordedFrames.value.length === 0) {
    alert("No frames captured for GIF export");
    return;
  }

  try {
    // Show processing message
    const originalText = "Download as GIF";
    const button = event.target.closest("button");
    if (button) button.textContent = "Creating GIF...";

    // Use gifenc library for GIF creation
    const { GIFEncoder, quantize, applyPalette } = await import(
      "https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js"
    );

    const gif = GIFEncoder();

    // Process frames
    for (let i = 0; i < recordedFrames.value.length; i++) {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = recordedFrames.value[i];
      });

      // Draw image to a temporary canvas to get pixel data
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width.value;
      tempCanvas.height = height.value;
      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, width.value, height.value);
      const palette = quantize(imageData.data, 256);
      const index = applyPalette(imageData.data, palette);

      gif.writeFrame(index, width.value, height.value, {
        palette,
        delay: 100, // 100ms = 10fps
      });

      // Update progress
      if (button) {
        button.textContent = `Creating GIF... ${Math.round(((i + 1) / recordedFrames.value.length) * 100)}%`;
      }
    }

    gif.finish();

    const blob = new Blob([gif.bytes()], { type: "image/gif" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mandelbrot-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    recordedFrames.value = [];
    showExportOptions.value = false;
  } catch (error) {
    console.error("Failed to create GIF:", error);
    alert("Failed to create GIF: " + error.message);
  }
};

const downloadRecording = () => {
  downloadAsWebM();
};
</script>
