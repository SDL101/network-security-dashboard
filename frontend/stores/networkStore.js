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
  }),

  actions: {
    initializeSocket() {
      this.socket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("new_log", (data) => {
        if (!this.isCapturing || !data) return;
        if (data.stats) this.updateStats(data.stats);
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
  },
});
