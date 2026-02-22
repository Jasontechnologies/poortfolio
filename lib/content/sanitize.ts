import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'h1',
    'h2',
    'h3',
    'blockquote',
    'pre',
    'code',
    'strong',
    'em',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'a'
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: 'noreferrer noopener',
        target: '_blank'
      }
    })
  }
};

export function sanitizePostHtml(input: string) {
  return sanitizeHtml(input, SANITIZE_OPTIONS);
}

export function htmlToPlainText(input: string) {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();
}

