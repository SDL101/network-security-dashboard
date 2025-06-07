<template>
  <div class="connection-status-container">
    <div class="connection-status" :class="networkStore.connectionStatus">
      <span class="status-icon">{{ statusIcon }}</span>
      <span class="status-text">{{ statusMessage }}</span>
      <button 
        v-if="showReconnectButton" 
        @click="reconnect" 
        class="reconnect-btn"
      >
        Reconnect
      </button>
    </div>
    <div v-if="networkStore.connectionError" class="error-details">
      {{ networkStore.connectionError }}
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useNetworkStore } from "../stores/networkStore";

const networkStore = useNetworkStore();

const statusIcon = computed(() => {
  switch (networkStore.connectionStatus) {
    case "connected":
      return "🟢";
    case "disconnected":
      return "🔴";
    case "connecting":
      return "🟡";
    case "error":
      return "⚠️";
    default:
      return "❓";
  }
});

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

const showReconnectButton = computed(() => {
  return networkStore.connectionStatus === "error" || 
         networkStore.connectionStatus === "disconnected";
});

const reconnect = () => {
  networkStore.attemptReconnection();
};
</script>

<style scoped>
.connection-status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.status-icon {
  font-size: 12px;
}

.status-text {
  flex: 1;
}

.reconnect-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.reconnect-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.error-details {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  max-width: 300px;
  padding: 4px 8px;
  background: rgba(255, 152, 0, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 152, 0, 0.3);
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
  animation: pulse 1.5s infinite;
}

.error {
  background-color: #ff9800;
  color: white;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .error-details {
    background: rgba(255, 152, 0, 0.15);
    border-color: rgba(255, 152, 0, 0.4);
    color: #e0e0e0;
  }
}
</style>
