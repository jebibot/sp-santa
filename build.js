const fs = require("fs");
const { minify_sync } = require("terser");

(async () => {
  const code = fs.readFileSync("bookmarklet.js", "utf8");
  let html = fs.readFileSync("docs/index.html", "utf8");
  html = html.replace(
    /data-type="(\w+)" href="javascript:(?:[^"]+)"/g,
    (_, type) => {
      const { code: minified } = minify_sync(code, {
        compress: {
          passes: 2,
          global_defs: {
            __ITEM_TYPE__: type,
          },
        },
        format: {
          ascii_only: true,
          quote_style: 1,
        },
      });
      return `data-type="${type}" href="javascript:${encodeURI(minified)}"`;
    }
  );
  fs.writeFileSync("docs/index.html", html, "utf8");
})();
