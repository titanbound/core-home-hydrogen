// CORE: HOME - made by titanbound. P.S, I most DEFINITELY took Jad's auto-update + I stole the console off of him. Thanks JadXV, Your UI's are amazing, but backend is even more!


const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const DiscordRPC = require('discord-rpc');
const axios = require('axios');
const fetch = require('node-fetch');
const { checkForUpdates } = require('./update');
const { spawn } = require('child_process');
const os = require('os');

let mainWindow;
let rpcClient;
let isExecuting = false;
let pendingExecution = null;
let robloxLogWindow = null;
let logMonitoringInterval = null;
let isMonitoringLogs = false;

const workspacePath = path.join(app.getPath('documents'), 'Core Workspace', 'Saved Executions');
const html = path.join(__dirname, 'src', 'index.html');
const aihtml = path.join(__dirname, 'src', 'ai.html');
const robloxLogHtml = path.join(__dirname, 'src', 'roblox-log.html');

if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        frame: false,
        show: false, 
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: true,
            devTools: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            backgroundThrottling: false 
        },
    });

    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self' https://cdnjs.cloudflare.com/ajax/libs/ https://unpkg.com/ https://fonts.googleapis.com/ https://fonts.gstatic.com/ https://generativelanguage.googleapis.com/; " +
                    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com/ajax/libs/ https://unpkg.com/; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/; " +
                    "img-src 'self' data:; " +
                    "font-src 'self' https://fonts.gstatic.com/; " +
                    "connect-src 'self' https://generativelanguage.googleapis.com/; " +
                    "frame-src 'self'"
                ]
            }
        });
    });

    mainWindow.loadFile(html);
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('close', (event) => {
        mainWindow.webContents.send('request-save');
        app.quit();
    });
}

function createAIWindow() {
    const aiWin = new BrowserWindow({
        width: 1000,
        height: 600,
        frame: false, 
        devTools: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    aiWin.loadFile(aihtml);
}

function startDiscordRPC() {
    rpcClient = new DiscordRPC.Client({ transport: 'ipc' });
    rpcClient.on('ready', () => {
        rpcClient.setActivity({
            state: 'Working in Core: Home Hydrogen',
            startTimestamp: new Date(),
            largeImageKey: 'logo',
        });
    });

    rpcClient.login({ clientId: '1190403622350094366' }).catch(error => {
        console.log('Discord RPC connection failed:', error);
        setTimeout(checkAndStartDiscordRPC, 10000);
    });
}

function stopDiscordRPC() {
    if (rpcClient) {
        rpcClient.clearActivity().catch(console.error);
        rpcClient.destroy();
        rpcClient = null;
    }
}

function checkAndStartDiscordRPC() {
    if (!rpcClient) {
        const net = require('net');
        const client = net.createConnection({ path: '/tmp/discord-ipc-0' }, () => {
            client.end();
            startDiscordRPC();
        });

        client.on('error', () => {
            setTimeout(checkAndStartDiscordRPC, 10000);
        });
    }
}

function getNextSaveFilename() {
    const files = fs.readdirSync(workspacePath).filter(f => f.startsWith('save-') && f.endsWith('.lua'));
    const numbers = files.map(f => parseInt(f.match(/save-(\d+)\.lua/)[1], 10) || 0);
    const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;
    return `save-${nextNumber}.lua`;
}

function saveScript(content) {
    const filename = getNextSaveFilename();
    const filePath = path.join(workspacePath, filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Saved: ${filePath}`);
}

async function executeScript(code) {
    if (!code) {
        return "No valid script to execute.";
    }

    const START_PORT = 6969;
    const END_PORT = 7069;
    let serverPort = null;
    let lastError = '';
    
    for (let port = START_PORT; port <= END_PORT; port++) {
        try {
            const res = await fetch(`http://127.0.0.1:${port}/secret`, {
                method: 'GET'
            });
            if (res.ok && await res.text() === '0xdeadbeef') {
                serverPort = port;
                break;
            }
        } catch (e) {
            lastError = e.message;
        }
    }
    
    if (!serverPort) {
        throw new Error(`Could not locate HTTP server on ports ${START_PORT}-${END_PORT}. Last error: ${lastError}`);
    }

    const response = await fetch(`http://127.0.0.1:${serverPort}/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: code
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.text();
}

function createRobloxLogWindow() {
    if (robloxLogWindow) {
        robloxLogWindow.focus();
        return;
    }

    robloxLogWindow = new BrowserWindow({
        width: 500,
        height: 300,
        frame: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    robloxLogWindow.loadFile(robloxLogHtml);

    robloxLogWindow.on('closed', () => {
        robloxLogWindow = null;
        if (isMonitoringLogs) {
            stopRobloxLogMonitoring();
        }
    });
}

function startRobloxLogMonitoring() {
    if (isMonitoringLogs) {
        stopRobloxLogMonitoring();
    }
    
    isMonitoringLogs = true;
    
    const logDir = path.join(os.homedir(), 'Library/Logs/Roblox');
    
    if (!fs.existsSync(logDir)) {
        if (robloxLogWindow) {
            robloxLogWindow.webContents.send('roblox-log', {
                message: `Roblox logs directory not found: ${logDir}`
            });
        }
        return `Error: Roblox logs directory not found: ${logDir}`;
    }
    
    let currentLogFile = null;
    let fileSize = 0;
    
    logMonitoringInterval = setInterval(() => {
        try {
            const files = fs.readdirSync(logDir)
                .filter(f => fs.statSync(path.join(logDir, f)).isFile())
                .map(f => ({
                    path: path.join(logDir, f),
                    mtime: fs.statSync(path.join(logDir, f)).mtime.getTime()
                }))
                .sort((a, b) => b.mtime - a.mtime);
            
            if (files.length > 0) {
                const latestLogFile = files[0].path;
                
                if (latestLogFile !== currentLogFile) {
                    currentLogFile = latestLogFile;
                    fileSize = 0;
                }
                
                if (currentLogFile) {
                    const currentSize = fs.statSync(currentLogFile).size;
                    
                    if (currentSize > fileSize) {
                        const buffer = Buffer.alloc(currentSize - fileSize);
                        const fd = fs.openSync(currentLogFile, 'r');
                        
                        fs.readSync(fd, buffer, 0, buffer.length, fileSize);
                        fs.closeSync(fd);
                        
                        const newContent = buffer.toString('utf8');
                        fileSize = currentSize;
                        
                        newContent.split(/\r?\n/).forEach(line => {
                            if (line.trim()) {
                                const cleanedLine = cleanLogLine(line);
                                if (cleanedLine && robloxLogWindow && !shouldFilter(cleanedLine)) {
                                    robloxLogWindow.webContents.send('roblox-log', { 
                                        message: cleanedLine,
                                        noTimestamp: true
                                    });
                                }
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error monitoring logs:', error);
            if (robloxLogWindow) {
                robloxLogWindow.webContents.send('roblox-log', {
                    message: `Error: ${error.message}`
                });
            }
        }
    }, 500);
    
    return 'Log monitoring started';
}

function cleanLogLine(line) {
    if (!line || !line.trim()) return null;
    
    let cleaned = line;
    
    cleaned = cleaned.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z,\d+\.\d+,[a-f0-9]+,\d+/g, '');
    
    cleaned = cleaned.replace(/\[(D?FLog::[^\]]+)\]/g, '');
    
    cleaned = cleaned.replace(/\d{1,2}:\d{2}:\d{2} [AP]M/g, '');
    
    cleaned = cleaned.replace(/^[,\s]+/, '');
    
    return cleaned.trim();
}

function shouldFilter(text) {
    if (!text || text.length < 2) return true;
    
    const unwantedPatterns = [
        'active://',
        'sdp', 'candidate:', 'ice-ufrag:',
        'o=-', 's=', 't=', 'a=group:',
        'InputDevice', 'OutputDevice',
        'Starting log monitoring',
        'Monitoring new logs'
    ];
    
    return unwantedPatterns.some(pattern => text.includes(pattern));
}

function stopRobloxLogMonitoring() {
    if (logMonitoringInterval) {
        clearInterval(logMonitoringInterval);
        logMonitoringInterval = null;
    }
    isMonitoringLogs = false;
    return 'Log monitoring stopped';
}

function stopRobloxLogCapture() {
    return stopRobloxLogMonitoring();
}

function findRobloxProcess() {
    return new Promise((resolve, reject) => {
        const ps = spawn('ps', ['aux']);
        let output = '';
        
        ps.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        ps.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`ps process exited with code ${code}`));
                return;
            }
            
            const lines = output.split('\n');
            const robloxProcessLine = lines.find(line => 
                line.includes('RobloxPlayer') && !line.includes('grep')
            );
            
            if (robloxProcessLine) {
                const pid = robloxProcessLine.trim().split(/\s+/)[1];
                console.log(`Found RobloxPlayer with PID: ${pid}`);
                resolve(pid);
            } else {
                reject(new Error('No running RobloxPlayer process found'));
            }
        });
    });
}

ipcMain.on('ai-open-window', () => {
    createAIWindow();
});

ipcMain.on('save-script', (event, content) => {
    saveScript(content);
});

ipcMain.handle('enable-discord-rpc', () => {
    startDiscordRPC();
});

ipcMain.handle('disable-discord-rpc', () => {
    stopDiscordRPC();
});

ipcMain.handle('execute-script', async (event, script) => {
    if (isExecuting) {
        pendingExecution = script;
        return "Previous execution in progress. This request will be processed next.";
    }

    isExecuting = true;
    
    try {
        const result = await executeScript(script);
        
        while (pendingExecution) {
            const nextScript = pendingExecution;
            pendingExecution = null;
            await executeScript(nextScript);
        }
        
        return result;
    } catch (error) {
        console.error("Script execution failed:", error);
        return `Execution failed: ${error.message}`;
    } finally {
        isExecuting = false;
    }
});

ipcMain.on('open-roblox-log-window', () => {
    createRobloxLogWindow();
});

ipcMain.handle('start-roblox-log-capture', async () => {
    return startRobloxLogMonitoring();
});

ipcMain.handle('stop-roblox-log-capture', () => {
    return stopRobloxLogCapture();
});

function initialize() {
    createWindow();
    checkForUpdates();
    checkAndStartDiscordRPC();
}

app.whenReady().then(() => {
    initialize();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            initialize();
        }
    });
});