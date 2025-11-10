# The Mandelverse - Mandelbrot Set Explorer

An interactive Mandelbrot fractal explorer built with Vue 3.

The Mandelbrot set is a famous fractal — a complex, infinitely detailed mathematical shape that exhibits self-similarity at every scale. It’s defined by iterating the simple equation

$$
z_{n+1} = z_n^2 + c
$$

where both **z** and **c** are complex numbers. A point **c** belongs to the Mandelbrot set if the sequence remains bounded (doesn’t escape to infinity).

When visualized, the Mandelbrot set reveals intricate, beautiful patterns that repeat endlessly, showing how complex structures can emerge from simple mathematical rules. 

<img src="src/assets/mandelbrot.gif" width="100%" height="100%"/>

With this simple website, I wanted to dive deeper into this great equation, and give the user total freedom to explore the set and find its beautiful and hidden visuals.

## Features

- Interactive zooming by clicking
- Auto-zoom mode to explore fractal regions
- Pre-defined interesting fractal locations
- Random exploration mode
- Boring region detection
- Multiple color schemes

## How to run it locally?

```bash
npm install
npm run dev
```

## Is this hosted?
It is publicly hosted and can be found here:
https://mandelverse.netlify.app/
