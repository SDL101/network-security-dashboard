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

    <select
      id="eventType"
      v-model="selectedEventType"
      @change="filterLogs"
      class="event-type-select"
    >
      <option value="">All Events</option>
      <option value="high_severity">High Severity</option>
      <option value="medium_severity">Medium Severity</option>
      <option value="low_severity">Low Severity</option>
      <option value="network_scan">Port Scans</option>
      <option value="large_packet">Large Packets</option>
      <option value="external_connection">External Connections</option>
      <option value="normal_traffic">Normal Traffic</option>
    </select>

    <button
      id="exportLogs"
      @click="exportLogs"
      :disabled="!networkStore.totalEvents"
      class="control-btn"
    >
      <span class="icon">📥</span>
      <span class="btn-text">Export CSV</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useNetworkStore } from "../stores/networkStore";

const networkStore = useNetworkStore();
const selectedEventType = ref("");

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

const filterLogs = () => {
  networkStore.filterLogsByType(selectedEventType.value);
};

const exportLogs = () => {
  networkStore.exportLogs();
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

.event-type-select {
  height: 42px;
  min-width: 180px;
  margin-left: auto;
  padding: 0 12px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px auto;
  padding-right: 30px;
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
