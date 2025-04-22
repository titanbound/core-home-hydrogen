# Core Home: Hydrogen

A Minimalistic Hydrogen UI with integrated AI assistance and Discord RPC support.

## Prerequisites

- Node.js (v16 or higher)
- npm (Node Package Manager)
- macOS operating system
- Discord (optional, for RPC features)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/titanbound/core-home-hydrogen.git
cd core-home-hydrogen
```

2. Install dependencies:
```bash
npm install
```

3. Install development dependencies:
```bash
npm install --save-dev electron electron-builder
```

## Development

To run the application in development mode:
```bash
npm start
```

## Building

To build the application:
```bash
npm run build
```

The built application will be available in the `out` directory.

## Features

- Luau code editor with syntax highlighting
- AI-powered code assistance
- Discord Rich Presence integration
- Auto-save functionality
- Automatic updates
- Luau LSP support

## Workspace

The application creates a workspace directory at:
`~/Documents/Core Workspace/Saved\ Executions`

This directory stores all saved Lua scripts.

## Configuration

The application automatically handles:
- Luau LSP installation and updates
- Discord RPC connection
- Workspace directory creation

## Troubleshooting

If you encounter issues:

1. Check Discord is running (for RPC features)
2. Ensure ports 6969-7069 are available for Hydrogen.
3. Verify write permissions in Documents folder
4. Check internet connection for AI features

## License

Copyright © 2025 titanbound. All rights reserved.
```

This README provides essential information for developers to build and use the application while maintaining the project's structure and requirements.
