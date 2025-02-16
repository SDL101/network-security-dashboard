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
          v-for="log in networkStore.filteredLogs"
          :key="log.id"
          :class="[log.event_type.toLowerCase(), log.severity.toLowerCase()]"
        >
          <td>{{ formatTime(log.timestamp) }}</td>
          <td>
            <span class="event-type" :class="log.event_type.toLowerCase()">
              {{ log.event_type }}
            </span>
          </td>
          <td>{{ log.source_ip }}</td>
          <td>{{ log.destination_ip }}</td>
          <td>
            <span class="protocol-badge" :data-protocol="log.protocol">
              {{ log.protocol }}
            </span>
          </td>
          <td>
            <span class="severity-badge" :class="log.severity.toLowerCase()">
              {{ log.severity }}
            </span>
          </td>
          <td>{{ log.details }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { useNetworkStore } from "../stores/networkStore";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

const networkStore = useNetworkStore();
// Use storeToRefs for reactive state
const { logs } = storeToRefs(networkStore);

onMounted(() => {
  // Initialize filteredLogs with all logs
  networkStore.filterLogsByType("");
});

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
  color: #333;
}

/* Network Scan Events - Red theme */
tr.network_scan {
  background: rgba(255, 71, 87, 0.1);
}

tr.network_scan td {
  color: #333;
}

tr.network_scan .event-type {
  background: #d63031;
  color: white;
}

/* Large Packet Events - Orange theme */
tr.large_packet {
  background: rgba(255, 165, 2, 0.1);
}

tr.large_packet td {
  color: #333;
}

tr.large_packet .event-type {
  background: #e17055;
  color: white;
}

/* External Connection Events - Blue theme */
tr.external_connection {
  background: rgba(152, 38, 116, 0.1);
}

tr.external_connection td {
  background: rgba(0, 210, 211, 0.3);
  color: #2d3436 !important;
}

tr.external_connection .event-type {
  background: #0984e3;
  color: white;
}

/* Normal Traffic Events - Neutral theme */
tr.normal_traffic {
  background: rgba(236, 240, 241, 0.3);
}

tr.normal_traffic td {
  color: #929693 !important;
}

tr.normal_traffic .event-type {
  background: #6c757d;
  color: white;
}

/* Severity Badges */
.severity-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.severity-badge.high {
  background: #d63031;
}

.severity-badge.medium {
  background: #e17055;
}

.severity-badge.low {
  background: #0984e3;
}

/* Event Type Labels */
.event-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Hover effect */
.logs-table tr:hover td {
  background: rgba(255, 255, 255, 0.95) !important;
  transform: scale(1.01);
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

/* Override the dark default background from styles.css */
.logs-table td {
  background: #aeddae; /* Changed to light green */
  color: #2d3436; /* Keep dark text for contrast */
}

/* Then apply our specific event type backgrounds */
tr.network_scan td {
  background: rgba(255, 71, 87, 0.1);
}

tr.large_packet td {
  background: rgba(255, 165, 2, 0.1);
}

tr.external_connection td {
  background: rgba(0, 210, 211, 0.3);
}

tr.normal_traffic td {
  background: rgba(135, 196, 144, 0.5);
}

.protocol-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  background: #e9ecef;
  color: #495057;
  display: inline-block;
  min-width: 60px;
  text-align: center;
}

/* Protocol-specific styles */
.protocol-badge[data-protocol="HTTP"] {
  background: #4caf50;
  color: white;
}
.protocol-badge[data-protocol="HTTPS"] {
  background: #2196f3;
  color: white;
}
.protocol-badge[data-protocol="DNS"] {
  background: #9c27b0;
  color: white;
}
.protocol-badge[data-protocol="SSH"] {
  background: #607d8b;
  color: white;
}
.protocol-badge[data-protocol="FTP"] {
  background: #795548;
  color: white;
}
.protocol-badge[data-protocol="SMTP"] {
  background: #ff5722;
  color: white;
}
.protocol-badge[data-protocol="POP3"] {
  background: #9c27b0;
  color: white;
}
.protocol-badge[data-protocol="IMAP"] {
  background: #673ab7;
  color: white;
}
.protocol-badge[data-protocol="RDP"] {
  background: #e91e63;
  color: white;
}
.protocol-badge[data-protocol="MySQL"] {
  background: #ff9800;
  color: white;
}
.protocol-badge[data-protocol="PostgreSQL"] {
  background: #3f51b5;
  color: white;
}
.protocol-badge[data-protocol="MSSQL"] {
  background: #009688;
  color: white;
}
.protocol-badge[data-protocol="HTTP-ALT"] {
  background: #8bc34a;
  color: white;
}
.protocol-badge[data-protocol="ICMP"] {
  background: #ff9800;
  color: white;
}
.protocol-badge[data-protocol="Unknown"] {
  background: #e9ecef;
  color: #495057;
}
.protocol-badge[data-protocol^="TCP"] {
  background: #03a9f4;
  color: white;
}
.protocol-badge[data-protocol^="UDP"] {
  background: #009688;
  color: white;
}
</style>
