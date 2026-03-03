const fs = require('fs');
const path = require('path');

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const stat = fs.statSync(path.join(dir, file));
        if (stat.isDirectory()) {
            getAllFiles(path.join(dir, file), fileList);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            fileList.push(path.join(dir, file));
        }
    }
    return fileList;
}

const files = getAllFiles(path.join(__dirname, 'src/pages')).concat(getAllFiles(path.join(__dirname, 'src/components')));

let count = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('from \'antd\'') || content.includes('from "antd"')) {
        let changed = false;

        const regex = /<Table\s+([\s\S]*?)\/?>/g;
        content = content.replace(regex, (match, props) => {
            if (match.includes('Table.Summary') || match.includes('Table.Column')) return match;

            // Only inject if it doesn't already have our specific string
            if (props.includes('showTotal: (total, range)')) return match;

            let newProps = props;

            // 1. Handle scroll
            if (newProps.includes('scroll={')) {
                newProps = newProps.replace(/scroll=\{\s*\{([\s\S]*?)\}\s*\}/g, (m, inner) => {
                    let hasX = inner.includes('x:');
                    let newInner = inner;
                    if (!hasX) newInner += `, x: 'max-content'`;
                    if (!inner.includes('y:')) newInner += `, y: 'calc(100vh - 380px)'`;
                    return `scroll={{ ${newInner} }}`;
                });
            } else {
                newProps += ` scroll={{ x: 'max-content', y: 'calc(100vh - 380px)' }}`;
            }

            // 2. Handle pagination
            const pagTemplate = `showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total, range) => <span style={{ fontWeight: 'bold' }}>Total Rows: {total} | Rows: {range[0]} - {range[1]}</span>`;
            if (newProps.includes('pagination={false}')) {
                // leave it alone
            } else if (newProps.includes('pagination={')) {
                newProps = newProps.replace(/pagination={([\s\S]*?)(?=(?:\s+\w+=|\s*$))/g, (m, inner) => {
                    // Extract balanced braces logic is hard with regex, let's just do a simpler trick
                    // We only capture up to the next prop or end. This might be brittle if pagination={{a: 1}} has spaces inside.
                    return m;
                });

                // Let's use a split approach for pagination
                let idx = newProps.indexOf('pagination={');
                if (idx !== -1) {
                    let openObj = false;
                    if (newProps.substr(idx + 12, 1) === '{') openObj = true;
                    // Replacing might break, let's just append to it manually by finding the closing brace
                    // Actually, simpler to just find and replace "pagination={{ "
                    newProps = newProps.replace(/pagination=\{\{/g, `pagination={{ ${pagTemplate}, `);
                    // If it's a state var like `pagination={paginationData}` 
                    newProps = newProps.replace(/pagination=\{([^}{]*?)\}/g, (m, stateVar) => {
                        if (stateVar !== 'false' && stateVar !== 'true' && !stateVar.includes('...')) {
                            return `pagination={{ ...(${stateVar}), ${pagTemplate} }}`;
                        }
                        return m;
                    });
                }
            } else {
                newProps += ` pagination={{ ${pagTemplate} }}`;
            }

            const isSelfClosing = match.endsWith('/>');
            changed = true;
            return `<Table ${newProps} ${isSelfClosing ? '/>' : '>'}`;
        });

        if (changed) {
            fs.writeFileSync(file, content, 'utf8');
            count++;
            console.log("Updated", file);
        }
    }
}
console.log("Total files updated:", count);
