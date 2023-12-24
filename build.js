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

  let html = fs.readFileSync("public/index.html", "utf8");
  html = html.replace(
    /href="javascript:([^"]+)"/g,
    `href="javascript:${encodeURI(minified)}"`
  );
  fs.writeFileSync("public/index.html", html, "utf8");
})();
