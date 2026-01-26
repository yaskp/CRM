import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Use the transparent one we just made as input
const inputPath = path.resolve('uploads/logo_transparent.png');
const outputPath = path.resolve('uploads/logo_dark_mode.png');

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

        // Iterate through pixels
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // If pixel is visible
            if (a > 10) {
                // If pixel is dark (black text), make it white
                // "ENTERPRISE" is black. Teal color is likely brighter.
                // Let's use a threshold. If it's dark gray/black, boost to white.
                if (r < 80 && g < 80 && b < 80) {
                    data[i] = 255;     // R
                    data[i + 1] = 255; // G
                    data[i + 2] = 255; // B
                }
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

        console.log(`Saved dark mode logo to: ${outputPath}`);
    } catch (err) {
        console.error('Error processing image:', err);
    }
};

run();
