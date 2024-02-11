const vscode = require('vscode');

const knownHtmlElements = [
    'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
    'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl',
    'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header',
    'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'meta',
    'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp',
    'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'svg',
    'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'
];

function isKnownHtmlElement(part) {
    return knownHtmlElements.includes(part.toLowerCase());
}

function calculateSpecificity(selector) {
    let idSelectors = (selector.match(/#/g) || []).length;
    let classSelectors = (selector.match(/\./g) || []).length;

    // Extract parts between spaces to find HTML elements
    let htmlElements = selector.split(/[.#\s]/).filter(part => part !== '');
    let elementSelectors = htmlElements.reduce((count, part) => isKnownHtmlElement(part) ? count + 1 : count, 0);

    // Calculate a single weight for each selector
    return `(${idSelectors}-${classSelectors}-${elementSelectors})`;
}

function activate(context) {
    let inlineDecorationType = vscode.window.createTextEditorDecorationType({
       
    });

    let activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
        updateDecorations(activeEditor, inlineDecorationType);
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            updateDecorations(editor, inlineDecorationType);
        }
    });

    vscode.window.onDidChangeTextEditorSelection(event => {
        if (activeEditor && event.textEditor === activeEditor) {
            updateDecorations(activeEditor, inlineDecorationType);
        }
    });
}

function updateDecorations(editor, decorationType) {
    if (!editor || editor.document.languageId !== 'css') {
        return;
    }

    let document = editor.document;
    let text = document.getText();
    let selections = editor.selections;

    // Clear existing decorations
    editor.setDecorations(decorationType, []);

    // Apply new decorations based on specificity
    let decorationsArray = [];
    let lines = text.split('\n');

    selections.forEach(selection => {
        let lineIndex = selection.active.line;
        let line = lines[lineIndex];

        let match;
        let regex = /{/g;

        while ((match = regex.exec(line)) !== null) {
            let startPosition = match.index; // position before '{'

            // Find the end position by looking for the next '}' or the end of the line
            let endPosition = line.indexOf('}', startPosition);
            if (endPosition === -1) {
                endPosition = line.length;
            }

            let selectorsBeforeBrace = line.substring(0, startPosition).trim();
            let specificity = calculateSpecificity(selectorsBeforeBrace);

            let decoration = {
                range: new vscode.Range(new vscode.Position(lineIndex, startPosition), new vscode.Position(lineIndex, startPosition + 1)),
                renderOptions: {
                    after: {
                        margin: '0 0 0 1em',
                        fontWeight: 'light',
                        contentText: ` Specificity Weight: ${specificity}`,
                        color: '#8e8e8e74',
                        
                    },
                },
            };

            decorationsArray.push(decoration);
        }
    });

    editor.setDecorations(decorationType, decorationsArray);
}

exports.activate = activate;
