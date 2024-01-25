local group = vim.api.nvim_create_augroup("envim", { clear = true })

vim.api.nvim_create_autocmd({ "BufWinEnter" }, {
  group = group,
  pattern = { "http://*", "https://*", "*.ico", "*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg", "*.mp4", "*.webm", "*.pdf" },
  callback = function()
    local path = vim.fn.expand("%:p")
    local url = ""

    if string.find(path, "^https?://") then
      url = path
    else
      local ext = vim.fn.expand("%:e")
      local media = ""

      if ext == "ico" or ext == "png" or ext == "jpg" or ext == "jpeg" or ext == "gif" or ext == "svg" then
        media = "image"
      elseif ext == "mp4" or ext == "webm" then
        media = "video"
      elseif ext == "pdf" then
        media = "application"
      end

      if media ~= "" then
        local f = assert(io.open(path, "rb"))
        local content = f:read("*a")

        f:close()

        ext = ext == "svg" and "svg+xml" or ext
        url = string.format("data:%s/%s;base64,%s", media, ext, vim.base64.encode(content))
      end
    end

    if url ~= "" then envim_connect(0, { "envim_openurl", url, "vnew" }) end
  end,
})

vim.api.nvim_create_autocmd({ "DirChanged" }, {
  group = group,
  pattern = { "*" },
  callback = function() envim_connect(0, { "envim_dirchanged", vim.fn.getcwd() }) end,
})

vim.api.nvim_create_autocmd({ "OptionSet" }, {
  group = group,
  pattern = { "background" },
  callback = function()
    vim.cmd([[ mode ]])
    envim_connect(0, { "envim_setbackground", vim.o.background })
  end,
})

vim.api.nvim_create_autocmd({ "TabLeave" }, {
  group = group,
  pattern = { "*" },
  callback = function() return vim.api.nvim_win_get_config(0).external and vim.cmd([[wincmd j]]) end,
})
