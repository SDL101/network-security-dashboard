import { createPinia } from "pinia";
import { useNetworkStore } from "./stores/networkStore";

const pinia = createPinia();
const networkStore = useNetworkStore();

// Establish a Socket.IO connection to the server with specific transport options and reconnection settings
const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"], // Use WebSocket and fallback to polling if needed
  reconnectionAttempts: 5, // Try reconnecting 5 times before giving up
  reconnectionDelay: 1000, // Wait 1 second between reconnection attempts
});

// Global counters and state variables
let totalEvents = 0; // Total number of events logged
let securityAlerts = 0; // Number of security alerts detected
let activeConnections = new Set(); // Set of active connections (unique IPs)
let isCapturePaused = false; // Flag to indicate if capture is paused
let queuedLogs = []; // Array to store logs while capture is paused
let isCapturing = false; // Flag to indicate if capture is active
let activeSocket = null; // Reference to the active Socket.IO connection used for capturing
let connectionAttempts = 0; // Count of connection attempts

// Search state object to keep track of current search/filter criteria
const searchState = {
  ip: "", // IP address to filter by
  ipType: "both", // Type of IP search: both, source, or destination
  port: "", // Port number to filter by
  severity: "", // Severity level filter (high, medium, low)
  startTime: "", // Start time for filtering logs
  endTime: "", // End time for filtering logs
};

// Global variable to track if capture was previously stopped
let wasStoppedBefore = true; // Initialize as true for first start

// === Utility Functions ===

// Ensure required DOM elements exist and create them if missing
function ensureElements() {
  const elements = {
    totalEvents: document.getElementById("total-events"),
    securityAlerts: document.getElementById("security-alerts"),
    activeConnections: document.getElementById("active-connections"),
    logsTable: document.querySelector("#logs-table tbody"),
    statusIndicator: document.querySelector(".status-indicator"),
  };

  // If status indicator doesn't exist, create it and insert it into the DOM
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

// Update the connection status element with a message and a type (e.g., success, error)
function showConnectionStatus(message, type) {
  const statusDiv =
    document.getElementById("connection-status") || createStatusElement();
  statusDiv.textContent = message;
  statusDiv.className = `connection-status ${type}`;
}

// Create a connection status element if it doesn't exist in the DOM
function createStatusElement() {
  const statusDiv = document.createElement("div");
  statusDiv.id = "connection-status";
  document.querySelector(".dashboard").prepend(statusDiv);
  return statusDiv;
}

// Update UI stats (like total events, security alerts, active connections, and network status)
function updateStats(stats) {
  const elements = ensureElements();

  if (elements.totalEvents) {
    elements.totalEvents.textContent = networkStore.totalEvents || 0;
  }
  if (elements.securityAlerts) {
    elements.securityAlerts.textContent = networkStore.securityAlerts || 0;
  }
  if (elements.activeConnections) {
    elements.activeConnections.textContent =
      networkStore.activeConnections.size || 0;
  }
  if (elements.statusIndicator) {
    // Set the class and inner HTML based on current network status and uptime
    elements.statusIndicator.className = `status-indicator ${
      networkStore.securityAlerts > 0 ? "alert" : "safe"
    }`;
    elements.statusIndicator.innerHTML = `
      <h3>Network Status</h3>
      <span class="status-text">${
        networkStore.scan_status || "Monitoring"
      }</span>
      <span class="uptime">Uptime: ${formatUptime(
        networkStore.uptime_seconds || 0
      )}</span>
    `;
  }
}

// Convert uptime in seconds to a formatted string (e.g., "1h 23m 45s")
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

// Add a new log entry to the logs table if capture is active and not paused (or already queued)
function addLogEntry(log) {
  // Do not add if capture is not active or if capture is paused and the log is not already queued
  if (!isCapturing || (isCapturePaused && !queuedLogs.includes(log))) {
    return;
  }

  const elements = ensureElements();
  if (!elements.logsTable) return;

  // Check the event type filter from the dropdown; ignore the log if it doesn't match
  const eventFilter = document.getElementById("eventType")?.value;
  if (eventFilter && log.event_type !== eventFilter) return;

  // Create a table row for the log entry using a template literal
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

  // Insert the new log row at the top of the logs table
  elements.logsTable.insertAdjacentHTML("afterbegin", row);

  // Limit the logs table to the most recent 100 entries to prevent overflow
  const rows = elements.logsTable.getElementsByTagName("tr");
  if (rows.length > 100) {
    elements.logsTable.removeChild(rows[rows.length - 1]);
  }

  // If a stat box filter is active, reapply the filter on the logs
  const activeFilter = document.querySelector(".stat-box.active");
  if (activeFilter) {
    filterLogs(activeFilter.dataset.filter);
  }
  updateExportButtonState();
}

// Clear all logs from the UI and reset state variables; also trigger backend log clearing via API
function clearLogs() {
  // If capture is active, alert the user to stop capture before clearing logs
  if (isCapturing) {
    alert("Please stop capture before clearing logs");
    return;
  }

  // Clear the logs table in the UI
  const elements = ensureElements();
  if (elements.logsTable) {
    elements.logsTable.innerHTML = "";
  }

  // Reset global counters and states
  totalEvents = 0;
  securityAlerts = 0;
  activeConnections.clear();
  queuedLogs = [];

  // Reset stats display on the UI
  updateStats({
    packets_analyzed: 0,
    threats_detected: 0,
    active_ips: 0,
    scan_status: "Normal",
    uptime_seconds: 0,
  });

  // Clear any active filters from the stat boxes
  const statBoxes = document.querySelectorAll(".stat-box.clickable");
  statBoxes.forEach((box) => box.classList.remove("active"));

  // Reset the event type filter dropdown
  const eventTypeSelect = document.getElementById("eventType");
  if (eventTypeSelect) eventTypeSelect.value = "";

  // Force immediate UI update for counters
  if (elements.totalEvents) elements.totalEvents.textContent = "0";
  if (elements.securityAlerts) elements.securityAlerts.textContent = "0";
  if (elements.activeConnections) elements.activeConnections.textContent = "0";

  // Clear logs from the backend by making a POST request to the clear_logs API
  fetch("http://localhost:5000/clear_logs", {
    method: "POST",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to clear logs on server");
      }
      console.log("Logs cleared successfully on both frontend and backend");
    })
    .catch((error) => {
      console.error("Error clearing logs:", error);
    });
  updateExportButtonState();
}

// Load initial logs from the backend when capture is active
function loadInitialLogs() {
  if (!isCapturing) {
    console.log("Not loading initial logs - capture is stopped");
    return;
  }

  // Fetch logs from the backend API
  fetch("http://localhost:5000/get_logs")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Process logs only if capture is still active
      if (isCapturing && data.logs) {
        data.logs.forEach((log) => addLogEntry(log));
      }
      // Update the UI stats if available
      if (data.stats) {
        updateStats(data.stats);
      }
    })
    .catch((error) => {
      console.error("Error loading initial logs:", error);
      // Show an error message and retry after 5 seconds if capture is active
      if (isCapturing) {
        showConnectionStatus("Error loading logs - retrying...", "error");
        setTimeout(loadInitialLogs, 5000);
      }
    });
}

// === Socket Event Handlers ===

// When the socket connects successfully, update the connection status and load initial logs
socket.on("connect", () => {
  console.log("Connected to server");
  showConnectionStatus("Connected", "success");
  loadInitialLogs();
});

// Handle connection errors and display appropriate status messages
socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
  showConnectionStatus("Connection error - retrying...", "error");
});

// When a new log is received from the server, update the UI accordingly
socket.on("new_log", function (data) {
  console.log("Received new log:", data);
  // If capture is not active, reset counters
  if (!isCapturing) {
    totalEvents = 0;
    securityAlerts = 0;
    activeConnections.clear();
  }
  // Add the log entry and update stats if provided
  if (data.log) {
    addLogEntry(data.log);
  }
  if (data.stats) {
    // Only update UI stats if capture is active
    if (isCapturing) {
      updateStats(data.stats);
    }
  }
});

// Handle capture status updates from the server (e.g., when capture stops)
socket.on("capture_status", function (data) {
  console.log("Capture status received:", data);
  networkStore.isCapturing = data.status === "started";

  if (data.stats) {
    networkStore.updateStats(data.stats);
  }

  updateButtonStates();
});

// Handle periodic heartbeat messages from the server to update stats and show network status
socket.on("heartbeat", function (data) {
  console.log("Received heartbeat:", data);
  if (data.stats) {
    updateStats(data.stats);
  }

  const elements = ensureElements();
  if (!elements.logsTable) return;

  // If no log has been added in the last 5 seconds, add an "all clear" message row
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

// Listen for changes to the event type filter and update the logs display accordingly
document.addEventListener("DOMContentLoaded", () => {
  const eventTypeSelect = document.getElementById("eventType");
  if (eventTypeSelect) {
    eventTypeSelect.addEventListener("change", function () {
      const selectedType = this.value;
      const rows = document.querySelectorAll("#logs-table tbody tr");

      // Show or hide rows based on whether they match the selected event type
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

// Fetch logs from the backend with additional filters for event type and time range
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

      // Create rows for each log in the filtered data
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

// Initialize click event handlers for stat boxes to apply log filters based on their type
function initializeStatBoxes() {
  const statBoxes = document.querySelectorAll(".stat-box.clickable");

  statBoxes.forEach((box) => {
    box.addEventListener("click", () => {
      const filterType = box.dataset.filter;

      // Toggle the active state on stat boxes
      statBoxes.forEach((b) => b.classList.remove("active"));
      box.classList.add("active");

      // Apply filtering based on the selected filter type
      filterLogs(filterType);

      // Update the event type dropdown to reflect the selected filter if applicable
      const eventTypeSelect = document.getElementById("eventType");
      if (filterType === "security") {
        eventTypeSelect.value = "network_scan"; // Default to network_scan for security filter
      } else if (filterType === "all") {
        eventTypeSelect.value = "";
      }
    });
  });
}

// Filter logs displayed in the logs table based on the provided filter type
function filterLogs(filterType) {
  const rows = document.querySelectorAll("#logs-table tbody tr");

  rows.forEach((row) => {
    const eventType = row.querySelector(".event-type")?.textContent;
    const severity = row.dataset.severity;

    switch (filterType) {
      case "security":
        // Only show rows with high or medium severity events
        row.classList.toggle(
          "filtered-out",
          !(severity === "high" || severity === "medium")
        );
        break;

      case "active":
        // Only show rows from the last 5 minutes (recent connections)
        const timestamp = new Date(row.cells[0].textContent);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        row.classList.toggle("filtered-out", timestamp < fiveMinutesAgo);
        break;

      case "all":
        // Show all rows by removing the filter
        row.classList.remove("filtered-out");
        break;
    }
  });
}

// Initialize search functionality including toggle, input listeners, and button events
function initializeSearch() {
  // Toggle search fields display on clicking the search button
  const toggleBtn = document.getElementById("toggleSearch");
  const searchFields = document.querySelector(".search-fields");

  toggleBtn.addEventListener("click", () => {
    toggleBtn.classList.toggle("collapsed");
    searchFields.classList.toggle("collapsed");
  });

  // Bind the Apply and Clear search buttons to their respective functions
  document.getElementById("applySearch").addEventListener("click", applySearch);
  document.getElementById("clearSearch").addEventListener("click", clearSearch);

  // Optional: update search results in real-time as user types or selects
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

// Update the searchState object with current values from search inputs
function updateSearchState() {
  searchState.ip = document.getElementById("ipSearch").value;
  searchState.ipType = document.getElementById("ipSearchType").value;
  searchState.port = document.getElementById("portSearch").value;
  searchState.severity = document.getElementById("severityFilter").value;
  searchState.startTime = document.getElementById("startTime").value;
  searchState.endTime = document.getElementById("endTime").value;
}

// Apply search filters to the logs table rows based on the current search state
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

    // Filter by IP address if specified
    if (searchState.ip) {
      const ipMatch =
        searchState.ipType === "source"
          ? sourceIp
          : searchState.ipType === "dest"
          ? destIp
          : sourceIp + destIp;
      show = show && ipMatch.includes(searchState.ip);
    }

    // Filter by port number if specified (search within details)
    if (searchState.port) {
      show = show && details.includes(`port ${searchState.port}`);
    }

    // Filter by severity level if specified
    if (searchState.severity) {
      show = show && severity === searchState.severity;
    }

    // Filter by start and end time if specified
    if (searchState.startTime) {
      show = show && timestamp >= new Date(searchState.startTime);
    }
    if (searchState.endTime) {
      show = show && timestamp <= new Date(searchState.endTime);
    }

    // Toggle the row's visibility based on whether it passes all filters
    row.classList.toggle("filtered-out", !show);

    // If the row is shown and an IP filter is active, highlight matching text
    if (show && searchState.ip) {
      highlightText(row, searchState.ip);
    }
  });
}

// Clear search filters, reset search state and remove any highlights from the logs table
function clearSearch() {
  // Clear input values for all search fields
  document.getElementById("ipSearch").value = "";
  document.getElementById("ipSearchType").value = "both";
  document.getElementById("portSearch").value = "";
  document.getElementById("severityFilter").value = "";
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";

  // Reset the search state object
  Object.keys(searchState).forEach((key) => (searchState[key] = ""));

  // Show all rows and remove any highlight classes
  const rows = document.querySelectorAll("#logs-table tbody tr");
  rows.forEach((row) => {
    row.classList.remove("filtered-out");
    removeHighlights(row);
  });
}

// Highlight text in a table row that matches the search text
function highlightText(row, searchText) {
  if (!searchText) return;

  const cells = row.getElementsByTagName("td");
  Array.from(cells).forEach((cell) => {
    removeHighlights(cell);
    // Avoid re-highlighting text within already highlighted elements
    if (!cell.innerHTML.includes('span class="event-type"')) {
      cell.innerHTML = cell.innerHTML.replace(
        new RegExp(searchText, "gi"),
        (match) => `<span class="search-match">${match}</span>`
      );
    }
  });
}

// Remove highlight spans from an element's inner HTML
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

// === Capture Controls ===

// Initialize capture controls, button states, and socket connection for capturing logs
function initializeCapture() {
  const startBtn = document.getElementById("startCapture");
  const stopBtn = document.getElementById("stopCapture");
  const pauseBtn = document.getElementById("toggleCapture");
  const controlPanel = document.querySelector(".control-panel");

  // Initialize capture state variables
  isCapturing = false;
  isCapturePaused = false;
  queuedLogs = [];

  // Update the state of the control buttons based on capture status
  function updateButtonStates() {
    startBtn.disabled = isCapturing;
    stopBtn.disabled = !isCapturing;
    pauseBtn.disabled = !isCapturing;

    startBtn.classList.toggle("active", isCapturing);
    stopBtn.classList.toggle("stop", isCapturing);
    pauseBtn.classList.toggle("paused", isCapturePaused);

    // Update pause button text and icon based on pause state
    pauseBtn.innerHTML = isCapturePaused
      ? `<span class="icon">▶️</span><span class="btn-text">Resume Capture</span>`
      : `<span class="icon">⏸️</span><span class="btn-text">Pause Capture</span>`;

    // Set a status attribute on the control panel to reflect current capture status
    controlPanel.setAttribute(
      "data-status",
      !isCapturing
        ? "Capture Stopped"
        : isCapturePaused
        ? "Capture Paused"
        : "Capturing..."
    );
    updateExportButtonState();
  }

  // Function to start capturing logs
  function startCapture() {
    if (isCapturing) return;

    // Reset counters and active connection set
    totalEvents = 0;
    securityAlerts = 0;
    activeConnections.clear();

    // Clear the logs display before starting capture
    clearLogs();

    isCapturing = true;
    isCapturePaused = false;
    // Emit a start_capture event via the active socket connection
    activeSocket.emit("start_capture");
    showConnectionStatus("Starting capture...", "success");
    updateButtonStates();
  }

  // Function to stop capturing logs
  function stopCapture() {
    if (!isCapturing) return;

    isCapturing = false;
    isCapturePaused = false;
    // Emit a stop_capture event via the active socket connection
    activeSocket.emit("stop_capture");

    // Update connection status to reflect that capture has stopped
    showConnectionStatus("Capture Stopped, Press Start to Begin", "info");

    // Don't reset the counters, just update the button states
    updateButtonStates();
  }

  // Establish a new Socket.IO connection for capture control with custom options
  activeSocket = io("http://localhost:5000", {
    transports: ["websocket", "polling"],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 5000,
    autoConnect: true,
  });

  // Handle connection event: update UI and reset capture flags
  activeSocket.on("connect", () => {
    console.log("Connected to server");
    showConnectionStatus("Connected - Ready to capture", "success");
    isCapturing = false;
    isCapturePaused = false;
    updateButtonStates();
  });

  // Handle capture status messages from the server
  activeSocket.on("capture_status", function (data) {
    console.log("Capture status received:", data);
    networkStore.isCapturing = data.status === "started";

    if (data.status === "stopped") {
      // On stop, reset counters and clear active connections
      totalEvents = 0;
      securityAlerts = 0;
      activeConnections.clear();

      if (data.stats) {
        updateStats(data.stats);
      }
    }

    updateButtonStates();
  });

  // Handle new log messages while capturing; queue logs if paused
  activeSocket.on("new_log", function (data) {
    if (!isCapturing || !data) return;

    if (isCapturePaused) {
      queuedLogs.push(data.log);
    } else {
      if (data.log) addLogEntry(data.log);
      if (data.stats) updateStats(data.stats);
    }
  });

  // Bind button click events to start, stop, and pause/resume capture functions
  startBtn.addEventListener("click", startCapture);
  stopBtn.addEventListener("click", stopCapture);
  pauseBtn.addEventListener("click", toggleCapture);

  // Set the initial state of capture control buttons
  updateButtonStates();
}

// Export logs as a CSV file from the logs table
function exportLogs() {
  // Verify there are logs to export
  const table = document.getElementById("logs-table");
  const rows = table.querySelectorAll("tbody tr");

  if (rows.length === 0) {
    alert("No logs to export");
    return;
  }

  // Create CSV header row
  let csvContent =
    "Time,Source IP,Destination IP,Event Type,Details,Severity\n";

  // Convert each row into CSV format
  rows.forEach((row) => {
    const cells = Array.from(row.cells);
    const rowData = cells.map((cell) => `"${cell.textContent.trim()}"`);
    csvContent += rowData.join(",") + "\n";
  });

  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  link.href = window.URL.createObjectURL(blob);
  link.download = `network_security_logs_${timestamp}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Enable or disable the export logs button based on capture state
function updateExportButtonState() {
  const exportBtn = document.getElementById("exportLogs");
  if (!exportBtn) return;

  // Only enable the button when capture is stopped
  exportBtn.disabled = isCapturing;
}

// === Initialization ===

// When the document is fully loaded, initialize all core functionalities and UI event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize stat boxes for filtering logs
  initializeStatBoxes();
  // Initialize search functionality for logs filtering
  initializeSearch();
  // Initialize capture controls and set up Socket.IO capture connection
  initializeCapture();

  // Clear any existing logs in the logs table
  const elements = ensureElements();
  if (elements.logsTable) {
    elements.logsTable.innerHTML = "";
  }

  // Set up event listener for the event type filter dropdown to update log display on change
  const eventTypeSelect = document.getElementById("eventType");
  if (eventTypeSelect) {
    eventTypeSelect.addEventListener("change", function () {
      filterLogsByType(this.value);
    });
  }

  // Set initial connection status message on the UI
  showConnectionStatus("Connecting to server...", "info");
  updateExportButtonState();

  console.log("Application initialized successfully");
});
