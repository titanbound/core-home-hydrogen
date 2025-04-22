function initializeToolbar() {
  const toolbar = document.querySelector('#toolbar');
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  toolbar.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  document.getElementById('execute-btn').addEventListener('click', executeCode);
  document.getElementById('ai-window-btn').addEventListener('click', openAIWindow);
  document.getElementById('save-btn').addEventListener('click', saveFile);  

  function dragStart(e) {
    if (e.target.closest('.link')) return;
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;
      setTranslate(currentX, currentY, toolbar);
    }
  }

  function dragEnd() {
    isDragging = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }
}

function saveFile() {
  const code = editors[activeTabId]?.getValue().trim();
  if (!code) {
    showNotification('Save failed: File is empty.', 'error');
  } else {
    window.api.saveScript(code)
      .then(() => {
        showNotification('File saved successfully.', 'success');
      })
      .catch(error => {
        showNotification('Save failed: ' + error, 'error');
      });
  }
}

async function executeCode() {
  const code = editors[activeTabId]?.getValue().trim();
  if (!code) {
    showNotification('Error: Code is empty!', 'error');
  } else {
    try {
      const result = await window.api.executeScript(code);
      showNotification(result, result.includes('failed') ? 'error' : 'success');
    } catch (error) {
      showNotification('Execution failed: ' + error, 'error');
    }
  }
}

function openAIWindow() {
  window.api.aiOpenWindow().catch(error => {
    showNotification('Failed to open AI window: ' + error, 'error');
  });
}