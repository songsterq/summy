function extractMainContent() {
  const doc = document.cloneNode(true);
  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article || !article.textContent) {
    return '';
  }

  return cleanText(article.textContent);
}
