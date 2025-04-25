<template>
  <div class="dashboard">
    <header>
      <div class="header-container">
        <div class="header-left">
          <ThemeToggle />
        </div>
        <div class="header-center">
          <h1 class="main-title">Network Security Dashboard</h1>
        </div>
        <div class="header-right">
          <div class="developer-info">
            <div class="developer-text">
              <span>Developed by Scott Lindsay</span>
            </div>
            <a
              href="https://github.com/SDL101/network-security-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              class="github-link"
            >
              📂 View on GitHub
            </a>
          </div>
        </div>
      </div>
      <ConnectionStatus />
    </header>

    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button :class="{active: activeTab === 'live'}" @click="activeTab = 'live'">Live Capture</button>
      <button :class="{active: activeTab === 'archive'}" @click="activeTab = 'archive'">Capture Archive</button>
    </div>

    <div v-if="activeTab === 'live'">
      <StatPanel />
      <FilterPanel />
      <CaptureControls />
      <LogsTable />
    </div>
    <div v-else>
      <div class="archive-view">
        <h2>Capture Archive</h2>
        <table class="archive-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Events</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in sessions" :key="session.id">
              <td>{{ session.title }}</td>
              <td>{{ formatDate(session.timestamp) }}</td>
              <td>{{ session.log_count }}</td>
              <td>
                <button @click="restoreSession(session.id)">Restore</button>
                <button @click="deleteSession(session.id)" class="delete-btn">Delete</button>
              </td>
            </tr>
            <tr v-if="sessions.length === 0">
              <td colspan="4" style="text-align:center; color:var(--text-secondary);">No saved sessions yet.</td>
            </tr>
          </tbody>
        </table>
        <div v-if="archiveError" class="archive-error">{{ archiveError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import StatPanel from "./components/StatPanel.vue";
import CaptureControls from "./components/CaptureControls.vue";
import LogsTable from "./components/LogsTable.vue";
import ConnectionStatus from "./components/ConnectionStatus.vue";
import FilterPanel from "./components/FilterPanel.vue";
import ThemeToggle from "./components/ThemeToggle.vue";
import { useNetworkStore } from "./stores/networkStore";
import { onMounted, ref, watch } from "vue";
import "./assets/styles.css";

const networkStore = useNetworkStore();
const activeTab = ref('live');
const sessions = ref([]);
const archiveError = ref("");

const fetchSessions = async () => {
  archiveError.value = "";
  try {
    const res = await fetch("http://localhost:5000/list_sessions");
    sessions.value = await res.json();
  } catch (err) {
    archiveError.value = "Failed to load sessions.";
  }
};

const restoreSession = async (id) => {
  archiveError.value = "";
  try {
    const res = await fetch(`http://localhost:5000/get_session_logs/${id}`);
    const data = await res.json();
    if (data.logs) {
      networkStore.logs = data.logs;
      networkStore.filteredLogs = [...data.logs];
      networkStore.totalEvents = data.logs.length;
      networkStore.currentPage = 1;
      activeTab.value = 'live';
    } else {
      archiveError.value = data.message || "Failed to restore session.";
    }
  } catch (err) {
    archiveError.value = "Failed to restore session.";
  }
};

const deleteSession = async (id) => {
  if (!confirm('Are you sure you want to delete this session?')) return;
  archiveError.value = "";
  try {
    const res = await fetch(`http://localhost:5000/delete_session/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'success') {
      fetchSessions();
    } else {
      archiveError.value = data.message || 'Failed to delete session.';
    }
  } catch (err) {
    archiveError.value = 'Failed to delete session.';
  }
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString();
};

onMounted(() => {
  networkStore.initializeSocket();
  fetchSessions();
});

// Refetch sessions when switching to archive tab
watch(activeTab, (tab) => {
  if (tab === 'archive') fetchSessions();
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');

.main-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #4a90e2, #2c3e50);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  position: relative;
  text-transform: uppercase;
  white-space: nowrap;
  line-height: 1;
}

.main-title::after {
  display: none;
}

.dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

header {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
  gap: 10px;
}

.header-left {
  flex: 0 0 auto;
}

.header-center {
  flex: 1;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
}

.header-right {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  margin-right: 40px;
}

.developer-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
  margin-right: 0;
}

.developer-text {
  text-align: right;
  white-space: nowrap;
}

.github-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 6px 12px;
  border-radius: 4px;
  background: #24292e;
  font-weight: 500;
}

.github-link:hover {
  background: #1a1f24;
  transform: translateY(-1px);
}

.github-icon {
  color: #fff;
}

h1 {
  margin: 0;
  color: var(--text);
}

.tab-nav {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
  justify-content: center;
}
.tab-nav button {
  background: var(--surface);
  color: var(--text);
  border: 1.5px solid var(--border);
  border-radius: 8px 8px 0 0;
  padding: 10px 28px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.tab-nav button.active {
  background: var(--primary);
  color: #fff;
  border-bottom: 2.5px solid var(--primary);
}
.archive-view {
  margin-top: 40px;
  text-align: center;
}
.archive-table {
  margin: 0 auto;
  min-width: 420px;
  background: var(--surface);
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border-collapse: separate;
  border-spacing: 0;
}
.archive-table th, .archive-table td {
  padding: 12px 18px;
  border-bottom: 1px solid var(--border);
}
.archive-table th {
  background: var(--surface);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 1rem;
}
.archive-table tr:last-child td {
  border-bottom: none;
}
.archive-table button {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.archive-table button:hover {
  background: var(--primary-glow);
}
.archive-error {
  color: var(--danger);
  margin-top: 18px;
}
.delete-btn {
  background: var(--danger);
  margin-left: 8px;
}
.delete-btn:hover {
  background: #c0392b;
}
</style>
