_G.envim = function (sync, args)
  local fname = sync > 0 and "rpcrequest" or "rpcnotify"

  table.insert(args, 1, vim.g.envim_id)

  return vim.api.nvim_call_function(fname, args)
end

vim.cmd([[
  function! EnvimConnect(sync, ...)
    return v:lua.envim(a:sync, a:000)
  endfunction
]])
