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

// Load saved options
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
    baseUrl: 'https://chatgpt.com/',
    model: 'gpt-4o',
    useTemporaryChat: false
  }, (items) => {
    document.getElementById('baseUrl').value = items.baseUrl;
    document.getElementById('model').value = items.model;
    document.getElementById('useTemporaryChat').checked = items.useTemporaryChat;
    
    // Initialize model field state
    toggleModelField(items.useTemporaryChat);
  });
  
  // Add event listeners for auto-save
  document.getElementById('baseUrl').addEventListener('input', debounce(saveOptions, 500));
  document.getElementById('model').addEventListener('change', saveOptions);
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

  chrome.storage.sync.set({
    baseUrl,
    model,
    useTemporaryChat
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