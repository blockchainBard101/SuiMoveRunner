const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (request) {
    if (request === 'vscode') {
        return {
            Uri: { joinPath: () => ({ toString: () => 'mock_uri' }) },
            workspace: { workspaceFolders: [] }
        };
    }
    return originalRequire.apply(this, arguments);
};

const ind = require('./src/ui/templates/index.js');
const html = ind.getWebviewContent({ argsMapping: {} });
const fs = require('fs');
fs.writeFileSync('webview-debug-rendered.html', html);

const startIndex = html.indexOf('<script>') + 8;
const endIndex = html.indexOf('</script>');
const scriptContent = html.substring(startIndex, endIndex);

fs.writeFileSync('webview-debug-rendered.js', scriptContent);
const cp = require('child_process');
try {
    cp.execSync('node -c webview-debug-rendered.js', { stdio: 'pipe' });
    console.log('Syntax OK. Generating webview-debug-rendered.js');
} catch (e) {
    console.log('Syntax Error in rendered webview javascript:');
    console.error(e.stderr.toString());
}
