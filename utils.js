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

function cleanText(text) {
  return text
    .replace(/([.?!"])([A-Z])/g, '$1 $2')
    .trim();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debounce, cleanText };
}
