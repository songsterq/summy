// Load saved options
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
    baseUrl: 'https://chatgpt.com/',
    model: 'gpt-4',
    useTemporaryChat: false
  }, (items) => {
    document.getElementById('baseUrl').value = items.baseUrl;
    document.getElementById('model').value = items.model;
    document.getElementById('useTemporaryChat').checked = items.useTemporaryChat;
  });
});

// Save options
document.getElementById('save').addEventListener('click', () => {
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
    status.className = 'status success';
    status.style.display = 'block';
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
  });
}); 