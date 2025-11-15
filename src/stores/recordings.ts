import { ref, computed } from "vue";
import { defineStore } from "pinia";

import { GIFEncoder, quantize, applyPalette } from "gifenc";

export const useRecordingsStore = defineStore("recordings", () => {
  const isRecording = ref<boolean>(false);
  const mediaRecorder = ref<any>(null);
  const recordedChunks = ref<any[]>([]);
  const recordedFrames = ref<any[]>([]);
  const recordingTime = ref<any>("0:00");

  const showExportOptions = ref<boolean>(false);

  const recordingInterval = ref<any>(null);
  const recordingStartTime = ref<any>(0);
  const gifCaptureInterval = ref<any>(null);

  const startRecording = async (canvas: any) => {
    if (!canvas) return;

    try {
      // Create a stream from the canvas
      const stream = canvas.captureStream(30); // 30 FPS

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

      mediaRecorder.value.ondataavailable = (event: any) => {
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
      gifCaptureInterval.value = setInterval(() => {
        if (canvas) {
          recordedFrames.value.push(canvas.toDataURL("image/png"));
        }
      }, 100); // Capture every 100ms = 10 FPS for GIF

      // Start recording timer
      recordingStartTime.value = Date.now();
      recordingInterval.value = setInterval(updateRecordingTime, 1000);
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
      if (gifCaptureInterval.value) {
        clearInterval(gifCaptureInterval.value);
        gifCaptureInterval.value = null;
      }

      // Stop recording timer
      if (recordingInterval.value) {
        clearInterval(recordingInterval.value);
        recordingInterval.value = null;
      }
      recordingTime.value = "0:00";
    }
  };

  const updateRecordingTime = () => {
    const elapsed = Math.floor((Date.now() - recordingStartTime.value) / 1000);
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

  const downloadAsGIF = async (event: any, height: any, width: any) => {
    if (recordedFrames.value.length === 0) {
      alert("No frames captured for GIF export");
      return;
    }

    try {
      // Show processing message
      const originalText = "Download as GIF";
      const button = event.target?.closest("button");
      if (button) button.textContent = "Creating GIF...";

      // Use gifenc library for GIF creation

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
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext("2d");

        if (!ctx) continue;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        const palette = quantize(imageData.data, 256);
        const index = applyPalette(imageData.data, palette);

        gif.writeFrame(index, width, height, {
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
    } catch (error: any) {
      console.error("Failed to create GIF:", error);
      alert("Failed to create GIF: " + error.message);
    }
  };

  return {
    isRecording,
    recordedFrames,
    recordedChunks,
    recordingTime,
    mediaRecorder,
    downloadAsGIF,
    downloadAsWebM,
    updateRecordingTime,
    startRecording,
    stopRecording,
    showExportOptions,
    recordingInterval,
    recordingStartTime,
    gifCaptureInterval,
  };
});
