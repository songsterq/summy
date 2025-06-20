# AGENT Instructions

## Repository Overview
Summy is a minimal Chrome extension that summarizes web pages using ChatGPT. It is built with vanilla JavaScript and HTML and runs directly in the browser without a build step.

## Development Workflow
- No setup commands are necessary.
- Run the unit tests with `node tests/test_utils.js`.
- To test changes manually:
  1. Open Chrome and navigate to `chrome://extensions/`.
  2. Enable **Developer mode**.
  3. Click **Load unpacked** and select this project directory.
  4. After editing files, refresh the extension from the extensions page to load the updates.

## Coding Style
- Use two spaces for indentation in JavaScript, HTML, and JSON files.
- Prefer single quotes for strings in JavaScript.
- Keep the code vanilla—avoid adding npm dependencies or build tools.

## Programmatic Checks
Run the Node-based tests before committing changes:

```bash
node tests/test_utils.js
```
