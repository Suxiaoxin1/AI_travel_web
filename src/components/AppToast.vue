<template>
  <Teleport to="body">
    <Transition name="app-toast">
      <div
        v-if="ui.toast.visible && ui.toast.message"
        class="app-toast"
        :class="ui.toast.type"
        role="status"
      >
        {{ ui.toast.message }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useUiStore } from '../stores/uiStore.js'

const ui = useUiStore()
</script>

<style scoped>
.app-toast {
  position: fixed;
  left: 50%;
  bottom: 36px;
  transform: translateX(-50%);
  z-index: 12000;
  max-width: min(90vw, 420px);
  padding: 12px 18px;
  border-radius: 999px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  font-family: 'Noto Sans SC', sans-serif;
  pointer-events: none;
}

.app-toast.success { background: #0d6b5c; }
.app-toast.error { background: #c23b22; }
.app-toast.warn { background: #d4a84b; color: #1a1a2e; }
.app-toast.info { background: #1a1a2e; }

.app-toast-enter-active,
.app-toast-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
