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
      <button :class="{active: activeTab === 'docs'}" @click="activeTab = 'docs'">Documentation</button>
    </div>

    <div v-if="activeTab === 'live'">
      <StatPanel />
      <FilterPanel />
      <CaptureControls />
      <LogsTable />
    </div>
    <div v-else-if="activeTab === 'archive'">
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
    <div v-else-if="activeTab === 'docs'" class="documentation-view">
      <!-- Documentation Content -->
      <div class="doc-container">
        <h2>📚 Network Security Dashboard Documentation</h2>
        
        <!-- Quick Start Guide -->
        <section class="doc-section">
          <h3>🚀 Quick Start Guide</h3>
          <div class="doc-content">
            <h4>1. Prerequisites</h4>
            <ul>
              <li><strong>Python 3.8+</strong> - For backend packet capture and analysis</li>
              <li><strong>Node.js 14+</strong> - For frontend development</li>
              <li><strong>Administrator privileges</strong> - Required for packet sniffing</li>
            </ul>
            
            <h4>2. Starting the Application</h4>
            <ol>
              <li><strong>Backend:</strong> Run <code>./start_backend.sh</code> (requires sudo)</li>
              <li><strong>Frontend:</strong> Run <code>./start_frontend.sh</code> in a separate terminal</li>
              <li><strong>Access:</strong> Open <code>http://localhost:8000</code> in your browser</li>
            </ol>
            
            <h4>3. Using the Dashboard</h4>
            <div class="usage-steps">
              <div class="step">
                <span class="step-number">1</span>
                <div class="step-content">
                  <strong>Start Capture:</strong> Click the "Start Capture" button to begin monitoring network traffic
                </div>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <div class="step-content">
                  <strong>Filter Events:</strong> Use the filter panel to focus on specific event types, severities, or protocols
                </div>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <div class="step-content">
                  <strong>Follow Streams:</strong> Click on any log entry to follow the conversation between two endpoints
                </div>
              </div>
              <div class="step">
                <span class="step-number">4</span>
                <div class="step-content">
                  <strong>Export Data:</strong> Download logs as CSV or save sessions for later analysis
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Technology Stack -->
        <section class="doc-section">
          <h3>🛠️ Technology Stack</h3>
          <div class="doc-content">
            <div class="tech-grid">
              <div class="tech-category">
                <h4>Frontend</h4>
                <div class="tech-item">
                  <strong>Vue.js 3</strong> - Progressive JavaScript framework for building user interfaces
                </div>
                <div class="tech-item">
                  <strong>Pinia</strong> - State management pattern + library for Vue.js applications
                </div>
                <div class="tech-item">
                  <strong>Vite</strong> - Next generation frontend build tool for fast development
                </div>
                <div class="tech-item">
                  <strong>Socket.IO Client</strong> - Real-time bidirectional event-based communication
                </div>
              </div>
              
              <div class="tech-category">
                <h4>Backend</h4>
                <div class="tech-item">
                  <strong>Python Flask</strong> - Micro web framework for serving REST APIs
                </div>
                <div class="tech-item">
                  <strong>Scapy</strong> - Powerful packet manipulation and analysis library
                </div>
                <div class="tech-item">
                  <strong>SQLAlchemy</strong> - SQL toolkit and Object-Relational Mapping (ORM)
                </div>
                <div class="tech-item">
                  <strong>Flask-SocketIO</strong> - WebSocket support with fallback to HTTP long-polling
                </div>
                <div class="tech-item">
                  <strong>SQLite</strong> - Lightweight, disk-based database for data persistence
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Architecture Overview -->
        <section class="doc-section">
          <h3>🏗️ Architecture Overview</h3>
          <div class="doc-content">
            <div class="architecture-diagram">
              <div class="arch-layer">
                <h4>Frontend Layer (Vue.js)</h4>
                <div class="arch-components">
                  <span class="component">LogsTable.vue</span>
                  <span class="component">FilterPanel.vue</span>
                  <span class="component">CaptureControls.vue</span>
                  <span class="component">StatPanel.vue</span>
                </div>
              </div>
              
              <div class="arch-arrow">⬇️ Socket.IO + REST API ⬇️</div>
              
              <div class="arch-layer">
                <h4>Backend Layer (Flask)</h4>
                <div class="arch-components">
                  <span class="component">packet_sniffer.py</span>
                  <span class="component">database.py</span>
                  <span class="component">API Routes</span>
                </div>
              </div>
              
              <div class="arch-arrow">⬇️ Scapy Library ⬇️</div>
              
              <div class="arch-layer">
                <h4>Network Layer</h4>
                <div class="arch-components">
                  <span class="component">Raw Packet Capture</span>
                  <span class="component">Protocol Analysis</span>
                  <span class="component">Threat Detection</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Key Components -->
        <section class="doc-section">
          <h3>🔧 Key Components Explained</h3>
          <div class="doc-content">
            <div class="component-explanation">
              <h4>1. Packet Capture Engine (packet_sniffer.py)</h4>
              <p>The core of the application uses <strong>Scapy</strong> to capture and analyze network packets in real-time:</p>
              <ul>
                <li><strong>detect_threat()</strong> - Analyzes each packet for potential security threats</li>
                <li><strong>Port Scan Detection</strong> - Identifies SYN packets that may indicate reconnaissance</li>
                <li><strong>Large Packet Detection</strong> - Flags unusually large UDP packets</li>
                <li><strong>External Connection Monitoring</strong> - Tracks connections to non-private IP addresses</li>
              </ul>
              
              <h4>2. State Management (networkStore.js)</h4>
              <p>Centralized state management using <strong>Pinia</strong> handles:</p>
              <ul>
                <li><strong>Real-time Data Flow</strong> - Receives and processes Socket.IO events</li>
                <li><strong>Filtering Logic</strong> - Advanced filtering with bidirectional stream following</li>
                <li><strong>Connection Management</strong> - Automatic reconnection and error handling</li>
                <li><strong>Pagination</strong> - Efficient handling of large datasets</li>
              </ul>
              
              <h4>3. Real-time Communication</h4>
              <p><strong>Socket.IO</strong> enables instant updates:</p>
              <ul>
                <li><strong>new_log</strong> - Broadcasts new network events to all connected clients</li>
                <li><strong>capture_status</strong> - Synchronizes capture state across clients</li>
                <li><strong>Auto-reconnection</strong> - Maintains connection stability</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Security Features -->
        <section class="doc-section">
          <h3>🛡️ Security Features</h3>
          <div class="doc-content">
            <div class="security-features">
              <div class="feature-item">
                <strong>Port Scan Detection</strong>
                <p>Identifies potential reconnaissance attempts by detecting SYN packets to multiple ports</p>
              </div>
              <div class="feature-item">
                <strong>External Connection Monitoring</strong>
                <p>Tracks and highlights connections to external (non-private) IP addresses</p>
              </div>
              <div class="feature-item">
                <strong>Anomaly Detection</strong>
                <p>Flags unusually large packets that may indicate data exfiltration or attacks</p>
              </div>
              <div class="feature-item">
                <strong>Real-time Alerting</strong>
                <p>Immediate notification of security events through color-coded severity levels</p>
              </div>
            </div>
          </div>
        </section>

        <!-- API Reference -->
        <section class="doc-section">
          <h3>📡 API Reference</h3>
          <div class="doc-content">
            <div class="api-section">
              <h4>REST Endpoints</h4>
              <div class="api-endpoint">
                <span class="method get">GET</span>
                <code>/get_logs</code>
                <p>Retrieve network logs with optional filtering parameters</p>
              </div>
              <div class="api-endpoint">
                <span class="method post">POST</span>
                <code>/clear_logs</code>
                <p>Clear all stored network logs from the database</p>
              </div>
              <div class="api-endpoint">
                <span class="method post">POST</span>
                <code>/save_session</code>
                <p>Save current capture session with custom title</p>
              </div>
              <div class="api-endpoint">
                <span class="method get">GET</span>
                <code>/list_sessions</code>
                <p>Retrieve list of all saved capture sessions</p>
              </div>
              
              <h4>Socket.IO Events</h4>
              <div class="api-endpoint">
                <span class="method socket">EMIT</span>
                <code>start_capture</code>
                <p>Begin network packet capture</p>
              </div>
              <div class="api-endpoint">
                <span class="method socket">EMIT</span>
                <code>stop_capture</code>
                <p>Stop network packet capture</p>
              </div>
              <div class="api-endpoint">
                <span class="method socket">LISTEN</span>
                <code>new_log</code>
                <p>Receive real-time network events</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Troubleshooting -->
        <section class="doc-section">
          <h3>🔧 Troubleshooting</h3>
          <div class="doc-content">
            <div class="troubleshooting">
              <div class="issue">
                <h4>⚠️ Port 5000 in use</h4>
                <p><strong>Solution:</strong> Kill the process using <code>lsof -ti:5000 | xargs kill -9</code> or disable macOS AirPlay Receiver</p>
              </div>
              <div class="issue">
                <h4>⚠️ Permission denied for packet capture</h4>
                <p><strong>Solution:</strong> Run backend with sudo: <code>sudo python backend/packet_sniffer.py</code></p>
              </div>
              <div class="issue">
                <h4>⚠️ Connection issues</h4>
                <p><strong>Solution:</strong> Check that both frontend (port 8000) and backend (port 5000) are running</p>
              </div>
            </div>
          </div>
        </section>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

.main-title {
  font-family: 'Inter', sans-serif;
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #4f8cff, #5cb3ff);
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

/* Documentation Styles */
.documentation-view {
  padding: 20px 0;
}

.doc-container {
  max-width: 900px;
  margin: 0 auto;
  background: var(--surface);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.doc-container h2 {
  color: var(--primary);
  font-size: 2rem;
  margin-bottom: 30px;
  text-align: center;
  font-weight: 700;
}

.doc-section {
  margin-bottom: 40px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 30px;
}

.doc-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.doc-section h3 {
  color: var(--text);
  font-size: 1.5rem;
  margin-bottom: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.doc-section h4 {
  color: var(--text);
  font-size: 1.2rem;
  margin: 20px 0 12px 0;
  font-weight: 600;
}

.doc-content {
  line-height: 1.6;
  color: var(--text);
}

.doc-content p {
  margin-bottom: 15px;
  color: var(--text-secondary);
}

.doc-content ul, .doc-content ol {
  margin: 15px 0;
  padding-left: 25px;
}

.doc-content li {
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.doc-content code {
  background: var(--border);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
  color: var(--primary);
}

/* Usage Steps */
.usage-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: var(--background);
  border-radius: 8px;
  border-left: 4px solid var(--primary);
}

.step-number {
  background: var(--primary);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content strong {
  color: var(--text);
  display: block;
  margin-bottom: 5px;
}

/* Technology Grid */
.tech-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-top: 20px;
}

.tech-category h4 {
  color: var(--primary);
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.tech-item {
  margin-bottom: 12px;
  padding: 12px;
  background: var(--background);
  border-radius: 6px;
  border-left: 3px solid var(--primary);
}

.tech-item strong {
  color: var(--text);
  display: block;
  margin-bottom: 4px;
}

/* Architecture Diagram */
.architecture-diagram {
  margin: 20px 0;
  text-align: center;
}

.arch-layer {
  background: var(--background);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  margin: 15px 0;
}

.arch-layer h4 {
  color: var(--primary);
  margin-bottom: 15px;
}

.arch-components {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.component {
  background: var(--primary);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
}

.arch-arrow {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 10px 0;
  font-weight: 600;
}

/* Component Explanation */
.component-explanation ul {
  margin-left: 20px;
}

/* Security Features */
.security-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.feature-item {
  padding: 20px;
  background: var(--background);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.feature-item strong {
  color: var(--primary);
  display: block;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.feature-item p {
  margin: 0;
  font-size: 0.95rem;
}

/* API Reference */
.api-section h4 {
  color: var(--primary);
  margin: 25px 0 15px 0;
  font-size: 1.3rem;
}

.api-endpoint {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  background: var(--background);
  border-radius: 6px;
  margin-bottom: 10px;
  border-left: 3px solid var(--border);
}

.method {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  min-width: 60px;
  text-align: center;
}

.method.get {
  background: #4caf50;
}

.method.post {
  background: #2196f3;
}

.method.socket {
  background: #9c27b0;
}

.api-endpoint code {
  font-size: 1rem;
  background: transparent;
  color: var(--text);
  font-weight: 600;
}

.api-endpoint p {
  margin: 0;
  flex: 1;
  font-size: 0.9rem;
}

/* Troubleshooting */
.troubleshooting {
  margin-top: 20px;
}

.issue {
  padding: 20px;
  background: var(--background);
  border-radius: 8px;
  margin-bottom: 15px;
  border-left: 4px solid #ff9800;
}

.issue h4 {
  color: #ff9800;
  margin: 0 0 10px 0;
  font-size: 1.1rem;
}

.issue p {
  margin: 0;
  font-size: 0.95rem;
}

/* Tab Navigation Updates */
.tab-nav {
  display: flex;
  gap: 4px;
  margin-bottom: 25px;
  background: var(--background);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid var(--border);
}

.tab-nav button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab-nav button.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-nav button:hover:not(.active) {
  background: var(--surface);
  color: var(--text);
}

/* Responsive Design */
@media (max-width: 768px) {
  .tech-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .security-features {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .arch-components {
    flex-direction: column;
    align-items: center;
  }
  
  .api-endpoint {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .step {
    flex-direction: column;
    gap: 10px;
  }
  
  .doc-container {
    padding: 20px;
    margin: 0 10px;
  }
}
</style>
