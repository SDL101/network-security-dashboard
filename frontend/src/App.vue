<template>
  <div class="dashboard">
    <header>
      <h1>Network Security Monitor</h1>
      <ConnectionStatus />
    </header>

    <StatPanel />
    <FilterPanel />
    <CaptureControls />
    <LogsTable />
  </div>
</template>

<script setup>
import StatPanel from "./components/StatPanel.vue";
import FilterPanel from "./components/FilterPanel.vue";
import CaptureControls from "./components/CaptureControls.vue";
import LogsTable from "./components/LogsTable.vue";
import ConnectionStatus from "./components/ConnectionStatus.vue";
import { useNetworkStore } from "./stores/networkStore";
import { onMounted, onUnmounted } from "vue";

const networkStore = useNetworkStore();

onMounted(() => {
  networkStore.initializeSocket();
});

onUnmounted(() => {
  networkStore.disconnectSocket();
});
</script>

<style>
.dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h1 {
  margin: 0;
  color: #333;
}
</style>
