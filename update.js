// I modified & stole this off of Jad, thanks JadXV! Love you pal. Your UI's may be good, but your auto-updater is better!

const { app, dialog } = require('electron');
const { exec } = require('child_process');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

function getCurrentVersion() {
  try {
    const appPath = app.getAppPath();
    const packageJsonPath = path.join(appPath, 'package.json');
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (e) {
    console.error('Error reading package.json:', e.message);
    return '0.0.0'; 
  }
}

async function getLatestVersion() {
  try {
    const response = await fetch('https://github.com/titanbound/core-home-hydrogen/releases/latest', {
      method: 'HEAD',
      redirect: 'follow'
    });

    const finalUrl = response.url;
    const tagIndex = finalUrl.indexOf('/tag/');
    if (tagIndex !== -1) {
      return finalUrl.substring(tagIndex + 5);
    }
  } catch (e) {
    console.error('Error getting latest version:', e.message);
  }
  return null;
}

function checkForUpdates() {
  const currentVersion = getCurrentVersion();
  
  getLatestVersion().then(latestVersion => {
    if (!latestVersion) return;

    if (latestVersion > currentVersion) {
      const choice = dialog.showMessageBoxSync({
        type: 'info',
        buttons: ['Install Update', 'Not Now'],
        title: 'Core Update Available',
        message: 'A new version of Core is available!',
        detail: `New version: ${latestVersion}\n\nWould you like to update now?`,
        defaultId: 0,
        cancelId: 1
      });

      if (choice === 0) {
        exec(`osascript -e 'do shell script "curl -fsSL https://raw.githubusercontent.com/titanbound/core-home-hydrogen/refs/heads/main/install/install.sh | bash" with administrator privileges'`, (err) => {
          if (err) {
            dialog.showErrorBox("Update Failed", "There was a problem installing the update. Error: " + err.message);
            return;
          }

          dialog.showMessageBoxSync({
            type: 'info',
            buttons: ['OK'],
            title: 'Update Complete',
            message: `Core has been updated to version ${latestVersion}.`,
            detail: "Please restart the application to apply the changes."
          });

          app.quit();
        });
      }
    }
  });
}

module.exports = { checkForUpdates };