function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

function cleanText(text) {
  return text
    .replace(/([.?!"])([A-Z])/g, '$1 $2')
    .trim();
}

function extractMainContent() {
  const doc = document.cloneNode(true);
  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article || !article.textContent) {
    return '';
  }

  return cleanText(article.textContent);
}

// Shared constants and utilities

// Default prompt template
const DEFAULT_PROMPT_TEMPLATE = 'Give me a short summary of the following content from {PAGE_URL}:\n\n{PAGE_CONTENT}';

// Default prompt name
const DEFAULT_PROMPT_NAME = 'Short Summary';

// ELIM5 prompt template
const ELIM5_PROMPT_TEMPLATE = 'Explain like I\'m Five, using easy to understand terms, of the following content from {PAGE_URL}:\n\n{PAGE_CONTENT}';

// ELIM5 prompt name
const ELIM5_PROMPT_NAME = 'ELIM5';

// Platform configurations
const PLATFORMS = {
  CHATGPT: {
    name: 'ChatGPT',
    baseUrl: 'https://chatgpt.com/',
    domain: 'chatgpt.com',
    selector: 'div[contenteditable="true"][id="prompt-textarea"]'
  },
  GEMINI: {
    name: 'Gemini',
    baseUrl: 'https://gemini.google.com/app',
    domain: 'gemini.google.com',
    selector: 'rich-textarea div[contenteditable="true"]'
  },
  CLAUDE: {
    name: 'Claude',
    baseUrl: 'https://claude.ai/new',
    domain: 'claude.ai',
    selector: 'div[data-testid="chat-input"]'
  }
};

// Default settings
const DEFAULT_SETTINGS = {
  baseUrl: 'https://chatgpt.com/',
  useTemporaryChat: false,
  prompts: [],
  defaultPromptId: null
};

// Generate unique ID for prompts
function generatePromptId() {
  return 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Function to generate default prompts
function generateDefaultPrompts() {
  const shortSummaryId = generatePromptId();
  const elim5Id = generatePromptId();
  
  return {
    prompts: [
      {
        id: shortSummaryId,
        name: DEFAULT_PROMPT_NAME,
        template: DEFAULT_PROMPT_TEMPLATE
      },
      {
        id: elim5Id,
        name: ELIM5_PROMPT_NAME,
        template: ELIM5_PROMPT_TEMPLATE
      }
    ],
    defaultPromptId: shortSummaryId // Short Summary remains the default
  };
}

// Export for Node.js environment (for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_PROMPT_TEMPLATE,
    DEFAULT_PROMPT_NAME,
    ELIM5_PROMPT_TEMPLATE,
    ELIM5_PROMPT_NAME,
    PLATFORMS,
    DEFAULT_SETTINGS,
    cleanText,
    debounce,
    extractMainContent,
    generateDefaultPrompts
  };
}
