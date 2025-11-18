# The Mandelverse - Mandelbrot Set Explorer

<p align="left">
    <!-- Last Commit -->
    <img src="https://img.shields.io/github/last-commit/carlosperales95/mandelverse" alt="Last Commit">
    <!-- License -->
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License">
    <!-- Repo Size -->
    <img src="https://img.shields.io/github/repo-size/carlosperales95/mandelverse?label=Repo%20Size" alt="Repo Size">
</p>

<p align="left">
    <!-- Vue 3 -->
    <img src="https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js" alt="Vue 3">
    <!-- TS -->
    <img src="https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square" alt="Typescript">
    <!-- JS -->
    <img src="https://img.shields.io/badge/JavaScript-ES202x-f7df1e?logo=javascript&logoColor=black" alt="JavaScript">
    <!-- Vite -->
    <img src="https://img.shields.io/badge/Vite-Bundled-646cff?logo=vite" alt="Vite">
</p>

An interactive, minimalistic, and visually-focused Mandelbrot fractal explorer built with Vue 3.

<img src="src/assets/detailed-example-photo.png" width="100%" height="100%"/>

The Mandelbrot set is one of the most iconic fractals — an infinitely complex shape generated from the simple iteration:

$$
z_{n+1} = z_n^2 + c
$$

where both **z** and **c** are complex numbers. A point **c** belongs to the Mandelbrot set if the sequence remains bounded (doesn’t escape to infinity).

When visualized, the Mandelbrot set reveals intricate, beautiful patterns that repeat endlessly, showing how complex structures can emerge from simple mathematical rules. 



The Mandelverse lets you freely explore these patterns, zoom into hidden structures, and discover the wild visuals that emerge from this tiny equation.

> [!NOTE]
> High iteration counts or very small pixel scales still greatly increase render time. I want to improve > this in the future to get better performance.


<img src="src/assets/mandelbrot.gif" width="100%" height="100%"/>

## Features

🔍 Exploration
- Click-to-zoom into any point
- Predefined “interesting spots” to jump to instantly
- Customize fractal settings (pixel scale, detail iterations...)
- Random Exploration Mode:
    - Automatically jumps through locations in the set
    - Detects “boring regions” using a configurable threshold

🎥 Video Mode
- Record zoom explorations and export as `.webm` or `.gif`
- Multithreaded rendering for smoother video captures


📸 Camera Mode
- Capture screenshots directly from the explorer
- Export image or copy to clipboard


🎨 Visual Customization
- Completely redesigned color themes
- Multiple palettes for dramatically different fractal moods
- Minimalist and compact UI that maximizes screen space


## How to run it locally?

```bash
npm install
npm run dev
```

## Is this hosted?
It is publicly hosted and can be found here:
https://mandelverse.netlify.app/
