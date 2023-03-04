var DEBUG = false;
function debug_helper(args, is_debug) {
  if (!is_debug)
    return;
  console.log(args.callee.name);
}
