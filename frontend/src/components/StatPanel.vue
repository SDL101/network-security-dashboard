<template>
  <div class="stats-panel">
    <div class="stat-box">
      <h3>Total Events</h3>
      <span>{{ networkStore.totalEvents }}</span>
      <div class="stat-footer">Total network events</div>
    </div>
    <div class="stat-box warning">
      <h3>Security Alerts</h3>
      <span>{{ networkStore.securityAlerts }}</span>
      <div class="stat-footer">High severity alerts</div>
    </div>
    <div class="stat-box">
      <h3>Active Connections</h3>
      <span>{{ networkStore.activeConnections.size }}</span>
      <div class="stat-footer">Current open connections</div>
    </div>
  </div>
</template>

<script setup>
import { useNetworkStore } from "../stores/networkStore";

const networkStore = useNetworkStore();
</script>
