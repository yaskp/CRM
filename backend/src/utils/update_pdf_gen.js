const fs = require('fs');
const path = require('path');

const filePath = 'd:\\CRM\\backend\\src\\utils\\pdfGenerator.ts'; // Hardcoded path
const fileContent = fs.readFileSync(filePath, 'utf8');

const splitToken = 'export const generateDPRPDF = (dpr: any, stream: any) => {';
const parts = fileContent.split(splitToken);

if (parts.length < 2) {
    console.error('Could not find split token');
    process.exit(1);
}

const newFunction = `export const generateDPRPDF = (dpr: any, stream: any) => {
    const doc = new PDFDocument({ margin: 20, size: 'A4' }) // Smaller margins as per new design
    doc.pipe(stream)

    // Constants
    const startX = 20
    const endX = 575
    const width = endX - startX
    const colHalf = width / 2
    const centerX = startX + (width / 2)

    // --- Header ---
    const companyName = 'VH SHRI ENTERPRISE'
    // const companyAddress = 'B-104, Rajhans Bonista,\\nB/H Ramchowk, Ghod Dod Road,\\nSurat-395007'
    const companyAddressLines = [
        '804, RAJHANS BONISTA, B/H RAMCHOWK,',
        'GHOD DOD ROAD, SURAT-395 007',
        'CONTACT : 0261-2666515, 2666515',
        'email : vhshrienterprise@gmail.com',
        'www.vhshrienterprise.com'
    ]

    const logoPath = path.join(process.cwd(), 'uploads/logo.png')
    let y = 20

    // Logo (Left)
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, startX, y, { width: 180 })
    } else {
        doc.fontSize(24).font('Helvetica-Bold').text('vh shri', startX, y)
        doc.fontSize(12).text('ENTERPRISE', startX, y + 25)
    }

    // Address (Right)
    doc.fontSize(8).font('Helvetica')
    let addrY = y + 5
    companyAddressLines.forEach(line => {
        doc.text(line, 350, addrY, { align: 'right', width: 220 })
        addrY += 10
    })

    y += 60 // Below Logo
    doc.moveTo(startX, y).lineTo(endX, y).stroke() // Header underline if needed (optional)

    // Report Title
    y += 10
    doc.fontSize(12).font('Helvetica-Bold').text('DAILY PROGRESS REPORT (DAY SHIFT)', startX, y, { align: 'center', width, underline: true })
    y += 20

    // --- Table Helper Functions ---
    const drawRow = (y: number, height: number, cols: { x: number, w: number, text?: string, align?: string, font?: string, bold?: boolean, borderRight?: boolean }[]) => {
        // Draw bottom line
        doc.lineWidth(0.5).moveTo(startX, y + height).lineTo(endX, y + height).stroke()
        // Draw outer borders if first/last
        doc.moveTo(startX, y).lineTo(startX, y + height).stroke()
        doc.moveTo(endX, y).lineTo(endX, y + height).stroke()

        let maxH = height; 

        cols.forEach(col => {
            if (col.borderRight) {
                 doc.moveTo(col.x + col.w, y).lineTo(col.x + col.w, y + height).stroke()
            }
            if (col.text) {
                doc.font(col.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
                doc.text(col.text, col.x + 2, y + 4, { width: col.w - 4, align: (col.align as any) || 'left' })
            }
        })
        return y + height
    }
    
    // Draw Top Border for the big table
    doc.moveTo(startX, y).lineTo(endX, y).stroke()

    // 1. Project Details
    const rowH = 20
    const col1W = 100, col2W = 180, col3W = 100, col4W = width - (col1W + col2W + col3W)
    
    // Row 1: Client | Loc
    doc.font('Helvetica-Bold').fontSize(9)
    doc.text('NAME OF CLIENT :-', startX + 2, y + 5, { width: col1W })
    doc.font('Helvetica').text(dpr.project?.client?.name || '-', startX + col1W + 2, y + 5, { width: col2W })
    
    doc.font('Helvetica-Bold').text('LOCATION:-', startX + col1W + col2W + 2, y + 5, { width: col3W })
    doc.font('Helvetica').text(dpr.project?.location || '-', startX + col1W + col2W + col3W + 2, y + 5, { width: col4W })

    // Vertical lines
    doc.moveTo(startX, y).lineTo(startX, y+rowH).stroke()
    doc.moveTo(startX+col1W, y).lineTo(startX+col1W, y+rowH).stroke() // after Client Label
    doc.moveTo(startX+col1W+col2W, y).lineTo(startX+col1W+col2W, y+rowH).stroke() // after Client Val
    doc.moveTo(startX+col1W+col2W+col3W, y).lineTo(startX+col1W+col2W+col3W, y+rowH).stroke() // after Loc Label
    doc.moveTo(endX, y).lineTo(endX, y+rowH).stroke()
    
    y += rowH
    doc.moveTo(startX, y).lineTo(endX, y).stroke() // Bottom of Row 1

    // Row 2: Project | Date
    doc.font('Helvetica-Bold').text('NAME OF PROJECT :-', startX + 2, y + 5, { width: col1W })
    doc.font('Helvetica').text(dpr.project?.name || '-', startX + col1W + 2, y + 5, { width: col2W })
    
    doc.font('Helvetica-Bold').text('DATE:-', startX + col1W + col2W + 2, y + 5, { width: col3W })
    const dateStr = dpr.transaction_date ? new Date(dpr.transaction_date).toLocaleDateString('en-GB') : '-'
    doc.font('Helvetica').text(dateStr, startX + col1W + col2W + col3W + 2, y + 5, { width: col4W })

    // Vertical lines
    doc.moveTo(startX, y).lineTo(startX, y+rowH).stroke()
    doc.moveTo(startX+col1W, y).lineTo(startX+col1W, y+rowH).stroke() 
    doc.moveTo(startX+col1W+col2W, y).lineTo(startX+col1W+col2W, y+rowH).stroke()
    doc.moveTo(startX+col1W+col2W+col3W, y).lineTo(startX+col1W+col2W+col3W, y+rowH).stroke()
    doc.moveTo(endX, y).lineTo(endX, y+rowH).stroke()

    y += rowH
    doc.moveTo(startX, y).lineTo(endX, y).stroke() // Bottom of Row 2

    // --- 2. STAFF Section ---
    const manpower = dpr.manpower_data ? (typeof dpr.manpower_data === 'string' ? JSON.parse(dpr.manpower_data) : dpr.manpower_data) : []
    const staff = manpower.filter((m: any) => m.is_staff)
    const workers = manpower.filter((m: any) => !m.is_staff)

    const staffRowCount = Math.max(staff.length, 3)
    const staffSectionHeight = staffRowCount * 20
    
    // Label Column (Left)
    doc.font('Helvetica-Bold').text('STAFF', startX + 2, y + (staffSectionHeight/2) - 5, { width: col1W, align: 'center' })
    // Content Column (Right)
    let tempY = y
    for (let i = 0; i < staffRowCount; i++) {
        const s = staff[i]
        if (s) {
            doc.font('Helvetica').text(\`\${s.worker_type}: \${s.count}\`, startX + col1W + 5, tempY + 5)
        }
        // Inner horizontal lines for rows
        if (i < staffRowCount -1) {
             doc.moveTo(startX + col1W, tempY + 20).lineTo(endX, tempY + 20).stroke()
        }
        tempY += 20
    }
    
    // Vertical Lines for Staff
    doc.moveTo(startX, y).lineTo(startX, y + staffSectionHeight).stroke()
    doc.moveTo(startX + col1W, y).lineTo(startX + col1W, y + staffSectionHeight).stroke()
    doc.moveTo(endX, y).lineTo(endX, y + staffSectionHeight).stroke()
    
    y += staffSectionHeight
    doc.moveTo(startX, y).lineTo(endX, y).stroke() // Bottom of Staff

    // --- 3. Manpower Section ---
    const workerRowCount = Math.max(workers.length + 1, 4) // +1 for headers
    // Actually layout is: Header Row, then Data Rows
    // The design has col1: MANPOWER label (spanning all), col2: STEEL/SHUTTERING, col3: CONCRETE
    
    const mpLabelW = col1W
    const mpCol1W = (width - mpLabelW) * 0.6
    const mpCol2W = (width - mpLabelW) - mpCol1W

    const mpSectionH = (Math.max(workers.length, 3) + 1) * 20 // +1 for header
    
    // Label: MANPOWER
    doc.font('Helvetica-Bold').text('MANPOWER', startX + 2, y + (mpSectionH/2) - 5, { width: mpLabelW, align: 'center' })

    // Header Row
    doc.font('Helvetica-Bold').fontSize(8)
    doc.text('STEEL AND SHUTTERING WORK', startX + mpLabelW + 2, y + 5, { width: mpCol1W, align: 'center' })
    doc.text('CONCRETE WORK', startX + mpLabelW + mpCol1W + 2, y + 5, { width: mpCol2W, align: 'center' })
    
    doc.moveTo(startX + mpLabelW, y+20).lineTo(endX, y+20).stroke() // Header bottom line

    // Data Rows
    tempY = y + 20
    const wRows = Math.max(workers.length, 3)
    for (let i = 0; i < wRows; i++) {
        const w = workers[i]
        if (w) {
            doc.font('Helvetica').text(\`\${w.worker_type}: \${w.count}\`, startX + mpLabelW + 5, tempY + 5)
        }
        // Border bottom unless last
        if (i < wRows - 1) {
             doc.moveTo(startX + mpLabelW, tempY + 20).lineTo(endX, tempY + 20).stroke()
        }
        tempY += 20
    }

    // Vertical Lines
    doc.moveTo(startX, y).lineTo(startX, y + mpSectionH).stroke()
    doc.moveTo(startX + mpLabelW, y).lineTo(startX + mpLabelW, y + mpSectionH).stroke() // After Label
    doc.moveTo(startX + mpLabelW + mpCol1W, y).lineTo(startX + mpLabelW + mpCol1W, y + mpSectionH).stroke() // Split content
    doc.moveTo(endX, y).lineTo(endX, y + mpSectionH).stroke()

    y += mpSectionH
    doc.moveTo(startX, y).lineTo(endX, y).stroke()

     // --- 4. Machinery Section ---
     const machinery = dpr.machinery_data ? (typeof dpr.machinery_data === 'string' ? JSON.parse(dpr.machinery_data) : dpr.machinery_data) : []
     const machRows = Math.max(machinery.length, 3)
     const machH = machRows * 20

     doc.font('Helvetica-Bold').fontSize(9).text('MACHINERY', startX + 2, y + (machH/2) - 5, { width: col1W, align: 'center' })

     tempY = y
     for(let i=0; i<machRows; i++) {
         const m = machinery[i]
         if (m) {
             doc.font('Helvetica').text(\`\${m.name}: \${m.count} (Hrs: \${m.hours||'-'})\`, startX + col1W + 5, tempY + 5)
         }
         if (i < machRows -1) doc.moveTo(startX + col1W, tempY + 20).lineTo(endX, tempY + 20).stroke()
         tempY += 20
     }

     doc.moveTo(startX, y).lineTo(startX, y + machH).stroke()
     doc.moveTo(startX + col1W, y).lineTo(startX + col1W, y + machH).stroke()
     doc.moveTo(endX, y).lineTo(endX, y + machH).stroke()

     y += machH
     doc.moveTo(startX, y).lineTo(endX, y).stroke()

    // --- 5. Progress Section ---
    // dpr.items
    const items = dpr.items || []
    const progRows = Math.max(items.length, 3)
    const progH = progRows * 20

    doc.font('Helvetica-Bold').fontSize(9).text('PROGRESS', startX + 2, y + (progH/2) - 5, { width: col1W, align: 'center' })

    tempY = y
    for(let i=0; i<progRows; i++) {
        const it = items[i]
        if (it) {
            doc.font('Helvetica').text(\`\${it.material?.name || 'Activity'}: \${it.work_done_quantity} \${it.unit}\`, startX + col1W + 5, tempY + 5)
        }
        if (i < progRows -1) doc.moveTo(startX + col1W, tempY + 20).lineTo(endX, tempY + 20).stroke()
        tempY += 20
    }

    doc.moveTo(startX, y).lineTo(startX, y + progH).stroke()
    doc.moveTo(startX + col1W, y).lineTo(startX + col1W, y + progH).stroke()
    doc.moveTo(endX, y).lineTo(endX, y + progH).stroke()

    y += progH
    doc.moveTo(startX, y).lineTo(endX, y).stroke()

    // --- 6. Panel Details & RMC ---
    // Split into Left (40%) and Right (60%)
    const leftW = width * 0.4
    const rightW = width * 0.6
    const leftX = startX
    const rightX = startX + leftW

    const panelTopY = y
    
    // Check if we need a new page
    if (y > 600) {
        doc.addPage()
        y = 50
    }

    // -- Left Side: Panel Details --
    let currentLeftY = y
    doc.fontSize(9)
    // Header
    doc.font('Helvetica-Bold').text('PANEL DETAILS', leftX, currentLeftY + 5, { width: leftW, align: 'center' })
    doc.moveTo(leftX, currentLeftY + 20).lineTo(leftX + leftW, currentLeftY + 20).stroke()
    currentLeftY += 20
    
    // Panel Rows
    // Helper to draw panel row
    const drawPanelRow = (label: string, val: string) => {
        const rH = 20
        doc.font('Helvetica').text(label, leftX + 2, currentLeftY + 5, { width: (leftW*0.6)-2 })
        // Vertical line split
        doc.moveTo(leftX + (leftW*0.6), currentLeftY).lineTo(leftX + (leftW*0.6), currentLeftY + rH).stroke()
        doc.text(val, leftX + (leftW*0.6) + 2, currentLeftY + 5, { width: (leftW*0.4)-2 })
        
        doc.moveTo(leftX, currentLeftY+rH).lineTo(leftX+leftW, currentLeftY+rH).stroke()
        currentLeftY += rH
    }

    const panelJson = dpr.drawing_panel_id ? (Array.isArray(dpr.drawing_panel_id) ? dpr.drawing_panel_id[0] : dpr.drawing_panel_id) : null;
    
    drawPanelRow('PANEL SIZE :-', '-') 
    drawPanelRow('PANEL WIDTH :-', '-')
    drawPanelRow('GRABBING DEPTH :-', dpr.grabbing_depth || '-')
    drawPanelRow('GRABBING (SQM)', dpr.grabbing_sqm || '-')
    drawPanelRow('GRABBING START TIME :-', dpr.grabbing_start_time ? new Date(dpr.grabbing_start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-')
    drawPanelRow('GRABBING END TIME :-', dpr.grabbing_end_time ? new Date(dpr.grabbing_end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-')
    drawPanelRow('CONCRETING DEPTH:-', dpr.concreting_depth || '-')
    drawPanelRow('CONCRETING (SQM)', dpr.concreting_sqm || '-')
    drawPanelRow('CONCRETE START TIME :-', dpr.start_time ? new Date(dpr.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-')
    drawPanelRow('CONCRETE COMPL TIME:-', dpr.end_time ? new Date(dpr.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-')
    drawPanelRow('CONCRETE GRADE:-', dpr.concrete_grade || '-')


    // -- Right Side: RMC Details --
    let currentRightY = y
    // Header
    doc.font('Helvetica-Bold').text('RMC DETAILS', rightX, currentRightY + 5, { width: rightW, align: 'center' })
    doc.moveTo(rightX, currentRightY + 20).lineTo(endX, currentRightY + 20).stroke()
    currentRightY += 20
    
    // RMC Table Headers
    const rmcCols = [
        { w: 25, t: 'SR' },
        { w: 50, t: 'VEHICLE' },
        { w: 40, t: 'QTY' },
        { w: 40, t: 'SLUMP' },
        { w: 40, t: 'IN' },
        { w: 40, t: 'START' },
        { w: 40, t: 'OUT' }
    ]
    const rmcRowH = 20
    
    let rmcX = rightX
    doc.fontSize(7)
    rmcCols.forEach((c, i) => {
        doc.text(c.t, rmcX + 2, currentRightY + 5, { width: c.w })
        // Vert line
        if (i < rmcCols.length) doc.moveTo(rmcX + c.w, currentRightY).lineTo(rmcX + c.w, currentRightY + rmcRowH).stroke()
        rmcX += c.w
    })
    doc.moveTo(rightX, currentRightY+rmcRowH).lineTo(endX, currentRightY+rmcRowH).stroke()
    currentRightY += rmcRowH

    // RMC Rows (min 10)
    const rmcLogs = dpr.rmcLogs || [] 
    
    for (let i=0; i<10; i++) {
        rmcX = rightX
        rmcCols.forEach((c, idx) => {
             // Data would go here
             if (idx < rmcCols.length) doc.moveTo(rmcX + c.w, currentRightY).lineTo(rmcX + c.w, currentRightY + rmcRowH).stroke()
             rmcX += c.w
        })
        doc.moveTo(rightX, currentRightY+rmcRowH).lineTo(endX, currentRightY+rmcRowH).stroke()
        currentRightY += rmcRowH
    }

    // Calculate max Y
    const maxY = Math.max(currentLeftY, currentRightY)
    
    // Finish vertical lines for big boxes
    // Left Box
    doc.moveTo(leftX, y).lineTo(leftX, maxY).stroke()
    doc.moveTo(leftX + leftW, y).lineTo(leftX + leftW, maxY).stroke() // Middle line
    doc.moveTo(endX, y).lineTo(endX, maxY).stroke() // Right line
    
    // Fill empty space if one side is shorter
    if (currentLeftY < maxY) doc.moveTo(leftX, maxY).lineTo(leftX+leftW, maxY).stroke() // Close left
    if (currentRightY < maxY) doc.moveTo(rightX, maxY).lineTo(endX, maxY).stroke() // Close right

    y = maxY

     // --- 7. Remarks ---
     const remarkH = 50
     if (y + remarkH > 800) { doc.addPage(); y = 50; }
     
     doc.font('Helvetica-Bold').fontSize(9).text('REMARKS', startX + 2, y + (remarkH/2) - 5, { width: col1W, align: 'center' })
     
     doc.font('Helvetica').text(dpr.remarks || '', startX + col1W + 5, y + 5, { width: width - col1W - 5 })

    // Borders
    doc.moveTo(startX, y).lineTo(startX, y+remarkH).stroke()
    doc.moveTo(startX+col1W, y).lineTo(startX+col1W, y+remarkH).stroke()
    doc.moveTo(endX, y).lineTo(endX, y+remarkH).stroke()
    y += remarkH
    doc.moveTo(startX, y).lineTo(endX, y).stroke() // Bottom

    // --- 8. Footer ---
    y += 40
    if (y > 750) { doc.addPage(); y = 50 }

    doc.fontSize(9).font('Helvetica-Bold')
    doc.text('VH SHRI ENTERPRISE', startX + 20, y)
    doc.text('CLIENT', endX - 100, y)
    
    y += 40
    doc.lineCap('butt').moveTo(startX + 20, y).lineTo(startX + 150, y).stroke()
    doc.text('(ENGINEERS SIGNATURE)', startX + 20, y + 5)
    
    doc.moveTo(endX - 120, y).lineTo(endX - 20, y).stroke()
    doc.text('(ENGINEERS SIGNATURE)', endX - 120, y + 5)

    doc.end()
}
`;

const newContent = parts[0] + newFunction;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Update complete');
