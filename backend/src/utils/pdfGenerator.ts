import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'

export const generateQuotationPDF = (quotation: any, stream: any) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })

    doc.pipe(stream)

    // --- Header ---
    const companyName = 'VH SHRI ENTERPRISE'
    const companyAddress = 'B-104, Rajhans Bonista,\nB/H Ramchowk, Ghod Dod Road,\nSurat-395007'
    const companyContact = 'Contact: 0261-2666515, 2656515\nEmail: vhshrienterprise@gmail.com'

    const logoPath = path.join(process.cwd(), 'uploads/logo.png')
    let contentStartY = 160 // Increased start Y for better header spacing

    // Header Layout: Left Logo, Right Company Info
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 220 })
    } else {
        doc.fontSize(20).font('Helvetica-Bold').text(companyName, 40, 40)
    }

    // Company Info on Right Side
    doc.fontSize(10).font('Helvetica')
    doc.text(companyAddress, 300, 40, { align: 'right', width: 250 })
    doc.text(companyContact, 300, 85, { align: 'right', width: 250 })

    doc.moveTo(40, 135).lineTo(550, 135).stroke()


    // --- Quotation Info Block ---
    const startY = contentStartY
    const leftX = 40
    const rightX = 350

    doc.fontSize(10).font('Helvetica-Bold')

    // Left Column
    doc.text('Ref No.:', leftX, startY).font('Helvetica').text(` ${quotation.quotation_number}`, leftX + 45, startY)
    doc.font('Helvetica-Bold').text('Date:', leftX, startY + 15).font('Helvetica').text(` ${new Date(quotation.created_at).toLocaleDateString('en-GB')}`, leftX + 30, startY + 15)

    // Right Column
    doc.font('Helvetica-Bold').text('To:', rightX, startY)
    doc.font('Helvetica').text(quotation.lead?.company_name || quotation.lead?.name, rightX + 25, startY)
    if (quotation.lead?.address) {
        doc.text(quotation.lead.address, rightX + 25, startY + 15, { width: 200 })
    }

    doc.moveDown(2)

    // Project/Subject
    const currentY = doc.y + 20
    doc.font('Helvetica-Bold').text('Subject:', leftX, currentY)
    doc.font('Helvetica').text(' Quotation for Construction Services', leftX + 45, currentY)

    const items = quotation.items && quotation.items.length > 0 ? quotation.items : []

    // --- Item Tables ---
    const materialItems = items.filter((i: any) => i.item_type === 'material');
    const labourItems = items.filter((i: any) => i.item_type !== 'material');

    let y = currentY + 30;

    // Adjusted Column Positions
    // Adjusted Column Positions - Shifted to give more space to Amounts
    const colX = {
        sn: 40,
        desc: 70,
        unit: 270,
        quantity: 315,
        rate: 370,
        amount: 455
    };

    // Adjusted Column Widths
    const colWidths = {
        sn: 30,
        desc: 200, // Reduced to give space to rates/amounts
        unit: 45,
        quantity: 55,
        rate: 85, // Increased
        amount: 100 // Increased
    }

    // Unit Shortener Map
    const unitMap: Record<string, string> = {
        'Running Meter': 'Rmt',
        'Square Meter': 'Sq.m',
        'Cubic Meter': 'Cum',
        'Metric Ton': 'MT',
        'Numbers': 'Nos',
        'Kilograms': 'Kg',
        'Lump Sum': 'LS',
        'Feet': 'Ft',
        'Square Feet': 'Sq.ft',
        'Meter': 'Mtr',
    }

    const getShortUnit = (unit: string) => {
        if (!unit) return '-';
        return unitMap[unit] || unit.replace(/Meter/i, 'Mtr').replace(/Square/i, 'Sq').replace(/Cubic/i, 'Cu');
    }

    // Helper to clear area for text - WITH PADDING
    const drawCellText = (text: string, cellX: number, y: number, width: number, align: string = 'left') => {
        const padding = 4;
        const effectiveWidth = width - (padding * 2);
        // For right/center, doc.text still expects x as the start of the "box" if width is given.
        doc.text(text, cellX + padding, y, { width: effectiveWidth, align: align as any })
    }

    // Helper to draw vertical lines
    const drawVerticalLines = (topY: number, bottomY: number) => {
        const lines = [40, 70, 270, 315, 370, 455, 555] // Vertical line X positions
        lines.forEach(lineX => {
            doc.moveTo(lineX, topY).lineTo(lineX, bottomY).stroke()
        })
    }

    // Helper to draw table header
    const drawTableHeader = (title: string, topY: number) => {
        // Section Title
        doc.rect(40, topY, 515, 20).fill('#444444').stroke();
        doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
        doc.text(title.toUpperCase(), 40, topY + 5, { align: 'center', width: 515 });

        // Column Headers
        const headerY = topY + 20;
        doc.rect(40, headerY, 515, 25).fill('#e0e0e0').stroke(); // Increased height slightly
        doc.fillColor('black').font('Helvetica-Bold').fontSize(9);

        drawCellText('S.No', colX.sn, headerY + 8, colWidths.sn, 'center');
        drawCellText('Description of Item', colX.desc, headerY + 8, colWidths.desc, 'left');
        drawCellText('Unit', colX.unit, headerY + 8, colWidths.unit, 'center');
        drawCellText('Qty', colX.quantity, headerY + 8, colWidths.quantity, 'center');
        drawCellText('Rate', colX.rate, headerY + 8, colWidths.rate, 'right');
        drawCellText('Amount', colX.amount, headerY + 8, colWidths.amount, 'right');

        // Draw header vertical lines
        doc.strokeColor('black')
        drawVerticalLines(headerY, headerY + 25)

        return headerY + 25;
    };

    // Helper to render rows
    const renderTableRows = (rows: any[], startY: number) => {
        let currentY = startY;
        doc.font('Helvetica').fontSize(9);
        let sectionTotal = 0;

        rows.forEach((item, index) => {
            const descWidth = colWidths.desc - 8;
            const descHeight = doc.heightOfString(item.description, { width: descWidth });
            const rowHeight = Math.max(descHeight, 20) + 10;

            if (currentY + rowHeight > 750) {
                // If breaking page, close previous block borders first if needed (omitted for simplicity, but ideally should close bottom)
                doc.moveTo(40, currentY).lineTo(550, currentY).stroke()
                doc.addPage();
                currentY = 50;
                // Redraw header for continuation? optional, for now just simple continuation
                doc.moveTo(40, currentY).lineTo(550, currentY).stroke()
            }

            doc.fillColor('black');

            drawCellText(`${index + 1}`, colX.sn, currentY + 5, colWidths.sn, 'center');
            drawCellText(item.description, colX.desc, currentY + 5, colWidths.desc, 'left');

            const isLS = item.item_type === 'lumpsum' || item.unit === 'LS';
            const shortUnit = getShortUnit(item.unit);

            drawCellText(shortUnit, colX.unit, currentY + 5, colWidths.unit, 'center');

            if (!isLS) {
                drawCellText(Number(item.quantity).toFixed(2), colX.quantity, currentY + 5, colWidths.quantity, 'center');
                drawCellText(Number(item.rate).toFixed(2), colX.rate, currentY + 5, colWidths.rate, 'right');
            } else {
                drawCellText('-', colX.quantity, currentY + 5, colWidths.quantity, 'center');
                drawCellText('-', colX.rate, currentY + 5, colWidths.rate, 'right');
            }

            drawCellText(Number(item.amount).toFixed(2), colX.amount, currentY + 5, colWidths.amount, 'right');

            // Row Bottom Border
            doc.rect(40, currentY, 515, rowHeight).stroke(); // Outline row
            drawVerticalLines(currentY, currentY + rowHeight) // Vertical lines

            currentY += rowHeight;
            sectionTotal += Number(item.amount);
        });


        // Section Total Row
        doc.font('Helvetica-Bold');
        doc.text('Total', 350, currentY + 5, { align: 'right', width: 130 });
        drawCellText(sectionTotal.toFixed(2), colX.amount, currentY + 5, colWidths.amount, 'right');
        doc.rect(40, currentY, 515, 20).stroke();

        // Vertical lines for Total Row
        // Only need minimal vertical lines here? Or match table structure. Let's just frame the Total value.
        doc.moveTo(485, currentY).lineTo(485, currentY + 20).stroke() // Line before Amount

        return { nextY: currentY + 25, total: sectionTotal };
    };

    let totalLabour = 0;
    let totalMaterial = 0;

    // 1. Labour / Works Table
    if (labourItems.length > 0) {
        y = drawTableHeader('Labour / Work Items Cost', y);
        const res = renderTableRows(labourItems, y);
        y = res.nextY;
        totalLabour = res.total;
    }

    // 2. Material Table
    if (materialItems.length > 0) {
        if (y + 60 > 750) { doc.addPage(); y = 50; }
        y = drawTableHeader('Material Cost (Approx Estimate)', y);
        const res = renderTableRows(materialItems, y);
        y = res.nextY;
        totalMaterial = res.total;
    }

    // --- Summary Table ---
    if (y + 100 > 750) { doc.addPage(); y = 50; }

    y += 10;
    doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
    doc.text('SUMMARY OF COSTS', 40, y);
    y += 15;

    const summaryStartX = 40;
    const summaryWidth = 515;

    // Header
    doc.rect(summaryStartX, y, summaryWidth, 25).fill('#666666').stroke();
    doc.fillColor('white').text('DESCRIPTION', summaryStartX + 10, y + 8);
    doc.text('AMOUNT', 450, y + 8, { align: 'right', width: 100 });
    y += 25;

    // Rows
    const drawSummaryRow = (label: string, value: number, labelId: string = '') => {
        doc.rect(summaryStartX, y, summaryWidth, 20).stroke();
        doc.fillColor('black');
        if (labelId) doc.text(labelId, summaryStartX + 10, y + 5, { width: 30 });
        doc.text(label, summaryStartX + 50, y + 5);
        doc.text(value.toFixed(2), 450, y + 5, { align: 'right', width: 100 });
        y += 20;
    };

    if (totalLabour > 0) drawSummaryRow('TOTAL LABOUR / WORK ITEMS COST', totalLabour, 'A');
    if (totalMaterial > 0) drawSummaryRow('TOTAL MATERIAL COST', totalMaterial, 'B');

    // Grand Total (Before Discount)
    const subTotal = totalLabour + totalMaterial;

    // Discount
    let finalTotal = subTotal;
    if (quotation.discount_percentage > 0) {
        const discount = (subTotal * quotation.discount_percentage) / 100;
        drawSummaryRow(`Discount (${quotation.discount_percentage}%)`, -discount);
        finalTotal -= discount;
    }

    // Final Total
    doc.rect(summaryStartX, y, summaryWidth, 25).fill('#e0e0e0').stroke();
    doc.fillColor('black').font('Helvetica-Bold');
    doc.text('GRAND TOTAL', summaryStartX + 50, y + 8);
    doc.text(finalTotal.toFixed(2), 450, y + 8, { align: 'right', width: 100 });
    y += 35;

    // Note Section
    y += 30
    if (y > 720) { doc.addPage(); y = 50; }

    doc.font('Helvetica-Bold').text('NOTE:', 40, y)
    doc.font('Helvetica').fontSize(9)
    doc.text('1. GST will be charged extra as applicable.', 40, y + 15)
    doc.text('2. This quotation is valid for 15 days.', 40, y + 28)

    y += 45

    // Remarks
    if (quotation.remarks) {
        if (y + 40 > 750) { doc.addPage(); y = 50; }
        doc.font('Helvetica-Bold').text('REMARKS:', 40, y);
        y += 15;
        doc.font('Helvetica').fontSize(9).text(quotation.remarks, 40, y, { width: 515 });
        y += doc.heightOfString(quotation.remarks, { width: 515 }) + 10;
    }

    // --- Scopes ---

    // Helper to ensure numbering
    const ensureNumbering = (text: string): string => {
        if (!text) return '';
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length === 0) return '';

        // If first line already has numbering pattern "1.", return as is to avoid double numbering
        if (/^\d+\./.test(lines[0].trim())) {
            return text;
        }

        return lines.map((l, i) => {
            return `${i + 1}. ${l.trim()}`;
        }).join('\n');
    }

    // Client Scope
    if (quotation.client_scope) {
        const numberedScope = ensureNumbering(quotation.client_scope);
        doc.font('Helvetica-Bold').fontSize(10);
        const titleHeight = doc.heightOfString('CLIENT SCOPE (To be provided free of cost)', { width: 500 }) + 5
        const contentHeight = doc.heightOfString(numberedScope, { width: 500 }) + 20

        if (y + titleHeight + contentHeight > 750) { doc.addPage(); y = 50; } else { y += 20; }

        doc.text('CLIENT SCOPE (To be provided free of cost)', 40, y, { underline: true })
        y += titleHeight
        doc.font('Helvetica').fontSize(9).text(numberedScope, 40, y, { width: 500 })
        y += contentHeight
    }

    // Contractor Scope
    if (quotation.contractor_scope) {
        const numberedScope = ensureNumbering(quotation.contractor_scope);
        doc.font('Helvetica-Bold').fontSize(10);
        const titleHeight = doc.heightOfString('VHSHRI SCOPE', { width: 500 }) + 5
        const contentHeight = doc.heightOfString(numberedScope, { width: 500 }) + 20

        if (y + titleHeight + contentHeight > 750) { doc.addPage(); y = 50; } else { y += 20; }

        doc.text('VHSHRI SCOPE', 40, y, { underline: true })
        y += titleHeight
        doc.font('Helvetica').fontSize(9).text(numberedScope, 40, y, { width: 500, align: 'left' })
        y += contentHeight
    }

    // --- Annexure (Terms) ---
    // --- Annexures (Payment, Terms, etc) ---

    // Constants for alphabetic numbering
    const getAlphaLabel = (index: number) => String.fromCharCode(97 + index); // 0 -> a, 1 -> b

    const renderAnnexureSection = (title: string, content: string | null, startAlpha: boolean = false) => {
        if (!content) return;

        // Split content into lines for processing
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        if (lines.length === 0) return;

        // Space check
        const titleHeight = 30;
        if (y + titleHeight + 50 > 750) {
            doc.addPage();
            y = 50;
        } else {
            y += 30;
        }

        // Title
        doc.font('Helvetica-Bold').fontSize(11).text(title, 40, y, { underline: true });
        y += 20;

        doc.font('Helvetica').fontSize(10);

        lines.forEach((line: string, index: number) => {
            // Remove existing bullets/numbers if we are re-numbering
            const cleanLine = line.replace(/^[\d+.-]+\s*/, '').replace(/^[a-z]\s*[.)]\s*/i, '').trim();

            const label = startAlpha ? getAlphaLabel(index) : `${index + 1}.`;
            // Calculate height
            const height = doc.heightOfString(cleanLine, { width: 480 });

            if (y + height > 750) {
                doc.addPage();
                y = 50;
            }

            // Draw label and text
            doc.text(label, 40, y);
            doc.text(cleanLine, 75, y, { width: 480 }); // Indent text

            y += height + 8; // Spacing between items
        });
    };

    // 1. Terms & Conditions -> Annexure I
    renderAnnexureSection('ANNEXURE I - Terms & Conditions', quotation.terms_conditions, false);

    // 2. Payment Terms -> Annexure II
    renderAnnexureSection('ANNEXURE II - Payment terms', quotation.payment_terms, true); // true for alphabetic numbering (a, b, c...)

    // 3. Fallback/Extra Annexure from the old object if different
    // If the 'annexure' object has clauses that are NOT just a duplicate of the above (which were copied to quote fields), 
    // we might want to check. But since we copied text to quotation fields, we likely rely on those.
    // However, if there are *extra* clauses in the annexure object... let's ignore for now to avoid duplication,
    // assuming quotation.terms_conditions holds the source of truth for this quote.

    // --- Footer ---
    doc.fontSize(10).text('Thank you for your business!', 50, 780, { align: 'center', width: 500 })

    doc.end()
}

export const generateWorkOrderPDF = (workOrder: any, stream: any) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })

    doc.pipe(stream)

    // --- Header ---
    const companyName = 'VH SHRI ENTERPRISE'
    const companyAddress = 'B-104, Rajhans Bonista,\nB/H Ramchowk, Ghod Dod Road,\nSurat-395007'
    const companyContact = 'Contact: 0261-2666515, 2656515\nEmail: vhshrienterprise@gmail.com'

    const logoPath = path.join(process.cwd(), 'uploads/logo.png')
    let contentStartY = 160

    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 220 })
    } else {
        doc.fontSize(20).font('Helvetica-Bold').text(companyName, 40, 40)
    }

    doc.fontSize(10).font('Helvetica')
    doc.text(companyAddress, 300, 40, { align: 'right', width: 250 })
    doc.text(companyContact, 300, 85, { align: 'right', width: 250 })

    doc.moveTo(40, 135).lineTo(550, 135).stroke()

    // --- Info Block ---
    const startY = contentStartY
    const leftX = 40
    const rightX = 350

    doc.fontSize(10).font('Helvetica-Bold')

    // Left Column
    doc.text('WO No.:', leftX, startY).font('Helvetica').text(` ${workOrder.work_order_number}`, leftX + 50, startY)
    doc.font('Helvetica-Bold').text('Date:', leftX, startY + 15).font('Helvetica').text(` ${new Date(workOrder.created_at).toLocaleDateString('en-GB')}`, leftX + 35, startY + 15)

    // Right Column
    doc.font('Helvetica-Bold').text('To:', rightX, startY)

    // Check if Vendor or Internal
    if (workOrder.vendor) {
        doc.font('Helvetica').text(workOrder.vendor.name, rightX + 25, startY)
        if (workOrder.vendor.address) {
            doc.text(workOrder.vendor.address, rightX + 25, startY + 15, { width: 200 })
        }
    } else {
        doc.font('Helvetica').text('Internal Execution Team', rightX + 25, startY)
    }

    doc.moveDown(2)

    // Subject
    const currentY = doc.y + 20
    doc.font('Helvetica-Bold').text('Subject:', leftX, currentY)
    doc.font('Helvetica').text(` Work Order for Project: ${workOrder.project?.name || '-'}`, leftX + 45, currentY)

    const items = workOrder.items || []

    let y = currentY + 30;

    // Helper to draw cell
    const drawCellText = (text: string, cellX: number, y: number, width: number, align: string = 'left') => {
        const padding = 4;
        const effectiveWidth = width - (padding * 2);
        doc.text(text, cellX + padding, y, { width: effectiveWidth, align: align as any })
    }

    // Helper to draw lines
    const drawVerticalLines = (topY: number, bottomY: number) => {
        const lines = [40, 70, 270, 315, 370, 455, 555]
        lines.forEach(lineX => {
            doc.moveTo(lineX, topY).lineTo(lineX, bottomY).stroke()
        })
    }

    const colX = { sn: 40, desc: 70, unit: 270, quantity: 315, rate: 370, amount: 455 };
    const colWidths = { sn: 30, desc: 200, unit: 45, quantity: 55, rate: 85, amount: 100 }

    const drawTableHeader = (title: string, topY: number) => {
        doc.rect(40, topY, 515, 20).fill('#444444').stroke();
        doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
        doc.text(title.toUpperCase(), 40, topY + 5, { align: 'center', width: 515 });

        const headerY = topY + 20;
        doc.rect(40, headerY, 515, 25).fill('#e0e0e0').stroke();
        doc.fillColor('black').font('Helvetica-Bold').fontSize(9);

        drawCellText('S.No', colX.sn, headerY + 8, colWidths.sn, 'center');
        drawCellText('Description', colX.desc, headerY + 8, colWidths.desc, 'left');
        drawCellText('Unit', colX.unit, headerY + 8, colWidths.unit, 'center');
        drawCellText('Qty', colX.quantity, headerY + 8, colWidths.quantity, 'center');
        drawCellText('Rate', colX.rate, headerY + 8, colWidths.rate, 'right');
        drawCellText('Amount', colX.amount, headerY + 8, colWidths.amount, 'right');

        doc.strokeColor('black')
        drawVerticalLines(headerY, headerY + 25)

        return headerY + 25;
    };

    // Helper function to render rows with section total
    const renderTableRows = (rows: any[], startY: number, startIndex: number = 0) => {
        let currentY = startY;
        doc.font('Helvetica').fontSize(9);
        let sectionTotal = 0;

        rows.forEach((item, idx) => {
            const descWidth = colWidths.desc - 8;
            const descHeight = doc.heightOfString(item.description || '-', { width: descWidth });
            const rowHeight = Math.max(descHeight, 20) + 10;

            if (currentY + rowHeight > 750) {
                doc.moveTo(40, currentY).lineTo(550, currentY).stroke()
                doc.addPage();
                currentY = 50;
                doc.moveTo(40, currentY).lineTo(550, currentY).stroke()
            }

            doc.fillColor('black');
            drawCellText(`${startIndex + idx + 1}`, colX.sn, currentY + 5, colWidths.sn, 'center');
            drawCellText(item.description || '-', colX.desc, currentY + 5, colWidths.desc, 'left');
            drawCellText(item.unit || '-', colX.unit, currentY + 5, colWidths.unit, 'center');
            drawCellText(Number(item.quantity).toFixed(2), colX.quantity, currentY + 5, colWidths.quantity, 'center');
            drawCellText(Number(item.rate).toFixed(2), colX.rate, currentY + 5, colWidths.rate, 'right');
            drawCellText(Number(item.amount).toFixed(2), colX.amount, currentY + 5, colWidths.amount, 'right');

            doc.rect(40, currentY, 515, rowHeight).stroke();
            drawVerticalLines(currentY, currentY + rowHeight)
            currentY += rowHeight;
            sectionTotal += Number(item.amount);
        });

        // Section Total Row
        doc.font('Helvetica-Bold');
        doc.text('Total', 350, currentY + 5, { align: 'right', width: 90 });
        drawCellText(sectionTotal.toFixed(2), colX.amount, currentY + 5, colWidths.amount, 'right');
        doc.rect(40, currentY, 515, 20).stroke();
        doc.moveTo(455, currentY).lineTo(455, currentY + 20).stroke()

        return { nextY: currentY + 25, total: sectionTotal };
    };

    // Group items by category - materials vs labour/work
    const materialItems = items.filter((i: any) => i.category === 'material');
    const labourItems = items.filter((i: any) => i.category !== 'material');

    let totalLabour = 0;
    let totalMaterial = 0;
    let itemIndex = 0;

    // 1. Labour / Works Table
    if (labourItems.length > 0) {
        if (y + 60 > 750) { doc.addPage(); y = 50; }
        y = drawTableHeader('Labour / Work Items Cost', y);
        const res = renderTableRows(labourItems, y, itemIndex);
        y = res.nextY;
        totalLabour = res.total;
        itemIndex += labourItems.length;
    }

    // 2. Material Table
    if (materialItems.length > 0) {
        if (y + 60 > 750) { doc.addPage(); y = 50; }
        y = drawTableHeader('Material Cost', y);
        const res = renderTableRows(materialItems, y, itemIndex);
        y = res.nextY;
        totalMaterial = res.total;
    }

    // --- Summary Section ---
    if (y + 150 > 750) { doc.addPage(); y = 50; }
    y += 10;

    doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
    doc.text('SUMMARY OF COSTS', 40, y);
    y += 20;

    const summaryStartX = 340;
    const summaryWidth = 215;

    // Header
    doc.rect(summaryStartX, y, summaryWidth, 20).fill('#666666').stroke();
    doc.fillColor('white').text('DESCRIPTION', summaryStartX + 10, y + 6, { width: 120 });
    doc.text('AMOUNT', 450, y + 6, { align: 'right', width: 100 });
    y += 20;

    // Helper to draw summary row
    const drawSummaryRow = (label: string, value: number, labelId: string = '') => {
        doc.rect(summaryStartX, y, summaryWidth, 20).stroke();
        doc.fillColor('black').font('Helvetica').fontSize(9);
        if (labelId) doc.text(labelId, summaryStartX + 5, y + 6, { width: 15 });
        doc.text(label, summaryStartX + 25, y + 6, { width: 120 });
        doc.text(value.toFixed(2), 450, y + 6, { align: 'right', width: 100 });
        y += 20;
    };

    if (totalLabour > 0) drawSummaryRow('LABOUR / WORK ITEMS COST', totalLabour, 'A');
    if (totalMaterial > 0) drawSummaryRow('MATERIAL COST', totalMaterial, 'B');

    const subTotal = totalLabour + totalMaterial;

    // Discount
    let finalTotal = subTotal;
    if (workOrder.discount_percentage > 0) {
        const discount = (subTotal * workOrder.discount_percentage) / 100;
        drawSummaryRow(`Discount (${workOrder.discount_percentage}%)`, -discount);
        finalTotal -= discount;
    }

    // Grand Total
    doc.rect(summaryStartX, y, summaryWidth, 25).fill('#e0e0e0').stroke();
    doc.fillColor('black').font('Helvetica-Bold').fontSize(11);
    doc.text('GRAND TOTAL', summaryStartX + 25, y + 8, { width: 120 });
    doc.text(`Rs. ${finalTotal.toFixed(2)}`, 450, y + 8, { align: 'right', width: 100 });

    y += 40;

    // --- Scopes & Terms ---
    const ensureNumbering = (text: string): string => {
        if (!text) return '';
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length === 0) return '';
        if (/^\d+\./.test(lines[0].trim())) return text;
        return lines.map((l, i) => `${i + 1}. ${l.trim()}`).join('\n');
    }

    const sections = [
        { title: 'CLIENT SCOPE', content: workOrder.client_scope },
        { title: 'VHSHRI SCOPE', content: workOrder.contractor_scope },
        { title: 'PAYMENT TERMS', content: workOrder.payment_terms },
        { title: 'TERMS & CONDITIONS', content: workOrder.terms_conditions },
        { title: 'REMARKS', content: workOrder.remarks }
    ];

    sections.forEach(sec => {
        if (sec.content) {
            const numbered = ensureNumbering(sec.content);
            const titleHeight = 20;
            const contentHeight = doc.heightOfString(numbered, { width: 500 }) + 10;

            if (y + titleHeight + contentHeight > 750) { doc.addPage(); y = 50; }

            doc.font('Helvetica-Bold').fontSize(10).text(sec.title, 40, y, { underline: true });
            y += titleHeight;
            doc.font('Helvetica').fontSize(9).text(numbered, 40, y, { width: 500 });
            y += contentHeight + 10;
        }
    });

    // --- Signatures ---
    if (y + 100 > 750) { doc.addPage(); y = 50; }
    y += 60;

    doc.text('Authorized Signatory', 40, y, { align: 'center', width: 200 });
    doc.text('Accepted By', 350, y, { align: 'center', width: 200 });
    doc.fontSize(8).text('VH SHRI ENTERPRISE', 40, y + 15, { align: 'center', width: 200 });
    doc.text(workOrder.vendor ? workOrder.vendor.name : 'Internal Team', 350, y + 15, { align: 'center', width: 200 });

    doc.end()


}

export const generatePurchaseOrderPDF = (po: any, stream: any) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })

    doc.pipe(stream)

    // --- Header ---
    const companyName = 'VH SHRI ENTERPRISE'
    const companyAddress = 'B-104, Rajhans Bonista,\nB/H Ramchowk, Ghod Dod Road,\nSurat-395007'
    const companyContact = 'Contact: 0261-2666515, 2656515\nEmail: vhshrienterprise@gmail.com'
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
            drawCellText(`${idx + 1}`, colX.sn, currentY + 5, colWidths.sn, 'center');
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
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, 450, y + 8, { align: 'right', width: 95 });

    y += 40;

    // --- Terms ---
    doc.font('Helvetica-Bold').fontSize(10).text('Terms & Conditions:', 40, y, { underline: true });
    y += 15;
    doc.font('Helvetica').fontSize(9);

    if (po.annexure) {
        if (po.annexure.payment_terms) { doc.text(`Payment Terms: ${po.annexure.payment_terms}`, 40, y); y += 15; }
        if (po.annexure.delivery_terms) { doc.text(`Delivery Terms: ${po.annexure.delivery_terms}`, 40, y); y += 15; }
    } else if (po.payment_terms) {
        doc.text(`Payment Terms: ${po.payment_terms}`, 40, y); y += 15;
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

export const generateDPRPDF = (dpr: any, stream: any) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })

    doc.pipe(stream)

    // --- Header (Shared Brand) ---
    const companyName = 'VH SHRI ENTERPRISE'
    const companyAddress = 'B-104, Rajhans Bonista,\nB/H Ramchowk, Ghod Dod Road,\nSurat-395007'
    const companyContact = 'Contact: 0261-2666515, 2656515\nEmail: vhshrienterprise@gmail.com'

    const logoPath = path.join(process.cwd(), 'uploads/logo.png')
    let contentStartY = 160

    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 220 })
    } else {
        doc.fontSize(20).font('Helvetica-Bold').text(companyName, 40, 40)
    }

    doc.fontSize(10).font('Helvetica')
    doc.text(companyAddress, 300, 40, { align: 'right', width: 250 })
    doc.text(companyContact, 300, 85, { align: 'right', width: 250 })

    doc.moveTo(40, 135).lineTo(550, 135).stroke()

    // --- Report Metadata ---
    const startY = contentStartY
    doc.fontSize(12).font('Helvetica-Bold').text('DAILY PROGRESS REPORT', 40, startY, { align: 'center', width: 515 })

    doc.fontSize(10).font('Helvetica-Bold')
    doc.text('Report No:', 40, startY + 25).font('Helvetica').text(` ${dpr.transaction_number}`, 100, startY + 25)
    doc.font('Helvetica-Bold').text('Date:', 40, startY + 40).font('Helvetica').text(` ${new Date(dpr.transaction_date).toLocaleDateString('en-GB')}`, 100, startY + 40)

    doc.font('Helvetica-Bold').text('Project:', 300, startY + 25).font('Helvetica').text(` ${dpr.project?.name || '-'}`, 350, startY + 25, { width: 200 })
    doc.font('Helvetica-Bold').text('Location:', 300, startY + 45).font('Helvetica').text(` ${[dpr.toBuilding?.name, dpr.toFloor?.name, dpr.toZone?.name].filter(Boolean).join(' > ') || 'Site Wide'}`, 350, startY + 45, { width: 200 })

    // --- 1. Materials & Progress Table ---
    let y = startY + 80

    const colX = { sn: 40, desc: 70, unit: 230, qty: 280, achievement: 340, wastage: 420, eff: 480 }
    const colWidths = { sn: 30, desc: 160, unit: 50, qty: 60, achievement: 80, wastage: 60, eff: 75 }

    const drawTableHeader = (title, topY) => {
        doc.rect(40, topY, 515, 20).fill('#444444').stroke()
        doc.fillColor('white').font('Helvetica-Bold').fontSize(10)
        doc.text(title.toUpperCase(), 40, topY + 5, { align: 'center', width: 515 })

        const headerY = topY + 20
        doc.rect(40, headerY, 515, 25).fill('#e0e0e0').stroke()
        doc.fillColor('black').font('Helvetica-Bold').fontSize(8)

        doc.text('S.N', colX.sn + 5, headerY + 8)
        doc.text('Activity / Material', colX.desc + 5, headerY + 8)
        doc.text('Unit', colX.unit + 5, headerY + 8)
        doc.text('Consumed', colX.qty + 5, headerY + 8)
        doc.text('Work Done', colX.achievement + 5, headerY + 8)
        doc.text('Wastage', colX.wastage + 5, headerY + 8)
        doc.text('Efficiency', colX.eff + 5, headerY + 8)

        return headerY + 25
    }

    y = drawTableHeader('Materials Achievement & Consumption', y)

    doc.font('Helvetica').fontSize(9)
    const items = dpr.items || []
    items.forEach((item, idx) => {
        const rowHeight = 25
        if (y + rowHeight > 750) { doc.addPage(); y = 50 }

        doc.rect(40, y, 515, rowHeight).stroke()
        doc.text(`${idx + 1}`, colX.sn + 5, y + 8)
        doc.text(item.material?.name || '-', colX.desc + 5, y + 8, { width: 150 })
        doc.text(item.unit || item.material?.uom || '-', colX.unit + 5, y + 8)
        doc.text(Number(item.quantity).toFixed(2), colX.qty + 5, y + 8)
        doc.text(Number(item.work_done_quantity).toFixed(2), colX.achievement + 5, y + 8)
        doc.text(Number(item.wastage_quantity).toFixed(2), colX.wastage + 5, y + 8)

        // Efficiency Calc
        const stdRate = item.material?.standard_rate
        let effStr = '-'
        if (stdRate && item.work_done_quantity > 0) {
            const actualRate = item.quantity / item.work_done_quantity
            effStr = `${Math.round((stdRate / actualRate) * 100)}%`
        }
        doc.text(effStr, colX.eff + 5, y + 8)

        y += rowHeight
    })

    // --- 2. Manpower Section ---
    y += 20
    if (y + 100 > 750) { doc.addPage(); y = 50 }

    doc.rect(40, y, 515, 20).fill('#444444').stroke()
    doc.fillColor('white').font('Helvetica-Bold').fontSize(10)
    doc.text('MANPOWER DEPLOYMENT (LABOR HAJRI)', 40, y + 5, { align: 'center', width: 515 })
    y += 20

    const mpData = dpr.manpower_data ? (typeof dpr.manpower_data === 'string' ? JSON.parse(dpr.manpower_data) : dpr.manpower_data) : []

    doc.fillColor('black').font('Helvetica-Bold').fontSize(9)
    doc.rect(40, y, 515, 20).fill('#e0e0e0').stroke()
    doc.text('Worker Category', 45, y + 5)
    doc.text('Count', 250, y + 5)
    doc.text('Attendance (Hajri)', 350, y + 5)
    doc.text('Total Mandays', 470, y + 5)
    y += 20

    doc.font('Helvetica').fontSize(9)
    mpData.forEach((mp: any) => {
        const rowHeight = 20
        if (y + rowHeight > 750) { doc.addPage(); y = 50 }
        doc.fillColor('black')
        doc.rect(40, y, 515, rowHeight).stroke()
        doc.text(mp.worker_type || '-', 45, y + 5)
        doc.text(mp.count ? mp.count.toString() : '0', 250, y + 5)
        doc.text(mp.hajri ? mp.hajri.toString() : '0', 350, y + 5)
        doc.text((Number(mp.count || 0) * Number(mp.hajri || 0)).toFixed(1), 470, y + 5)
        y += rowHeight
    })

    // --- 3. Site Conditions & Remarks ---
    y += 20
    if (y + 100 > 750) { doc.addPage(); y = 50 }

    doc.font('Helvetica-Bold').text('SITE CONDITIONS:', 40, y)
    doc.font('Helvetica').text(`Weather: ${dpr.weather_condition || 'Clear'} | Work Hours: ${dpr.work_hours || '8'} | Temp: ${dpr.temperature || '-'}°C`, 40, y + 15)

    y += 40
    doc.fillColor('black').font('Helvetica-Bold').text('SITE REMARKS:', 40, y)
    doc.font('Helvetica').text(dpr.remarks || 'Proceeding as per schedule.', 40, y + 15, { width: 515 })

    y += doc.heightOfString(dpr.remarks || 'Proceeding as per schedule.', { width: 515 }) + 30

    // --- 4. Progress Photos ---
    const photos = dpr.progress_photos ? (typeof dpr.progress_photos === 'string' ? JSON.parse(dpr.progress_photos) : dpr.progress_photos) : []

    if (photos.length > 0) {
        if (y + 150 > 750) { doc.addPage(); y = 50 }
        doc.font('Helvetica-Bold').fontSize(10).text('SITE PROGRESS PHOTOGRAPHS:', 40, y)
        y += 20

        let photoX = 40
        const photoWidth = 240
        const photoHeight = 160

        photos.forEach((photo: any, index: number) => {
            if (!photo) return
            let photoUrl = typeof photo === 'string' ? photo : (photo.url || photo.response?.url)
            if (!photoUrl) return

            // Resolve local path
            if (photoUrl.startsWith('http')) {
                photoUrl = photoUrl.split('localhost:5000/')[1] || photoUrl
            }

            const absolutePath = path.join(process.cwd(), photoUrl)

            if (fs.existsSync(absolutePath)) {
                if (y + photoHeight > 750) { doc.addPage(); y = 50 }

                try {
                    doc.image(absolutePath, photoX, y, { width: photoWidth, height: photoHeight })
                    doc.rect(photoX, y, photoWidth, photoHeight).stroke() // Border
                } catch (e) {
                    console.error('Failed to embed image in PDF', absolutePath, e)
                }

                if (index % 2 === 0 && index < photos.length - 1) {
                    photoX = 300 // Move to right col
                } else {
                    photoX = 40 // Back to left col
                    y += photoHeight + 15 // Move to next row
                }
            }
        })
    }

    // --- Footer ---
    doc.fillColor('black').font('Helvetica').fontSize(9)
    doc.text('Authorized By Site Engineer', 40, 750, { align: 'left', width: 200 })
    doc.text('Project Manager Approval', 350, 750, { align: 'right', width: 200 })

    doc.end()
}
