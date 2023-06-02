local function copy(lines, regtype)
  return envim(0, { "envim_clipboard", lines, regtype })
end

local function paste()
  return envim(1, { "envim_clipboard" })
end

vim.g.loaded_clipboard_provider = nil
vim.g.clipboard = {
  name = "envim",
  copy = { ["+"] = copy, ["*"] = copy },
  paste = { ["+"] = paste, ["*"] = paste },
}

vim.cmd([[
  runtime autoload/provider/clipboard.vim
]])
