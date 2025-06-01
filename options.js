// Debounce function to prevent multiple saves when typing
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

// Function to toggle model field based on temporary chat setting
function toggleModelField(useTemporaryChat) {
  const modelSelect = document.getElementById('model');
  modelSelect.disabled = useTemporaryChat;
}

// Fix chrome:// URLs since they cannot be opened directly from content scripts
function handleShortcutLink() {
  document.getElementById('shortcutLink').addEventListener('click', (e) => {
    e.preventDefault();
    // Tell the user how to access the shortcuts page
    alert('To configure keyboard shortcuts:\n\n1. Copy this URL: chrome://extensions/shortcuts\n2. Open a new tab\n3. Paste and go to the URL\n4. Find "ChatGPT Summarizer" in the list and set your preferred shortcut');
  });
}

// Load saved options
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
    baseUrl: 'https://chatgpt.com/',
    model: 'gpt-4o',
    useTemporaryChat: false,
    promptTemplate: 'Summarize the following content from {PAGE_URL}:\n\n{PAGE_CONTENT}'
  }, (items) => {
    document.getElementById('baseUrl').value = items.baseUrl;
    document.getElementById('model').value = items.model;
    document.getElementById('useTemporaryChat').checked = items.useTemporaryChat;
    document.getElementById('promptTemplate').value = items.promptTemplate;
    
    // Initialize model field state
    toggleModelField(items.useTemporaryChat);
    
    // Initialize shortcut link handler
    handleShortcutLink();
  });
  
  // Add event listeners for auto-save
  document.getElementById('baseUrl').addEventListener('input', debounce(saveOptions, 500));
  document.getElementById('model').addEventListener('change', saveOptions);
  document.getElementById('promptTemplate').addEventListener('input', debounce(saveOptions, 500));
  document.getElementById('useTemporaryChat').addEventListener('change', function() {
    toggleModelField(this.checked);
    saveOptions();
  });
});

// Save options
function saveOptions() {
  const baseUrl = document.getElementById('baseUrl').value;
  const model = document.getElementById('model').value;
  const useTemporaryChat = document.getElementById('useTemporaryChat').checked;
  const promptTemplate = document.getElementById('promptTemplate').value;

  chrome.storage.sync.set({
    baseUrl,
    model,
    useTemporaryChat,
    promptTemplate
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    status.className = 'status success show-toast';
    
    setTimeout(() => {
      status.className = 'status success hide-toast';
      // Wait for the fade animation to complete before hiding the element
      setTimeout(() => {
        status.className = 'status success';
      }, 500);
    }, 2000);
  });
} 