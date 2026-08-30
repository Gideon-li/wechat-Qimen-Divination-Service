/** 去掉模型爱用的 Markdown 标记，避免 ###、** 挡阅读。 */
export function stripModelMarkup(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[a-zA-Z0-9_-]*/g, "").trim())
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|[^\w*])\*([^*\n]+)\*(?!\*)/g, "$1$2")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "· ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-=*]{3,}\s*$/gm, "")
    .replace(/[*#`]+/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
