# AGENT Instructions

## Repository Overview
Summy is a minimal Chrome extension that summarizes web pages using ChatGPT. It is written in TypeScript and compiled to JavaScript for use in the browser.

## Development Workflow
- Install dependencies with `npm install`.
- Run the unit tests with `npm test` from the project root. This command compiles the TypeScript before executing the tests.
- Ensure Node.js 18 or later is installed so the built-in test runner is available.
- To test changes manually:
  1. Open Chrome and navigate to `chrome://extensions/`.
  2. Enable **Developer mode**.
  3. Click **Load unpacked** and select this project directory.
  4. After editing files, refresh the extension from the extensions page to load the updates.

## Coding Style
- Use two spaces for indentation in JavaScript, HTML, and JSON files.
- Prefer single quotes for strings in JavaScript.
- Keep the code lightweight and avoid unnecessary dependencies.

## Programmatic Checks
Run the tests before committing changes:

```bash
npm test
```
