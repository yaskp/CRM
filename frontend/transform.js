module.exports = function (fileInfo, api) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    let dirty = false;

    root.find(j.JSXOpeningElement, { name: { name: 'Table' } })
        .forEach(path => {
            const attrs = path.value.attributes;

            // 1. Add scroll
            const hasScroll = attrs.some(a => a.name && a.name.name === 'scroll');
            if (!hasScroll) {
                attrs.push(
                    j.jsxAttribute(
                        j.jsxIdentifier('scroll'),
                        j.jsxExpressionContainer(
                            j.objectExpression([
                                j.property('init', j.identifier('x'), j.literal('max-content')),
                                j.property('init', j.identifier('y'), j.literal('calc(100vh - 380px)'))
                            ])
                        )
                    )
                );
                dirty = true;
            }

            // 2. Handle pagination
            // If there is pagination prop, modify it
            const pagIdx = attrs.findIndex(a => a.name && a.name.name === 'pagination');

            const showSizeChangerProps = [
                j.property('init', j.identifier('showSizeChanger'), j.literal(true)),
                j.property('init', j.identifier('pageSizeOptions'), j.arrayExpression([j.literal('10'), j.literal('20'), j.literal('50'), j.literal('100')])),
                j.property('init', j.identifier('showTotal'),
                    j.arrowFunctionExpression(
                        [
                            j.identifier.from({ name: 'total', typeAnnotation: j.tsTypeAnnotation(j.tsNumberKeyword()) }),
                            j.identifier.from({ name: 'range', typeAnnotation: j.tsTypeAnnotation(j.tsArrayType(j.tsNumberKeyword())) })
                        ], // typed args for TS
                        j.jsxElement(
                            j.jsxOpeningElement(j.jsxIdentifier('span'), [
                                j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(j.objectExpression([j.property('init', j.identifier('fontWeight'), j.literal('bold'))])))
                            ]),
                            j.jsxClosingElement(j.jsxIdentifier('span')),
                            [
                                j.jsxText('Total Rows: '),
                                j.jsxExpressionContainer(j.identifier('total')),
                                j.jsxText(' | Rows: '),
                                j.jsxExpressionContainer(j.memberExpression(j.identifier('range'), j.literal(0))),
                                j.jsxText(' - '),
                                j.jsxExpressionContainer(j.memberExpression(j.identifier('range'), j.literal(1))),
                            ]
                        )
                    )
                )
            ];

            if (pagIdx === -1) {
                attrs.push(
                    j.jsxAttribute(
                        j.jsxIdentifier('pagination'),
                        j.jsxExpressionContainer(j.objectExpression(showSizeChangerProps))
                    )
                );
                dirty = true;
            } else {
                const pagAttr = attrs[pagIdx];
                if (pagAttr.value && pagAttr.value.expression) {
                    const expr = pagAttr.value.expression;
                    if (expr.type === 'ObjectExpression') {
                        const hasShowTotal = expr.properties.some(p => p.key && p.key.name === 'showTotal');
                        if (!hasShowTotal) {
                            expr.properties.push(...showSizeChangerProps);
                            dirty = true;
                        }
                    } else if (expr.type === 'Identifier' || expr.type === 'MemberExpression') {
                        pagAttr.value.expression = j.objectExpression([
                            j.spreadElement(expr),
                            ...showSizeChangerProps
                        ]);
                        dirty = true;
                    }
                }
            }
        });

    return dirty ? root.toSource() : null;
}
