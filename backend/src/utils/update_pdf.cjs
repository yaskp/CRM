
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pdfGenerator.ts');

const newCode = `export const generatePurchaseOrderPDF = (po: any, stream: any) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })

    doc.pipe(stream)

    // --- Header ---
    const companyName = 'VH SHRI ENTERPRISE'
    const companyAddress = 'B-104, Rajhans Bonista,\\nB/H Ramchowk, Ghod Dod Road,\\nSurat-395007'
    const companyContact = 'Contact: 0261-2666515, 2656515\\nEmail: vhshrienterprise@gmail.com'
    const companyGSTIN = 'GSTIN: 24AAAFV7277F1Z5' // Updated default

    const logoPath = path.join(process.cwd(), 'uploads/logo.png')
    let contentStartY = 175

    // Header Layout
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 220 })
    } else {
        doc.fontSize(20).font('Helvetica-Bold').text(companyName, 40, 40)
    }

    // Company Info on Right Side
    doc.fontSize(10).font('Helvetica')
    doc.text(companyAddress, 300, 40, { align: 'right', width: 250 })
    doc.text(companyContact, 300, 85, { align: 'right', width: 250 })
    doc.font('Helvetica-Bold').text(companyGSTIN, 300, 115, { align: 'right', width: 250 })

    doc.moveTo(40, 140).lineTo(550, 140).stroke()


    // --- PO Info Block ---
    const startY = contentStartY
    const leftX = 40
    const valueX = leftX + 60
    
    // Vendor Column
    const rightX = 320
    const rightValueX = rightX + 70

    doc.fontSize(10)

    // Left Column (PO Details)
    doc.font('Helvetica-Bold').text('PO No.:', leftX, startY)
    doc.font('Helvetica').text(po.po_number || po.temp_number, valueX, startY)
    
    doc.font('Helvetica-Bold').text('Date:', leftX, startY + 15)
    doc.font('Helvetica').text(new Date(po.created_at).toLocaleDateString('en-GB'), valueX, startY + 15)

    doc.font('Helvetica-Bold').text('Project:', leftX, startY + 30)
    doc.font('Helvetica').text(po.project?.name || '-', valueX, startY + 30, { width: 200 })

    // Right Column (Vendor Details)
    doc.font('Helvetica-Bold').text('To (Vendor):', rightX, startY)
    doc.font('Helvetica').text(po.vendor?.name || '', rightValueX, startY)
    
    let vendorY = startY + 15
    if (po.vendor?.address) {
        doc.font('Helvetica').text(po.vendor.address, rightValueX, vendorY, { width: 160 })
        vendorY += doc.heightOfString(po.vendor.address, { width: 160 }) + 5
    } else {
        vendorY += 15
    }
    
    if (po.vendor?.gstin) {
         doc.font('Helvetica-Bold').text('GSTIN:', rightX, vendorY)
         doc.font('Helvetica').text(po.vendor.gstin, rightValueX, vendorY)
    }

    // Shipping Address Section
    const nextY = Math.max(startY + 60, vendorY + 20)
    
    if (po.shipping_address) {
        doc.font('Helvetica-Bold').text('Ship To:', leftX, nextY)
        doc.font('Helvetica').text(po.shipping_address, valueX, nextY, { width: 450 })
    }

    // --- Items Table ---
    const items = po.items || []
    let y = nextY + 40;

    // Helper to draw cell
    const drawCellText = (text, cellX, y, width, align = 'left') => {
        const padding = 4;
        const effectiveWidth = width - (padding * 2);
        doc.text(text, cellX + padding, y, { width: effectiveWidth, align: align })
    }

    // Helper to draw lines
    const drawVerticalLines = (topY, bottomY) => {
        const lines = [40, 70, 270, 315, 370, 455, 555]
        lines.forEach(lineX => {
            doc.moveTo(lineX, topY).lineTo(lineX, bottomY).stroke()
        })
    }

    // Purchase Order Columns
    const colX = { sn: 40, desc: 70, unit: 270, quantity: 315, rate: 370, amount: 455 };
    const colWidths = { sn: 30, desc: 200, unit: 45, quantity: 55, rate: 85, amount: 100 }

    const drawTableHeader = (title, topY) => {
        doc.rect(40, topY, 515, 20).fill('#444444').stroke();
        doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
        doc.text(title.toUpperCase(), 40, topY + 5, { align: 'center', width: 515 });

        const headerY = topY + 20;
        doc.rect(40, headerY, 515, 25).fill('#e0e0e0').stroke();
        doc.fillColor('black').font('Helvetica-Bold').fontSize(9);

        drawCellText('S.No', colX.sn, headerY + 8, colWidths.sn, 'center');
        drawCellText('Description / Material', colX.desc, headerY + 8, colWidths.desc, 'left');
        drawCellText('Unit', colX.unit, headerY + 8, colWidths.unit, 'center');
        drawCellText('Qty', colX.quantity, headerY + 8, colWidths.quantity, 'center');
        drawCellText('Rate', colX.rate, headerY + 8, colWidths.rate, 'right');
        drawCellText('Amount', colX.amount, headerY + 8, colWidths.amount, 'right');

        doc.strokeColor('black')
        drawVerticalLines(headerY, headerY + 25)

        return headerY + 25;
    };

    let calculatedSubTotal = 0

    // Render Rows
    if (items.length > 0) {
        y = drawTableHeader('Order Items', y);
        let currentY = y;
        doc.font('Helvetica').fontSize(9);

        items.forEach((item, idx) => {
            const desc = item.material?.name || item.description || '-';
            const descWidth = colWidths.desc - 8;
            const descHeight = doc.heightOfString(desc, { width: descWidth });
            const rowHeight = Math.max(descHeight, 20) + 10;

            if (currentY + rowHeight > 750) {
                doc.moveTo(40, currentY).lineTo(550, currentY).stroke()
                doc.addPage();
                currentY = 50;
                doc.moveTo(40, currentY).lineTo(550, currentY).stroke()
            }

            doc.fillColor('black');
            drawCellText(\`\${idx + 1}\`, colX.sn, currentY + 5, colWidths.sn, 'center');
            drawCellText(desc, colX.desc, currentY + 5, colWidths.desc, 'left');
            drawCellText(item.unit || '-', colX.unit, currentY + 5, colWidths.unit, 'center');
            drawCellText(Number(item.quantity).toFixed(2), colX.quantity, currentY + 5, colWidths.quantity, 'center');
            drawCellText(Number(item.unit_price).toFixed(2), colX.rate, currentY + 5, colWidths.rate, 'right');
            
            // Calculate line amount (quantity * rate)
            const qty = Number(item.quantity) || 0;
            const rate = Number(item.unit_price) || 0;
            const lineAmount = qty * rate;
            calculatedSubTotal += lineAmount;

            drawCellText(lineAmount.toFixed(2), colX.amount, currentY + 5, colWidths.amount, 'right');

            doc.rect(40, currentY, 515, rowHeight).stroke();
            drawVerticalLines(currentY, currentY + rowHeight)
            currentY += rowHeight;
        });
        
        y = currentY;
    }

    // --- Totals Section ---
    if (y + 100 > 750) { doc.addPage(); y = 50; }
    y += 10;

    const summaryStartX = 340;
    const summaryWidth = 215;

    // Subtotal
    doc.font('Helvetica').fontSize(9)
    doc.text('Subtotal:', 350, y, { width: 90, align: 'right' })
    doc.text(calculatedSubTotal.toFixed(2), 455, y, { width: 95, align: 'right' }) 
    
    y += 15

    const cgst = Number(po.cgst_amount) || 0;
    const sgst = Number(po.sgst_amount) || 0;
    const igst = Number(po.igst_amount) || 0;

    if (cgst > 0) {
        doc.text('CGST:', 350, y, { width: 90, align: 'right' })
        doc.text(cgst.toFixed(2), 455, y, { width: 95, align: 'right' })
        y += 15
    }
    if (sgst > 0) {
        doc.text('SGST:', 350, y, { width: 90, align: 'right' })
        doc.text(sgst.toFixed(2), 455, y, { width: 95, align: 'right' })
        y += 15
    }
    if (igst > 0) {
        doc.text('IGST:', 350, y, { width: 90, align: 'right' })
        doc.text(igst.toFixed(2), 455, y, { width: 95, align: 'right' })
        y += 15
    }

    const grandTotal = calculatedSubTotal + cgst + sgst + igst;

    doc.rect(summaryStartX, y, summaryWidth, 25).fill('#e0e0e0').stroke();
    doc.fillColor('black').font('Helvetica-Bold').fontSize(11);
    doc.text('GRAND TOTAL', summaryStartX + 10, y + 8);
    doc.text(\`Rs. \${grandTotal.toFixed(2)}\`, 450, y + 8, { align: 'right', width: 95 });

    y += 40;

    // --- Terms ---
    doc.font('Helvetica-Bold').fontSize(10).text('Terms & Conditions:', 40, y, { underline: true });
    y += 15;
    doc.font('Helvetica').fontSize(9);

    if (po.annexure) {
        if (po.annexure.payment_terms) { doc.text(\`Payment Terms: \${po.annexure.payment_terms}\`, 40, y); y += 15; }
        if (po.annexure.delivery_terms) { doc.text(\`Delivery Terms: \${po.annexure.delivery_terms}\`, 40, y); y += 15; }
    } else if (po.payment_terms) {
        doc.text(\`Payment Terms: \${po.payment_terms}\`, 40, y); y += 15;
    }

    if (po.notes) {
        y += 10;
        doc.font('Helvetica-Bold').text('Notes:', 40, y);
        doc.font('Helvetica').text(po.notes, 40, y + 15);
    }
    
    // Authorization Footer
    y += 50
    const footerY = Math.min(y, 720) 
    
    doc.fontSize(9)
    doc.text('Authorized Signatory', 40, footerY, { align: 'left', width: 200 })
    doc.text('For VH SHRI ENTERPRISE', 40, footerY + 40, { align: 'left', width: 200 })
    
    doc.text('Accepted By (Vendor)', 350, footerY, { align: 'right', width: 200 })

    doc.end()
}
`;

const fileContent = fs.readFileSync(filePath, 'utf8');
const startMarker = "export const generatePurchaseOrderPDF = (po: any, stream: any) => {";
const startIdx = fileContent.indexOf(startMarker);

if (startIdx !== -1) {
    const finalContent = fileContent.substring(0, startIdx) + newCode;
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log("Success");
} else {
    console.log("Function not found");
}
