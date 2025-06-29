# Summy - ChatGPT Summarizer Chrome Extension

A Chrome extension that helps you summarize web content using ChatGPT. Simply click the extension icon or use the keyboard shortcut to automatically extract content from the current page and send it to ChatGPT for summarization.

## Features

- One-click summarization: Click the extension icon to instantly summarize the current page
- Summarize selected text: Right-click on selected text and choose "Summarize Selected Text" from the context menu
- Smart content extraction: Uses Mozilla's Readability library to reliably extract main content
- Cleans up extracted text by removing extra blank lines
- Configurable ChatGPT model (GPT-4 or GPT-3.5 Turbo)
- Option to use temporary chat
- Customizable base URL
- Keyboard shortcut support (Command+Shift+S on Mac, Ctrl+Shift+S on Windows/Linux)

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

### Method 1: Click the Extension Icon
1. Navigate to any webpage you want to summarize
2. Click the extension icon in your browser toolbar
3. The extension will automatically:
   - Extract the main content from the page
   - Open ChatGPT in a new tab
   - Enter a prompt to summarize the content

### Method 2: Right-Click on Selected Text
1. Select any text on a webpage
2. Right-click to open the context menu
3. Choose "Summarize Selected Text"
4. The extension will open ChatGPT in a new tab and ask it to summarize the selected text

### Method 3: Use Keyboard Shortcut
- Press Command+Shift+S (Mac) or Ctrl+Shift+S (Windows/Linux) while on any webpage
- This performs the same action as clicking the extension icon

## Configuration

1. Click the extension icon and select "Options"
2. Configure the following settings:
   - Base URL (default: https://chatgpt.com/)
   - Model selection (GPT-4 or GPT-3.5 Turbo)
   - Temporary chat option
   - Keyboard shortcut (via chrome://extensions/shortcuts)

## How It Works

1. When triggered by clicking the icon, the extension extracts the main content from the current webpage using Mozilla's Readability algorithm and removes excess blank lines.
2. When triggered by the context menu, the extension uses the selected text.
3. It opens ChatGPT in a new tab.
4. The content is automatically entered into ChatGPT's interface.
5. A prompt is added to request a summary of the content.
6. ChatGPT processes the request and provides a summary.

## Note

You'll need to have access to ChatGPT (https://chatgpt.com/) for this extension to work. The extension requires the following permissions:
- `activeTab`: To access the current tab's content
- `storage`: To save your preferences
- `contextMenus`: To add the right-click context menu
- `commands`: For keyboard shortcut support
- `scripting`: To extract content and interact with ChatGPT
- Host permission for chatgpt.com: To interact with ChatGPT's interface

## Development

### Building for Release

Use the included build script to create a production-ready package:

```bash
# Bump patch version and create zip package
./build.sh -t patch

# Bump minor version and create git commit
./build.sh -t minor -c

# Bump major version
./build.sh -t major

# Show help
./build.sh -h
```

The build script will:
- Automatically increment the version number in `manifest.json`
- Copy all production files to `dist/` directory
- Create a versioned zip file (e.g., `summy-v1.0.3.zip`)
- Optionally create a git commit with the version bump

### Testing

Run the unit tests with Node.js (v18 or newer):

```bash
node tests/test_utils.js # from the project root
```
