document.addEventListener("DOMContentLoaded", () => {
  // Initialize first editor
  initEditor('tab1', 'editor1');
  
  // Setup event listeners
  setupTabEvents();
  initializeToolbar();
  
  // Initialize theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);
  
  // Setup settings handlers
  document.getElementById('settings-btn').addEventListener('click', () => {
    document.getElementById('settings-popup').style.display = 'flex';
  });
  
  document.getElementById('close-settings').addEventListener('click', () => {
    document.getElementById('settings-popup').style.display = 'none';
  });
  
  document.getElementById('discord-rpc').addEventListener('change', (event) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      window.api.enableDiscordRpc().catch(console.error);
    } else {
      window.api.disableDiscordRpc().catch(console.error);
    }
  });
  
  document.getElementById('theme-toggle').addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    localStorage.setItem('theme', selectedTheme);
    applyTheme(selectedTheme);
  });
});