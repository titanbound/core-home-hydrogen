// CORE: HOME: HYDROGEN - made by titanbound, if you see this your a skid. But, I dont really care either ways, since that means my product is being used. Thanks!
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const DiscordRPC = require('discord-rpc');
const { autoUpdater } = require('electron-updater');
const axios = require('axios');
const semver = require('semver');
const fetch = require('node-fetch');
const os = require('os');
const { exec } = require('child_process');
const https = require('https');

// Global Variables
let mainWindow;
let rpcClient;
let isExecuting = false;
let pendingExecution = null;

const START_PORT = 6969;
const END_PORT = 7069;

// Constants
const workspacePath = path.join(app.getPath('documents'), 'Core Workspace', 'Saved Executions');
const html = path.join(__dirname, 'src', 'index.html');
const aihtml = path.join(__dirname, 'src', 'ai.html');

const LUAU_LSP_REPO = 'JohnnyMorganz/luau-lsp';
const LUAU_LSP_PATH = path.join(app.getPath('userData'), 'bin', 'luau-lsp');

// Initialization

async function updateLuauLSP() {
    try {
        const response = await axios.get(`https://api.github.com/repos/${LUAU_LSP_REPO}/releases/latest`);
        const release = response.data;
        
        const macAsset = release.assets.find(asset => asset.name === 'luau-lsp-macos.zip');
        if (!macAsset) {
            throw new Error('macOS binary not found in latest release');
        }

        const binDir = path.dirname(LUAU_LSP_PATH);
        if (!fs.existsSync(binDir)) {
            fs.mkdirSync(binDir, { recursive: true });
        }

        const zipPath = path.join(binDir, 'luau-lsp-macos.zip');
        const writer = fs.createWriteStream(zipPath);

        const downloadResponse = await axios({
            url: macAsset.browser_download_url,
            method: 'GET',
            responseType: 'stream'
        });

        downloadResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await new Promise((resolve, reject) => {
            exec(`unzip -o "${zipPath}" -d "${binDir}"`, (error) => {
                if (error) reject(error);
                else {
                    fs.chmodSync(LUAU_LSP_PATH, '755');
                    fs.unlinkSync(zipPath);
                    resolve();
                }
            });
        });

        return { success: true, version: release.tag_name };
    } catch (error) {
        console.error('Failed to update Luau LSP:', error);
        throw error;
    }
}

function initialize() {
    if (!fs.existsSync(workspacePath)) {
        fs.mkdirSync(workspacePath, { recursive: true });
    }

    app.whenReady().then(async () => {
        try {
            await updateLuauLSP();
        } catch (error) {
            console.error('Failed to update Luau LSP:', error);
        }
        createWindow();
        checkAndStartDiscordRPC();
        
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
}

// Window Management
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

    setupSecurityHeaders();
    setupWindowEvents();
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

function setupSecurityHeaders() {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self' https://cdnjs.cloudflare.com/ajax/libs/ https://unpkg.com/; " +
                    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com/ajax/libs/ https://unpkg.com/; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/; " +
                    "font-src 'self' https://fonts.gstatic.com/; " +
                    "img-src 'self' data: https://fonts.gstatic.com/; " +
                    "connect-src 'self' https://generativelanguage.googleapis.com/; " +
                    "frame-src 'self'; " +
                    "worker-src 'self' blob:; " +
                    "child-src 'self' blob:"      
                ]
            }
        });
    });
}

function setupWindowEvents() {
    mainWindow.loadFile(html);
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.webContents.on('did-finish-load', () => {
        checkForUpdates(true);
    });

    mainWindow.on('close', () => {
        mainWindow.webContents.send('request-save');
        app.quit();
    });
}

// Discord RPC
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

// Auto Updates
function setupAutoUpdater() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;
    
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'titanbound',
        repo: 'core-home-hydrogen',
        private: false
    });

    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', (info) => {
        console.log('Update available', info.version);
    });

    autoUpdater.on('update-downloaded', (info) => {
        handleUpdateDownloaded();
    });

    autoUpdater.on('error', (error) => {
        console.error('Update error:', error);
        if (!error.message.includes('app-update.yml')) {
            dialog.showErrorBox('Error', 'Update failed: ' + error);
        }
    });
}

function handleUpdateDownloaded() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Install and restart now?',
        buttons: ['Yes', 'Later']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
}

async function checkForUpdates(silent = false) {
    try {
        const currentVersion = app.getVersion();
        const response = await axios.get('https://api.github.com/repos/titanbound/core-home-hydrogen/releases/latest');
        
        if (!response.data || !response.data.tag_name) {
            handleNoUpdates(silent);
            return;
        }
        
        const latestVersion = response.data.tag_name.replace('v', '');
        
        if (semver.gt(latestVersion, currentVersion)) {
            await handleNewVersion(latestVersion, currentVersion, response.data);
        } else if (!silent) {
            await dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'No Updates',
                message: 'You are running the latest version.'
            });
        }
    } catch (error) {
        handleUpdateError(error, silent);
    }
}

// Script Management
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

let cachedPort = null;
let lastPortCheck = 0;
const PORT_CACHE_DURATION = 5000; 

async function findServerPort() {
    const now = Date.now();
    if (cachedPort && (now - lastPortCheck) < PORT_CACHE_DURATION) {
        return cachedPort;
    }

    for (let port = START_PORT; port <= END_PORT; port++) {
        try {
            const res = await fetch(`http://127.0.0.1:${port}/secret`, {
                method: 'GET'
            });
            if (res.ok && await res.text() === '0xdeadbeef') {
                cachedPort = port;
                lastPortCheck = now;
                return port;
            }
        } catch (e) {
            continue;
        }
    }
    throw new Error(`Could not locate HTTP server on ports ${START_PORT}-${END_PORT}`);
}

async function executeScript(code) {
    if (!code) return "No valid script to execute.";

    const serverPort = await findServerPort();
    
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

async function handleScriptExecution(event, script) {
    if (isExecuting) {
        return "Execution in progress. Please wait.";
    }

    isExecuting = true;
    
    try {
        const result = await executeScript(script);
        return result;
    } catch (error) {
        console.error("Script execution failed:", error);
        return `Execution failed: ${error.message}`;
    } finally {
        isExecuting = false;
    }
}

function setupIPCHandlers() {
    ipcMain.on('ai-open-window', () => createAIWindow());
    ipcMain.handle('save-script', async (event, content) => {  
        try {
            saveScript(content);
            return 'File saved successfully';
        } catch (error) {
            throw new Error(`Save failed: ${error.message}`);
        }
    });
    ipcMain.handle('enable-discord-rpc', () => startDiscordRPC());
    ipcMain.handle('disable-discord-rpc', () => stopDiscordRPC());
    ipcMain.handle('check-for-updates', () => checkForUpdates(false));
    ipcMain.handle('execute-script', handleScriptExecution);
    ipcMain.handle('get-luau-lsp-status', async () => {
        try {
            const result = await updateLuauLSP();
            return { success: true, version: result.version };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

async function handleScriptExecution(event, script) {
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
}

// Initialize Application
initialize();
setupAutoUpdater();
setupIPCHandlers();

