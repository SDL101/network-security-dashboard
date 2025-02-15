<template>
  <div class="stats-panel">
    <div class="stat-box clickable" data-filter="all">
      <h3>Total Events</h3>
      <span>{{ networkStore.totalEvents }}</span>
      <div class="stat-footer">Click to view all</div>
    </div>
    <div class="stat-box warning clickable" data-filter="security">
      <h3>Security Alerts</h3>
      <span>{{ networkStore.securityAlerts }}</span>
      <div class="stat-footer">Click to view alerts</div>
    </div>
    <div class="stat-box clickable" data-filter="active">
      <h3>Active Connections</h3>
      <span>{{ networkStore.activeConnections.size }}</span>
      <div class="stat-footer">Click to view connections</div>
    </div>
  </div>
</template>

<script setup>
import { useNetworkStore } from "../stores/networkStore";

const networkStore = useNetworkStore();
</script>
