

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
  chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    const baseUrl = items.baseUrl;
    document.getElementById('baseUrl').value = baseUrl;
    document.getElementById('useTemporaryChat').checked = items.useTemporaryChat;
    
    // Determine which platform is selected based on baseUrl
    let selectedPlatform = 'CUSTOM';
    if (baseUrl === PLATFORMS.CHATGPT.baseUrl) {
      selectedPlatform = 'CHATGPT';
    } else if (baseUrl === PLATFORMS.GEMINI.baseUrl) {
      selectedPlatform = 'GEMINI';
    }
    document.getElementById('platform').value = selectedPlatform;
    updateUIForPlatform(selectedPlatform);
    
    // Load prompts and default selection
    loadPrompts(items.prompts, items.defaultPromptId);
    
    // Get current keyboard shortcut
    getCurrentShortcut();
  });
  
  // Add event listeners for auto-save
  document.getElementById('platform').addEventListener('change', onPlatformChange);
  document.getElementById('baseUrl').addEventListener('input', debounce(saveOptions, 500));
  document.getElementById('useTemporaryChat').addEventListener('change', saveOptions);
  
  // Add event listeners for prompt management
  document.getElementById('addPromptBtn').addEventListener('click', addPrompt);
  document.getElementById('updatePromptBtn').addEventListener('click', updatePrompt);
  document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);
  
  // Add event delegation for prompt action buttons
  document.getElementById('promptsList').addEventListener('click', function(e) {
    const promptItem = e.target.closest('.prompt-item');
    if (!promptItem) return;
    
    const promptId = promptItem.dataset.promptId;
    if (e.target.classList.contains('btn-edit')) {
      editPrompt(promptId);
    } else if (e.target.classList.contains('btn-delete')) {
      deletePrompt(promptId);
    } else if (e.target.classList.contains('btn-move-up')) {
      movePrompt(promptId, -1);
    } else if (e.target.classList.contains('btn-move-down')) {
      movePrompt(promptId, 1);
    } else if (e.target.classList.contains('btn-set-default')) {
      setAsDefault(promptId);
    }
  });
});

// Handle platform selection change
function onPlatformChange() {
  const platform = document.getElementById('platform').value;
  updateUIForPlatform(platform);
  
  // Update baseUrl based on platform selection
  if (platform === 'CHATGPT') {
    document.getElementById('baseUrl').value = PLATFORMS.CHATGPT.baseUrl;
  } else if (platform === 'GEMINI') {
    document.getElementById('baseUrl').value = PLATFORMS.GEMINI.baseUrl;
  }
  
  saveOptions();
}

// Update UI elements based on selected platform
function updateUIForPlatform(platform) {
  const baseUrlGroup = document.getElementById('baseUrlGroup');
  const temporaryChatGroup = document.getElementById('temporaryChatGroup');
  const baseUrlInput = document.getElementById('baseUrl');
  
  if (platform === 'CUSTOM') {
    baseUrlGroup.style.display = 'block';
    baseUrlInput.readOnly = false;
    temporaryChatGroup.style.display = 'flex';
  } else if (platform === 'GEMINI') {
    baseUrlGroup.style.display = 'block';
    baseUrlInput.readOnly = true;
    temporaryChatGroup.style.display = 'none';
  } else {
    baseUrlGroup.style.display = 'block';
    baseUrlInput.readOnly = true;
    temporaryChatGroup.style.display = 'flex';
  }
}

// Save options
function saveOptions() {
  const baseUrl = document.getElementById('baseUrl').value;
  const useTemporaryChat = document.getElementById('useTemporaryChat').checked;

  chrome.storage.sync.set({
    baseUrl,
    useTemporaryChat
  }, () => {
    showToast('Options saved.');
  });
}

// Load and display prompts
function loadPrompts(prompts, defaultPromptId) {
  const promptsList = document.getElementById('promptsList');
  
  // Clear existing content
  promptsList.innerHTML = '';
  
  if (prompts.length === 0) {
    // Create default prompts if none exist
    const defaultPrompts = generateDefaultPrompts();
    prompts = defaultPrompts.prompts;
    const newDefaultPromptId = defaultPromptId || defaultPrompts.defaultPromptId;
    chrome.storage.sync.set({ prompts, defaultPromptId: newDefaultPromptId }, () => {
      // Reload prompts with the updated defaultPromptId
      loadPrompts(prompts, newDefaultPromptId);
    });
    return; // Exit early, will be called again with the updated defaultPromptId
  }
  
  prompts.forEach((prompt, index) => {
    // Add to list
    const promptItem = document.createElement('div');
    promptItem.className = 'prompt-item' + (prompt.id === defaultPromptId ? ' default' : '');
    promptItem.dataset.promptId = prompt.id;
    promptItem.dataset.promptIndex = index;
    
    promptItem.innerHTML = `
      <div class="prompt-header">
        <span class="prompt-name${prompt.id === defaultPromptId ? ' default' : ''}">${prompt.name}</span>
        <div class="prompt-actions">
          ${index > 0 ? '<button class="btn-move btn-move-up" data-direction="-1">&uarr;</button>' : ''}
          ${index < prompts.length - 1 ? '<button class="btn-move btn-move-down" data-direction="1">&darr;</button>' : ''}
          ${prompt.id !== defaultPromptId ? '<button class="btn-primary btn-set-default">Set as Default</button>' : ''}
          <button class="btn-secondary btn-edit">Edit</button>
          <button class="btn-danger btn-delete">Delete</button>
        </div>
      </div>
      <div class="prompt-content">${prompt.template}</div>
    `;
    promptsList.appendChild(promptItem);
  });
  
  if (prompts.length === 0) {
    promptsList.innerHTML = '<div class="empty-prompts">No prompts saved yet. Add your first prompt above.</div>';
  }
}

// Add new prompt
function addPrompt() {
  const name = document.getElementById('promptName').value.trim();
  const template = document.getElementById('promptTemplate').value.trim();
  
  if (!name || !template) {
    alert('Please enter both prompt name and template.');
    return;
  }
  
  chrome.storage.sync.get(['prompts', 'defaultPromptId'], (items) => {
    const prompts = items.prompts || [];
    const newPrompt = {
      id: generatePromptId(),
      name: name,
      template: template
    };
    
    prompts.push(newPrompt);
    
    // If this is the first prompt, make it default
    let defaultPromptId = items.defaultPromptId;
    if (!defaultPromptId && prompts.length === 1) {
      defaultPromptId = newPrompt.id;
    }
    
    chrome.storage.sync.set({ prompts, defaultPromptId }, () => {
      loadPrompts(prompts, defaultPromptId);
      clearPromptForm();
      showToast('Prompt added successfully!');
    });
  });
}

// Edit prompt
let editingPromptId = null;

function editPrompt(promptId) {
  chrome.storage.sync.get(['prompts'], (items) => {
    const prompt = items.prompts.find(p => p.id === promptId);
    if (prompt) {
      document.getElementById('promptName').value = prompt.name;
      document.getElementById('promptTemplate').value = prompt.template;
      
      editingPromptId = promptId;
      
      document.getElementById('addPromptBtn').style.display = 'none';
      document.getElementById('updatePromptBtn').style.display = 'inline-block';
      document.getElementById('cancelEditBtn').style.display = 'inline-block';
    }
  });
}

// Update prompt
function updatePrompt() {
  const name = document.getElementById('promptName').value.trim();
  const template = document.getElementById('promptTemplate').value.trim();
  
  if (!name || !template) {
    alert('Please enter both prompt name and template.');
    return;
  }
  
  chrome.storage.sync.get(['prompts', 'defaultPromptId'], (items) => {
    const prompts = items.prompts || [];
    const promptIndex = prompts.findIndex(p => p.id === editingPromptId);
    
    if (promptIndex !== -1) {
      prompts[promptIndex].name = name;
      prompts[promptIndex].template = template;
      
      chrome.storage.sync.set({ prompts }, () => {
        loadPrompts(prompts, items.defaultPromptId);
        cancelEdit();
        showToast('Prompt updated successfully!');
      });
    }
  });
}

// Cancel edit
function cancelEdit() {
  clearPromptForm();
  editingPromptId = null;
  
  document.getElementById('addPromptBtn').style.display = 'inline-block';
  document.getElementById('updatePromptBtn').style.display = 'none';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

// Clear prompt form
function clearPromptForm() {
  document.getElementById('promptName').value = '';
  document.getElementById('promptTemplate').value = '';
}

// Delete prompt
function deletePrompt(promptId) {
  if (!confirm('Are you sure you want to delete this prompt?')) {
    return;
  }
  
  chrome.storage.sync.get(['prompts', 'defaultPromptId'], (items) => {
    let prompts = items.prompts || [];
    let defaultPromptId = items.defaultPromptId;
    
    prompts = prompts.filter(p => p.id !== promptId);
    
    // If we deleted the default prompt, select a new default
    if (defaultPromptId === promptId) {
      defaultPromptId = prompts.length > 0 ? prompts[0].id : null;
    }
    
    chrome.storage.sync.set({ prompts, defaultPromptId }, () => {
      loadPrompts(prompts, defaultPromptId);
      showToast('Prompt deleted successfully!');
    });
  });
}

// Move prompt up or down
function movePrompt(promptId, direction) {
  chrome.storage.sync.get(['prompts', 'defaultPromptId'], (items) => {
    const prompts = items.prompts || [];
    const currentIndex = prompts.findIndex(p => p.id === promptId);
    
    if (currentIndex === -1) return;
    
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= prompts.length) return;
    
    // Swap prompts
    [prompts[currentIndex], prompts[newIndex]] = [prompts[newIndex], prompts[currentIndex]];
    
    chrome.storage.sync.set({ prompts }, () => {
      loadPrompts(prompts, items.defaultPromptId);
      showToast('Prompt order updated!');
    });
  });
}

// Set a specific prompt as default
function setAsDefault(promptId) {
  chrome.storage.sync.get(['prompts'], (items) => {
    chrome.storage.sync.set({ defaultPromptId: promptId }, () => {
      loadPrompts(items.prompts, promptId);
      showToast('Default prompt updated!');
    });
  });
}

// Show toast notification
function showToast(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status success show-toast';
  
  setTimeout(() => {
    status.className = 'status success hide-toast';
    setTimeout(() => {
      status.className = 'status success';
    }, 500);
  }, 2000);
}
