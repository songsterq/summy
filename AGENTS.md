1→# AGENTS.md
2→
3→## Setup
4→No setup required - this is a vanilla JavaScript Chrome extension with no dependencies.
5→
6→## Commands
7→- **Build**: `./build.sh -t patch` (creates versioned zip for distribution)
8→- **Test**: `node tests/test_utils.js` (requires Node.js v18+)
9→- **Dev/Load**: Open `chrome://extensions/`, enable Developer mode, click "Load unpacked", select repo root
10→
11→## Tech Stack
12→- **Type**: Chrome Extension (Manifest V3)
13→- **Languages**: Vanilla JavaScript, HTML
14→- **Libraries**: Mozilla Readability.js (bundled)
15→
16→## Architecture
17→- `background.js` - Service worker handling extension actions, context menus, and ChatGPT integration
18→- `content.js` - Content script for text selection tracking
19→- `utils.js` - Shared utilities (text cleaning, debounce, default settings)
20→- `options.js/options.html` - Configuration UI for prompts and settings
21→- `Readability.js` - Mozilla library for extracting main page content
22→
23→## Code Style
24→- No semicolons required but used consistently
25→- `async/await` for asynchronous operations
26→- Single quotes for strings (except in HTML)
27→- Minimal comments (code should be self-explanatory)
28→