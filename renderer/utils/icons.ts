export const icons = [
  { font: "", color: "yellow-fg", name: "Javascript", type: /(javascript)|(javascriptreact)/ },
  { font: "", color: "lightblue-fg", name: "Typescript", type: /(typescript)|(typescriptreact)/ },
  { font: "", color: "purple-fg", name: "PHP", type: "php" },
  { font: "", color: "lightblue-fg", name: "Perl", type: "perl" },
  { font: "", color: "yellow-fg", name: "Python", type: "python" },
  { font: "", color: "red-fg", name: "Ruty", type: "ruby" },
  { font: "", color: "lightblue-fg", name: "Lua", type: "lua" },
  { font: "", color: "red-fg", name: "HTML", type: "html" },
  { font: "", color: "lightblue-fg", name: "CSS", type: /(css)|(scss)|(less)/ },
  { font: "", color: "green-fg", name: "Vim", type: "vim" },
  { font: "", color: "green-fg", name: "Shell", type: /(sh)|(zsh)/ },
  { font: "", color: "red-fg", name: "Git", type: /git/ },
  { font: "", color: "blue-fg", name: "Docker", type: /docker/i },
  { font: "ﬥ", color: "gray-fg", name: "JSON", type: "json" },
  { font: "", color: "gray-fg", name: "Config", type: /(yaml)|(toml)/ },
  { font: "", color: "pink-fg", name: "Help", type: "help" },
];

export const notificates = [
  { font: "", color: "lightblue", kinds: ["echo",  "echomsg", ""], filter: true},
  { font: "", color: "green", kinds: ["quickfix",  "search_count"], filter: true},
  { font: "", color: "yellow", kinds: ["wmsg"], filter: true},
  { font: "", color: "red", kinds: ["emsg", "echoerr", "lua_error", "rpc_error"], filter: true},
  { font: "", color: "purple", kinds: ["confirm", "confirm_sub"], filter: false},
  { font: "", color: "pink", kinds: ["return_prompt"], filter: false},
  { font: "", color: "gray", kinds: ["mode", "command", "ruler"], filter: false},
];
