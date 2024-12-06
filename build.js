const fs = require("fs");
const { minify } = require("terser");

(async () => {
  const code = fs.readFileSync("bookmarklet.js", "utf8");
  const { code: minified } = await minify(code, {
    compress: {
      passes: 2,
    },
    format: {
      ascii_only: true,
      quote_style: 1,
    },
  });

  let html = fs.readFileSync("docs/index.html", "utf8");
  html = html.replace(
    /data-type="(\d+)" href="javascript:(?:[^"]+)"/g,
    (_, type) =>
      `data-type="${type}" href="javascript:${encodeURI(
        minified.replace("__ITEM_TYPE__", type)
      )}"`
  );
  fs.writeFileSync("docs/index.html", html, "utf8");
})();
