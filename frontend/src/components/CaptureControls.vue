<template>
  <div class="control-panel">
    <button
      id="startCapture"
      class="control-btn"
      @click="startCapture"
      :disabled="networkStore.isCapturing"
    >
      <span class="icon">▶️</span>
      <span class="btn-text">Start Capture</span>
    </button>
    <button
      id="stopCapture"
      class="control-btn"
      @click="stopCapture"
      :disabled="!networkStore.isCapturing"
    >
      <span class="icon">⏹️</span>
      <span class="btn-text">Stop Capture</span>
    </button>
    <button @click="clearLogs" class="control-btn">
      <span class="icon">🗑️</span>
      <span class="btn-text">Clear Logs</span>
    </button>
  </div>
</template>

<script setup>
import { useNetworkStore } from "../../stores/networkStore";

const networkStore = useNetworkStore();

const startCapture = () => {
  networkStore.startCapture();
};

const stopCapture = () => {
  networkStore.stopCapture();
};

const clearLogs = () => {
  networkStore.clearLogs();
};
</script>
