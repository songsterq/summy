// The keyboard shortcut is handled by the manifest.json command
chrome.runtime.onInstalled.addListener(() => {
  console.log('ChatGPT Summarizer extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Get the stored settings
  const settings = await chrome.storage.sync.get({
    baseUrl: 'https://chatgpt.com/',
    model: 'gpt-4o',
    useTemporaryChat: false
  });

  // Construct the URL with parameters (without 'q' parameter)
  const url = new URL(settings.baseUrl);
  
  // Only set model parameter if not using temporary chat
  if (!settings.useTemporaryChat) {
    url.searchParams.set('model', settings.model);
  }
  
  if (settings.useTemporaryChat) {
    url.searchParams.set('temporary-chat', 'true');
  }

  // Store the prompt to be entered later
  const prompt = `Summarize the content at ${tab.url}`;
  
  // Open the URL in a new tab and get the tab ID
  chrome.tabs.create({ url: url.toString() }, (newTab) => {
    // Listen for the tab to finish loading
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
      // Check if this is the tab we opened and it's done loading
      if (tabId === newTab.id && changeInfo.status === 'complete') {
        // Execute script to enter the prompt
        chrome.scripting.executeScript({
          target: { tabId: newTab.id },
          function: enterPrompt,
          args: [prompt]
        });
        
        // Remove the listener once we've handled the event
        chrome.tabs.onUpdated.removeListener(listener);
      }
    });
  });
});

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