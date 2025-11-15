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
    <template v-if="mode == 'video'">
      <RecordButton :is-recording="isRecording" @click="toggleRecording" />
      <RecordingBadge
        :is-recording="isRecording"
        :recording-time="recordingTime"
      />

      <ExportRecordingModal
        v-if="showExportOptions"
        @close="showExportOptions = false"
        @download="handleDownload"
      />
    </template>
    <template v-else>
      <ScreenshotButton @click="showExportOptions = true" />
      <ExportScreenshotModal
        v-if="showExportOptions"
        @close="showExportOptions = false"
        @screenshot="takeScreenshot('png')"
        @screenshot-jpg="takeScreenshot('jpeg')"
        @screenshot-hq="takeHighQualityScreenshot(2)"
        @screenshot-with-info="takeScreenshotWithInfo"
        @copy-clipboard="copyScreenshotToClipboard"
      />
    </template>
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
import RecordButton from "@/components/RecordButton.vue";
import RecordingBadge from "@/components/RecordingBadge.vue";
import ExportRecordingModal from "@/components/ExportRecordingModal.vue";
import { useThemesStore } from "@/stores/themes";
import ScreenshotButton from "@/components/ScreenshotButton.vue";
import ExportScreenshotModal from "@/components/ExportScreenshotModal.vue";
import { useRecordingsStore } from "@/stores/recordings";

const canvas = ref(null);
const xmin = ref(-2);
const ymin = ref(-2);

const settings = useSettingsStore();
const themes = useThemesStore();
const recordings = useRecordingsStore();

const {
  isRecording,
  recordingTime,
  showExportOptions,
  recordingInterval,
  gifCaptureInterval,
} = storeToRefs(recordings);

const { colorScheme, palette, fillMode } = storeToRefs(themes);

const {
  zoomSpeed,
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
  maxIterations,
  pixelScale,
  mode,
} = storeToRefs(settings);

// Recording state

const isRendering = ref(false);

let cachedTempCanvas = null;

const currentPixelScale = computed(() => {
  /*   if (mode.value === "video") return 4; */
  return pixelScale.value;
});

let animationFrameId = null;

const width = ref(window.innerWidth);
const height = ref(window.innerHeight);
const gridWidth = computed(() => width.value / currentPixelScale.value);
const gridHeight = computed(() => height.value / currentPixelScale.value);

let autoZoomInterval = null;
let clickZoomTarget = null;
let previousFrameData = null;

const workers = ref([]);
/* const workerCount = ref(navigator.hardwareConcurrency || 8);
 */
const workerCount = ref(50);
const workerPool = ref([]);
const isWorkerPoolInitialized = ref(false);

const getAdaptiveIterations = () => {
  /* if (mode.value === 'video') return 255; */

  // Reduce quality when zooming for smoother experience
  if (isAutoZooming.value) {
    return Math.min(maxIterations.value, 500);
  }

  return maxIterations.value;
};

const adaptiveWorkerCount = computed(() => {
  const cores = navigator.hardwareConcurrency || 4;

  // Use fewer workers in video mode for smoother performance
  /*  if (mode.value === 'video') {
    return Math.max(2, Math.floor(cores / 2)); // Use half the cores
  } */

  // Use more workers for high-quality mode with high iterations
  const baseWorkers = cores;
  if (maxIterations.value > 2000) {
    return Math.min(baseWorkers * 2, 16);
  }
  return baseWorkers;
});

const initializeWorkerPool = () => {
  if (isWorkerPoolInitialized.value) return;

  const count = adaptiveWorkerCount.value;
  workerPool.value = [];

  for (let i = 0; i < count; i++) {
    workerPool.value.push(createWorkerFromFunction(workerFunction));
  }

  isWorkerPoolInitialized.value = true;
};

// Handlers
const handleResize = () => {
  width.value = window.innerWidth;
  height.value = window.innerHeight;
  mandel();
};

const handleDownload = (format) => {
  if (format === "gif")
    recordings.downloadAsGIF(event, width.value, height.value);
  if (format === "webm") recordings.downloadAsWebM();
};

const createWorkerFromFunction = (fn) => {
  const blob = new Blob(["(" + fn.toString() + ")()"], {
    type: "application/javascript",
  });
  return new Worker(URL.createObjectURL(blob));
};

const workerFunction = function () {
  self.onmessage = function (e) {
    const {
      startX,
      endX,
      startY,
      endY,
      xmin,
      ymin,
      scale,
      maxIterations,
      palette,
      fillMode,
    } = e.data;

    const parseColor = (colorStr) => {
      if (colorStr.startsWith("#")) {
        const hex = colorStr.slice(1);
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      } else if (colorStr.startsWith("rgb")) {
        const match = colorStr.match(/\d+/g);
        return {
          r: parseInt(match[0]),
          g: parseInt(match[1]),
          b: parseInt(match[2]),
        };
      }
      return { r: 0, g: 0, b: 0 };
    };

    const width = endX - startX;
    const height = endY - startY;
    const imageData = new ImageData(width, height);
    const data = imageData.data;
    const escapeRadius = 4;
    const escapeRadiusSq = escapeRadius * escapeRadius;

    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        let i = 0,
          zx = 0,
          zy = 0;
        const cx = xmin + x / scale;
        const cy = ymin + y / scale;

        // Early bailout for main cardioid and period-2 bulb
        const q = (cx - 0.25) * (cx - 0.25) + cy * cy;
        if (
          q * (q + (cx - 0.25)) < 0.25 * cy * cy ||
          (cx + 1) * (cx + 1) + cy * cy < 0.0625
        ) {
          i = maxIterations;
        } else {
          // Optimized iteration with periodicity checking
          let oldZx = 0,
            oldZy = 0;
          let period = 0;
          const checkPeriod = 20;

          while (i < maxIterations) {
            const zxSq = zx * zx;
            const zySq = zy * zy;

            if (zxSq + zySq > escapeRadiusSq) break;

            zy = 2 * zx * zy + cy;
            zx = zxSq - zySq + cx;
            i++;

            // Periodicity checking - if orbit is repeating, it's in the set
            if (zx === oldZx && zy === oldZy) {
              i = maxIterations;
              break;
            }

            period++;
            if (period > checkPeriod) {
              period = 0;
              oldZx = zx;
              oldZy = zy;
            }
          }
        }

        const colorin = Math.floor((i / maxIterations) * 255);
        const colorIndex = i >= maxIterations ? 0 : colorin;
        const color =
          fillMode === "full" ? palette[colorin] : palette[colorIndex];

        const rgb = parseColor(color);
        const idx = ((y - startY) * width + (x - startX)) * 4;
        data[idx] = rgb.r;
        data[idx + 1] = rgb.g;
        data[idx + 2] = rgb.b;
        data[idx + 3] = 255;
      }
    }

    self.postMessage({ imageData, startX, startY, width, height });
  };
};

// Frame Similarity function
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
  const cx = xmin.value + mouseX / currentPixelScale.value / scale.value;
  const cy =
    ymin.value +
    (gridHeight.value - mouseY / currentPixelScale.value) / scale.value;

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

const mandel = async () => {
  if (!canvas.value || isRendering.value) return;

  isRendering.value = true;

  try {
    // Initialize worker pool on first use
    if (!isWorkerPoolInitialized.value) {
      initializeWorkerPool();
    }

    const context = canvas.value.getContext("2d");
    const currentPalette = palette.value;
    /* const currentMaxIterations = mode.value === 'video' ? 255 : maxIterations.value; */
    const currentMaxIterations = getAdaptiveIterations();

    const tempCanvas = getTempCanvas();
    // Create a temporary canvas to composite results
    tempCanvas.width = gridWidth.value;
    tempCanvas.height = gridHeight.value;
    const tempCtx = tempCanvas.getContext("2d", { alpha: false });

    // Divide work among workers
    const workersToUse = Math.min(workerPool.value.length, gridWidth.value);
    const chunkWidth = Math.ceil(gridWidth.value / workersToUse);

    const promises = [];

    for (let i = 0; i < workersToUse; i++) {
      const worker = workerPool.value[i];
      const startX = i * chunkWidth;
      const endX = Math.min((i + 1) * chunkWidth, gridWidth.value);

      const promise = new Promise((resolve) => {
        const handler = (e) => {
          const { imageData, startX, startY } = e.data;
          tempCtx.putImageData(imageData, startX, startY);
          worker.removeEventListener("message", handler);
          resolve();
        };

        worker.addEventListener("message", handler);

        worker.postMessage({
          startX,
          endX,
          startY: 0,
          endY: gridHeight.value,
          xmin: xmin.value,
          ymin: ymin.value,
          scale: scale.value,
          maxIterations: currentMaxIterations,
          palette: currentPalette,
          fillMode: fillMode.value,
          pixelScale: currentPixelScale.value,
          gridHeight: gridHeight.value,
        });
      });

      promises.push(promise);
    }

    await Promise.all(promises);

    // Draw everything at once
    context.clearRect(0, 0, width.value, height.value);
    context.save();
    context.scale(currentPixelScale.value, -currentPixelScale.value);
    context.drawImage(tempCanvas, 0, -gridHeight.value);
    context.restore();

    if (isAutoZooming.value) checkFrameSimilarity();
  } finally {
    isRendering.value = false;
  }
};

const autoZoom = () => {
  if (isRendering.value) {
    // Schedule next frame
    animationFrameId = requestAnimationFrame(autoZoom);
    return;
  }

  const point = interestingPoints[currentPointIndex.value];
  const { newCenterX, newCenterY } = centerToNewCenter(point);
  scale.value *= zoomFactor.value;
  const newViewSizeX = gridWidth.value / scale.value;
  const newViewSizeY = gridHeight.value / scale.value;
  xmin.value = newCenterX - newViewSizeX / 2;
  ymin.value = newCenterY - newViewSizeY / 2;

  mandel().then(() => {
    if (isAutoZooming.value) {
      animationFrameId = requestAnimationFrame(autoZoom);
    }
  });
};

const toggleAutoZoom = () => {
  isAutoZooming.value = !isAutoZooming.value;
  if (isAutoZooming.value) {
    previousFrameData = null;
    sameFrameCount.value = 0;
    autoZoom(); // Start with RAF instead of setInterval
  } else {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (autoZoomInterval) {
      clearInterval(autoZoomInterval);
      autoZoomInterval = null;
    }
  }
};

// Modified autoZoomToPoint to skip if still rendering
const autoZoomToPoint = (target) => {
  if (isRendering.value) return; // Skip this frame if still rendering

  const { newCenterX, newCenterY } = centerToNewCenter(target);
  scale.value *= zoomFactor.value;
  const newViewSizeX = gridWidth.value / scale.value;
  const newViewSizeY = gridHeight.value / scale.value;
  xmin.value = newCenterX - newViewSizeX / 2;
  ymin.value = newCenterY - newViewSizeY / 2;
  mandel();
};

const centerToNewCenter = (point) => {
  const centerX = xmin.value + gridWidth.value / scale.value / 2;
  const centerY = ymin.value + gridHeight.value / scale.value / 2;
  const newCenterX =
    centerX + (new Decimal(point.x) - centerX) * moveSpeed.value;
  const newCenterY =
    centerY + (new Decimal(point.y) - centerY) * moveSpeed.value;

  return { newCenterX, newCenterY };
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

// Recording functions
const toggleRecording = () => {
  if (isRecording.value) {
    recordings.stopRecording();
    return;
  }

  recordings.startRecording(canvas.value);
};

// Screenshot state
const isCapturingScreenshot = ref(false);

// Screenshot function
const takeScreenshot = (format = "png") => {
  if (!canvas.value) return;
  isCapturingScreenshot.value = true;

  try {
    // Get canvas data as blob
    canvas.value.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to create blob from canvas");
        isCapturingScreenshot.value = false;
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = Date.now();
      const location =
        interestingPoints[currentPointIndex.value]?.name || "mandelbrot";
      const filename = `${location.replace(/\s+/g, "-").toLowerCase()}-${timestamp}.${format}`;

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      isCapturingScreenshot.value = false;
    }, `image/${format}`);
  } catch (error) {
    console.error("Screenshot failed:", error);
    isCapturingScreenshot.value = false;
  }
};

// High-quality screenshot (with optional upscaling)
const takeHighQualityScreenshot = async (scaleFactor = 2) => {
  if (!canvas.value) return;
  isCapturingScreenshot.value = true;

  try {
    const button = event.target.closest("button");
    if (button) button.textContent = "Creating HQ";
    // Create a temporary high-res canvas
    const tempCanvas = document.createElement("canvas");
    const tempWidth = width.value * scaleFactor;
    const tempHeight = height.value * scaleFactor;
    tempCanvas.width = tempWidth;
    tempCanvas.height = tempHeight;

    const tempCtx = tempCanvas.getContext("2d");
    const currentPalette = palette.value;
    const tempGridWidth = tempWidth / currentPixelScale.value;
    const tempGridHeight = tempHeight / currentPixelScale.value;
    const tempPixelScale = currentPixelScale.value / scaleFactor;

    // Render at higher resolution
    for (let x = 0; x < tempGridWidth; x++) {
      for (let y = 0; y < tempGridHeight; y++) {
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
        } while (i < maxIterations.value && zx * zx + zy * zy < 4);

        const colorin = Math.floor((i / maxIterations.value) * 255);
        const colorIndex = i >= maxIterations.value ? 0 : colorin;

        tempCtx.fillStyle =
          fillMode.value === "full"
            ? currentPalette[colorin]
            : currentPalette[colorIndex];

        tempCtx.fillRect(
          x * tempPixelScale,
          tempHeight - y * tempPixelScale,
          tempPixelScale,
          tempPixelScale,
        );

        if (button) {
          button.textContent = `Creating HQ... ${Math.round((((x + 1) * (y + 1)) / (tempGridWidth * tempGridHeight)) * 100)}%`;
        }
      }
    }

    // Download the high-res image
    tempCanvas.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to create high-res blob");
        isCapturingScreenshot.value = false;
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = Date.now();
      const location =
        interestingPoints[currentPointIndex.value]?.name || "mandelbrot";
      const filename = `${location.replace(/\s+/g, "-").toLowerCase()}-hq-${timestamp}.png`;

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      isCapturingScreenshot.value = false;
    }, "image/png");
  } catch (error) {
    console.error("High-quality screenshot failed:", error);
    isCapturingScreenshot.value = false;
  }
};

// Copy to clipboard (modern browsers)
const copyScreenshotToClipboard = async () => {
  if (!canvas.value) return;

  try {
    const blob = await new Promise((resolve) => {
      canvas.value.toBlob(resolve, "image/png");
    });

    if (!blob) {
      throw new Error("Failed to create blob");
    }

    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);

    // Optional: Show success notification
    console.log("Screenshot copied to clipboard!");
    // You could add a toast notification here
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    alert(
      "Failed to copy screenshot to clipboard. Your browser may not support this feature.",
    );
  }
};

// Screenshot with metadata overlay
const takeScreenshotWithInfo = () => {
  if (!canvas.value) return;

  isCapturingScreenshot.value = true;

  try {
    // Create temporary canvas with metadata
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width.value;
    tempCanvas.height = height.value;
    const tempCtx = tempCanvas.getContext("2d");

    // Draw the mandelbrot canvas
    tempCtx.drawImage(canvas.value, 0, 0);

    // Add metadata overlay
    const padding = 20;
    const fontSize = 16;
    const lineHeight = 22;

    // Semi-transparent background
    tempCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
    tempCtx.fillRect(padding, padding, 300, 150);

    // Text
    tempCtx.fillStyle = "#ffffff";
    tempCtx.font = `${fontSize}px monospace`;

    const info = [
      `Location: ${interestingPoints[currentPointIndex.value]?.name || "Custom"}`,
      `X: ${xmin.value.toFixed(8)}`,
      `Y: ${ymin.value.toFixed(8)}`,
      `Scale: ${scale.value.toFixed(2)}`,
      `Theme: ${colorScheme.value}`,
      `Date: ${new Date().toLocaleDateString()}`,
    ];

    info.forEach((line, i) => {
      tempCtx.fillText(line, padding + 10, padding + 30 + i * lineHeight);
    });

    // Download
    tempCanvas.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to create blob with info");
        isCapturingScreenshot.value = false;
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = Date.now();
      const location =
        interestingPoints[currentPointIndex.value]?.name || "mandelbrot";
      const filename = `${location.replace(/\s+/g, "-").toLowerCase()}-info-${timestamp}.png`;

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      isCapturingScreenshot.value = false;
    }, "image/png");
  } catch (error) {
    console.error("Screenshot with info failed:", error);
    isCapturingScreenshot.value = false;
  }
};

const getTempCanvas = () => {
  if (
    !cachedTempCanvas ||
    cachedTempCanvas.width !== gridWidth.value ||
    cachedTempCanvas.height !== gridHeight.value
  ) {
    cachedTempCanvas = document.createElement("canvas");
    cachedTempCanvas.width = gridWidth.value;
    cachedTempCanvas.height = gridHeight.value;
  }
  return cachedTempCanvas;
};

// Lifecycle
onMounted(() => {
  nextTick(() => mandel());
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  workerPool.value.forEach((w) => w.terminate());
  workerPool.value = [];
  isWorkerPoolInitialized.value = false;
  // Clean up recording if active
  if (isRecording.value) recordings.stopRecording();

  if (recordingInterval.value) clearInterval(recordingInterval.value);

  if (gifCaptureInterval.value) clearInterval(gifCaptureInterval.value);

  if (autoZoomInterval) clearInterval(autoZoomInterval);

  window.removeEventListener("resize", handleResize);
});
</script>
