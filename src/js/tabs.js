let tabCounter = 1;
let activeTabId = 'tab1';

function setupTabEvents() {
  document.querySelector('.tab-add').addEventListener('click', addNewTab);
  document.getElementById('save-btn').addEventListener('click', saveFile);
  document.querySelector('.tab-bar').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (tab && tab.classList.contains('tab')) {
      activateTab(tab.dataset.tabId);
    }
  });
  document.querySelector('.tab-bar').addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-close')) {
      const tab = e.target.closest('.tab');
      closeTab(tab.dataset.tabId);
    }
  });
}

function addNewTab() {
  tabCounter++;
  const newTabId = `tab${tabCounter}`;
  const newEditorId = `editor${tabCounter}`;
  const tabTemplate = `
    <div class="no-drag tab" data-tab-id="${newTabId}">
      <div class="no-drag tab-content">
        <span class="tab-title">untitled${tabCounter}.lua</span>
        <span class="no-drag tab-close">&times;</span>
      </div>
    </div>`;
  document.querySelector('.tab-add').insertAdjacentHTML('beforebegin', tabTemplate);
  document.getElementById('editor-container').insertAdjacentHTML('afterbegin', `
    <div id="${newEditorId}" class="editor" data-tab-id="${newTabId}"></div>`);
  initEditor(newTabId, newEditorId);
  activateTab(newTabId);
  applyTheme(localStorage.getItem('theme') || 'dark');
}

function activateTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.editor').forEach(editor => editor.classList.remove('active'));
  document.querySelector(`.tab[data-tab-id="${tabId}"]`).classList.add('active');
  document.querySelector(`.editor[data-tab-id="${tabId}"]`).classList.add('active');
  activeTabId = tabId;
}

function closeTab(tabId) {
  const tabs = document.querySelectorAll('.tab');
  if (tabs.length <= 1) {
    showNotification('You must have at least one tab open.', 'warning');
    return;
  }
  const tab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  const editor = document.querySelector(`.editor[data-tab-id="${tabId}"]`);
  if (tab.classList.contains('active')) {
    const prevTab = tab.previousElementSibling || tab.nextElementSibling;
    if (prevTab) {
      activateTab(prevTab.dataset.tabId);
    }
  }
  tab.remove();
  editor.remove();
  delete editors[tabId];
}

function saveFile() {
  if (editors[activeTabId]) {
    let content = editors[activeTabId].getValue().trim();
    if (!content) {
      showNotification('Save failed: File is empty.', 'error');
    } else {
      showNotification('File saved successfully.', 'success');
      try {
        window.api.saveScript(content);
      } catch {
        console.log("API not available, would save content:", content);
      }
    }
  } else {
    console.error("Active editor is not initialized yet.");
  }
}