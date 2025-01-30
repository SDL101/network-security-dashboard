const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

let totalEvents = 0;
let securityAlerts = 0;
let activeConnections = new Set();
let isCapturePaused = false;
let queuedLogs = [];
let isCapturing = false;
let activeSocket = null;
let connectionAttempts = 0;

// Add search state object
const searchState = {
  ip: "",
  ipType: "both",
  port: "",
  severity: "",
  startTime: "",
  endTime: "",
};

// Make sure all required elements exist
function ensureElements() {
  const elements = {
    totalEvents: document.getElementById("total-events"),
    securityAlerts: document.getElementById("security-alerts"),
    activeConnections: document.getElementById("active-connections"),
    logsTable: document.querySelector("#logs-table tbody"),
    statusIndicator: document.querySelector(".status-indicator"),
  };

  // Create status indicator if it doesn't exist
  if (!elements.statusIndicator) {
    const statusDiv = document.createElement("div");
    statusDiv.className = "status-indicator";
    document
      .querySelector(".dashboard")
      .insertBefore(statusDiv, document.querySelector(".stats-panel"));
    elements.statusIndicator = statusDiv;
  }

  return elements;
}

function showConnectionStatus(message, type) {
  const statusDiv =
    document.getElementById("connection-status") || createStatusElement();
  statusDiv.textContent = message;
  statusDiv.className = `connection-status ${type}`;
}

function createStatusElement() {
  const statusDiv = document.createElement("div");
  statusDiv.id = "connection-status";
  document.querySelector(".dashboard").prepend(statusDiv);
  return statusDiv;
}

function updateStats(stats) {
  const elements = ensureElements();

  if (elements.totalEvents) {
    elements.totalEvents.textContent = stats.packets_analyzed || 0;
  }
  if (elements.securityAlerts) {
    elements.securityAlerts.textContent = stats.threats_detected || 0;
  }
  if (elements.activeConnections) {
    elements.activeConnections.textContent = stats.active_ips || 0;
  }
  if (elements.statusIndicator) {
    elements.statusIndicator.className = `status-indicator ${
      stats.threats_detected > 0 ? "alert" : "safe"
    }`;
    elements.statusIndicator.innerHTML = `
      <h3>Network Status</h3>
      <span class="status-text">${stats.scan_status || "Monitoring"}</span>
      <span class="uptime">Uptime: ${formatUptime(
        stats.uptime_seconds || 0
      )}</span>
    `;
  }
}

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

function addLogEntry(log) {
  if (!isCapturing || (isCapturePaused && !queuedLogs.includes(log))) {
    return;
  }

  const elements = ensureElements();
  if (!elements.logsTable) return;

  const eventFilter = document.getElementById("eventType")?.value;
  if (eventFilter && log.event_type !== eventFilter) return;

  const row = `
    <tr class="${log.event_type}" data-severity="${log.severity}">
      <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
      <td>${log.source_ip}</td>
      <td>${log.destination_ip}</td>
      <td>
        <span class="event-type ${log.event_type}">${log.event_type}</span>
      </td>
      <td>${log.details}</td>
      <td>
        <span class="severity-badge ${log.severity}">${log.severity}</span>
      </td>
    </tr>
  `;

  elements.logsTable.insertAdjacentHTML("afterbegin", row);

  // Keep only last 100 entries
  const rows = elements.logsTable.getElementsByTagName("tr");
  if (rows.length > 100) {
    elements.logsTable.removeChild(rows[rows.length - 1]);
  }

  // Apply current filter if any stat box is active
  const activeFilter = document.querySelector(".stat-box.active");
  if (activeFilter) {
    filterLogs(activeFilter.dataset.filter);
  }
}

function clearLogs() {
  if (isCapturing && !isCapturePaused) {
    alert("Please pause or stop capture before clearing logs");
    return;
  }

  const elements = ensureElements();
  if (elements.logsTable) {
    elements.logsTable.innerHTML = "";
  }
  totalEvents = 0;
  securityAlerts = 0;
  activeConnections.clear();
  queuedLogs = [];
  updateStats({
    packets_analyzed: 0,
    threats_detected: 0,
    active_ips: 0,
    scan_status: "Normal",
    uptime_seconds: 0,
  });
}

// Initial load of logs
function loadInitialLogs() {
  fetch("http://localhost:5000/get_logs")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Initial logs loaded:", data);
      if (data.logs) {
        data.logs.forEach((log) => addLogEntry(log));
      }
      if (data.stats) {
        updateStats(data.stats);
      }
    })
    .catch((error) => {
      console.error("Error loading initial logs:", error);
      showConnectionStatus("Error loading logs - retrying...", "error");
      // Retry after 5 seconds
      setTimeout(loadInitialLogs, 5000);
    });
}

// Socket event handlers
socket.on("connect", () => {
  console.log("Connected to server");
  showConnectionStatus("Connected", "success");
  loadInitialLogs();
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
  showConnectionStatus("Connection error - retrying...", "error");
});

socket.on("new_log", function (data) {
  console.log("Received new log:", data);
  if (data.log) {
    addLogEntry(data.log);
  }
  if (data.stats) {
    updateStats(data.stats);
  }
});

socket.on("heartbeat", function (data) {
  console.log("Received heartbeat:", data);
  if (data.stats) {
    updateStats(data.stats);
  }

  const elements = ensureElements();
  if (!elements.logsTable) return;

  const lastRow = elements.logsTable.querySelector("tr:first-child");
  if (!lastRow || new Date() - new Date(lastRow.cells[0].textContent) > 5000) {
    const allClearRow = `
      <tr class="all-clear">
        <td colspan="6">
          <div class="all-clear-message">
            <span class="icon">✓</span>
            Network scan active - No threats detected
            <span class="timestamp">${new Date(
              data.timestamp
            ).toLocaleTimeString()}</span>
          </div>
        </td>
      </tr>
    `;
    elements.logsTable.insertAdjacentHTML("afterbegin", allClearRow);
  }
});

// Add event listener for filter changes
document.addEventListener("DOMContentLoaded", () => {
  const eventTypeSelect = document.getElementById("eventType");
  if (eventTypeSelect) {
    eventTypeSelect.addEventListener("change", function () {
      const selectedType = this.value;
      const rows = document.querySelectorAll("#logs-table tbody tr");

      rows.forEach((row) => {
        if (!selectedType || row.classList.contains(selectedType)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  }
});

function fetchFilteredLogs(eventType = "", startDate = "", endDate = "") {
  console.log("Fetching logs with filters...");

  let url = `http://localhost:5000/get_logs?`;
  if (eventType) url += `event_type=${eventType}&`;
  if (startDate) url += `start_date=${startDate}&`;
  if (endDate) url += `end_date=${endDate}&`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log("Filtered API Response Data:", data);
      const tableBody = document.querySelector("#logs-table tbody");
      tableBody.innerHTML = "";

      data.forEach((log) => {
        const formattedDate = new Date(log.timestamp).toLocaleString();
        const isCritical = log.event_type === "failed_login";

        const row = `<tr style="color: ${isCritical ? "red" : "black"};">
                    <td>${formattedDate}</td>
                    <td>${log.source_ip}</td>
                    <td>${log.destination_ip}</td>
                    <td>${log.event_type}</td>
                    <td>${log.details}</td>
                </tr>`;
        tableBody.innerHTML += row;
      });
    })
    .catch((error) => console.error("Error fetching logs:", error));
}

function initializeStatBoxes() {
  const statBoxes = document.querySelectorAll(".stat-box.clickable");

  statBoxes.forEach((box) => {
    box.addEventListener("click", () => {
      const filterType = box.dataset.filter;

      // Toggle active state
      statBoxes.forEach((b) => b.classList.remove("active"));
      box.classList.add("active");

      // Apply filtering
      filterLogs(filterType);

      // Update dropdown to match
      const eventTypeSelect = document.getElementById("eventType");
      if (filterType === "security") {
        eventTypeSelect.value = "network_scan"; // Default to network_scan for security filter
      } else if (filterType === "all") {
        eventTypeSelect.value = "";
      }
    });
  });
}

function filterLogs(filterType) {
  const rows = document.querySelectorAll("#logs-table tbody tr");

  rows.forEach((row) => {
    const eventType = row.querySelector(".event-type")?.textContent;
    const severity = row.dataset.severity;

    switch (filterType) {
      case "security":
        // Show only high and medium severity events
        row.classList.toggle(
          "filtered-out",
          !(severity === "high" || severity === "medium")
        );
        break;

      case "active":
        // Show only recent connections (last 5 minutes)
        const timestamp = new Date(row.cells[0].textContent);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        row.classList.toggle("filtered-out", timestamp < fiveMinutesAgo);
        break;

      case "all":
        // Show all rows
        row.classList.remove("filtered-out");
        break;
    }
  });
}

function initializeSearch() {
  // Initialize toggle functionality
  const toggleBtn = document.getElementById("toggleSearch");
  const searchFields = document.querySelector(".search-fields");

  toggleBtn.addEventListener("click", () => {
    toggleBtn.classList.toggle("collapsed");
    searchFields.classList.toggle("collapsed");
  });

  // Initialize search buttons
  document.getElementById("applySearch").addEventListener("click", applySearch);
  document.getElementById("clearSearch").addEventListener("click", clearSearch);

  // Initialize real-time search (optional)
  const searchInputs = document.querySelectorAll(
    ".search-group input, .search-group select"
  );
  searchInputs.forEach((input) => {
    input.addEventListener("input", () => {
      updateSearchState();
      applySearch();
    });
  });
}

function updateSearchState() {
  searchState.ip = document.getElementById("ipSearch").value;
  searchState.ipType = document.getElementById("ipSearchType").value;
  searchState.port = document.getElementById("portSearch").value;
  searchState.severity = document.getElementById("severityFilter").value;
  searchState.startTime = document.getElementById("startTime").value;
  searchState.endTime = document.getElementById("endTime").value;
}

function applySearch() {
  updateSearchState();
  const rows = document.querySelectorAll("#logs-table tbody tr");

  rows.forEach((row) => {
    const sourceIp = row.cells[1].textContent;
    const destIp = row.cells[2].textContent;
    const severity = row.dataset.severity;
    const timestamp = new Date(row.cells[0].textContent);
    const details = row.cells[4].textContent;

    let show = true;

    // IP address filter
    if (searchState.ip) {
      const ipMatch =
        searchState.ipType === "source"
          ? sourceIp
          : searchState.ipType === "dest"
          ? destIp
          : sourceIp + destIp;
      show = show && ipMatch.includes(searchState.ip);
    }

    // Port filter
    if (searchState.port) {
      show = show && details.includes(`port ${searchState.port}`);
    }

    // Severity filter
    if (searchState.severity) {
      show = show && severity === searchState.severity;
    }

    // Time range filter
    if (searchState.startTime) {
      show = show && timestamp >= new Date(searchState.startTime);
    }
    if (searchState.endTime) {
      show = show && timestamp <= new Date(searchState.endTime);
    }

    // Apply visibility
    row.classList.toggle("filtered-out", !show);

    // Highlight matches if shown
    if (show && searchState.ip) {
      highlightText(row, searchState.ip);
    }
  });
}

function clearSearch() {
  // Clear all search inputs
  document.getElementById("ipSearch").value = "";
  document.getElementById("ipSearchType").value = "both";
  document.getElementById("portSearch").value = "";
  document.getElementById("severityFilter").value = "";
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";

  // Reset search state
  Object.keys(searchState).forEach((key) => (searchState[key] = ""));

  // Show all rows and remove highlights
  const rows = document.querySelectorAll("#logs-table tbody tr");
  rows.forEach((row) => {
    row.classList.remove("filtered-out");
    removeHighlights(row);
  });
}

function highlightText(row, searchText) {
  if (!searchText) return;

  const cells = row.getElementsByTagName("td");
  Array.from(cells).forEach((cell) => {
    removeHighlights(cell);
    if (!cell.innerHTML.includes('span class="event-type"')) {
      cell.innerHTML = cell.innerHTML.replace(
        new RegExp(searchText, "gi"),
        (match) => `<span class="search-match">${match}</span>`
      );
    }
  });
}

function removeHighlights(element) {
  const highlights = element.getElementsByClassName("search-match");
  while (highlights.length > 0) {
    const parent = highlights[0].parentNode;
    parent.innerHTML = parent.innerHTML.replace(
      /<span class="search-match">([^<]+)<\/span>/g,
      "$1"
    );
  }
}

function initializeCapture() {
  const startBtn = document.getElementById('startCapture');
  const stopBtn = document.getElementById('stopCapture');
  const pauseBtn = document.getElementById('toggleCapture');
  const controlPanel = document.querySelector('.control-panel');

  // Ensure capture is stopped at startup
  isCapturing = false;
  isCapturePaused = false;
  queuedLogs = [];

  function updateButtonStates() {
    // Update button states
    startBtn.disabled = isCapturing;
    stopBtn.disabled = !isCapturing;
    pauseBtn.disabled = !isCapturing;

    // Update button appearances
    startBtn.classList.toggle('active', isCapturing);
    stopBtn.classList.toggle('stop', isCapturing);
    pauseBtn.classList.toggle('paused', isCapturePaused);

    // Update pause button text
    pauseBtn.innerHTML = isCapturePaused ? 
        `<span class="icon">▶️</span><span class="btn-text">Resume Capture</span>` :
        `<span class="icon">⏸️</span><span class="btn-text">Pause Capture</span>`;

    // Update status text
    controlPanel.setAttribute('data-status', 
        !isCapturing ? 'Capture Stopped' :
        isCapturePaused ? 'Capture Paused' :
        'Capturing...'
    );

    console.log('Button states updated:', {
        isCapturing,
        isCapturePaused,
        startDisabled: startBtn.disabled,
        stopDisabled: stopBtn.disabled,
        pauseDisabled: pauseBtn.disabled
    });
  }

  // Connect to socket but don't start capture
  activeSocket = io("http://localhost:5000", {
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 5000,
    autoConnect: true
  });

  activeSocket.on('connect', () => {
    console.log('Connected to server');
    showConnectionStatus('Connected - Ready to capture', 'success');
    // Ensure we're in a stopped state on connect
    isCapturing = false;
    updateButtonStates();
  });

  activeSocket.on('capture_status', (data) => {
    console.log('Capture status received:', data.status);
    isCapturing = data.status === 'started';
    if (!isCapturing) {
      isCapturePaused = false;
      queuedLogs = [];
    }
    updateButtonStates();
  });

  function startCapture() {
    if (isCapturing) return;
    console.log('Requesting capture start...');
    activeSocket.emit('start_capture');
  }

  function stopCapture() {
    if (!isCapturing) return;
    console.log('Requesting capture stop...');
    activeSocket.emit('stop_capture');
  }

  // Add event listeners
  startBtn.addEventListener('click', startCapture);
  stopBtn.addEventListener('click', stopCapture);
  pauseBtn.addEventListener('click', toggleCapture);

  // Initial button states
  updateButtonStates();
}

// Update your document ready handler
document.addEventListener("DOMContentLoaded", () => {
  initializeStatBoxes();
  initializeSearch();
  initializeCapture();
  // ... your existing initialization code ...
});
