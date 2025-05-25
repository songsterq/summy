// The keyboard shortcut is handled by the manifest.json command
chrome.runtime.onInstalled.addListener(() => {
  console.log('ChatGPT Summarizer extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
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