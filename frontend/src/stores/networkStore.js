import { defineStore } from "pinia";
import { io } from "socket.io-client";

export const useNetworkStore = defineStore("network", {
  state: () => ({
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
  }),

  actions: {
    startCapture() {
      if (!this.socket) {
        this.initializeSocket();
      }
      console.log("Emitting start_capture event");
      this.socket.emit("start_capture");
    },

    stopCapture() {
      if (this.socket) {
        console.log("Emitting stop_capture event");
        this.socket.emit("stop_capture");
      }
    },

    initializeSocket() {
      if (this.socket) return;

      this.connectionStatus = "connecting";
      console.log("Initializing socket connection...");

      this.socket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        this.connectionStatus = "connected";
        console.log("Connected to server");
      });

      this.socket.on("disconnect", () => {
        this.connectionStatus = "disconnected";
        console.log("Disconnected from server");
      });

      this.socket.on("connect_error", (error) => {
        this.connectionStatus = "error";
        console.error("Connection error:", error);
      });

      this.socket.on("new_log", (data) => {
        console.log("Received new log:", data);
        if (!this.isCapturing || !data) return;
        if (this.isCapturePaused) {
          this.queuedLogs.push(data.log);
        } else {
          if (data.log) {
            this.logs.push(data.log);
            this.updateStats(data.stats);
          }
        }
      });

      this.socket.on("capture_status", (data) => {
        console.log("Received capture status:", data);
        this.isCapturing = data.status === "started";
        if (data.stats) this.updateStats(data.stats);
      });
    },

    updateStats(stats) {
      if (stats) {
        this.totalEvents = stats.packets_analyzed || 0;
        this.securityAlerts = stats.threats_detected || 0;
        if (stats.active_ips) {
          this.activeConnections = new Set(
            Array.isArray(stats.active_ips)
              ? stats.active_ips
              : [stats.active_ips]
          );
        }
      }
    },

    filterLogsByType(eventType) {
      if (!eventType) {
        this.filteredLogs = this.logs;
      } else {
        this.filteredLogs = this.logs.filter(
          (log) => log.event_type === eventType
        );
      }
    },

    addLogEntry(log) {
      this.logs.push(log);
      this.filteredLogs = this.logs;
      this.updateStats({
        packets_analyzed: this.totalEvents + 1,
        threats_detected:
          log.severity === "High"
            ? this.securityAlerts + 1
            : this.securityAlerts,
        active_ips: this.activeConnections.size + 1,
      });
    },

    exportLogs() {
      const csvContent = this.convertLogsToCSV(this.filteredLogs);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `network_logs_${new Date().toISOString()}.csv`
      );
      link.style.visibility = "hidden";
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

    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.connectionStatus = "disconnected";
      }
    },
  },
});
