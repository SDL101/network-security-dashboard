<template>
  <div class="theme-toggle-container">
    <button 
      class="theme-toggle" 
      @click="toggleTheme"
      :class="{ 'light': !isDarkMode }"
      aria-label="Toggle theme"
    >
      <div class="toggle-track">
        <div class="toggle-thumb">
          <span class="icon">{{ isDarkMode ? '🌙' : '☀️' }}</span>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isDarkMode = ref(false);

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle('light-theme');
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    isDarkMode.value = false;
    document.documentElement.classList.add('light-theme');
  } else {
    isDarkMode.value = true;
    document.documentElement.classList.remove('light-theme');
  }
});
</script>

<style scoped>
.theme-toggle-container {
  display: flex;
  align-items: center;
}

.theme-toggle {
  position: relative;
  width: 60px;
  height: 30px;
  border-radius: 30px;
  background: var(--surface);
  border: 2px solid var(--border);
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease;
  overflow: hidden;
}

.theme-toggle:hover {
  border-color: var(--primary);
  transform: scale(1.05);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.toggle-track {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.toggle-thumb {
  position: absolute;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.theme-toggle.light .toggle-thumb {
  transform: translateX(30px);
  background: var(--primary-glow);
}

.icon {
  font-size: 14px;
  transition: all 0.3s ease;
}

/* Add a subtle glow effect in dark mode */
.theme-toggle:not(.light) .toggle-thumb {
  box-shadow: 0 0 10px rgba(54, 153, 255, 0.5);
}

/* Add a subtle glow effect in light mode */
.theme-toggle.light .toggle-thumb {
  box-shadow: 0 0 10px rgba(0, 136, 255, 0.5);
}

/* Add a subtle background gradient */
.theme-toggle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, 
    rgba(54, 153, 255, 0.1),
    rgba(0, 136, 255, 0.1)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.theme-toggle:hover::before {
  opacity: 1;
}
</style> 