<template>
  <div class="dashboard">
    <header>
      <div class="header-container">
        <div class="header-left">
          <ThemeToggle />
        </div>
        <div class="header-center">
          <h1>Network Security Dashboard</h1>
        </div>
        <div class="header-right">
          <div class="developer-info">
            <div class="developer-text">
              <span>Developed by Scott Lindsay</span>
            </div>
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
      </div>
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
import CaptureControls from "./components/CaptureControls.vue";
import LogsTable from "./components/LogsTable.vue";
import ConnectionStatus from "./components/ConnectionStatus.vue";
import FilterPanel from "./components/FilterPanel.vue";
import ThemeToggle from "./components/ThemeToggle.vue";
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
  flex-direction: column;
  margin-bottom: 20px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 20px;
}

.header-left {
  flex: 1;
}

.header-center {
  flex: 2;
  text-align: center;
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.developer-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.developer-text {
  text-align: right;
  white-space: nowrap;
  margin-right: 20px;
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
  margin-right: 20px;
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
  color: var(--text);
}
</style>
