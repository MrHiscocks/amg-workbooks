export function el(tag, text, attrs, ...children) {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  for (const [name, value] of Object.entries(attrs ?? {})) {
    if (value !== false && value !== undefined && value !== null) node.setAttribute(name, value === true ? "" : value);
  }
  node.append(...children);
  return node;
}
export const field = (label, control) => el("label", null, { class: "field" }, el("span", label), control);
export const button = (label, attrs = {}) => el("button", label, { type: "button", class: "button", ...attrs });
export function input(type, value = "", attrs = {}) {
  const node = el("input", null, { type, ...attrs });
  node.value = value;
  return node;
}
export function select(options, value, attrs = {}) {
  const node = el("select", null, attrs, ...options.map(([key, label]) => el("option", label, { value: key })));
  node.value = value;
  return node;
}
export const message = () => el("p", "", { class: "notice", role: "status" });
export function showMessage(node, text, error = false) {
  node.textContent = text;
  node.classList.toggle("error", error);
}
