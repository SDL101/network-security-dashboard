<template>
  <div class="control-panel">
    <button
      id="startCapture"
      class="control-btn"
      :class="{ 'btn-disabled': networkStore.isCapturing }"
      @click="startCapture"
      :disabled="networkStore.isCapturing"
    >
      <span class="icon">▶️</span>
      <span class="btn-text">Start Capture</span>
    </button>
    <button
      id="stopCapture"
      class="control-btn"
      :class="{ 'btn-disabled': !networkStore.isCapturing }"
      @click="stopCapture"
      :disabled="!networkStore.isCapturing"
    >
      <span class="icon">⏹️</span>
      <span class="btn-text">Stop Capture</span>
    </button>
    <button
      @click="clearLogs"
      class="control-btn"
      :class="{ 'btn-disabled': networkStore.isCapturing }"
      :disabled="networkStore.isCapturing"
    >
      <span class="icon">🗑️</span>
      <span class="btn-text">Clear Logs</span>
    </button>
    <button @click="toggleView" class="control-btn">
      <span class="icon">🔄</span>
      <span class="btn-text">{{
        isScrollView ? "Page View" : "Scroll View"
      }}</span>
    </button>

    <button
      id="exportLogs"
      @click="exportLogs"
      :disabled="!networkStore.totalEvents"
      class="control-btn"
    >
      <span class="icon">📥</span>
      <span class="btn-text">Download Logs as CSV</span>
    </button>

    <button
      v-if="!networkStore.isCapturing && networkStore.totalEvents"
      @click="showSaveModal = true"
      class="control-btn"
    >
      <span class="icon">💾</span>
      <span class="btn-text">Save Logs</span>
    </button>

    <!-- Save Session Modal -->
    <div v-if="showSaveModal" class="modal-overlay">
      <div class="modal">
        <h3>Save Capture Session</h3>
        <input
          v-model="sessionTitle"
          type="text"
          placeholder="Enter a title for this session"
          class="modal-input"
        />
        <div class="modal-actions">
          <button @click="saveSession" :disabled="!sessionTitle.trim()" class="control-btn">Save</button>
          <button @click="closeModal" class="control-btn">Cancel</button>
        </div>
        <div v-if="saveError" class="modal-error">{{ saveError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useNetworkStore } from "../stores/networkStore";

const networkStore = useNetworkStore();
const isScrollView = ref(false);

const showSaveModal = ref(false);
const sessionTitle = ref("");
const saveError = ref("");

console.log("CaptureControls mounted, networkStore:", {
  isCapturing: networkStore.isCapturing,
  hasClearLogs: typeof networkStore.clearLogs === "function",
  availableActions: Object.keys(networkStore),
});

const startCapture = () => {
  networkStore.startCapture();
};

const stopCapture = () => {
  networkStore.stopCapture();
};

const clearLogs = () => {
  console.log("Clear logs button clicked");
  networkStore.clearLogs();
};

const exportLogs = () => {
  networkStore.exportLogs();
};

const toggleView = () => {
  isScrollView.value = !isScrollView.value;
  networkStore.setViewMode(isScrollView.value);
};

const closeModal = () => {
  showSaveModal.value = false;
  sessionTitle.value = "";
  saveError.value = "";
};

const saveSession = async () => {
  saveError.value = "";
  try {
    const response = await fetch("http://localhost:5000/save_session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: sessionTitle.value,
        logs: networkStore.logs,
        timestamp: new Date().toISOString(),
      }),
    });
    const data = await response.json();
    if (data.status === "success") {
      closeModal();
    } else {
      saveError.value = data.message || "Failed to save session.";
    }
  } catch (err) {
    saveError.value = "Error saving session.";
  }
};
</script>

<style scoped>
.control-panel {
  display: flex;
  gap: 12px;
  margin: 20px 0;
  padding: 15px;
  background: var(--surface);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  min-height: 60px;
}

.control-btn {
  height: 42px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  white-space: nowrap;
}

.icon {
  margin-right: 8px;
}

.btn-text {
  font-size: 0.9rem;
}

#exportLogs {
  height: 42px;
  white-space: nowrap;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--surface);
  padding: 28px 24px 18px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  min-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modal h3 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  color: var(--primary);
}
.modal-input {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  margin-bottom: 16px;
  font-size: 1rem;
  background: var(--background);
  color: var(--text);
}
.modal-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.modal-error {
  color: var(--danger);
  font-size: 0.95rem;
  margin-top: 4px;
}
</style>
