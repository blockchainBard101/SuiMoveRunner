const fs = require('fs');

// We need to compile templates.ts and index.ts so we can call getWebviewContent
// using ts-node or just by compiling out to a local dir
const srcCode = fs.readFileSync('src/ui/templates/webview/script.ts', 'utf8');
const match = srcCode.match(/export const webviewScript = \`([\s\S]*)\`;/m);
if (!match) throw new Error("Could not find webviewScript");

const scriptStr = match[1]
    .replace('\\${JSON.stringify(argsMapping)}', JSON.stringify({}));

const html = \`<script>\${scriptStr}</script>\`;
fs.writeFileSync('test.html', html);
console.log("Wrote test.html");
