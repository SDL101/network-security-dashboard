<template>
  <div class="stats-panel">
    <div class="stat-box">
      <div class="stat-icon"><i class="fa-solid fa-chart-line"></i></div>
      <h3>Total Events</h3>
      <span class="stat-number">{{ networkStore.totalEvents }}</span>
      <div class="stat-footer">Total network events</div>
    </div>
    <div class="stat-box warning">
      <div class="stat-icon"><i class="fa-solid fa-shield-halved"></i></div>
      <h3>Security Alerts</h3>
      <span class="stat-number">{{ networkStore.securityAlerts }}</span>
      <div class="stat-footer">High severity alerts</div>
    </div>
    <div class="stat-box">
      <div class="stat-icon"><i class="fa-solid fa-network-wired"></i></div>
      <h3>Active Connections</h3>
      <span class="stat-number">{{ networkStore.activeConnections.size }}</span>
      <div class="stat-footer">Current open connections</div>
    </div>
  </div>
</template>

<script setup>
import { useNetworkStore } from "../stores/networkStore";

const networkStore = useNetworkStore();
</script>

<style scoped>
.stats-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.stat-box {
  background: var(--surface);
  padding: 12px 10px 8px 10px;
  border-radius: 14px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px rgba(79, 140, 255, 0.06);
  text-align: center;
  backdrop-filter: blur(6px) saturate(1.1);
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  min-height: 0;
}

.stat-box:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 6px 18px rgba(79, 140, 255, 0.13);
}

.stat-icon {
  font-size: 1.3rem;
  color: var(--primary);
  margin-bottom: 2px;
  filter: drop-shadow(0 1px 4px rgba(79,140,255,0.10));
}

.stat-box.warning .stat-icon {
  color: var(--danger);
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.5px;
  margin-bottom: 0;
  display: block;
}

.stat-footer {
  font-size: 0.82rem;
  opacity: 0.7;
  margin-top: 2px;
  letter-spacing: 0.1px;
}

.stat-box h3 {
  font-size: 1rem;
  margin: 0 0 2px 0;
  color: var(--primary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
