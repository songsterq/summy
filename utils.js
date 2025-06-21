"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = debounce;
exports.cleanText = cleanText;
exports.extractMainContent = extractMainContent;
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
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
function extractMainContent() {
    const doc = document.cloneNode(true);
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
