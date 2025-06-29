importScripts('utils.js');
// The keyboard shortcut is handled by the manifest.json command
chrome.runtime.onInstalled.addListener(async () => {
  console.log('ChatGPT Summarizer extension installed');
  
  // Check if prompts already exist before creating defaults.
  const existingData = await chrome.storage.sync.get(['prompts']);
  if (!existingData.prompts || existingData.prompts.length === 0) {
    // Create default prompts on installation
    const defaultPrompts = generateDefaultPrompts();
    await chrome.storage.sync.set({ 
      prompts: defaultPrompts.prompts, 
      defaultPromptId: defaultPrompts.defaultPromptId 
    });
  }
  // Writing the default prompts above would result in the sync storage being updated.
  // This would trigger the onChanged listener below, which would then call createContextMenus().
  // So, we don't call createContextMenus() here.
});

chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync' && (changes.prompts || changes.defaultPromptId)) {
    await createContextMenus();
  }
});

// Create context menu items for all prompts
async function createContextMenus() {
  // Remove all existing context menu items
  chrome.contextMenus.removeAll();
  
  // Get stored settings
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  // Find the default prompt
  const defaultPrompt = settings.prompts.find(p => p.id === settings.defaultPromptId) || settings.prompts[0];
  
  // Create context menu item for default prompt first
  chrome.contextMenus.create({
    id: defaultPrompt.id,
    title: `${defaultPrompt.name} (Default)`,
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: `selected_${defaultPrompt.id}`,
    title: `${defaultPrompt.name} (Default)`,
    contexts: ['selection']
  });
  
  if (settings.prompts.length > 1) {
    // Create separator if there are other prompts
    chrome.contextMenus.create({
      id: 'separator',
      type: 'separator',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'selected_separator',
      type: 'separator',
      contexts: ['selection']
    });

    // Create context menu items for other prompts
    settings.prompts.forEach(prompt => {
      if (prompt.id !== defaultPrompt.id) {
        chrome.contextMenus.create({
          id: prompt.id,
          title: prompt.name,
          contexts: ['page']
        });
        chrome.contextMenus.create({
          id: `selected_${prompt.id}`,
          title: prompt.name,
          contexts: ['selection']
        });
      }
    });
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  await processTabOrSelection(tab, null);
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId.startsWith('selected_')) {
    // Handle selected text context menu
    const promptId = info.menuItemId.replace('selected_', '');
    await processSelectedText(tab, promptId, info.selectionText);
  } else {
    // Handle page summarization context menu
    await processTab(tab, info.menuItemId);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'processSelectedText') {
    await processSelectedText(sender.tab, request.promptId, request.text);
    sendResponse({ success: true });
  }
});

// Common function to process a tab with a specific prompt
async function processTab(tab, promptId) {
  // Get the stored settings
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  // Get the prompt template
  let promptTemplate = DEFAULT_PROMPT_TEMPLATE; // fallback
  
  if (promptId && settings.prompts && settings.prompts.length > 0) {
    // Find the specific prompt by ID
    const selectedPrompt = settings.prompts.find(p => p.id === promptId);
    if (selectedPrompt) {
      promptTemplate = selectedPrompt.template;
    }
  } else if (settings.prompts && settings.prompts.length > 0) {
    // Use default prompt (for extension icon click)
    const defaultPrompt = settings.prompts.find(p => p.id === settings.defaultPromptId) || settings.prompts[0];
    promptTemplate = defaultPrompt.template;
  }

  // Construct the URL with parameters (without 'q' parameter)
  const url = new URL(settings.baseUrl);
  
  // Only set model parameter if not using temporary chat
  if (!settings.useTemporaryChat) {
    url.searchParams.set('model', settings.model);
  }
  
  if (settings.useTemporaryChat) {
    url.searchParams.set('temporary-chat', 'true');
  }

  // Default prompt with just the URL
  let extractedContent = '';

  // Execute script to extract content from the page
  try {
    // Inject the Readability library first
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['Readability.js', 'utils.js']
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractMainContent
    });
    
    // Get the extracted content (results[0].result contains the return value)
    extractedContent = results[0].result;
  } catch (error) {
    console.error('Error extracting content:', error);
  }
  
  // Process the prompt template by replacing macros
  let prompt = promptTemplate
    .replace(/{PAGE_URL}/g, tab.url)
    .replace(/{PAGE_CONTENT}/g, extractedContent);
  
  // Open the URL in a new tab and get the tab ID
  chrome.tabs.create({ url: url.toString() }, (newTab) => {
    // Define the update listener separately so we can easily remove it
    const updateListener = (tabId, changeInfo, tab) => {
      // Check if this is the tab we opened and it's done loading
      if (tabId === newTab.id && changeInfo.status === 'complete') {
        // Execute script to enter the prompt
        chrome.scripting.executeScript({
          target: { tabId: newTab.id },
          function: enterPrompt,
          args: [prompt]
        });

        // Remove the listener once we've handled the event
        chrome.tabs.onUpdated.removeListener(updateListener);
      }
    };

    // Listen for the tab to finish loading
    chrome.tabs.onUpdated.addListener(updateListener);
  });
}

// Common function to handle both tab and selection processing
async function processTabOrSelection(tab, promptId) {
  // Try to get selected text first
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' });
    if (response && response.selectedText && response.selectedText.trim()) {
      // If there's selected text, use it
      await processSelectedText(tab, promptId, response.selectedText);
      return;
    }
  } catch (error) {
    console.log('No content script or selected text available, falling back to page summary');
  }
  
  // Fall back to page summarization
  await processTab(tab, promptId);
}

// Common function to process selected text with a specific prompt
async function processSelectedText(tab, promptId, selectedText) {
  if (!selectedText || selectedText.trim() === '') {
    console.log('No text selected');
    return;
  }

  // Get the stored settings
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  // Get the prompt template
  let promptTemplate = DEFAULT_PROMPT_TEMPLATE; // fallback
  
  if (promptId && settings.prompts && settings.prompts.length > 0) {
    // Find the specific prompt by ID
    const selectedPrompt = settings.prompts.find(p => p.id === promptId);
    if (selectedPrompt) {
      promptTemplate = selectedPrompt.template;
    }
  } else if (settings.prompts && settings.prompts.length > 0) {
    // Use default prompt
    const defaultPrompt = settings.prompts.find(p => p.id === settings.defaultPromptId) || settings.prompts[0];
    promptTemplate = defaultPrompt.template;
  }

  // Construct the URL with parameters
  const url = new URL(settings.baseUrl);
  
  // Only set model parameter if not using temporary chat
  if (!settings.useTemporaryChat) {
    url.searchParams.set('model', settings.model);
  }
  
  if (settings.useTemporaryChat) {
    url.searchParams.set('temporary-chat', 'true');
  }

  // Process the prompt template by replacing macros
  let prompt = promptTemplate
    .replace(/{PAGE_URL}/g, tab.url)
    .replace(/{PAGE_CONTENT}/g, selectedText.trim());
  
  // Open the URL in a new tab and get the tab ID
  chrome.tabs.create({ url: url.toString() }, (newTab) => {
    // Define the update listener separately so we can easily remove it
    const updateListener = (tabId, changeInfo, tab) => {
      // Check if this is the tab we opened and it's done loading
      if (tabId === newTab.id && changeInfo.status === 'complete') {
        // Execute script to enter the prompt
        chrome.scripting.executeScript({
          target: { tabId: newTab.id },
          function: enterPrompt,
          args: [prompt]
        });

        // Remove the listener once we've handled the event
        chrome.tabs.onUpdated.removeListener(updateListener);
      }
    };

    // Listen for the tab to finish loading
    chrome.tabs.onUpdated.addListener(updateListener);
  });
}

// Function to enter the prompt into the ChatGPT text box
function enterPrompt(prompt) {
  // Find the textarea by its ID
  const interval = setInterval(() => {
    const textbox = document.querySelector('div[contenteditable="true"][id="prompt-textarea"]');
    if (textbox) {
      clearInterval(interval);
      
      // Set the content of the textbox
      textbox.innerHTML = `<p>${prompt}</p>`;
      
      // Create and dispatch an input event to trigger ChatGPT's UI
      const inputEvent = new Event('input', { bubbles: true });
      textbox.dispatchEvent(inputEvent);
      
      // Focus the textbox and set cursor to the end
      textbox.focus();
      
      // Place the cursor at the end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(textbox);
      range.collapse(false); // false means collapse to end
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Simulate Enter key press to submit the prompt
      setTimeout(() => {
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        textbox.dispatchEvent(enterEvent);
      }, 100); // Small delay to ensure focus is set
    }
  }, 500); // Check every 500ms until the textbox is found
} 
