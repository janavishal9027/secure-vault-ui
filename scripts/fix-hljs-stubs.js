/**
 * Creates stub files for deprecated highlight.js language aliases
 * that source-map-loader tries to resolve but no longer exist in v11.
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "node_modules", "highlight.js", "lib", "languages");
const stubs = ["c-like.js", "htmlbars.js", "sql_more.js"];
const content = 'module.exports = function(hljs) { return { name: "noop" }; };\n';

stubs.forEach((file) => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
  }
});
