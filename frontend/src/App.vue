<template>
  <div class="dashboard">
    <header>
      <div class="header-container">
        <h1>Network Security Dashboard</h1>
        <div class="developer-info">
          <span>Developed by Scott Lindsay</span>
          <a
            href="https://github.com/SDL101/network-security-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            class="github-link"
          >
            📂 View on GitHub
          </a>
        </div>
      </div>
      <ConnectionStatus />
    </header>

    <StatPanel />
    <CaptureControls />
    <LogsTable />
  </div>
</template>

<script setup>
import StatPanel from "./components/StatPanel.vue";
import CaptureControls from "./components/CaptureControls.vue";
import LogsTable from "./components/LogsTable.vue";
import ConnectionStatus from "./components/ConnectionStatus.vue";
import { useNetworkStore } from "./stores/networkStore";
import { onMounted } from "vue";
import "./assets/styles.css";

const networkStore = useNetworkStore();

onMounted(() => {
  networkStore.initializeSocket();
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

.header-container {
  display: flex;
  align-items: center;
  gap: 24px;
}

.developer-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.9rem;
  color: #666;
}

.github-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 6px 12px;
  border-radius: 4px;
  background: #24292e;
  font-weight: 500;
}

.github-link:hover {
  background: #1a1f24;
  transform: translateY(-1px);
}

.github-icon {
  color: #fff;
}

h1 {
  margin: 0;
  color: #333;
}
</style>
