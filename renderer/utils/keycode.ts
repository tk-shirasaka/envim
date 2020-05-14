import { KeyboardEvent } from "react";

export const keycode = (e: KeyboardEvent) => {
  const { keyCode, key, ctrlKey, altKey, metaKey } = e;

  switch (key) {
    case "¥": return "\\";
    case "<": return "<LT>";
    case "Escape": return "<Esc>";
    case "Backspace": return "<BS>";
    case "Insert": return "<Insert>";
    case "Delete": return "<Del>";
    case "Tab": return "<Tab>";
    case "Enter": return "<CR>";
    case "ArrowUp": return "<Up>";
    case "ArrowDown": return "<Down>";
    case "ArrowLeft": return "<Left>";
    case "ArrowRight": return "<Right>";
    case "Home": return "<Home>";
    case "End": return "<End>";
    case "PageUp": return "<PageUp>";
    case "PageDown": return "<PageDown>";
    case "Help": return "<Help>";
    case "CapsLock": return "";
    case "Alphanumeric": return "";
    case "NonConvert": return "";
    case "Convert": return "";
    case "HiraganaKatakana": return "";
    case "Clear": return "";
    case "NumLock": return "";
    case "Control": return "";
    case "Shift": return "";
    case "Alt": return "";
    case "F1": return "<F1>";
    case "F2": return "<F2>";
    case "F3": return "<F3>";
    case "F4": return "<F4>";
    case "F5": return "<F5>";
    case "F6": return "<F6>";
    case "F7": return "<F7>";
    case "F8": return "<F8>";
    case "F9": return "<F9>";
    case "F10": return "<F10>";
    case "F11": return "<F11>";
    case "F12": return "<F12>";
  }

  if (keyCode === 229) return "";
  if (ctrlKey && key === "|") return "<C-\\>";
  if (ctrlKey) return `<C-${key}>`;
  if (altKey) return `<A-${key}>`;
  if (metaKey) return `<D-${key}>`;

  return key;
};
