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