<template>
  <div class="connection-status" :class="networkStore.connectionStatus">
    {{ statusMessage }}
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useNetworkStore } from "../stores/networkStore";

const networkStore = useNetworkStore();

const statusMessage = computed(() => {
  switch (networkStore.connectionStatus) {
    case "connected":
      return "Connected to server";
    case "disconnected":
      return "Disconnected from server";
    case "connecting":
      return "Connecting to server...";
    case "error":
      return "Connection error";
    default:
      return "Unknown status";
  }
});
</script>

<style scoped>
.connection-status {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.connected {
  background-color: #4caf50;
  color: white;
}

.disconnected {
  background-color: #f44336;
  color: white;
}

.connecting {
  background-color: #2196f3;
  color: white;
}

.error {
  background-color: #ff9800;
  color: white;
}
</style>
