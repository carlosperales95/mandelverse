import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useThemesStore = defineStore(
  "themes",
  () => {
    const colorScheme = ref<string>("fire");

    const palette = computed(() => generatePalette(colorScheme.value));

    const fillMode = ref<"border" | "full">("border");

    const hslToRgb = (h: number, s: number, l: number) => {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      const r = hue2rgb(p, q, h + 1 / 3);
      const g = hue2rgb(p, q, h);
      const b = hue2rgb(p, q, h - 1 / 3);
      return [r * 255, g * 255, b * 255];
    };

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const generatePalette = (scheme: string) => {
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
            const c = (h: number) =>
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

    function setColorScheme(scheme: string) {
      colorScheme.value = scheme;
    }

    return {
      palette,
      colorScheme,
      fillMode,
      setColorScheme,
      generatePalette,
      hslToRgb,
    };
  },
  {
    persist: true,
  },
);
