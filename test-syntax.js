const source = require('./out/ui/templates/index.js');
const webviewContent = source.getWebviewContent({ argsMapping: {} });
const scriptContent = webviewContent.split('<script>')[1].split('</script>')[0];
try {
    new Function(scriptContent);
    console.log('Syntax OK');
} catch (e) {
    console.log('Syntax Error: ' + e.message);
    const lines = scriptContent.split('\\n');
    for (let i = 1; i <= lines.length; i++) {
        try {
            new Function(lines.slice(0, i).join('\\n'));
        } catch (err) {
            if (err instanceof SyntaxError && err.message !== 'Unexpected end of input') {
                console.log('Error around line ' + i + ': ' + lines[i - 1]);
                console.log(err.message);
                break;
            }
        }
    }
}
