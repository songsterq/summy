// Function to toggle model field based on temporary chat setting
function toggleModelField(useTemporaryChat) {
  const modelSelect = document.getElementById('model');
  modelSelect.disabled = useTemporaryChat;
}

// Function to get the current keyboard shortcut
function getCurrentShortcut() {
  chrome.commands.getAll(commands => {
    const command = commands.find(cmd => cmd.name === '_execute_action');
    if (command && command.shortcut) {
      document.getElementById('currentShortcut').textContent = command.shortcut;
    } else {
      document.getElementById('currentShortcut').textContent = "Command+Shift+S (Mac) / Ctrl+Shift+S (Windows/Linux)";
    }
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
    
    // Get current keyboard shortcut
    getCurrentShortcut();
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