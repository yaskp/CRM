import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'

export const generateQuotationPDF = (quotation: any, stream: any) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })

    doc.pipe(stream)

    // --- Header ---
    const companyName = 'VH SHRI ENTERPRISE'
    const companyAddress = 'B-701, Rajhans Bonista,\nB/H Ramchowk, Ghod Dod Road,\nSurat-395007'
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

    // Construct full address
    const addressParts: string[] = []
    if (quotation.lead?.address) addressParts.push(quotation.lead.address)

    const cityStateParts: string[] = []
    if (quotation.lead?.city) cityStateParts.push(quotation.lead.city)
    if (quotation.lead?.state) cityStateParts.push(quotation.lead.state)

    if (cityStateParts.length > 0) {
        let cityStateStr = cityStateParts.join(', ')
        if (quotation.lead?.pincode) cityStateStr += ` - ${quotation.lead.pincode}`
        addressParts.push(cityStateStr)
    }

    if (addressParts.length > 0) {
        doc.text(addressParts.join('\n'), rightX + 25, startY + 15, { width: 200 })
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
        drawCellText('Rate (Rs.)', colX.rate, headerY + 8, colWidths.rate, 'right');
        drawCellText('Amount (Rs.)', colX.amount, headerY + 8, colWidths.amount, 'right');

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
            const workTypeText = (item.item_type !== 'material')
                ? `${item.parentWorkItemType?.name || ''}${item.workItemType?.name ? ` > ${item.workItemType.name}` : ''}`
                : '';

            const displayDesc = workTypeText.trim()
                ? `${workTypeText.trim()}\n${item.description}`
                : item.description;

            const descWidth = colWidths.desc - 8;
            const descHeight = doc.heightOfString(displayDesc, { width: descWidth });
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
            drawCellText(displayDesc, colX.desc, currentY + 5, colWidths.desc, 'left');

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
        doc.text('Total', 40, currentY + 6, { align: 'right', width: 410 });
        drawCellText(sectionTotal.toFixed(2), colX.amount, currentY + 6, colWidths.amount, 'right');
        doc.rect(40, currentY, 515, 20).stroke();

        // Vertical lines for Total Row
        doc.moveTo(455, currentY).lineTo(455, currentY + 20).stroke() // Matches colX.amount

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

    // Layout constants for summary
    const summaryAmountX = 455;
    const summaryAmountWidth = 95;

    // Header
    doc.rect(summaryStartX, y, summaryWidth, 25).fill('#666666').stroke();
    doc.fillColor('white').text('DESCRIPTION', summaryStartX + 10, y + 8);
    doc.text('AMOUNT', summaryAmountX, y + 8, { align: 'right', width: summaryAmountWidth - 5 });
    y += 25;

    // Rows
    const drawSummaryRow = (label: string, value: number, labelId: string = '') => {
        doc.rect(summaryStartX, y, summaryWidth, 20).stroke();
        doc.fillColor('black');
        if (labelId) doc.text(labelId, summaryStartX + 10, y + 5, { width: 30 });
        doc.text(label, summaryStartX + 50, y + 5);
        doc.text(value.toFixed(2), summaryAmountX, y + 5, { align: 'right', width: summaryAmountWidth - 5 });
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
    doc.text('GRAND TOTAL (Excl. GST)', summaryStartX + 50, y + 8);
    doc.text(finalTotal.toFixed(2), summaryAmountX, y + 8, { align: 'right', width: summaryAmountWidth - 5 });
    y += 28;
    doc.fontSize(8).font('Helvetica-Bold').text('* GST / Taxes extra as applicable', summaryStartX, y, { align: 'right', width: summaryWidth - 10 });
    y += 15;

    // Note Section
    y += 30
    if (y > 720) { doc.addPage(); y = 50; }

    doc.font('Helvetica-Bold').text('NOTE:', 40, y)
    doc.font('Helvetica-Bold').fontSize(10)
    doc.text('1. GST will be charged extra as applicable.', 40, y + 15)
    doc.font('Helvetica').fontSize(9)
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
    // --- Scopes ---
    const drawScopeSection = (title: string, scopeMatrix: any[], filterFn: (item: any) => boolean, bgColor: string) => {
        // Prepare filtered list keeping categories
        const sectionItems: any[] = [];
        let currentHeader: any = null;
        let lastHeaderAdded = false;

        scopeMatrix.forEach((item) => {
            if (item.is_category) {
                currentHeader = item;
                lastHeaderAdded = false;
            } else if (filterFn(item)) {
                if (currentHeader && !lastHeaderAdded) {
                    sectionItems.push({ ...currentHeader, is_header: true });
                    lastHeaderAdded = true;
                }
                sectionItems.push(item);
            }
        });

        if (sectionItems.length === 0) return y;

        if (y + 40 > 750) { doc.addPage(); y = 50; } else { y += 15; }

        // Section Title
        doc.rect(40, y, 515, 18).fill(bgColor).stroke();
        doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
        doc.text(title, 40, y + 5, { align: 'center', width: 515 });
        y += 18;

        doc.fillColor('black').font('Helvetica').fontSize(8);
        sectionItems.forEach((item: any) => {
            const descWidth = 490;
            const descHeight = doc.heightOfString(item.description || '', { width: descWidth });
            const rowHeight = descHeight + 6;

            if (y + rowHeight > 750) {
                doc.addPage();
                y = 50;
            }

            if (item.is_header) {
                doc.font('Helvetica-Bold').fontSize(8.5);
                y += 5;
                doc.text(item.description.toUpperCase(), 45, y, { width: descWidth });
                y += 12;
                doc.font('Helvetica').fontSize(8);
            } else {
                doc.text('•', 45, y + 2);
                doc.text(item.description, 60, y + 2, { width: descWidth - 15 });
                y += rowHeight;
            }
        });

        return y;
    };

    const drawScopeMatrix = (scopeMatrix: any[]) => {
        if (!scopeMatrix || scopeMatrix.length === 0) return y;

        // Draw Client Section
        y = drawScopeSection("CLIENT'S SCOPE OF WORK / RESPONSIBILITIES", scopeMatrix, (it) => !!it.client_scope, '#444444');

        // Draw VHSHRI Section
        y = drawScopeSection("CONTRACTOR'S (VHSHRI) SCOPE OF WORK / RESPONSIBILITIES", scopeMatrix, (it) => !!it.contractor_scope, '#0d9488');

        return y + 20;
    };

    if (quotation.scope_matrix && Array.isArray(quotation.scope_matrix) && quotation.scope_matrix.length > 0) {
        y = drawScopeMatrix(quotation.scope_matrix);
    } else {
        // Fallback for old scope text
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

    // ─── TITLE BLOCK (No company branding — printed on client's letterhead) ───
    // Large centered title at the top
    const CONTENT_START_Y = 160 // Increased start Y for client letterhead
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a2e')
    doc.text('WORK ORDER', 40, CONTENT_START_Y, { align: 'center', width: 515 })

    // Horizontal divider
    doc.moveTo(40, CONTENT_START_Y + 25).lineTo(550, CONTENT_START_Y + 25).lineWidth(1.5).stroke('#1a1a2e')

    // ─── WO INFO GRID ───
    let y = CONTENT_START_Y + 40
    const leftX = 40
    const rightX = 320

    doc.fontSize(9).font('Helvetica').fillColor('black')

    // Left column
    doc.font('Helvetica-Bold').text('Work Order No.:', leftX, y)
    doc.font('Helvetica').text(workOrder.work_order_number, leftX + 95, y)

    doc.font('Helvetica-Bold').text('Date:', leftX, y + 14)
    doc.font('Helvetica').text(new Date(workOrder.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), leftX + 95, y + 14)

    doc.font('Helvetica-Bold').text('Status:', leftX, y + 28)
    doc.font('Helvetica').text((workOrder.status || 'draft').toUpperCase(), leftX + 95, y + 28)

    // Right column — client/project
    const project = workOrder.project
    const client = project?.client

    doc.font('Helvetica-Bold').text('Project:', rightX, y)
    doc.font('Helvetica').text(project?.name || '-', rightX + 55, y, { width: 200 })

    doc.font('Helvetica-Bold').text('Project Code:', rightX, y + 14)
    doc.font('Helvetica').text(project?.project_code || '-', rightX + 75, y + 14)

    if (client) {
        doc.font('Helvetica-Bold').text('Client:', rightX, y + 28)
        doc.font('Helvetica').text(client.company_name || '-', rightX + 55, y + 28)
    }

    // Vendor / Team
    doc.font('Helvetica-Bold').text('To:', leftX, y + 42)
    if (workOrder.vendor) {
        doc.font('Helvetica').text(workOrder.vendor.name, leftX + 95, y + 42)
        const addrParts: string[] = []
        if (workOrder.vendor.address) addrParts.push(workOrder.vendor.address)
        const cityState = [workOrder.vendor.city, workOrder.vendor.state].filter(Boolean).join(', ')
        if (cityState) addrParts.push(cityState)
        if (addrParts.length > 0) doc.font('Helvetica').text(addrParts.join(', '), leftX + 95, y + 54, { width: 220 })
    } else {
        doc.font('Helvetica').text('VH SHRI Enterprise', leftX + 95, y + 42)
    }

    y += 70
    doc.moveTo(40, y).lineTo(550, y).lineWidth(0.5).stroke('#cccccc')
    y += 10

    // Subject
    doc.font('Helvetica-Bold').fontSize(10).text('Subject:', leftX, y)
    doc.font('Helvetica').text(` Work Order for Project: ${project?.name || '-'}`, leftX + 50, y)
    y += 22

    // ─── ITEMS TABLE ───
    const items = workOrder.items || []

    const drawCellText = (text: string, cellX: number, cy: number, width: number, align: string = 'left') => {
        const padding = 4
        doc.text(text, cellX + padding, cy, { width: width - padding * 2, align: align as any })
    }

    const cols = { sn: 40, desc: 70, unit: 270, qty: 315, rate: 370, amount: 455 }
    const colW = { sn: 30, desc: 200, unit: 45, qty: 55, rate: 85, amount: 100 }

    const drawVLines = (topY: number, btmY: number) => {
        [40, 70, 270, 315, 370, 455, 555].forEach(lx => {
            doc.moveTo(lx, topY).lineTo(lx, btmY).stroke()
        })
    }

    const drawTableHeader = (title: string, topY: number) => {
        doc.rect(40, topY, 515, 20).fill('#2d3748').stroke()
        doc.fillColor('white').font('Helvetica-Bold').fontSize(9)
        doc.text(title.toUpperCase(), 40, topY + 6, { align: 'center', width: 515 })
        const hY = topY + 20
        doc.rect(40, hY, 515, 22).fill('#edf2f7').stroke()
        doc.fillColor('#1a1a2e').font('Helvetica-Bold').fontSize(8.5)
        drawCellText('S.No', cols.sn, hY + 7, colW.sn, 'center')
        drawCellText('Description of Work', cols.desc, hY + 7, colW.desc, 'left')
        drawCellText('Unit', cols.unit, hY + 7, colW.unit, 'center')
        drawCellText('Qty', cols.qty, hY + 7, colW.qty, 'center')
        drawCellText('Rate (Rs.)', cols.rate, hY + 7, colW.rate, 'right')
        drawCellText('Amount (Rs.)', cols.amount, hY + 7, colW.amount, 'right')
        doc.strokeColor('#000000').lineWidth(0.5)
        drawVLines(hY, hY + 22)
        return hY + 22
    }

    const renderRows = (rows: any[], startY: number, startIdx: number = 0) => {
        let cy = startY, total = 0
        doc.font('Helvetica').fontSize(8.5).fillColor('black')
        rows.forEach((item: any, idx: number) => {
            const dh = doc.heightOfString(item.description || '-', { width: colW.desc - 8 })
            const rh = Math.max(dh, 18) + 8
            if (cy + rh > 750) { doc.moveTo(40, cy).lineTo(550, cy).stroke(); doc.addPage(); cy = 50 }
            doc.fillColor('black')
            drawCellText(`${startIdx + idx + 1}`, cols.sn, cy + 4, colW.sn, 'center')
            drawCellText(item.description || '-', cols.desc, cy + 4, colW.desc, 'left')
            drawCellText(item.unit || '-', cols.unit, cy + 4, colW.unit, 'center')
            drawCellText(Number(item.quantity).toFixed(2), cols.qty, cy + 4, colW.qty, 'center')
            drawCellText(Number(item.rate).toFixed(2), cols.rate, cy + 4, colW.rate, 'right')
            drawCellText(Number(item.amount).toFixed(2), cols.amount, cy + 4, colW.amount, 'right')
            doc.rect(40, cy, 515, rh).stroke()
            drawVLines(cy, cy + rh)
            cy += rh
            total += Number(item.amount)
        })
        // Row total
        doc.font('Helvetica-Bold').fontSize(8.5)
        doc.text('Sub Total', 350, cy + 4, { align: 'right', width: 95 })
        drawCellText(total.toFixed(2), cols.amount, cy + 4, colW.amount, 'right')
        doc.rect(40, cy, 515, 20).stroke()
        doc.moveTo(455, cy).lineTo(455, cy + 20).stroke()
        return { nextY: cy + 25, total }
    }

    const materialItems = items.filter((i: any) => i.category === 'material')
    const labourItems = items.filter((i: any) => i.category !== 'material')
    let totalLabour = 0, totalMaterial = 0, itemIndex = 0

    if (labourItems.length > 0) {
        if (y + 60 > 750) { doc.addPage(); y = 50 }
        y = drawTableHeader('Scope of Work', y)
        const r = renderRows(labourItems, y, itemIndex)
        y = r.nextY; totalLabour = r.total; itemIndex += labourItems.length
    }
    if (materialItems.length > 0) {
        if (y + 60 > 750) { doc.addPage(); y = 50 }
        y = drawTableHeader('Material Items', y)
        const r = renderRows(materialItems, y, itemIndex)
        y = r.nextY; totalMaterial = r.total
    }

    // ─── SUMMARY ───
    if (y + 80 > 750) { doc.addPage(); y = 50 }
    y += 8
    const sumX = 340, sumW = 215

    doc.rect(sumX, y, sumW, 20).fill('#2d3748').stroke()
    doc.fillColor('white').font('Helvetica-Bold').fontSize(8.5)
    doc.text('DESCRIPTION', sumX + 10, y + 6, { width: 115 })
    doc.text('AMOUNT (Rs.)', 450, y + 6, { align: 'right', width: 100 })
    y += 20

    const drawSR = (label: string, value: number, id: string = '') => {
        doc.rect(sumX, y, sumW, 18).stroke()
        doc.fillColor('black').font('Helvetica').fontSize(8.5)
        if (id) doc.text(id, sumX + 5, y + 4, { width: 15 })
        doc.text(label, sumX + 22, y + 4, { width: 120 })
        doc.text(value.toFixed(2), 450, y + 4, { align: 'right', width: 100 })
        y += 18
    }

    const subTotal = totalLabour + totalMaterial
    if (totalLabour > 0) drawSR('Labour / Work Cost', totalLabour, 'A')
    if (totalMaterial > 0) drawSR('Material Cost', totalMaterial, 'B')

    let finalTotal = subTotal
    if (workOrder.discount_percentage > 0) {
        const disc = (subTotal * workOrder.discount_percentage) / 100
        drawSR(`Discount (${workOrder.discount_percentage}%)`, -disc)
        finalTotal -= disc
    }

    doc.rect(sumX, y, sumW, 22).fill('#e2e8f0').stroke()
    doc.fillColor('#1a1a2e').font('Helvetica-Bold').fontSize(10)
    doc.text('GRAND TOTAL', sumX + 22, y + 6, { width: 120 })
    doc.text(`Rs. ${finalTotal.toFixed(2)}`, 450, y + 6, { align: 'right', width: 100 })
    y += 28

    doc.font('Helvetica').fontSize(7.5).fillColor('#666')
    doc.text('* All taxes / GST will be charged extra as applicable', 40, y)
    y += 15

    // ─── SECTIONS (Scope, Terms etc) ───
    const sections = [
        { title: 'CLIENT SCOPE OF WORK', content: workOrder.client_scope },
        { title: 'CONTRACTOR SCOPE OF WORK', content: workOrder.contractor_scope },
        { title: 'PAYMENT TERMS', content: workOrder.payment_terms },
        { title: 'TERMS & CONDITIONS', content: workOrder.terms_conditions },
        { title: 'REMARKS', content: workOrder.remarks }
    ]

    sections.forEach(sec => {
        if (!sec.content) return
        const lines = sec.content.split('\n').filter((l: string) => l.trim().length > 0)
        if (lines.length === 0) return
        const titleH = 18
        const contentH = doc.heightOfString(lines.map((l: string, i: number) => `${i + 1}. ${l.trim()}`).join('\n'), { width: 500 }) + 10
        if (y + titleH + contentH > 750) { doc.addPage(); y = 50 } else { y += 15 }
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a1a2e').text(sec.title, 40, y, { underline: true })
        y += titleH
        doc.font('Helvetica').fontSize(8.5).fillColor('black')
        lines.forEach((line: string, i: number) => {
            const text = `${i + 1}. ${line.trim()}`
            const lh = doc.heightOfString(text, { width: 500 })
            if (y + lh > 750) { doc.addPage(); y = 50 }
            doc.text(text, 40, y, { width: 500 })
            y += lh + 4
        })
    })

    // ─── SIGNATURE BLOCKS ───
    if (y + 100 > 750) { doc.addPage(); y = 50 }
    y += 50

    const sigBoxStyle = (sx: number, sy: number, label: string, name: string) => {
        doc.moveTo(sx, sy + 35).lineTo(sx + 180, sy + 35).stroke()
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a1a2e')
        doc.text(label, sx, sy + 40, { width: 180, align: 'center' })
        doc.font('Helvetica').fontSize(8).fillColor('#555')
        doc.text(name, sx, sy + 53, { width: 180, align: 'center' })
    }

    sigBoxStyle(40, y, 'Authorized Signatory (Client)', workOrder.project?.client?.company_name || 'Client')
    sigBoxStyle(340, y, 'Acknowledged & Accepted By', workOrder.vendor ? workOrder.vendor.name : 'VH SHRI Enterprise')

    doc.font('Helvetica').fontSize(7).fillColor('#888').text('Date: _______________', 40, y + 70)
    doc.text('Date: _______________', 340, y + 70)

    doc.end()
}

export const generatePurchaseOrderPDF = (po: any, stream: any) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })

    doc.pipe(stream)

    // --- Header ---
    const companyName = 'VH SHRI ENTERPRISE'
    const companyAddress = 'B-701, Rajhans Bonista,\nB/H Ramchowk, Ghod Dod Road,\nSurat-395007'
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
    const vendorAddressParts: string[] = []
    if (po.vendor?.address) vendorAddressParts.push(po.vendor.address)

    const vendorCityStateParts: string[] = []
    if (po.vendor?.city) vendorCityStateParts.push(po.vendor.city)
    if (po.vendor?.state) vendorCityStateParts.push(po.vendor.state)

    if (vendorCityStateParts.length > 0) {
        let cityStateStr = vendorCityStateParts.join(', ')
        if (po.vendor?.pincode) cityStateStr += ` - ${po.vendor.pincode}`
        vendorAddressParts.push(cityStateStr)
    }

    if (vendorAddressParts.length > 0) {
        doc.font('Helvetica').text(vendorAddressParts.join('\n'), rightValueX, vendorY, { width: 160 })
        vendorY += doc.heightOfString(vendorAddressParts.join('\n'), { width: 160 }) + 5
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
    const drawCellText = (text: string, cellX: number, y: number, width: number, align: any = 'left') => {
        const padding = 4;
        const effectiveWidth = width - (padding * 2);
        doc.text(text, cellX + padding, y, { width: effectiveWidth, align: align })
    }

    // Helper to draw lines
    const drawVerticalLines = (topY: number, bottomY: number) => {
        const lines = [40, 70, 270, 315, 370, 455, 555]
        lines.forEach(lineX => {
            doc.moveTo(lineX, topY).lineTo(lineX, bottomY).stroke()
        })
    }

    // Purchase Order Columns
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
        drawCellText('Description / Material', colX.desc, headerY + 8, colWidths.desc, 'left');
        drawCellText('Unit', colX.unit, headerY + 8, colWidths.unit, 'center');
        drawCellText('Qty', colX.quantity, headerY + 8, colWidths.quantity, 'center');
        drawCellText('Rate (Rs.)', colX.rate, headerY + 8, colWidths.rate, 'right');
        drawCellText('Amount (Rs.)', colX.amount, headerY + 8, colWidths.amount, 'right');

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

        items.forEach((item: any, idx: number) => {
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
    const doc = new PDFDocument({ margin: 20, size: 'A4' })
    doc.pipe(stream)

    const startX = 20
    const endX = 575
    const width = endX - startX
    const primaryColor = '#1a4a6b'

    // --- Header ---
    const logoPath = path.join(process.cwd(), 'uploads/logo.png')
    let y = 20

    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, startX, y, { width: 140 })
    } else {
        doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text('VH SHRI', startX, y)
        doc.fontSize(10).text('ENTERPRISE', startX, y + 22)
    }

    doc.fillColor('#333333').fontSize(7).font('Helvetica')
    const companyAddress = '804, RAJHANS BONISTA, B/H RAMCHOWK, GHOD DOD ROAD, SURAT - 395 007\nCONTACT: 0261-2666515 | email: vhshrienterprise@gmail.com'
    doc.text(companyAddress, 300, y + 5, { align: 'right', width: 275 })

    y += 50
    doc.moveTo(startX, y).lineTo(endX, y).strokeColor('#cccccc').lineWidth(0.5).stroke()
    doc.strokeColor('black').lineWidth(1)

    // Report Title Banner
    y += 10
    doc.rect(startX, y, width, 22).fill(primaryColor).stroke()
    doc.fillColor('white').font('Helvetica-Bold').fontSize(11)
    doc.text('DAILY PROGRESS REPORT', startX, y + 6, { align: 'center', width })
    y += 22

    // 1. Project Overview Table
    doc.fillColor('black').font('Helvetica').fontSize(8)
    const rowH = 18
    const drawInfoRow = (label1: string, val1: string, label2: string, val2: string) => {
        const col1W = 90, col2W = 185, col3W = 80, col4W = width - (col1W + col2W + col3W)

        doc.rect(startX, y, width, rowH).stroke()
        doc.font('Helvetica-Bold').text(label1, startX + 5, y + 5, { width: col1W })
        doc.font('Helvetica').text(val1 || '-', startX + col1W + 5, y + 5, { width: col2W - 10 })

        doc.moveTo(startX + col1W + col2W, y).lineTo(startX + col1W + col2W, y + rowH).stroke()
        doc.font('Helvetica-Bold').text(label2, startX + col1W + col2W + 5, y + 5, { width: col3W })
        doc.font('Helvetica').text(val2 || '-', startX + col1W + col2W + col3W + 5, y + 5, { width: col4W - 10 })

        doc.moveTo(startX + col1W, y).lineTo(startX + col1W, y + rowH).stroke()
        y += rowH
    }

    const clientName = dpr.project?.client?.company_name || dpr.project?.client?.name || '-'
    const reportDate = dpr.transaction_date ? new Date(dpr.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

    // Find key contacts
    const contacts = dpr.project?.contacts || []
    const engineer = contacts.find((c: any) => c.contact_type === 'site_engineer' || c.contact_type === 'project_manager')?.name || '-'
    const contractor = contacts.find((c: any) => c.contact_type === 'labour_contractor')?.name || contacts.find((c: any) => c.contact_type === 'labour_contractor')?.company_name || '-'

    drawInfoRow('CLIENT:', clientName, 'DATE:', reportDate)
    drawInfoRow('PROJECT:', dpr.project?.name, 'REPORT NO:', dpr.transaction_number)
    drawInfoRow('LOCATION:', dpr.project?.site_location || dpr.project?.site_city, 'ENGINEER:', engineer)
    drawInfoRow('CONTRACTOR:', contractor, 'STATUS:', (dpr.status || 'draft').toUpperCase())

    y += 10

    // Parsing Helpers
    const parseJSON = (str: any) => {
        try { return typeof str === 'string' ? JSON.parse(str) : (str || []) } catch (e) { return [] }
    }

    // 2. Staff & Manpower Sections
    const manpowerList = dpr.manpowerLogs && dpr.manpowerLogs.length > 0 ? dpr.manpowerLogs : parseJSON(dpr.manpower_data)
    const staff = manpowerList.filter((m: any) => m.is_staff || m.staff_name)
    const workers = manpowerList.filter((m: any) => !m.is_staff && !m.staff_name)

    const drawSectionHeader = (title: string) => {
        if (y > 750) { doc.addPage(); y = 40; }
        doc.rect(startX, y, width, 16).fill('#eeeeee').stroke()
        doc.fillColor('black').font('Helvetica-Bold').fontSize(9)
        doc.text(title, startX + 5, y + 4)
        y += 16
    }

    // Staff Table
    if (staff.length > 0) {
        drawSectionHeader('SITE MANAGEMENT & STAFF')
        doc.font('Helvetica').fontSize(8).fillColor('black')
        staff.forEach((s: any) => {
            doc.rect(startX, y, width, 16).stroke()
            doc.text(`${s.staff_name || s.worker_type || 'Staff'}`, startX + 10, y + 4, { width: 250 })
            doc.font('Helvetica-Bold').text(`${s.staff_role || '-'}`, startX + 270, y + 4)
            doc.font('Helvetica').text(`Attendance: ${s.hajri || 1}`, startX + 450, y + 4, { align: 'right', width: 100 })
            y += 16
        })
        y += 8
    }

    // Workers Table
    if (workers.length > 0) {
        drawSectionHeader('LABOUR DEPLOYMENT')
        doc.font('Helvetica').fontSize(8)
        // Group workers by type
        const colW = width / 3
        let rowX = startX
        doc.rect(startX, y, width, 18).stroke()
        workers.forEach((w: any, idx: number) => {
            if (idx > 0 && idx % 3 === 0) {
                y += 18
                doc.rect(startX, y, width, 18).stroke()
                rowX = startX
            }
            doc.text(`${w.worker_type}: ${w.count} (M/D: ${(w.count * (w.hajri || 1)).toFixed(1)})`, rowX + 5, y + 5, { width: colW - 10 })
            rowX += colW
            if (idx % 3 !== 2) doc.moveTo(rowX, y).lineTo(rowX, y + 18).stroke()
        })
        y += 26
    }

    // 3. Structural Progress (Specialized Logs)
    const panelLogs = dpr.panelWorkLogs || []
    const pileLogs = dpr.pileWorkLogs || []

    if (panelLogs.length > 0) {
        drawSectionHeader('STRUCTURAL PROGRESS (D-WALL PANELS)')
        const cols = [
            { t: 'Panel ID', w: 60 },
            { t: 'Size (LxWxD)', w: 80 },
            { t: 'Area (sqm)', w: 55 },
            { t: 'Grab Time', w: 65 },
            { t: 'Conc Time', w: 65 },
            { t: 'Qty(Th/Ac)', w: 60 },
            { t: 'Grade', w: 40 },
            { t: 'Cage ID', w: 60 },
            { t: 'Remarks', w: width - 485 }
        ]

        // Header Row
        doc.font('Helvetica-Bold').fontSize(7)
        let tx = startX
        cols.forEach(c => {
            doc.text(c.t, tx + 2, y + 4, { width: c.w - 4, align: 'center' })
            tx += c.w
        })
        y += 14
        doc.moveTo(startX, y).lineTo(endX, y).stroke()

        doc.font('Helvetica').fontSize(7)
        panelLogs.forEach((p: any) => {
            tx = startX
            doc.rect(startX, y, width, 20).stroke()
            doc.font('Helvetica-Bold').text(p.panel_identifier || p.panel?.panel_identifier || '-', tx + 2, y + 6, { width: cols[0].w - 4, align: 'center' })
            tx += cols[0].w
            doc.font('Helvetica').text(`${p.panel?.length || '-'}x${p.panel?.width || p.panel?.thickness || '-'}x${p.grabbing_depth || '-'}`, tx + 2, y + 6, { width: cols[1].w - 4, align: 'center' })
            tx += cols[1].w
            doc.text(`${p.grabbing_sqm || '-'}`, tx + 2, y + 6, { width: cols[2].w - 4, align: 'center' })
            tx += cols[2].w
            doc.text(`${p.grabbing_start_time || '-'}\n${p.grabbing_end_time || '-'}`, tx + 2, y + 2, { width: cols[3].w - 4, align: 'center' })
            tx += cols[3].w
            doc.text(`${p.concrete_start_time || '-'}\n${p.concrete_end_time || '-'}`, tx + 2, y + 2, { width: cols[4].w - 4, align: 'center' })
            tx += cols[4].w
            doc.font('Helvetica-Bold').text(`${p.theoretical_concrete_qty || '-'}/${p.actual_concrete_qty || '-'}`, tx + 2, y + 6, { width: cols[5].w - 4, align: 'center' })
            tx += cols[5].w
            doc.font('Helvetica').text(p.concrete_grade || '-', tx + 2, y + 6, { width: cols[6].w - 4, align: 'center' })
            tx += cols[6].w
            doc.text(p.cage_id_ref || '-', tx + 2, y + 6, { width: cols[7].w - 4, align: 'center' })
            tx += cols[7].w
            doc.text('-', tx + 2, y + 6, { width: cols[8].w - 4 })

            // Vertical separators
            let vx = startX
            cols.forEach(c => { vx += c.w; doc.moveTo(vx, y).lineTo(vx, y + 20).stroke() })
            y += 20
        })
        y += 10
    }

    if (pileLogs.length > 0) {
        drawSectionHeader('STRUCTURAL PROGRESS (PILING WORK)')
        const cols = [
            { t: 'Pile No', w: 60 },
            { t: 'Depths(Ac/Rk)', w: 75 },
            { t: 'Time Log', w: 65 },
            { t: 'Conc Qty', w: 55 },
            { t: 'Grade', w: 40 },
            { t: 'Steel(MT)', w: 50 },
            { t: 'Slump/Cube', w: 70 },
            { t: 'Rig', w: 45 },
            { t: 'Other', w: width - 460 }
        ]

        doc.font('Helvetica-Bold').fontSize(7)
        let tx = startX
        cols.forEach(c => {
            doc.text(c.t, tx + 2, y + 4, { width: c.w - 4, align: 'center' })
            tx += c.w
        })
        y += 14
        doc.moveTo(startX, y).lineTo(endX, y).stroke()

        doc.font('Helvetica').fontSize(7)
        pileLogs.forEach((p: any) => {
            tx = startX
            doc.rect(startX, y, width, 20).stroke()
            doc.font('Helvetica-Bold').text(p.pile_identifier || p.pile?.panel_identifier || '-', tx + 2, y + 6, { width: cols[0].w - 4, align: 'center' })
            tx += cols[0].w
            doc.font('Helvetica').text(`${p.achieved_depth || '-'}/${p.rock_socket_length || '-'}`, tx + 2, y + 6, { width: cols[1].w - 4, align: 'center' })
            tx += cols[1].w
            doc.text(`${p.start_time || '-'}\n${p.end_time || '-'}`, tx + 2, y + 2, { width: cols[2].w - 4, align: 'center' })
            tx += cols[2].w
            doc.font('Helvetica-Bold').text(`${p.actual_concrete_qty || p.concrete_poured || '-'}`, tx + 2, y + 6, { width: cols[3].w - 4, align: 'center' })
            tx += cols[3].w
            doc.font('Helvetica').text(p.concrete_grade || '-', tx + 2, y + 6, { width: cols[4].w - 4, align: 'center' })
            tx += cols[4].w
            doc.text(`${p.steel_installed || '-'}`, tx + 2, y + 6, { width: cols[5].w - 4, align: 'center' })
            tx += cols[5].w
            doc.text(`${p.slump_test || '-'}/${p.cube_test_id || '-'}`, tx + 2, y + 6, { width: cols[6].w - 4, align: 'center' })
            tx += cols[6].w
            doc.text(`${p.rig_id || '-'}`, tx + 2, y + 6, { width: cols[7].w - 4, align: 'center' })
            tx += cols[7].w
            doc.text('-', tx + 2, y + 6, { width: cols[8].w - 4 })

            let vx = startX
            cols.forEach(c => { vx += c.w; doc.moveTo(vx, y).lineTo(vx, y + 20).stroke() })
            y += 20
        })
        y += 10
    }

    // 4. Material Consumption Table
    if (dpr.items && dpr.items.length > 0) {
        drawSectionHeader('ACTIVITY & MATERIAL CONSUMPTION')
        const cols = [
            { t: 'Sr', w: 30 },
            { t: 'Description of Activity / Material', w: 250 },
            { t: 'Unit', w: 50 },
            { t: 'Consumption', w: 80 },
            { t: 'Work Achievement', w: 90 },
            { t: 'Efficiency', w: 55 }
        ]

        doc.font('Helvetica-Bold').fontSize(8).fillColor('black')
        let tx = startX
        cols.forEach(c => {
            doc.text(c.t, tx + 2, y + 4, { width: c.w - 4, align: c.t.includes('Quant') ? 'right' : 'center' })
            tx += c.w
        })
        y += 16
        doc.moveTo(startX, y).lineTo(endX, y).stroke()

        doc.font('Helvetica').fontSize(8)
        dpr.items.forEach((it: any, idx: number) => {
            tx = startX
            const rowHeight = Math.max(doc.heightOfString(it.material?.name || 'Item', { width: cols[1].w - 4 }) + 8, 16)
            if (y + rowHeight > 750) { doc.addPage(); y = 40; }

            doc.rect(startX, y, width, rowHeight).stroke()
            doc.text(`${idx + 1}`, tx, y + 4, { width: cols[0].w, align: 'center' })
            tx += cols[0].w
            doc.font('Helvetica-Bold').text(it.material?.name || 'Item', tx + 2, y + 4, { width: cols[1].w - 4 })
            tx += cols[1].w
            doc.font('Helvetica').text(it.unit || it.material?.uom || '-', tx, y + 4, { width: cols[2].w, align: 'center' })
            tx += cols[2].w
            doc.text(Number(it.quantity).toFixed(2), tx, y + 4, { width: cols[3].w, align: 'center' })
            tx += cols[3].w
            doc.text(Number(it.work_done_quantity || 0).toFixed(2), tx, y + 4, { width: cols[4].w, align: 'center' })
            tx += cols[4].w

            // Efficiency
            const std = it.material?.standard_rate
            if (std && it.work_done_quantity > 0) {
                const act = it.quantity / it.work_done_quantity
                const eff = Math.round((std / act) * 100)
                doc.text(`${eff}%`, tx, y + 4, { width: cols[5].w, align: 'center' })
            } else {
                doc.text('-', tx, y + 4, { width: cols[5].w, align: 'center' })
            }

            let vx = startX
            cols.forEach(c => { vx += c.w; doc.moveTo(vx, y).lineTo(vx, y + rowHeight).stroke() })
            y += rowHeight
        })
        y += 10
    }

    // 5. Machinery Status
    const machLogs = dpr.machineryBreakdownLogs && dpr.machineryBreakdownLogs.length > 0 ? dpr.machineryBreakdownLogs : parseJSON(dpr.machinery_data)
    if (machLogs.length > 0) {
        drawSectionHeader('MACHINERY & EQUIPMENT STATUS')
        const cols = [
            { t: 'Equipment', w: 100 },
            { t: 'Reg No', w: 70 },
            { t: 'Status', w: 60 },
            { t: 'Hours', w: 50 },
            { t: 'Breakdown Time', w: 100 },
            { t: 'Reason', w: 90 },
            { t: 'Action Taken', w: width - 470 }
        ]

        doc.font('Helvetica-Bold').fontSize(7)
        let tx = startX
        cols.forEach(c => {
            doc.text(c.t, tx + 2, y + 4, { width: c.w - 4, align: 'center' })
            tx += c.w
        })
        y += 14
        doc.moveTo(startX, y).lineTo(endX, y).stroke()

        doc.font('Helvetica').fontSize(7)
        machLogs.forEach((m: any) => {
            tx = startX
            const breakdownTime = (m.breakdown_start && m.breakdown_end) ? `${m.breakdown_start}-${m.breakdown_end}` : '-'
            const reason = m.breakdown_reason || m.breakdown_description || '-'
            const action = m.action_taken || '-'

            const maxH1 = doc.heightOfString(reason, { width: cols[5].w - 4 })
            const maxH2 = doc.heightOfString(action, { width: cols[6].w - 4 })
            const rowHeight = Math.max(20, maxH1 + 8, maxH2 + 8)

            if (y + rowHeight > 750) { doc.addPage(); y = 40; }

            doc.rect(startX, y, width, rowHeight).stroke()
            doc.text(m.equipment_name || m.name || 'Equipment', tx + 2, y + 6, { width: cols[0].w - 4, align: 'center' })
            tx += cols[0].w
            doc.text(m.registration_number || '-', tx + 2, y + 6, { width: cols[1].w - 4, align: 'center' })
            tx += cols[1].w
            doc.text((m.status || 'Active').toUpperCase(), tx + 2, y + 6, { width: cols[2].w - 4, align: 'center' })
            tx += cols[2].w
            doc.text(m.hours || m.breakdown_hours || '-', tx + 2, y + 6, { width: cols[3].w - 4, align: 'center' })
            tx += cols[3].w
            doc.text(breakdownTime, tx + 2, y + 6, { width: cols[4].w - 4, align: 'center' })
            tx += cols[4].w
            doc.text(reason, tx + 2, y + 6, { width: cols[5].w - 4, align: 'center' })
            tx += cols[5].w
            doc.text(action, tx + 2, y + 6, { width: cols[6].w - 4 })

            let vx = startX
            cols.forEach(c => { vx += c.w; doc.moveTo(vx, y).lineTo(vx, y + rowHeight).stroke() })
            y += rowHeight
        })
        y += 10
    }

    // 6. RMC Logs
    if (dpr.rmcLogs && dpr.rmcLogs.length > 0) {
        drawSectionHeader('RMC DELIVERY LOGS')
        const cols = [
            { t: 'Truck No', w: 80 },
            { t: 'Qty (cum)', w: 60 },
            { t: 'Slump', w: 50 },
            { t: 'In Time', w: 60 },
            { t: 'Start Time', w: 60 },
            { t: 'Out Time', w: 60 },
            { t: 'Panel / Remarks', w: width - 370 }
        ]
        doc.font('Helvetica-Bold').fontSize(7)
        let tx = startX
        cols.forEach(c => { doc.text(c.t, tx, y + 4, { width: c.w, align: 'center' }); tx += c.w })
        y += 14
        doc.font('Helvetica').fontSize(7)
        dpr.rmcLogs.forEach((r: any) => {
            tx = startX
            doc.rect(startX, y, width, 16).stroke()
            doc.text(r.vehicle_no, tx, y + 4, { width: cols[0].w, align: 'center' })
            tx += cols[0].w
            doc.text(r.quantity?.toString(), tx, y + 4, { width: cols[1].w, align: 'center' })
            tx += cols[1].w
            doc.text(r.slump?.toString(), tx, y + 4, { width: cols[2].w, align: 'center' })
            tx += cols[2].w
            doc.text(r.in_time || '-', tx, y + 4, { width: cols[3].w, align: 'center' })
            tx += cols[3].w
            doc.text(r.start_time || '-', tx, y + 4, { width: cols[4].w, align: 'center' })
            tx += cols[4].w
            doc.text(r.out_time || '-', tx, y + 4, { width: cols[5].w, align: 'center' })
            tx += cols[5].w

            const pId = r.drawing_panel_id || dpr.drawing_panel_id || ''
            const pText = pId ? `P:${pId}` : ''
            const remarksText = r.remarks || ''
            doc.text([pText, remarksText].filter(Boolean).join(' | '), tx + 5, y + 4, { width: cols[6].w - 10 })

            let vx = startX
            cols.forEach(c => { vx += c.w; doc.moveTo(vx, y).lineTo(vx, y + 16).stroke() })
            y += 16
        })
        y += 10
    }

    // 7. Site Conditions & Remarks
    drawSectionHeader('ENGINEER\'S SITE REMARKS')
    const remarks = dpr.remarks || 'Construction proceeding as per layout. All safety protocols followed.'
    const weather = `Weather: ${dpr.weather_condition || 'Clear'} | Work Hours: ${dpr.work_hours || '8'}`
    doc.font('Helvetica-Bold').fontSize(8).text(weather, startX + 5, y + 5)
    y += 15
    doc.font('Helvetica').fontSize(8).text(remarks, startX + 5, y, { width: width - 10 })
    y += doc.heightOfString(remarks, { width: width - 10 }) + 20

    // Footer
    if (y > 700) { doc.addPage(); y = 50; }
    y += 20
    doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor)
    doc.text('PREPARED BY (SITE ENGINEER)', startX + 20, y)
    doc.text('APPROVED BY (PROJECT MANAGER)', endX - 250, y, { align: 'right', width: 230 })

    y += 40
    doc.strokeColor('#333').lineWidth(1)
    doc.moveTo(startX + 20, y).lineTo(startX + 180, y).stroke()
    doc.moveTo(endX - 180, y).lineTo(endX - 20, y).stroke()

    doc.fontSize(7).font('Helvetica').fillColor('#888').text(`(Signature / Date)`, startX + 20, y + 5)
    doc.text(`(Signature / Date)`, endX - 180, y + 5, { align: 'right', width: 160 })

    doc.end()
}

export const generateCreditNotePDF = (srn: any, stream: any) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    doc.pipe(stream)

    const cn = srn.creditNote
    const vendor = srn.vendor
    const project = srn.project || srn.source_project || srn.fromProject

    // ─── Company Header ───────────────────────────────────────────────
    const companyName = 'VH SHRI ENTERPRISE'
    const companyAddress = 'B-701, Rajhans Bonista,\nB/H Ramchowk, Ghod Dod Road,\nSurat-395007'
    const companyContact = 'Contact: 0261-2666515, 2656515\nEmail: vhshrienterprise@gmail.com'
    const companyGSTIN = 'GSTIN: 24AAAFV7277F1Z5'

    const logoPath = path.join(process.cwd(), 'uploads/logo.png')

    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 200 })
    } else {
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a1a').text(companyName, 40, 40)
    }

    doc.fontSize(9).font('Helvetica').fillColor('#333333')
    doc.text(companyAddress, 300, 40, { align: 'right', width: 255 })
    doc.text(companyContact, 300, 72, { align: 'right', width: 255 })
    doc.text(companyGSTIN, 300, 96, { align: 'right', width: 255 })

    // Document Type Banner
    doc.rect(40, 115, 515, 22).fill('#1a4a6b').stroke()
    doc.fillColor('white').font('Helvetica-Bold').fontSize(12)
    doc.text('CREDIT NOTE', 40, 121, { align: 'center', width: 515 })

    doc.moveTo(40, 137).lineTo(555, 137).strokeColor('#cccccc').lineWidth(0.5).stroke()
    doc.lineWidth(1).strokeColor('black')

    // ─── Info Block ──────────────────────────────────────────────────
    const infoY = 148
    doc.fillColor('#333333').font('Helvetica-Bold').fontSize(9)
    doc.text('Credit Note No.:', 40, infoY)
    doc.font('Helvetica').text(cn.credit_note_number || '-', 130, infoY)

    doc.font('Helvetica-Bold').text('Date:', 40, infoY + 14)
    doc.font('Helvetica').text(cn.transaction_date ? new Date(cn.transaction_date).toLocaleDateString('en-GB') : '-', 130, infoY + 14)

    doc.font('Helvetica-Bold').text('Ref SRN No.:', 40, infoY + 28)
    doc.font('Helvetica').text(srn.transaction_number || '-', 130, infoY + 28)

    doc.font('Helvetica-Bold').text('Status:', 40, infoY + 42)
    doc.font('Helvetica').text((cn.status || 'draft').toUpperCase(), 130, infoY + 42)

    // Right column: Vendor info
    doc.font('Helvetica-Bold').text('Vendor / Payee:', 330, infoY)
    doc.font('Helvetica-Bold').fontSize(10).text(vendor?.name || 'N/A', 330, infoY + 14)
    doc.font('Helvetica').fontSize(8).text(vendor?.address || '', 330, infoY + 27, { width: 220 })
    if (vendor?.gst_number) doc.text(`GSTIN: ${vendor.gst_number} `, 330, infoY + 40, { width: 220 })

    // Project ref
    if (project?.name) {
        doc.fontSize(8).font('Helvetica-Bold').text('Project:', 330, infoY + 57)
        doc.font('Helvetica').text(project.name, 395, infoY + 57, { width: 160 })
    }

    // ─── Separator ───────────────────────────────────────────────────
    const tableStartY = infoY + 85
    doc.moveTo(40, tableStartY - 5).lineTo(555, tableStartY - 5).strokeColor('#aaaaaa').lineWidth(0.5).stroke()
    doc.lineWidth(1).strokeColor('black')

    // ─── Items Table ─────────────────────────────────────────────────
    const colX = { sn: 40, desc: 60, qty: 295, unit: 340, rate: 385, tax: 435, amount: 475 }
    const colW = { sn: 20, desc: 235, qty: 45, unit: 45, rate: 50, tax: 40, amount: 80 }
    const ROW_MIN = 18

    const drawCell = (text: string, x: number, y: number, w: number, align = 'left', bold = false) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8)
        doc.text(`${text} `, x + 3, y + 4, { width: w - 6, align: align as any })
    }

    // Header
    let y = tableStartY
    doc.rect(40, y, 515, 18).fill('#2c5f8a').stroke()
    doc.fillColor('white').font('Helvetica-Bold').fontSize(8)
    drawCell('#', colX.sn, y, colW.sn, 'center', true)
    drawCell('Material Description', colX.desc, y, colW.desc, 'left', true)
    drawCell('Qty', colX.qty, y, colW.qty, 'center', true)
    drawCell('Unit', colX.unit, y, colW.unit, 'center', true)
    drawCell('Rate (Rs.)', colX.rate, y, colW.rate, 'right', true)
    drawCell('Tax%', colX.tax, y, colW.tax, 'right', true)
    drawCell('Amount (Rs.)', colX.amount, y, colW.amount, 'right', true)
    y += 18

    // Rows
    const items: any[] = cn.items || []
    doc.fillColor('black')
    items.forEach((item: any, idx: number) => {
        const matName = item.material?.name || 'N/A'
        const matCode = item.material?.material_code || ''
        const descH = doc.font('Helvetica').fontSize(8).heightOfString(matName + (matCode ? `\n${matCode} ` : ''), { width: colW.desc - 6 })
        const rowH = Math.max(descH + 8, ROW_MIN + 4)

        if (y + rowH > 760) {
            doc.addPage()
            y = 50
        }

        const bg = idx % 2 === 0 ? '#f7fafd' : '#ffffff'
        doc.rect(40, y, 515, rowH).fill(bg).stroke()

        drawCell(`${idx + 1} `, colX.sn, y, colW.sn, 'center')
        doc.font('Helvetica-Bold').fontSize(8).text(matName, colX.desc + 3, y + 3, { width: colW.desc - 6 })
        if (matCode) doc.font('Helvetica').fontSize(7).fillColor('#777').text(matCode, colX.desc + 3, y + 3 + doc.heightOfString(matName, { width: colW.desc - 6 }), { width: colW.desc - 6 })
        doc.fillColor('black')
        drawCell(Number(item.quantity).toFixed(2), colX.qty, y, colW.qty, 'center')
        drawCell(item.unit || item.material?.unit || '-', colX.unit, y, colW.unit, 'center')
        drawCell(`Rs.${Number(item.unit_price).toFixed(2)} `, colX.rate, y, colW.rate, 'right')
        drawCell(`${Number(item.tax_percentage).toFixed(0)}% `, colX.tax, y, colW.tax, 'right')
        drawCell(`Rs.${Number(item.total_amount).toFixed(2)} `, colX.amount, y, colW.amount, 'right')

        y += rowH
    })

    // ─── Financial Summary ────────────────────────────────────────────
    const SUMX = 340
    const SUMW = 215

    if (y + 80 > 760) { doc.addPage(); y = 50 }
    y += 10

    const drawSumRow = (label: string, val: string, highlight = false) => {
        if (highlight) {
            doc.rect(SUMX, y, SUMW, 22).fill('#d0e8f7').stroke()
        } else {
            doc.rect(SUMX, y, SUMW, 18).fill('#f7f7f7').stroke()
        }
        doc.fillColor('#222222').font(highlight ? 'Helvetica-Bold' : 'Helvetica').fontSize(highlight ? 10 : 8.5)
        doc.text(label, SUMX + 5, y + (highlight ? 6 : 4), { width: 110 })
        doc.text(val, SUMX + 120, y + (highlight ? 6 : 4), { align: 'right', width: SUMW - 125 })
        y += highlight ? 22 : 18
    }

    drawSumRow('Subtotal (Excl. Tax)', `Rs.${Number(cn.subtotal).toFixed(2)} `)
    drawSumRow('Tax Amount', `Rs.${Number(cn.tax_amount).toFixed(2)} `)
    drawSumRow('CREDIT NOTE VALUE', `Rs.${Number(cn.total_amount).toFixed(2)} `, true)

    // ─── Remarks ─────────────────────────────────────────────────────
    const remarks = cn.remarks || srn.remarks
    if (remarks) {
        y += 15
        if (y + 50 > 760) { doc.addPage(); y = 50 }
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#222222').text('REMARKS / REASON FOR RETURN:', 40, y)
        y += 13
        doc.font('Helvetica').fontSize(8).text(remarks, 40, y, { width: 515 })
        y += doc.heightOfString(remarks, { width: 515 }) + 8
    }

    // ─── Signatures ─────────────────────────────────────────────────
    if (y + 90 > 760) { doc.addPage(); y = 50 }
    y += 50

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333')
    doc.moveTo(40, y).lineTo(180, y).stroke()
    doc.moveTo(385, y).lineTo(555, y).stroke()

    doc.text('Authorized Signatory', 40, y + 5, { align: 'center', width: 140 })
    doc.text('Vendor Acknowledgement', 385, y + 5, { align: 'center', width: 170 })
    doc.font('Helvetica').fontSize(8).fillColor('#666666')
    doc.text('VH SHRI ENTERPRISE', 40, y + 18, { align: 'center', width: 140 })
    doc.text(vendor?.name || 'Vendor', 385, y + 18, { align: 'center', width: 170 })

    // ─── Footer ──────────────────────────────────────────────────────
    doc.fontSize(7).fillColor('#aaaaaa').font('Helvetica')
    doc.text('Generated by VHSHRI Construction Management System | This is a computer-generated document.', 40, 810, { align: 'center', width: 515 })

    doc.end()
}
