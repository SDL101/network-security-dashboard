<template>
  <div class="filters">
    <select id="eventType" v-model="selectedEventType" @change="filterLogs">
      <option value="">All Events</option>
      <option value="high_severity">High Severity</option>
      <option value="medium_severity">Medium Severity</option>
      <option value="low_severity">Low Severity</option>
      <option value="network_scan">Port Scans</option>
      <option value="external_connection">External Connections</option>
      <option value="normal_traffic">Normal Traffic</option>
    </select>
    <button
      id="exportLogs"
      @click="exportLogs"
      :disabled="!networkStore.totalEvents"
    >
      Export Logs as CSV
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useNetworkStore } from "../stores/networkStore";

const networkStore = useNetworkStore();
const selectedEventType = ref("");

const filterLogs = () => {
  networkStore.filterLogsByType(selectedEventType.value);
};

const exportLogs = () => {
  networkStore.exportLogs();
};
</script>
