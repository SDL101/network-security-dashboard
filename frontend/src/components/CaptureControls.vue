<template>
  <div class="control-panel">
    <button
      id="startCapture"
      class="control-btn"
      :class="{ 'btn-disabled': networkStore.isCapturing }"
      @click="startCapture"
      :disabled="networkStore.isCapturing"
    >
      <span class="icon">▶️</span>
      <span class="btn-text">Start Capture</span>
    </button>
    <button
      id="stopCapture"
      class="control-btn"
      :class="{ 'btn-disabled': !networkStore.isCapturing }"
      @click="stopCapture"
      :disabled="!networkStore.isCapturing"
    >
      <span class="icon">⏹️</span>
      <span class="btn-text">Stop Capture</span>
    </button>
    <button
      @click="clearLogs"
      class="control-btn"
      :class="{ 'btn-disabled': networkStore.isCapturing }"
      :disabled="networkStore.isCapturing"
    >
      <span class="icon">🗑️</span>
      <span class="btn-text">Clear Logs</span>
    </button>
    <button @click="toggleView" class="control-btn">
      <span class="icon">🔄</span>
      <span class="btn-text">{{
        isScrollView ? "Page View" : "Scroll View"
      }}</span>
    </button>

    <button
      id="exportLogs"
      @click="exportLogs"
      :disabled="!networkStore.totalEvents"
      class="control-btn"
    >
      <span class="icon">📥</span>
      <span class="btn-text">Download Logs as CSV</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useNetworkStore } from "../stores/networkStore";

const networkStore = useNetworkStore();
const isScrollView = ref(false);

console.log("CaptureControls mounted, networkStore:", {
  isCapturing: networkStore.isCapturing,
  hasClearLogs: typeof networkStore.clearLogs === "function",
  availableActions: Object.keys(networkStore),
});

const startCapture = () => {
  networkStore.startCapture();
};

const stopCapture = () => {
  networkStore.stopCapture();
};

const clearLogs = () => {
  console.log("Clear logs button clicked");
  networkStore.clearLogs();
};

const exportLogs = () => {
  networkStore.exportLogs();
};

const toggleView = () => {
  isScrollView.value = !isScrollView.value;
  networkStore.setViewMode(isScrollView.value);
};
</script>

<style scoped>
.control-panel {
  display: flex;
  gap: 12px;
  margin: 20px 0;
  padding: 15px;
  background: var(--surface);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  min-height: 60px;
}

.control-btn {
  height: 42px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  white-space: nowrap;
}

.icon {
  margin-right: 8px;
}

.btn-text {
  font-size: 0.9rem;
}

#exportLogs {
  height: 42px;
  white-space: nowrap;
}
</style>
