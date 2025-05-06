const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    aiOpenWindow: () => ipcRenderer.send('ai-open-window'),
    executeScript: (script, bool) => ipcRenderer.invoke('execute-script', script, bool),
    enableDiscordRpc: () => ipcRenderer.invoke('enable-discord-rpc'),
    disableDiscordRpc: () => ipcRenderer.invoke('disable-discord-rpc'),
    getFiles: () => ipcRenderer.invoke('get-files'),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    saveScript: (content) => ipcRenderer.send('save-script', content),
    openDialog: (method, config) => ipcRenderer.invoke('dialog', method, config),
});

contextBridge.exposeInMainWorld('robloxLogAPI', {
    startCapture: () => ipcRenderer.invoke('start-roblox-log-capture'),
    stopCapture: () => ipcRenderer.invoke('stop-roblox-log-capture'),
    onLog: (callback) => {
        ipcRenderer.on('roblox-log', (_, data) => callback(data));
    },
    onError: (callback) => {
        ipcRenderer.on('roblox-log-error', (_, data) => callback(data));
    },
    onStopped: (callback) => {
        ipcRenderer.on('roblox-log-stopped', () => callback());
    }
});

contextBridge.exposeInMainWorld('robloxLog', {
    openLogWindow: () => ipcRenderer.send('open-roblox-log-window')
});