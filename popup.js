document.getElementById('summarize').addEventListener('click', async () => {
  // Get the current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Get the stored settings
  const settings = await chrome.storage.sync.get({
    baseUrl: 'https://chatgpt.com/',
    model: 'gpt-4',
    useTemporaryChat: false
  });

  // Construct the URL with parameters
  const url = new URL(settings.baseUrl);
  url.searchParams.set('q', `Summarize the content at ${tab.url}`);
  url.searchParams.set('model', settings.model);
  if (settings.useTemporaryChat) {
    url.searchParams.set('temporary-chat', 'true');
  }

  // Open the URL in a new tab
  chrome.tabs.create({ url: url.toString() });
}); 