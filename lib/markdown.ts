// Markdown-to-plain-text for short previews (cards, lists), where rendering
// formatting would be noise: drops syntax, keeps the words.
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, "")
    .replace(/(\*\*|__|~~|\*|_)(.*?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();
}
