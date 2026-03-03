const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project({
    tsConfigFilePath: path.join(__dirname, "tsconfig.json"),
});

const sourceFiles = [
    ...project.getSourceFiles("src/pages/**/*.tsx"),
    ...project.getSourceFiles("src/components/**/*.tsx")
];
console.log(`Found ${sourceFiles.length} source files.`);

let updatedFiles = 0;

for (const sourceFile of sourceFiles) {
    let modified = false;

    // Check if the file imports Table from antd
    const importDecs = sourceFile.getImportDeclarations();
    const hasAntdTable = importDecs.some(imp =>
        (imp.getModuleSpecifierValue() === "antd")
        && imp.getNamedImports().some(ni => ni.getName() === "Table")
    );

    if (!hasAntdTable) {
        continue;
    }

    const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
    const tableElements = jsxElements.filter(el => el.getTagNameNode().getText() === "Table");

    const selfClosingElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
    const tableSelfClosing = selfClosingElements.filter(el => el.getTagNameNode().getText() === "Table");

    const allTableNodes = [...tableElements, ...tableSelfClosing];

    for (const tableNode of allTableNodes) {
        // 1. SCROLL
        const scrollAttr = tableNode.getAttribute("scroll");

        let existingX = "'max-content'";

        if (scrollAttr) {
            const initializer = scrollAttr.getInitializer();
            if (initializer && initializer.getKind() === SyntaxKind.JsxExpression) {
                const expr = initializer.getExpression();
                if (expr && expr.getKind() === SyntaxKind.ObjectLiteralExpression) {
                    const props = expr.getProperties();
                    props.forEach(p => {
                        if (p.getName() === "x" && p.getInitializer) {
                            const init = p.getInitializer();
                            existingX = init ? init.getText() : existingX;
                        }
                    });
                }
            }
            scrollAttr.remove();
        }

        tableNode.addAttribute({
            name: "scroll",
            initializer: `{ x: ${existingX}, y: 'calc(100vh - 380px)' }`
        });
        modified = true;

        // 2. PAGINATION
        const pagAttr = tableNode.getAttribute("pagination");
        const pagTemplate = `showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total, range) => <span style={{ fontWeight: 'bold' }}>Total Rows: {total} | Rows: {range[0]} - {range[1]}</span>`;

        if (pagAttr) {
            const initializer = pagAttr.getInitializer();
            if (initializer && initializer.getKind() === SyntaxKind.JsxExpression) {
                const text = initializer.getExpression()?.getText();
                pagAttr.remove();
                if (text === "false") {
                    tableNode.addAttribute({ name: "pagination", initializer: "{false}" });
                } else if (text) {
                    tableNode.addAttribute({
                        name: "pagination",
                        initializer: `{ { ...(${text}), ${pagTemplate} } }`
                    });
                    modified = true;
                }
            } else {
                pagAttr.remove();
                tableNode.addAttribute({
                    name: "pagination",
                    initializer: `{ { ${pagTemplate} } }`
                });
                modified = true;
            }
        } else {
            tableNode.addAttribute({
                name: "pagination",
                initializer: `{ { ${pagTemplate} } }`
            });
            modified = true;
        }

        // 3. STYLE BORDER
        const styleAttr = tableNode.getAttribute("style");
        if (!styleAttr) {
            tableNode.addAttribute({
                name: "style",
                initializer: `{ border: '1px solid #f0f0f0', borderRadius: 8 }`
            });
            modified = true;
        }
    }

    if (modified) {
        sourceFile.saveSync();
        updatedFiles++;
        console.log(`Updated ${sourceFile.getFilePath()}`);
    }
}

console.log(`Successfully updated ${updatedFiles} files.`);
