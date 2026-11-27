const testFolder = "../public/sitemap";
const fs = require("fs");

const makeEndStr = (ind) => `
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ind}
</sitemapindex>
`;

fs.readdir(testFolder, (err, files) => {
  let localCpy = "";
  files.forEach((file) => {
    const x = `
    <sitemap>
      <loc>https://www.partspass.app/sitemap/${file}</loc>
    </sitemap>`;
    localCpy += `
    <sitemap>
      <loc>https://www.partspass.app/sitemap/${file}</loc>
    </sitemap>`;
    console.log(x);
  });
  fs.writeFileSync("tmp/test.xml", localCpy, (err) => {
    if (err) {
      console.error(err);
    } else {
      // file written successfully
    }
  });
});
