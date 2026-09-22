/** Allow importing server-only modules from Node audit scripts. */
const Module = require("module");
const original = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === "server-only") return {};
  return original.apply(this, arguments);
};
