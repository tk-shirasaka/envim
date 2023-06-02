local group = vim.api.nvim_create_augroup("envim", { clear = true })

vim.api.nvim_create_autocmd({ "BufRead", "BufEnter", "BufWritePost" }, {
  group = group,
  pattern = { "*.ico", "*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg", "*.mp4", "*.webm", "*.pdf" },
  callback = function() envim(0, { "envim_preview" }) end,
})

vim.api.nvim_create_autocmd({ "BufHidden", "BufDelete" }, {
  group = group,
  pattern = { "*.ico", "*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg", "*.mp4", "*.webm", "*.pdf" },
  callback = function() envim(0, { "envim_preview", "" }) end,
})

vim.api.nvim_create_autocmd({ "DirChanged" }, {
  group = group,
  pattern = { "*" },
  callback = function() envim(0, { "envim_dirchanged", vim.fn.getcwd() }) end,
})

vim.api.nvim_create_autocmd({ "OptionSet" }, {
  group = group,
  pattern = { "background" },
  callback = function() envim(0, { "envim_setbackground", vim.o.background }) end,
})

vim.api.nvim_create_autocmd({ "TabLeave" }, {
  group = group,
  pattern = { "*" },
  callback = function() return vim.api.nvim_win_get_config(0).external and vim.cmd([[wincmd j]]) end,
})
