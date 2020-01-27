export const icons = [
  { font: "", color: "#eceb8f", name: "Javascript", type: ["javascript", "javascriptreact"] },
  { font: "", color: "#5ba9e1", name: "Typescript", type: ["typescript", "typescriptreact"] },
  { font: "", color: "#4182b1", name: "PHP", type: ["php"] },
  { font: "", color: "#3ab2e1", name: "Perl", type: ["perl"] },
  { font: "", color: "#d0d543", name: "Python", type: ["python"] },
  { font: "", color: "#c82a2a", name: "Ruty", type: ["ruby"] },
  { font: "ﬥ", color: "#d4d4d4", name: "JSON", type: ["json"] },
  { font: "", color: "#e67a68", name: "HTML", type: ["html"] },
  { font: "", color: "#7dc5e1", name: "CSS", type: ["css", "scss", "less"] },
  { font: "", color: "#12b324", name: "Vim", type: ["vim"] },
  { font: "", color: "#21bd8a", name: "Shell", type: ["sh", "zsh"] },
];

export const notificate = (kind: string) => {
  switch (kind) {
    case "emsg":
    case "echoerr":
    case "lua_error":
    case "rpc_error":
    case "wmsg":
      return ""
    case "":
    case "confirm":
    case "confirm_sub":
    case "echo":
    case "echomsg":
      return ""
    case "return_prompt":
      return ""
    case "quickfix":
    case "search_count":
      return ""
  }
};
