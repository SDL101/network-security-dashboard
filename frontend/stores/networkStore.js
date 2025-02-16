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
    uptime_seconds: 0,
  }),

  actions: {
    initializeSocket() {
      this.socket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("new_log", (data) => {
        console.log(
          "Raw WebSocket data received:",
          JSON.stringify(data, null, 2)
        );

        if (!this.isCapturing || !data) return;
        if (this.isCapturePaused) {
          this.queuedLogs.push(data.log);
        } else {
          if (data.log) {
            console.log("Log data before processing:", {
              protocol: data.log.protocol,
              fullLog: data.log,
            });
            this.addLogEntry(data.log);
          }
          if (data.stats) {
            this.updateStats(data.stats);
          }
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
    },

    stopCapture() {
      if (this.socket) {
        this.socket.emit("stop_capture");
      }
    },

    async clearLogs() {
      console.log("clearLogs action triggered");
      console.log("Current capture state:", this.isCapturing);

      if (this.isCapturing) {
        alert("Please stop capture before clearing logs");
        return;
      }

      try {
        console.log("Making clear_logs API request");
        const response = await fetch("http://localhost:5000/clear_logs", {
          method: "POST",
        });

        console.log("API response status:", response.status);

        if (!response.ok) {
          throw new Error("Failed to clear logs on server");
        }

        console.log("Before state reset:", {
          logs: this.logs.length,
          totalEvents: this.totalEvents,
          securityAlerts: this.securityAlerts,
          activeConnections: this.activeConnections.size,
        });

        // Reset all state
        this.logs = [];
        this.totalEvents = 0;
        this.securityAlerts = 0;
        this.activeConnections.clear();
        this.queuedLogs = [];

        console.log("After state reset:", {
          logs: this.logs.length,
          totalEvents: this.totalEvents,
          securityAlerts: this.securityAlerts,
          activeConnections: this.activeConnections.size,
        });
      } catch (error) {
        console.error("Error clearing logs:", error);
      }
    },

    updateStats(stats) {
      if (stats) {
        this.totalEvents = stats.packets_analyzed || 0;
        this.securityAlerts = stats.threats_detected || 0;
        this.activeConnections = new Set(
          Array.from({ length: stats.active_ips || 0 })
        );
      }
    },

    clearStats() {
      this.totalEvents = 0;
      this.securityAlerts = 0;
      this.activeConnections.clear();
    },

    addLogEntry(log) {
      console.log("Adding log entry, raw log:", log);
      console.log("Protocol value before enhancement:", log.protocol);

      const enhancedLog = {
        ...log,
        protocol:
          log.protocol && log.protocol !== "" ? log.protocol : "Unknown",
      };

      console.log("Enhanced log entry:", enhancedLog);
      this.logs.push(enhancedLog);
      this.updateStats({
        packets_analyzed: this.totalEvents + 1,
        threats_detected:
          log.severity === "high"
            ? this.securityAlerts + 1
            : this.securityAlerts,
        active_ips: this.activeConnections.size + 1,
      });
    },
  },
});
