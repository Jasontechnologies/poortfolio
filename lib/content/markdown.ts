const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;
const ITALIC_PATTERN = /\*([^*\n]+)\*/g;
const INLINE_CODE_PATTERN = /`([^`]+)`/g;
const HEADING_PATTERN = /^(#{1,6})\s+(.*)$/;
const UL_ITEM_PATTERN = /^-\s+(.*)$/;
const OL_ITEM_PATTERN = /^\d+\.\s+(.*)$/;

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInline(text: string) {
  return text
    .replace(INLINE_CODE_PATTERN, '<code>$1</code>')
    .replace(BOLD_PATTERN, '<strong>$1</strong>')
    .replace(ITALIC_PATTERN, '<em>$1</em>')
    .replace(LINK_PATTERN, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>');
}

export function markdownToHtml(markdown: string) {
  const escaped = escapeHtml(markdown ?? '');
  const lines = escaped.split(/\r?\n/);
  const out: string[] = [];
  let inUnorderedList = false;
  let inOrderedList = false;

  const closeLists = () => {
    if (inUnorderedList) {
      out.push('</ul>');
      inUnorderedList = false;
    }
    if (inOrderedList) {
      out.push('</ol>');
      inOrderedList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeLists();
      continue;
    }

    const headingMatch = line.match(HEADING_PATTERN);
    if (headingMatch) {
      closeLists();
      const level = headingMatch[1].length;
      out.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const ulMatch = line.match(UL_ITEM_PATTERN);
    if (ulMatch) {
      if (!inUnorderedList) {
        if (inOrderedList) {
          out.push('</ol>');
          inOrderedList = false;
        }
        out.push('<ul>');
        inUnorderedList = true;
      }
      out.push(`<li>${formatInline(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = line.match(OL_ITEM_PATTERN);
    if (olMatch) {
      if (!inOrderedList) {
        if (inUnorderedList) {
          out.push('</ul>');
          inUnorderedList = false;
        }
        out.push('<ol>');
        inOrderedList = true;
      }
      out.push(`<li>${formatInline(olMatch[1])}</li>`);
      continue;
    }

    closeLists();
    out.push(`<p>${formatInline(line)}</p>`);
  }

  closeLists();
  return out.join('\n');
}
