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
    connectionError: null,
    reconnectionAttempts: 0,
    maxReconnectionAttempts: 5,
    activeFilters: {
      eventTypes: [],
      severities: [],
      protocols: [],
      ipAddresses: [],
      srcPort: null,
      dstPort: null,
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
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      this.connectionStatus = "connecting";
      this.connectionError = null;

      this.socket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
        reconnectionAttempts: this.maxReconnectionAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on("connect", () => {
        console.log("✅ Connected to server");
        this.connectionStatus = "connected";
        this.connectionError = null;
        this.reconnectionAttempts = 0;
        this.isCapturing = false;
        this.isCapturePaused = false;
      });

      this.socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from server:", reason);
        this.connectionStatus = "disconnected";
        this.isCapturing = false;
        
        if (reason === "io server disconnect") {
          // Server disconnected us, try to reconnect manually
          this.connectionError = "Server terminated connection";
          setTimeout(() => this.attemptReconnection(), 2000);
        }
      });

      this.socket.on("connect_error", (error) => {
        console.error("🔌 Connection error:", error.message);
        this.connectionStatus = "error";
        this.connectionError = `Connection failed: ${error.message}`;
        this.reconnectionAttempts++;
        
        if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
          this.connectionError = "Unable to connect to server. Please check if the backend is running.";
        }
      });

      this.socket.on("reconnect", (attemptNumber) => {
        console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
        this.connectionStatus = "connected";
        this.connectionError = null;
        this.reconnectionAttempts = 0;
      });

      this.socket.on("reconnect_error", (error) => {
        console.error("🔄 Reconnection failed:", error.message);
        this.connectionStatus = "error";
        this.connectionError = "Reconnection failed";
      });

      this.socket.on("new_log", (data) => {
        if (!this.isCapturing || !data) return;

        try {
          if (this.isCapturePaused) {
            this.queuedLogs.push(data.log);
          } else {
            if (data.log) this.addLogEntry(data.log);
            if (data.stats) this.updateStats(data.stats);
          }
        } catch (error) {
          console.error("Error processing new log:", error);
        }
      });

      this.socket.on("capture_status", (data) => {
        try {
          this.isCapturing = data.status === "started";
          if (data.stats) this.updateStats(data.stats);
        } catch (error) {
          console.error("Error processing capture status:", error);
        }
      });
    },

    attemptReconnection() {
      if (this.connectionStatus === "connected") return;
      
      this.initializeSocket();
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
      this.activeFilters = {
        eventTypes: filters.eventTypes || [],
        severities: filters.severities || [],
        protocols: filters.protocols || [],
        ipAddresses: filters.ipAddresses || [],
        srcPort: filters.srcPort ?? null,
        dstPort: filters.dstPort ?? null,
      };
      this.applyFilters();
    },

    clearFilters() {
      this.activeFilters = {
        eventTypes: [],
        severities: [],
        protocols: [],
        ipAddresses: [],
        srcPort: null,
        dstPort: null,
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
        // Check IP address filter
        if (this.activeFilters.ipAddresses && this.activeFilters.ipAddresses.length > 0) {
          const ipSet = new Set(this.activeFilters.ipAddresses.map(ip => ip.trim()));
          if (!ipSet.has(log.source_ip) && !ipSet.has(log.destination_ip)) {
            return false;
          }
        }
        // Bidirectional stream following logic
        if (
          this.activeFilters.srcPort != null &&
          this.activeFilters.dstPort != null &&
          this.activeFilters.ipAddresses.length === 2
        ) {
          const [ipA, ipB] = this.activeFilters.ipAddresses;
          const portA = this.activeFilters.srcPort;
          const portB = this.activeFilters.dstPort;
          const protocolMatch =
            this.activeFilters.protocols.length === 0 ||
            this.activeFilters.protocols.includes(log.protocol);

          const forward =
            log.source_ip === ipA &&
            log.source_port === portA &&
            log.destination_ip === ipB &&
            log.destination_port === portB;

          const reverse =
            log.source_ip === ipB &&
            log.source_port === portB &&
            log.destination_ip === ipA &&
            log.destination_port === portA;

          if (!(protocolMatch && (forward || reverse))) {
            return false;
          }
        } else {
          // Check source port filter (if set, but not in stream-follow mode)
          if (this.activeFilters.srcPort != null && log.source_port !== this.activeFilters.srcPort) {
            return false;
          }
          // Check destination port filter (if set, but not in stream-follow mode)
          if (this.activeFilters.dstPort != null && log.destination_port !== this.activeFilters.dstPort) {
            return false;
          }
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
        "Src IP",
        "Src Port",
        "Dst IP",
        "Dst Port",
        "Protocol",
        "Severity",
        "Details",
      ];

      const rows = logs.map((log) => [
        new Date(log.timestamp).toISOString(),
        log.event_type,
        log.source_ip,
        log.source_port ?? "-",
        log.destination_ip,
        log.destination_port ?? "-",
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
