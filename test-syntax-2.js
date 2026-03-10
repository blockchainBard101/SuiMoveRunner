const fs = require('fs');
let content = fs.readFileSync('src/ui/templates/webview/script.ts', 'utf8');
const scriptStr = content.slice(content.indexOf('\`') + 1, content.lastIndexOf('\`'));
const cleanStr = scriptStr.replace(/\\\${[^}]*}/g, '{}');
try {
    new Function(cleanStr);
    console.log('Valid JS syntax!');
} catch (e) {
    console.log('Syntax error:', e);
    fs.writeFileSync('debug-view.js', cleanStr);
}
