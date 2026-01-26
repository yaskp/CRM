import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const inputPath = path.resolve('uploads/logo.png');
const outputPath = path.resolve('uploads/logo_transparent.png');

console.log(`Processing: ${inputPath}`);

if (!fs.existsSync(inputPath)) {
    console.error('Input file not found');
    process.exit(1);
}

const run = async () => {
    try {
        const { data, info } = await sharp(inputPath)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Iterate through pixels and make white transparent
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Threshold for white (adjust if needed, > 230 is safe for logos usually)
            if (r > 230 && g > 230 && b > 230) {
                data[i + 3] = 0; // Alpha
            }
        }

        await sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        })
            .png()
            .toFile(outputPath);

        console.log(`Saved transparent logo to: ${outputPath}`);
    } catch (err) {
        console.error('Error processing image:', err);
    }
};

run();
