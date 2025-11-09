<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <header class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">
          Mandelbrot Set Explorer
        </h1>
        <p class="text-gray-600">
          Explore the infinite complexity of the Mandelbrot fractal
        </p>
      </header>
      
      <Mandelbrot />
      
      <footer class="mt-12 text-center text-gray-500 text-sm">
        <p>Built with Vue 3 • Click anywhere to zoom in • Try different color schemes!</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import Mandelbrot from './components/Mandelbrot.vue'
</script>