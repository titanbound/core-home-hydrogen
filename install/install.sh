#!/bin/sh

PURPLE="\033[1;35m"
NC="\033[0m"

# Header
printf "${PURPLE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     Installing Core Home Hydrogen         ║"
echo "╚═══════════════════════════════════════════╝"
printf "${NC}\n"

API_URL="https://api.github.com/repos/titanbound/core-home-hydrogen/releases/latest"
LATEST_JSON=$(curl -s "$API_URL")
DMG_URL=$(printf "%s\n" "$LATEST_JSON" | grep "browser_download_url" | grep ".dmg" | cut -d '"' -f 4)

if [ -z "$DMG_URL" ]; then
    echo "Error: Failed to find a valid .dmg URL for the latest release."
    exit 1
fi

TEMP_DMG="/tmp/core_home_hydrogen.dmg"
curl -s -L -o "$TEMP_DMG" "$DMG_URL"

if [ ! -f "$TEMP_DMG" ]; then
    echo "Error: Failed to download the DMG file."
    exit 1
fi

MOUNT_OUTPUT=$(hdiutil mount "$TEMP_DMG" 2>/dev/null)
MOUNT_DIR=$(echo "$MOUNT_OUTPUT" | grep -o '/Volumes/[^ ]*')

if [ -z "$MOUNT_DIR" ]; then
    echo "Error: Failed to mount the DMG file."
    exit 1
fi

APP_PATH="$MOUNT_DIR/Core Home.app"

if [ ! -d "$APP_PATH" ]; then
    MOUNT_DIR="/Volumes/Core Home"
    APP_PATH="$MOUNT_DIR/Core Home.app"
fi

if [ ! -d "$APP_PATH" ]; then
    echo "Error: Core Home.app not found inside the mounted DMG."
    exit 1
fi

if [ -d "/Applications/Core Home.app" ]; then
    sudo rm -rf "/Applications/Core Home.app"
fi

cp -R "$APP_PATH" /Applications/

if [ $? -eq 0 ]; then
    echo "Core Home has been successfully installed to /Applications."
else
    echo "Error: Failed to copy Core Home.app to /Applications."
    exit 1
fi

hdiutil unmount "$MOUNT_DIR" 2>/dev/null

rm "$TEMP_DMG"

echo "Installation complete!"
