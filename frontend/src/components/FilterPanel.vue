<template>
  <div class="filter-panel">
    <div class="filter-header" @click="toggleFilters">
      <h3>Filters</h3>
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

      <div class="filter-actions">
        <button @click="clearFilters" class="clear-btn">Clear All Filters</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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
  { value: 'UDP', label: 'UDP' }
];

const selectedEventTypes = ref([]);
const selectedSeverities = ref([]);
const selectedProtocols = ref([]);

const updateFilters = () => {
  networkStore.updateFilters({
    eventTypes: selectedEventTypes.value,
    severities: selectedSeverities.value,
    protocols: selectedProtocols.value
  });
};

const clearFilters = () => {
  selectedEventTypes.value = [];
  selectedSeverities.value = [];
  selectedProtocols.value = [];
  networkStore.clearFilters();
};

const toggleFilters = () => {
  isExpanded.value = !isExpanded.value;
};

onMounted(() => {
  // Initialize with any existing filters from the store
  const currentFilters = networkStore.getCurrentFilters();
  if (currentFilters) {
    selectedEventTypes.value = currentFilters.eventTypes || [];
    selectedSeverities.value = currentFilters.severities || [];
    selectedProtocols.value = currentFilters.protocols || [];
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
  padding: 5px 0;
}

.filter-header h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 600;
}

.toggle-icon {
  transition: transform 0.3s ease;
  font-size: 0.8rem;
  color: var(--text-secondary);
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
</style>
