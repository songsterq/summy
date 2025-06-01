// The keyboard shortcut is handled by the manifest.json command
chrome.runtime.onInstalled.addListener(() => {
  console.log('ChatGPT Summarizer extension installed');
});

// Function to extract main text content from a web page
function extractMainContent() {
  // Function to clean text (remove excess whitespace)
  const cleanText = (text) => {
    return text.replace(/\s+/g, ' ').trim();
  };

  let content = '';
  
  // Try to find main content containers
  const contentContainers = [
    ...document.querySelectorAll('article, [role="article"], main, .article, .content, .post, [itemprop="articleBody"]'),
    ...document.querySelectorAll('section:not(header section, footer section)'),
  ];
  
  if (contentContainers.length > 0) {
    // Use the first content container that has substantial text
    for (const container of contentContainers) {
      // Get all paragraphs within the container
      const paragraphs = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
      if (paragraphs.length > 5) { // Arbitrary threshold for a "real" article
        content = Array.from(paragraphs)
          .map(p => cleanText(p.textContent))
          .filter(text => text.length > 0)
          .join('\n\n');
        break;
      }
    }
  }
  
  // Fallback: if no suitable container found, grab paragraphs directly
  if (!content) {
    const paragraphs = document.querySelectorAll('p');
    content = Array.from(paragraphs)
      .map(p => cleanText(p.textContent))
      .filter(text => text.length > 0 && text.split(' ').length > 5) // Filter out very short paragraphs
      .join('\n\n');
  }
  
  // If still no content, try getting text from divs that might contain text
  if (!content) {
    const textDivs = Array.from(document.querySelectorAll('div'))
      .filter(div => {
        // Only include divs that directly contain text and not just other elements
        const hasDirectText = Array.from(div.childNodes)
          .some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 50);
        return hasDirectText;
      });
    
    content = textDivs
      .map(div => cleanText(div.textContent))
      .filter(text => text.length > 0)
      .join('\n\n');
  }
  
  return content;
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Get the stored settings
  const settings = await chrome.storage.sync.get({
    baseUrl: 'https://chatgpt.com/',
    model: 'gpt-4o',
    useTemporaryChat: false,
    promptTemplate: 'Summarize the following content from {PAGE_URL}:\n\n{PAGE_CONTENT}'
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

  // Default prompt with just the URL
  let extractedContent = '';

  // Execute script to extract content from the page
  try {
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
  let prompt = settings.promptTemplate
    .replace(/{PAGE_URL}/g, tab.url)
    .replace(/{PAGE_CONTENT}/g, extractedContent);
  
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