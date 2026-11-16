<script setup lang="ts">
const { visible } = useTostada()
const asset = useAsset()
</script>

<template>
  <img v-if="visible" class="tostada" :src="asset('media/ui/tostada.webp')" alt="¡Tostada!">
</template>

<style scoped>
.tostada {
  position: absolute; right: -4px; bottom: -4px; z-index: 60;
  width: 46%;
  pointer-events: none;
  animation: peek 1.6s ease-in-out forwards;
}
@keyframes peek {
  0% { transform: translate(100%, 100%); }
  20%, 75% { transform: translate(0, 0); }
  100% { transform: translate(100%, 100%); }
}
</style>
