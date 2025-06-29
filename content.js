// Content script for handling text selection and keyboard shortcuts
let selectedText = '';

// Track text selection
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    sendResponse({ selectedText: text });
  }
});

// Listen for keyboard shortcuts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarizeSelection') {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text) {
      // Send the selected text back to background script for processing
      chrome.runtime.sendMessage({
        action: 'processSelectedText',
        text: text,
        url: window.location.href,
        promptId: request.promptId
      });
    }
    
    sendResponse({ success: true });
  }
});