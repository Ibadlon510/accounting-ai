// @ts-expect-error -- isomorphic-dompurify types don't resolve under "exports"
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "ul", "ol", "li", "br", "hr", "img", "a", "b", "i", "u",
  "strong", "em", "small", "sub", "sup", "blockquote", "pre", "code",
  "style", "section", "article", "header", "footer", "nav", "main",
  "figure", "figcaption", "svg", "path", "circle", "rect", "line",
];

const ALLOWED_ATTR = [
  "class", "id", "style", "src", "alt", "width", "height",
  "href", "target", "colspan", "rowspan", "cellpadding", "cellspacing",
  "border", "align", "valign", "role", "viewBox", "fill", "stroke",
  "stroke-width", "d", "cx", "cy", "r", "x", "y", "x1", "y1", "x2", "y2",
];

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "select"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}

export function sanitizeCss(css: string): string {
  return css
    .replace(/expression\s*\(/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/@import\s/gi, "")
    .replace(/url\s*\(\s*["']?javascript:/gi, "url(");
}
