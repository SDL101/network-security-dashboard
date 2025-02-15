<template>
  <div class="logs-container">
    <table class="logs-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Event Type</th>
          <th>Source IP</th>
          <th>Destination IP</th>
          <th>Protocol</th>
          <th>Severity</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="log in networkStore.logs"
          :key="log.id"
          :class="log.severity.toLowerCase()"
        >
          <td>{{ formatTime(log.timestamp) }}</td>
          <td>{{ log.event_type }}</td>
          <td>{{ log.source_ip }}</td>
          <td>{{ log.destination_ip }}</td>
          <td>{{ log.protocol }}</td>
          <td>{{ log.severity }}</td>
          <td>{{ log.details }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { useNetworkStore } from "../stores/networkStore";

const networkStore = useNetworkStore();

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};
</script>

<style scoped>
.logs-container {
  margin-top: 20px;
  overflow-x: auto;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.logs-table th,
.logs-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.logs-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.logs-table tr:hover {
  background: #f9f9f9;
}

.high {
  background-color: #ffebee;
}

.medium {
  background-color: #fff3e0;
}

.low {
  background-color: #f1f8e9;
}
</style>
