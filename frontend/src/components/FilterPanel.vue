<template>
  <div class="filter-panel">
    <div class="filter-header" @click="toggleFilters">
      <div class="header-content">
        <h3>Filters</h3>
        <div class="active-filters">
          <span v-if="!hasActiveFilters">No filters active</span>
          <template v-else>
            <span v-for="(filters, category) in activeFilters" :key="category" class="filter-category">
              <span v-for="filter in filters" :key="filter" class="active-filter default-filter-badge" v-if="category !== 'Stream'">
                {{ filter }}
              </span>
              <span v-for="filter in filters" :key="'stream-badge-' + filter" class="active-filter stream-badge" v-else v-html="filter"></span>
            </span>
          </template>
        </div>
      </div>
      <span class="toggle-icon" :class="{ 'expanded': isExpanded }">
        ▼
      </span>
    </div>
    
    <div class="filter-content" :class="{ 'expanded': isExpanded }">
      <div class="filter-section">
        <h4>Event Type</h4>
        <div class="filter-options">
          <label v-for="type in eventTypes" :key="type.value" class="filter-option">
            <input
              type="checkbox"
              v-model="selectedEventTypes"
              :value="type.value"
              @change="updateFilters"
            />
            {{ type.label }}
          </label>
        </div>
      </div>

      <div class="filter-section">
        <h4>Severity</h4>
        <div class="filter-options">
          <label v-for="severity in severities" :key="severity.value" class="filter-option">
            <input
              type="checkbox"
              v-model="selectedSeverities"
              :value="severity.value"
              @change="updateFilters"
            />
            {{ severity.label }}
          </label>
        </div>
      </div>

      <div class="filter-section">
        <h4>Protocol</h4>
        <div class="filter-options">
          <label v-for="protocol in protocols" :key="protocol.value" class="filter-option">
            <input
              type="checkbox"
              v-model="selectedProtocols"
              :value="protocol.value"
              @change="updateFilters"
            />
            {{ protocol.label }}
          </label>
        </div>
      </div>

      <div class="filter-section">
        <h4>IP Address (Source or Destination)</h4>
        <div class="filter-options">
          <input
            type="text"
            v-model="ipInput"
            @input="onIpInput"
            placeholder="Enter IPs (comma separated)"
            class="ip-input"
            :disabled="isStreamFollowing"
          />
        </div>
      </div>

      <div class="filter-actions">
        <button @click="clearFilters" class="clear-btn">Clear All Filters</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useNetworkStore } from '../stores/networkStore';

const networkStore = useNetworkStore();
const isExpanded = ref(false);

const eventTypes = [
  { value: 'network_scan', label: 'Port Scans' },
  { value: 'external_connection', label: 'External Connections' },
  { value: 'normal_traffic', label: 'Normal Traffic' }
];

const severities = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

// will add more here as filtering algo improves
const protocols = [
  { value: 'HTTP', label: 'HTTP' },
  { value: 'HTTPS', label: 'HTTPS' },
  { value: 'SSH', label: 'SSH' },
  { value: 'FTP', label: 'FTP' },
  //{ value: 'SMTP', label: 'SMTP' },
  { value: 'DNS', label: 'DNS' },
  //{ value: 'RDP', label: 'RDP' },
];

const selectedEventTypes = ref([]);
const selectedSeverities = ref([]);
const selectedProtocols = ref([]);
const ipInput = ref("");
const selectedIpAddresses = ref([]);

const hasActiveFilters = computed(() => {
  // Also show as active if stream-following is active
  const storeFilters = networkStore.activeFilters;
  const streamActive =
    storeFilters.srcPort != null &&
    storeFilters.dstPort != null &&
    storeFilters.protocols && storeFilters.protocols.length === 1 &&
    storeFilters.ipAddresses && storeFilters.ipAddresses.length === 2;
  return (
    selectedEventTypes.value.length > 0 ||
    selectedSeverities.value.length > 0 ||
    selectedProtocols.value.length > 0 ||
    selectedIpAddresses.value.length > 0 ||
    streamActive
  );
});

const activeFilters = computed(() => {
  const filters = {};
  
  if (selectedEventTypes.value.length > 0) {
    filters['Event Types'] = selectedEventTypes.value.map(type => 
      eventTypes.find(t => t.value === type)?.label || type
    );
  }
  
  if (selectedSeverities.value.length > 0) {
    filters['Severity'] = selectedSeverities.value.map(severity => 
      severities.find(s => s.value === severity)?.label || severity
    );
  }
  
  if (selectedProtocols.value.length > 0) {
    filters['Protocol'] = selectedProtocols.value.map(protocol => 
      protocols.find(p => p.value === protocol)?.label || protocol
    );
  }
  
  if (!isStreamFollowing.value && selectedIpAddresses.value.length > 0) {
    filters['IP Address'] = selectedIpAddresses.value;
  }
  
  // Add stream-following badge if all 5-tuple fields are set
  const storeFilters = networkStore.activeFilters;
  if (
    storeFilters.srcPort != null &&
    storeFilters.dstPort != null &&
    storeFilters.protocols && storeFilters.protocols.length === 1 &&
    storeFilters.ipAddresses && storeFilters.ipAddresses.length === 2
  ) {
    const [srcIp, dstIp] = storeFilters.ipAddresses;
    const proto = storeFilters.protocols[0];
    filters['Stream'] = [
      `Stream: <span class='stream-key' style='color:#43a047;font-weight:600;'>Src IP:</span> <span class='stream-value' style='color:#1976d2;font-weight:500;'>${srcIp}</span>  <span class='stream-key' style='color:#43a047;font-weight:600;'>Src Port:</span> <span class='stream-value' style='color:#1976d2;font-weight:500;'>${storeFilters.srcPort}</span> ⇄ <span class='stream-key' style='color:#d63031;font-weight:600;'>Dst IP:</span> <span class='stream-value' style='color:#1976d2;font-weight:500;'>${dstIp}</span>  <span class='stream-key' style='color:#d63031;font-weight:600;'>Dst Port:</span> <span class='stream-value' style='color:#1976d2;font-weight:500;'>${storeFilters.dstPort}</span>  <span class='stream-key' style='color:#e6c75a;font-weight:600;'>Protocol:</span> <span class='stream-value' style='color:#1976d2;font-weight:500;'>${proto}</span>`
    ];
  }
  
  return filters;
});

const updateFilters = () => {
  // Merge with existing stream-following fields if present
  const current = networkStore.activeFilters;
  networkStore.updateFilters({
    eventTypes: selectedEventTypes.value,
    severities: selectedSeverities.value,
    protocols: selectedProtocols.value,
    ipAddresses: selectedIpAddresses.value,
    srcPort: current.srcPort,
    dstPort: current.dstPort,
  });
};

const onIpInput = () => {
  // Split by comma, trim, and filter out empty strings
  selectedIpAddresses.value = ipInput.value
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0);
  updateFilters();
};

const clearFilters = () => {
  selectedEventTypes.value = [];
  selectedSeverities.value = [];
  selectedProtocols.value = [];
  ipInput.value = "";
  selectedIpAddresses.value = [];
  networkStore.clearFilters();
};

const toggleFilters = () => {
  isExpanded.value = !isExpanded.value;
};

const isStreamFollowing = computed(() => {
  const f = networkStore.activeFilters;
  return (
    f.srcPort != null &&
    f.dstPort != null &&
    f.protocols && f.protocols.length === 1 &&
    f.ipAddresses && f.ipAddresses.length === 2
  );
});

// Watch for stream-following activation to clear IP filter
watch(isStreamFollowing, (active) => {
  if (active) {
    selectedIpAddresses.value = [];
    ipInput.value = '';
  }
});

// Sync local filter state with store's activeFilters
watch(
  () => networkStore.activeFilters,
  (newFilters) => {
    selectedEventTypes.value = newFilters.eventTypes || [];
    selectedSeverities.value = newFilters.severities || [];
    selectedProtocols.value = newFilters.protocols || [];
    selectedIpAddresses.value = newFilters.ipAddresses || [];
    ipInput.value = selectedIpAddresses.value.join(', ');
  },
  { deep: true }
);

onMounted(() => {
  // Initialize with any existing filters from the store
  const currentFilters = networkStore.getCurrentFilters();
  if (currentFilters) {
    selectedEventTypes.value = currentFilters.eventTypes || [];
    selectedSeverities.value = currentFilters.severities || [];
    selectedProtocols.value = currentFilters.protocols || [];
    selectedIpAddresses.value = currentFilters.ipAddresses || [];
    ipInput.value = selectedIpAddresses.value.join(', ');
  }
});
</script>

<style scoped>
.filter-panel {
  background: var(--surface);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.filter-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-header h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  transition: transform 0.3s ease;
  font-size: 1.2rem;
  color: var(--primary);
  background: rgba(54, 153, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
}

.toggle-icon:hover {
  background: rgba(54, 153, 255, 0.2);
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.filter-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.filter-content.expanded {
  max-height: 500px; /* Adjust this value based on your content */
  margin-top: 15px;
}

.filter-section {
  margin-bottom: 15px;
}

.filter-section h4 {
  margin: 0 0 8px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.filter-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-option input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

.filter-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.clear-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--primary);
}

.header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.filter-category {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.active-filter {
  background: rgba(54, 153, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.default-filter-badge {
  color: var(--primary);
}

.stream-key-src {
  color: #43a047;
  font-weight: 600;
}

.stream-key-dst {
  color: #d63031;
  font-weight: 600;
}

.stream-key {
  font-weight: 600;
}

.stream-value {
  color: #1976d2;
  font-weight: 500;
}

.ip-input {
  min-width: 220px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(54, 153, 255, 0.3);
  background: rgba(255,255,255,0.07);
  color: var(--text);
  font-size: 0.95rem;
  margin-bottom: 6px;
}

span.active-filter.stream-badge > .stream-key {
  color: #1976d2 !important;
  font-weight: 600;
}
span.active-filter.stream-badge > .stream-value {
  color: #388e3c !important;
  font-weight: 500;
}
</style>
