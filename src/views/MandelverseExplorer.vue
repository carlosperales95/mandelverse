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

const canvas = ref(null);
const xmin = ref(-2);
const ymin = ref(-2);

const settings = useSettingsStore();
const themes = useThemesStore();

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
const isRecording = ref(false);
const mediaRecorder = ref(null);
const recordedChunks = ref([]);
const recordedFrames = ref([]); // For GIF export
const recordingTime = ref("0:00");
const showExportOptions = ref(false);
let recordingInterval = null;
let recordingStartTime = 0;
let gifCaptureInterval = null;
const currentPixelScale = computed(() => {
  if (mode.value === "video") return 4;
  return pixelScale.value;
});

const width = ref(window.innerWidth);
const height = ref(window.innerHeight);
const gridWidth = computed(() => width.value / currentPixelScale.value);
const gridHeight = computed(() => height.value / currentPixelScale.value);

let autoZoomInterval = null;
let clickZoomTarget = null;
let previousFrameData = null;

// Handlers
const handleResize = () => {
  width.value = window.innerWidth;
  height.value = window.innerHeight;
  mandel();
};

const handleDownload = (format) => {
  if (format === "gif") downloadAsGIF();
  if (format === "webm") downloadAsWebM();
};

// Paint mandelbrot
const mandel = () => {
  if (!canvas.value) return;
  const context = canvas.value.getContext("2d");
  const currentPalette = palette.value;

  const currentMaxIterations =
    mode.value === "video" ? 255 : maxIterations.value;

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
      } while (i < currentMaxIterations && zx * zx + zy * zy < 4);

      const colorin = Math.floor((i / currentMaxIterations) * 255);

      const colorIndex =
        i >= currentMaxIterations
          ? 0 // first color default set points
          : colorin;

      context.fillStyle =
        fillMode.value == "full"
          ? currentPalette[colorin]
          : currentPalette[colorIndex];
      context.fillRect(
        x * currentPixelScale.value,
        height.value - y * currentPixelScale.value,
        currentPixelScale.value,
        currentPixelScale.value,
      );
    }
  }

  /*         } while (i < 255 && zx * zx + zy * zy < 4);
      context.fillStyle = currentPalette[i];
 */

  if (isAutoZooming.value) checkFrameSimilarity();
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

const autoZoom = () => {
  const point = interestingPoints[currentPointIndex.value];
  const { newCenterX, newCenterY } = centerToNewCenter(point);
  scale.value *= zoomFactor.value;
  const newViewSizeX = gridWidth.value / scale.value;
  const newViewSizeY = gridHeight.value / scale.value;
  xmin.value = newCenterX - newViewSizeX / 2;
  ymin.value = newCenterY - newViewSizeY / 2;
  mandel();
};

const autoZoomToPoint = (target) => {
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

// Lifecycle
onMounted(() => {
  nextTick(() => mandel());
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  // Clean up recording if active
  if (isRecording.value) stopRecording();

  if (recordingInterval) clearInterval(recordingInterval);

  if (gifCaptureInterval) clearInterval(gifCaptureInterval);

  if (autoZoomInterval) clearInterval(autoZoomInterval);

  window.removeEventListener("resize", handleResize);
});

// Add these functions to your component's <script setup>

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
</script>
