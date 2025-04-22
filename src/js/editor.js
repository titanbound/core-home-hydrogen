let editors = {};

function initEditor(tabId, editorId) {
  const editor = ace.edit(editorId);
  editor.setTheme("ace/theme/twilight");
  editor.getSession().setMode("ace/mode/lua");
  editor.setShowPrintMargin(false);
  editor.setOptions({
    enableLiveAutocompletion: true,
    enableSnippets: true,
    enableBasicAutocompletion: true,
    fontSize: "14px",
    showPrintMargin: false,
    highlightActiveLine: true,
    showGutter: true,
    useWorker: true
  });

  window.api.getLuauLspStatus().then(status => {
    if (status.success) {
      console.log('Luau LSP initialized:', status.version);
      setupLuauLSPForEditor(editor);
    } else {
      console.error('Luau LSP initialization failed:', status.error);
    }
  }).catch(error => {
    console.error('Failed to check LSP status:', error);
  });

  editors[tabId] = editor;
  applyCustomEditorStyles();
}

function setupLuauLSPForEditor(editor) {
  const worker = new Worker('./luau-worker.js');
  worker.onmessage = function(e) {
    const { type, data } = e.data;
    switch (type) {
      case 'completion':
        editor.completer.showPopup();
        break;
      case 'diagnostics':
        updateDiagnostics(editor, data);
        break;
    }
  };
  editor.on('change', () => {
    worker.postMessage({
      type: 'analyze',
      content: editor.getValue()
    });
  });
}

function updateDiagnostics(editor, diagnostics) {
  const session = editor.getSession();
  session.clearAnnotations();
  const annotations = diagnostics.map(d => ({
    row: d.line - 1,
    column: d.column,
    text: d.message,
    type: d.severity.toLowerCase()
  }));
  session.setAnnotations(annotations);
}

function applyCustomEditorStyles() {
  var style = document.createElement("style");
  style.textContent = `
    .ace_editor { background-color: #1a1a1a !important; color: #fff !important; }
    .ace_gutter { background-color: #1a1a1a !important; color: #fff !important; }
    .ace_cursor { border-left: 2px solid #fff !important; }
    .ace_text-input { color: #1a1a1a !important; }
    .ace_gutter-cell { background-color: #1a1a1a !important; color: #fff !important; }
    .ace_autocomplete { color: rgb(210, 200, 127) !important; }
    .ace_completion-highlight { color: rgb(210, 200, 127) !important; }
    .ace_completion-meta { color: rgba(210, 200, 127, 0.8) !important; }
  `;
  document.head.appendChild(style);
}