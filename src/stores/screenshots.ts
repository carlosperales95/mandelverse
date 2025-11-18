import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useScreenshotsStore = defineStore("screenshots", () => {
  // Screenshot state
  const isCapturingScreenshot = ref<boolean>(false);
  const cachedTempCanvas = ref<any>(null);

  // Screenshot function
  const takeScreenshot = (format = "png", canvas: any) => {
    if (!canvas) return;
    isCapturingScreenshot.value = true;

    try {
      // Get canvas data as blob
      canvas.toBlob((blob: any) => {
        if (!blob) {
          console.error("Failed to create blob from canvas");
          isCapturingScreenshot.value = false;
          return;
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const timestamp = Date.now();
        const location = "mandelbrot";
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

  // Copy to clipboard (modern browsers)
  const copyScreenshotToClipboard = async (canvas: any) => {
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob: Blob | null) => resolve(blob), "image/png");
      });

      if (!blob) {
        throw new Error("Failed to create blob");
      }

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

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
  const takeScreenshotWithInfo = (
    canvas: any,
    width: any,
    height: any,
    meta: any,
  ) => {
    if (!canvas) return;

    isCapturingScreenshot.value = true;

    try {
      // Create temporary canvas with metadata
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      // Draw the mandelbrot canvas
      tempCtx.drawImage(canvas, 0, 0);

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
        `Location: ${meta.location || "Custom"}`,
        `X: ${meta.xmin.toFixed(8)}`,
        `Y: ${meta.ymin.toFixed(8)}`,
        `Scale: ${meta.scale.toFixed(2)}`,
        `Theme: ${meta.colorScheme}`,
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
        const location = meta.location || "mandelbrot";
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

  const getTempCanvas = (gridWidth: any, gridHeight: any) => {
    if (
      !cachedTempCanvas.value ||
      cachedTempCanvas.value.width !== gridWidth ||
      cachedTempCanvas.value.height !== gridHeight
    ) {
      cachedTempCanvas.value = document.createElement("canvas");
      cachedTempCanvas.value.width = gridWidth;
      cachedTempCanvas.value.height = gridHeight;
    }
    return cachedTempCanvas.value;
  };

  return {
    getTempCanvas,
    takeScreenshotWithInfo,
    copyScreenshotToClipboard,
    takeScreenshot,
    isCapturingScreenshot,
  };
});
