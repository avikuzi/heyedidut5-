/**
 * Small Markdown subset for committee-assistant replies.
 * Builds a data tree only — callers turn it into React text nodes.
 * Model HTML is kept as literal text; there is no HTML passthrough.
 */

export type InlineNode =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: InlineNode[] }
  | { type: 'italic'; children: InlineNode[] };

export type MarkdownBlock =
  | { type: 'paragraph'; lines: InlineNode[][] }
  | { type: 'ul'; items: InlineNode[][] }
  | { type: 'ol'; items: Array<{ n: string; children: InlineNode[] }> }
  | { type: 'hr' };

const HR_LINE = /^\s*(?:\*{3,}|-{3,}|_{3,})\s*$/;
const BULLET_LINE = /^\s*[-*]\s+(.+)$/;
const NUMBER_LINE = /^\s*(\d+)[.)]\s+(.+)$/;

function findClosingStar(input: string, from: number): number {
  for (let index = from; index < input.length; index += 1) {
    if (input[index] !== '*') continue;
    if (input[index + 1] === '*') return -1;
    if (index === from) return -1;
    return index;
  }
  return -1;
}

export function parseInline(input: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buffer = '';
  const flush = () => {
    if (!buffer) return;
    nodes.push({ type: 'text', text: buffer });
    buffer = '';
  };

  let index = 0;
  while (index < input.length) {
    if (input.startsWith('**', index)) {
      const end = input.indexOf('**', index + 2);
      if (end !== -1) {
        flush();
        const inner = input.slice(index + 2, end);
        nodes.push({ type: 'bold', children: inner ? parseInline(inner) : [] });
        index = end + 2;
        continue;
      }
    }

    const next = input[index + 1];
    if (input[index] === '*' && next !== undefined && next !== '*' && !/\s/.test(next)) {
      const end = findClosingStar(input, index + 1);
      if (end !== -1) {
        flush();
        nodes.push({ type: 'italic', children: parseInline(input.slice(index + 1, end)) });
        index = end + 1;
        continue;
      }
    }

    buffer += input[index];
    index += 1;
  }

  flush();
  return nodes;
}

export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let paragraph: InlineNode[][] | null = null;
  let bullets: InlineNode[][] | null = null;
  let numbers: Array<{ n: string; children: InlineNode[] }> | null = null;

  const flushParagraph = () => {
    if (paragraph && paragraph.length > 0) blocks.push({ type: 'paragraph', lines: paragraph });
    paragraph = null;
  };
  const flushBullets = () => {
    if (bullets && bullets.length > 0) blocks.push({ type: 'ul', items: bullets });
    bullets = null;
  };
  const flushNumbers = () => {
    if (numbers && numbers.length > 0) blocks.push({ type: 'ol', items: numbers });
    numbers = null;
  };
  const flushLists = () => {
    flushBullets();
    flushNumbers();
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      flushLists();
      continue;
    }
    if (HR_LINE.test(line)) {
      flushParagraph();
      flushLists();
      blocks.push({ type: 'hr' });
      continue;
    }
    const bullet = BULLET_LINE.exec(line);
    if (bullet) {
      flushParagraph();
      flushNumbers();
      bullets = bullets || [];
      bullets.push(parseInline(bullet[1]));
      continue;
    }
    const numbered = NUMBER_LINE.exec(line);
    if (numbered) {
      flushParagraph();
      flushBullets();
      numbers = numbers || [];
      numbers.push({ n: numbered[1], children: parseInline(numbered[2]) });
      continue;
    }
    flushLists();
    paragraph = paragraph || [];
    paragraph.push(parseInline(line.trim()));
  }

  flushParagraph();
  flushLists();
  return blocks;
}

function inlineText(nodes: InlineNode[]): string {
  return nodes
    .map((node) => (node.type === 'text' ? node.text : inlineText(node.children)))
    .join('');
}

/** Clipboard text: same words, without Markdown emphasis, rules, or list markers. */
export function markdownToPlainText(source: string): string {
  const parts: string[] = [];
  for (const block of parseMarkdown(source)) {
    if (block.type === 'hr') continue;
    if (block.type === 'paragraph') {
      parts.push(block.lines.map((line) => inlineText(line)).join('\n'));
      continue;
    }
    if (block.type === 'ul') {
      parts.push(block.items.map((item) => `• ${inlineText(item)}`).join('\n'));
      continue;
    }
    parts.push(block.items.map((item) => `${item.n}. ${inlineText(item.children)}`).join('\n'));
  }
  return parts
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
