declare var Readability: any;

export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;
  return function(this: unknown, ...args: Parameters<T>): void {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

export function cleanText(text: string): string {
  return text
    .replace(/([.?!"])([A-Z])/g, '$1 $2')
    .trim();
}

export function extractMainContent(): string {
  const doc = document.cloneNode(true) as Document;
  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article || !article.textContent) {
    return '';
  }

  return cleanText(article.textContent);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debounce, cleanText, extractMainContent };
}
