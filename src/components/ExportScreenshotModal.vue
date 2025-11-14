<template>
  <!-- Export Options Modal -->
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Export Recording</h2>
      <p class="text-gray-600 mb-6">Choose your export format:</p>

      <div class="space-y-3">
        <button
          class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
          @click="emit('screenshot-jpg')"
        >
          <span>Download as JPG</span>
        </button>

        <!--         <button
          class="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
          @click="emit('screenshot-hq')"
        >
          <span>HQ (2x)</span>
          <span class="text-sm opacity-80">Best Quality</span>
        </button>
 -->
        <button
          class="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
          @click="emit('screenshot-with-info')"
        >
          <span>Meta JPG</span>
          <span class="text-sm opacity-80">JPG with info</span>
        </button>

        <button
          class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
          @click="emit('copy-clipboard')"
        >
          <span>Copy</span>
          <span class="text-sm opacity-80">To clipboard</span>
        </button>
      </div>

      <button
        class="w-full mt-4 text-gray-600 hover:text-gray-800 font-medium py-2"
        @click="emit('close')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits([
  "screenshot-jpg",
  "screenshot-hq",
  "screenshot-with-info",
  "copy-clipboard",
  "close",
]);
</script>
