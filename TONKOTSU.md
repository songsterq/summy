# REPO CONTEXT
This file contains important context about this repo for [Tonkotsu](https://www.tonkotsu.ai) and helps it work faster and generate better code.

## Project Description
This is a Chrome extension that summarizes web content using ChatGPT. The extension allows users to summarize any webpage with a single click, configure ChatGPT model settings, and use keyboard shortcuts.

## Commands

### Setup
This is a vanilla JavaScript Chrome extension with no build process or package dependencies, so no setup commands are needed.

### Build
No build process is required. The extension can be loaded directly into Chrome as an unpacked extension.

### Lint
No linting tools are configured for this project.

### Tests
No test framework is configured for this project.

### Development
To test the extension during development:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension directory
4. Make changes to the code and click the refresh icon on the extension card to see updates

## Project Structure
- `manifest.json`: Chrome extension configuration
- `options.html`/`options.js`: Extension settings page
- `background.js`: Background service worker
- `icons/`: Extension icons in various sizes