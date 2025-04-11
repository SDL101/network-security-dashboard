import { defineStore } from "pinia";
import { io } from "socket.io-client";

export const useNetworkStore = defineStore("network", {
  state: () => ({
    currentPage: 1,
    itemsPerPage: 20,
    socket: null,
    totalEvents: 0,
    securityAlerts: 0,
    activeConnections: new Set(),
    isCapturing: false,
    isCapturePaused: false,
    queuedLogs: [],
    logs: [],
    filteredLogs: [],
    connectionStatus: "disconnected",
    activeFilters: {
      eventTypes: [],
      severities: [],
      protocols: []
    },
    stats: {
      packets_analyzed: 0,
      threats_detected: 0,
      active_ips: 0,
      scan_status: "Normal",
      uptime_seconds: 0,
    },
    isScrollView: false,
  }),

  getters: {
    paginatedLogs(state) {
      const start = (state.currentPage - 1) * state.itemsPerPage;
      const end = start + state.itemsPerPage;
      return state.filteredLogs.slice(start, end);
    },

    totalPages(state) {
      return Math.ceil(state.filteredLogs.length / state.itemsPerPage);
    },

    getCurrentFilters(state) {
      return state.activeFilters;
    }
  },

  actions: {
    initializeSocket() {
      this.socket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        this.connectionStatus = "connected";
        this.isCapturing = false;
        this.isCapturePaused = false;
      });

      this.socket.on("new_log", (data) => {
        if (!this.isCapturing || !data) return;

        if (this.isCapturePaused) {
          this.queuedLogs.push(data.log);
        } else {
          if (data.log) this.addLogEntry(data.log);
          if (data.stats) this.updateStats(data.stats);
        }
      });

      this.socket.on("capture_status", (data) => {
        this.isCapturing = data.status === "started";
        if (data.stats) this.updateStats(data.stats);
      });
    },

    startCapture() {
      if (!this.socket) this.initializeSocket();
      this.socket.emit("start_capture");
      this.isCapturing = true;
      this.isCapturePaused = false;
      this.clearLogs();
    },

    stopCapture() {
      this.socket?.emit("stop_capture");
      this.isCapturing = false;
      this.isCapturePaused = false;
    },

    clearLogs() {
      if (this.isCapturing) return;

      this.logs = [];
      this.filteredLogs = [];
      this.totalEvents = 0;
      this.securityAlerts = 0;
      this.activeConnections.clear();
      this.queuedLogs = [];

      fetch("http://localhost:5000/clear_logs", {
        method: "POST",
      }).catch((error) => {
        console.error("Error clearing logs:", error);
      });
    },

    updateFilters(filters) {
      this.activeFilters = filters;
      this.applyFilters();
    },

    clearFilters() {
      this.activeFilters = {
        eventTypes: [],
        severities: [],
        protocols: []
      };
      this.filteredLogs = [...this.logs];
      this.currentPage = 1;
    },

    applyFilters() {
      this.currentPage = 1;
      
      this.filteredLogs = this.logs.filter(log => {
        // Check event type filter
        if (this.activeFilters.eventTypes.length > 0 && 
            !this.activeFilters.eventTypes.includes(log.event_type)) {
          return false;
        }

        // Check severity filter
        if (this.activeFilters.severities.length > 0 && 
            !this.activeFilters.severities.includes(log.severity)) {
          return false;
        }

        // Check protocol filter
        if (this.activeFilters.protocols.length > 0 && 
            !this.activeFilters.protocols.includes(log.protocol)) {
          return false;
        }

        return true;
      });
    },

    addLogEntry(log) {
      const enhancedLog = {
        ...log,
        id: Date.now() + Math.random(),
        protocol: log.protocol || "Unknown",
      };

      this.logs.unshift(enhancedLog);
      this.applyFilters();
      this.totalEvents++;

      if (log.severity === "high") {
        this.securityAlerts++;
      }

      if (log.source_ip) {
        this.activeConnections.add(log.source_ip);
      }
    },

    filterLogsByType(filter) {
      this.currentPage = 1;
      if (filter === "high_severity") {
        this.filteredLogs = this.logs.filter((log) => log.severity === "high");
      } else if (filter === "medium_severity") {
        this.filteredLogs = this.logs.filter(
          (log) => log.severity === "medium"
        );
      } else if (filter === "low_severity") {
        this.filteredLogs = this.logs.filter((log) => log.severity === "low");
      } else if (filter === "external_connection") {
        this.filteredLogs = this.logs.filter(
          (log) => log.event_type === "external_connection"
        );
      } else if (filter === "normal_traffic") {
        this.filteredLogs = this.logs.filter(
          (log) => log.event_type === "normal_traffic"
        );
      } else if (filter === "network_scan") {
        this.filteredLogs = this.logs.filter(
          (log) => log.event_type === "network_scan"
        );
      } else {
        this.filteredLogs = [...this.logs];
      }
    },

    updateStats(stats) {
      this.stats = { ...this.stats, ...stats };
    },

    exportLogs() {
      const csv = this.convertLogsToCSV(this.filteredLogs);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "network_logs.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    convertLogsToCSV(logs) {
      const headers = [
        "Time",
        "Event Type",
        "Source IP",
        "Destination IP",
        "Protocol",
        "Severity",
        "Details",
      ];

      const rows = logs.map((log) => [
        new Date(log.timestamp).toISOString(),
        log.event_type,
        log.source_ip,
        log.destination_ip,
        log.protocol,
        log.severity,
        log.details,
      ]);

      return [headers, ...rows].map((row) => row.join(",")).join("\n");
    },

    setPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },

    setViewMode(isScroll) {
      this.isScrollView = isScroll;
    },
  },
});
