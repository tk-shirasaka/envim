export const keycode = (e: KeyboardEvent) => {
  const { key, ctrlKey, altKey, metaKey } = e;

  switch (key) {
    case "<": return "<LT>";
    case "Escape": return "<Esc>";
    case "Backspace": return "<BS>";
    case 'Insert': return '<Insert>';
    case 'Delete': return '<Del>';
    case "Tab": return "<Tab>";
    case "Enter": return "<CR>";
    case 'ArrowUp': return '<Up>';
    case 'ArrowDown': return '<Down>';
    case 'ArrowLeft': return '<Left>';
    case 'ArrowRight': return '<Right>';
    case 'Home': return '<Home>';
    case 'End': return '<End>';
    case 'PageUp': return '<PageUp>';
    case 'PageDown': return '<PageDown>';
    case 'Help': return '<Help>';
    case "CapsLock": return "";
    case "Control": return "";
    case "Shift": return "";
    case "Alt": return "";
  }

  if (ctrlKey && key === '|') return "<C-\\>";
  if (ctrlKey) return `<C-${key}>`;
  if (altKey) return `<A-${key}>`;
  if (metaKey) return `<D-${key}>`;

  return key;
};
