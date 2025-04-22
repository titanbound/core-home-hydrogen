function applyTheme(theme) {
  setTheme(theme);
}

function setTheme(theme) {
  const elements = {
    body: document.body,
    editorContainer: document.getElementById('editor-container'),
    tabBar: document.querySelector('.tab-bar'),
    tabs: document.querySelectorAll('.tab'),
    buttons: document.querySelectorAll('.link'),
    svgIcons: document.querySelectorAll('.link svg'),
    gutterCells: document.querySelectorAll('.ace_gutter-cell'),
    settingsContent: document.querySelector('.settings-content'),
    themeSelector: document.getElementById('theme-toggle')
  };

  elements.themeSelector.value = theme;

  if (theme === 'light') {
    applyLightTheme(elements);
  } else {
    applyDarkTheme(elements);
  }
}

function applyLightTheme(elements) {
  // Base elements
  elements.body.style.backgroundColor = '#ffffff';
  elements.body.style.color = '#000000';
  elements.tabBar.style.backgroundColor = '#f0f0f0';
  elements.editorContainer.style.backgroundColor = '#f9f9f9';

  // Settings panel
  elements.settingsContent.style.backgroundColor = '#ffffff';
  elements.settingsContent.style.color = '#000000';
  document.querySelector('.settings-content h3').style.color = '#000000';
  document.querySelector('.settings-content h3').style.borderBottom = '1px solid #ddd';
  document.querySelectorAll('.settings-content label').forEach(label => {
    label.style.color = '#333';
  });

  // Settings controls
  document.getElementById('close-settings').style.backgroundColor = '#e0e0e0';
  document.getElementById('close-settings').style.color = '#000000';
  document.getElementById('theme-toggle').style.backgroundColor = '#f0f0f0';
  document.getElementById('theme-toggle').style.color = '#000000';

  // Tabs
  elements.tabs.forEach(tab => {
    tab.style.backgroundColor = '#fff';
    tab.style.color = '#000';
  });

  // Editor elements
  elements.gutterCells.forEach(cell => {
    cell.style.backgroundColor = '#f9f9f9';
    cell.style.color = '#000';
  });

  // Toolbar buttons
  elements.buttons.forEach(button => {
    button.style.backgroundColor = '#ededed';
    button.style.color = '#000';
  });

  // SVG icons
  elements.svgIcons.forEach(svg => {
    svg.style.fill = 'none';
    svg.style.stroke = '#333';
    svg.style.strokeWidth = '2px';
  });

  // Editor styles
  const editorStyle = document.createElement('style');
  editorStyle.textContent = `
    .ace_editor { background-color: #f9f9f9 !important; color: #000 !important; }
    .ace_gutter { background-color: #f9f9f9 !important; color: #000 !important; }
    .ace_cursor { border-left: 2px solid #000 !important; }
    .ace_gutter-cell { background-color: #f9f9f9 !important; color: #000 !important; }
    .ace_selection { background-color: #bdd5fa !important; }
    .ace_active-line { background-color: #f0f0f0 !important; }
  `;
  document.head.appendChild(editorStyle);
}

function applyDarkTheme(elements) {
  // Base elements
  elements.body.style.backgroundColor = '#2d2d2d';
  elements.body.style.color = '#fff';
  elements.tabBar.style.backgroundColor = '#1a1a1a';
  elements.editorContainer.style.backgroundColor = '#1a1a1a';

  // Settings panel
  elements.settingsContent.style.backgroundColor = '#2d2d2d';
  elements.settingsContent.style.color = '#fff';
  document.querySelector('.settings-content h3').style.color = '#fff';
  document.querySelector('.settings-content h3').style.borderBottom = '1px solid #444';
  document.querySelectorAll('.settings-content label').forEach(label => {
    label.style.color = '#bbb';
  });

  // Settings controls
  document.getElementById('close-settings').style.backgroundColor = '#444';
  document.getElementById('close-settings').style.color = '#fff';
  document.getElementById('theme-toggle').style.backgroundColor = '#333';
  document.getElementById('theme-toggle').style.color = '#fff';

  // Tabs
  elements.tabs.forEach(tab => {
    tab.style.backgroundColor = '#222';
    tab.style.color = '#fff';
  });

  const renameInputs = document.querySelectorAll('.rename-input');
  if (renameInputs.length > 0) {
    renameInputs.forEach(input => {
      input.style.backgroundColor = '#333';
      input.style.color = '#fff';
      input.style.border = '1px solid #555';
    });
  }

  // Editor elements
  elements.gutterCells.forEach(cell => {
    cell.style.backgroundColor = '#2d2d2d';
    cell.style.color = '#fff';
  });

  // Toolbar buttons
  elements.buttons.forEach(button => {
    button.style.backgroundColor = '#2d2d2d';
    button.style.color = '#fff';
  });

  // SVG icons
  elements.svgIcons.forEach(svg => {
    svg.style.fill = 'none';
    svg.style.stroke = '#fff';
    svg.style.strokeWidth = '2px';
  });

  // Editor styles
  const editorStyle = document.createElement('style');
  editorStyle.textContent = `
    .ace_editor { background-color: #1a1a1a !important; color: #fff !important; }
    .ace_gutter { background-color: #1a1a1a !important; color: #fff !important; }
    .ace_cursor { border-left: 2px solid #fff !important; }
    .ace_text-input { color: #1a1a1a !important; }
    .ace_gutter-cell { background-color: #1a1a1a !important; color: #fff !important; }
    .ace_selection { background-color: #264f78 !important; }
    .ace_active-line { background-color: #202020 !important; }
  `;
  document.head.appendChild(editorStyle);
}