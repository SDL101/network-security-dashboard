<template>
  <div class="logs-container">
    <!-- Debug dropdown -->
    <details class="debug-dropdown">
      <summary>Dev Tools Debug</summary>
      <div
        style="background: #f5f5f5; padding: 10px; margin: 10px 0; color: #888"
      >
        Total Network Events: {{ networkStore.totalEvents }}
        <br />
        Filtered Logs Count: {{ networkStore.filteredLogs.length }}
        <br />
        Current page: {{ networkStore.currentPage }}
        <br />
        Items per page: {{ networkStore.itemsPerPage }}
        <br />
        Paginated logs length: {{ networkStore.paginatedLogs.length }}
      </div>
    </details>

    <table class="logs-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Event Type</th>
          <th>Src IP</th>
          <th>Src Port</th>
          <th>Dst IP</th>
          <th>Dst Port</th>
          <th>Protocol</th>
          <th>Severity</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="log in displayedLogs"
          :key="log.id"
          :class="[log.event_type.toLowerCase(), log.severity.toLowerCase()]"
          @click="followStream(log)"
        >
          <td>{{ formatTime(log.timestamp) }}</td>
          <td>
            <span class="event-type" :class="log.event_type.toLowerCase()">
              {{ formatEventType(log.event_type) }}
            </span>
          </td>
          <td>{{ log.source_ip }}</td>
          <td>{{ log.source_port ?? '-' }}</td>
          <td>{{ log.destination_ip }}</td>
          <td>{{ log.destination_port ?? '-' }}</td>
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

    <div class="pagination" v-if="!isScrollView">
      <button
        :disabled="networkStore.currentPage === 1"
        @click="networkStore.setPage(networkStore.currentPage - 1)"
      >
        Previous
      </button>

      <span>
        Page {{ networkStore.currentPage }} of {{ networkStore.totalPages }} ({{
          networkStore.filteredLogs.length
        }}
        total logs)
      </span>

      <button
        :disabled="networkStore.currentPage === networkStore.totalPages"
        @click="networkStore.setPage(networkStore.currentPage + 1)"
      >
        Next
      </button>
    </div>

    <button v-else @click="scrollToTop" class="return-to-top">
      Return to Top
    </button>
  </div>
</template>

<script setup>
import { useNetworkStore } from "../stores/networkStore";
import { storeToRefs } from "pinia";
import { onMounted, computed } from "vue";

const networkStore = useNetworkStore();
// Use storeToRefs for reactive state
const { logs, paginatedLogs, isScrollView, filteredLogs } = storeToRefs(networkStore);

const displayedLogs = computed(() => {
  return isScrollView.value ? filteredLogs.value : paginatedLogs.value;
});

onMounted(() => {
  // Initialize filteredLogs with all logs
  networkStore.filterLogsByType("");
});

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const options = {
    year: "2-digit", // Testing abbr year to dec width
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // Use 24-hour time so I don't have to waste space with am/pm
  };
  return date.toLocaleString(undefined, options);
};

const formatEventType = (eventType) => {
  console.log("Event Type:", eventType);

  if (eventType === "external_connection") {
    return "EXTERNAL CONN";
  }
  return eventType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const followStream = (log) => {
  // Set filters for the 5-tuple (src IP, src port, dst IP, dst port, protocol)
  networkStore.updateFilters({
    eventTypes: [],
    severities: [],
    protocols: log.protocol ? [log.protocol] : [],
    ipAddresses: [log.source_ip, log.destination_ip],
    srcPort: log.source_port,
    dstPort: log.destination_port,
  });
};
</script>

<style scoped>
.logs-container {
  width: 95%;
  margin: 0 auto;
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
  white-space: nowrap;
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

/* Override the dark default background from styles.css */
.logs-table td {
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

/* Severity Badges */
.severity-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white !important;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
  display: inline-block;
  min-width: 60px;
  text-align: center;
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

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .logs-table td {
    color: #f8f9fa;
  }
  
  .severity-badge {
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
  }
  
  .severity-badge.high {
    background: #ff4757;
  }
  
  .severity-badge.medium {
    background: #ffa502;
  }
  
  .severity-badge.low {
    background: #00d2d3;
  }
}

/* Event Type Labels */
.event-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Hover effect */
.logs-table tr {
  transition: all 0.3s ease;
  position: relative;
}

.logs-table tr:hover {
  box-shadow: 0 0 0 2px #3b82f6; /* Blue outline */
  cursor: pointer;
  z-index: 1;
  transform: scale(1.01); /* Slight scale effect */
}

/* Dark mode hover adjustments */
@media (prefers-color-scheme: dark) {
  .logs-table tr:hover {
    box-shadow: 0 0 0 2px #60a5fa; /* Lighter blue outline for dark mode */
  }
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background-color: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination button:hover {
  background-color: var(--primary);
  color: var(--background);
  border-color: var(--primary);
}

.pagination button:disabled {
  background-color: var(--surface);
  color: var(--text-secondary);
  cursor: not-allowed;
  opacity: 0.7;
}

.scroll-view {
  max-height: 500px; /* Adjust as needed */
  overflow-y: auto;
}

.log-entry {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.return-to-top {
  display: block;
  margin: 20px auto;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background-color: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.return-to-top:hover {
  background-color: var(--primary);
  color: var(--background);
  border-color: var(--primary);
}
</style>
