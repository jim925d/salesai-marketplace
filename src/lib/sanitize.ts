// Input sanitization for XSS prevention
// Strips HTML tags from user input before storage or display

export function sanitize(input: string): string {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

export function sanitizeHTML(input: string): string {
  const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'li']
  const div = document.createElement('div')
  div.innerHTML = input

  function walk(node: Node): void {
    const children = Array.from(node.childNodes)
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element
        if (!ALLOWED_TAGS.includes(el.tagName.toLowerCase())) {
          el.replaceWith(...Array.from(el.childNodes))
        } else {
          // Remove all attributes
          while (el.attributes.length > 0) {
            el.removeAttribute(el.attributes[0].name)
          }
          walk(el)
        }
      }
    }
  }

  walk(div)
  return div.innerHTML
}
