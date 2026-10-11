// Quill uses editor-specific classes for lists, alignment and indentation.
// Convert those to normal HTML/CSS before the blog is saved, so the content
// renders correctly on the public website even when it does not load Quill CSS.
export function portableRichTextHtml(html) {
  if (!html || typeof document === "undefined") return html || "";

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  wrapper.querySelectorAll("ol").forEach((list) => {
    const items = Array.from(list.children).filter((node) => node.tagName === "LI");
    const listTypes = new Set(items.map((item) => item.dataset.list).filter(Boolean));

    // Quill creates an <ol> for both its ordered and bullet controls. A
    // conventional <ul> ensures bullets render on every public frontend.
    if (items.length && listTypes.size === 1 && listTypes.has("bullet")) {
      const unordered = document.createElement("ul");
      Array.from(list.attributes).forEach((attribute) => unordered.setAttribute(attribute.name, attribute.value));
      while (list.firstChild) unordered.appendChild(list.firstChild);
      list.replaceWith(unordered);
    }
  });

  wrapper.querySelectorAll("li[data-list]").forEach((item) => {
    item.removeAttribute("data-list");
    item.querySelector(":scope > .ql-ui")?.remove();
  });

  const classStyles = {
    "ql-align-center": ["textAlign", "center"],
    "ql-align-right": ["textAlign", "right"],
    "ql-align-justify": ["textAlign", "justify"],
    "ql-font-serif": ["fontFamily", "Georgia, 'Times New Roman', serif"],
    "ql-font-monospace": ["fontFamily", "Monaco, 'Courier New', monospace"],
    "ql-size-small": ["fontSize", "0.75em"],
    "ql-size-large": ["fontSize", "1.5em"],
    "ql-size-huge": ["fontSize", "2.5em"],
  };

  wrapper.querySelectorAll("*").forEach((element) => {
    Object.entries(classStyles).forEach(([className, [property, value]]) => {
      if (element.classList.contains(className)) {
        element.style[property] = value;
        element.classList.remove(className);
      }
    });

    const indent = Array.from(element.classList).find((className) => /^ql-indent-\d+$/.test(className));
    if (indent) {
      element.style.marginLeft = `${Number(indent.replace("ql-indent-", "")) * 3}em`;
      element.classList.remove(indent);
    }
  });

  return wrapper.innerHTML;
}
