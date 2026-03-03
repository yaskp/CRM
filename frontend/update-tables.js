const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx')) {
                arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const files = getAllFiles('src/pages');
files.push(...getAllFiles('src/components'));

let modifiedCount = 0;

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Only target files that import Table from antd
    if (!content.includes('from \'antd\'') && !content.includes('from "antd"')) continue;
    if (!content.includes('<Table')) continue;

    // Pattern to replace pagination={} without showTotal
    // We want to make sure every Table has x and y scroll, and a showTotal in pagination.
    let changed = false;

    // A simpler approach: Let's create a custom PremiumTable in PremiumComponents, and replace antd 'Table' usage with 'PremiumTable' where applicable.
    // Or we can just inject into existing <Table tags.
}
