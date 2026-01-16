import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

export const generateQuotationPDF = (quotation: any, stream: any) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })

    doc.pipe(stream)

    // -- Header --
    const companyName = 'Construction CRM'
    const companyAddress = '123 Builder Lane, Construct City, ST, 12345'
    const companyPhone = '+91 98765 43210'
    const companyEmail = 'info@constructioncrm.com'

    // Logo (Placeholder if file doesn't exist)
    // if (fs.existsSync('logo.png')) { doc.image('logo.png', 50, 45, { width: 50 }) }

    // Company Info (Top Left)
    doc
        .fontSize(20)
        .text(companyName, 50, 50)
        .fontSize(10)
        .text(companyAddress, 50, 75)
        .text(`Phone: ${companyPhone}`, 50, 90)
        .text(`Email: ${companyEmail}`, 50, 105)
        .moveDown()

    // Quotation Title (Top Right)
    doc
        .fontSize(25)
        .text('QUOTATION', 400, 50, { align: 'right' })
        .fontSize(10)
        .text(`Quotation #: ${quotation.quotation_number}`, 400, 80, { align: 'right' })
        .text(`Date: ${new Date(quotation.created_at).toLocaleDateString('en-GB')}`, 400, 95, { align: 'right' })
        .text(`Valid Until: ${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-GB') : 'N/A'}`, 400, 110, { align: 'right' })

    // -- Bill To --
    const leadName = quotation.lead?.name || 'N/A'
    const clientCompany = quotation.lead?.company_name || ''
    const clientAddress = quotation.lead?.address || 'Address not provided'
    const clientPhone = quotation.lead?.phone || ''
    const clientEmail = quotation.lead?.email || ''

    doc
        .moveDown(4)
        .fontSize(12)
        .text('Bill To:', 50, 160, { underline: true })
        .fontSize(10)
        .text(leadName, 50, 180)

    if (clientCompany) doc.text(clientCompany, 50, 195)
    doc.text(clientAddress, 50, clientCompany ? 210 : 195)
    if (clientPhone) doc.text(`Phone: ${clientPhone}`, 50, clientCompany ? 225 : 210)

    // -- Line Items Table Header --
    const tableTop = 280
    const itemX = 50
    const qtyX = 300
    const priceX = 370
    const totalX = 470

    doc
        .fontSize(10)
        .text('Description', itemX, tableTop, { bold: true })
        .text('Qty', qtyX, tableTop, { bold: true })
        .text('Unit Price', priceX, tableTop, { bold: true })
        .text('Total', totalX, tableTop, { bold: true })

    doc
        .moveTo(itemX, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke()

    // -- Single Line Item (Lump Sum) --
    // Since we don't have items, we treat the total as a single service item
    const itemY = tableTop + 25
    const originalAmount = quotation.total_amount

    doc
        .fontSize(10)
        .text('Construction Services / Project Estimation', itemX, itemY)
        .text('1', qtyX, itemY)
        .text(Number(originalAmount).toFixed(2), priceX, itemY)
        .text(Number(originalAmount).toFixed(2), totalX, itemY)

    // -- Totals --
    const subtotal = Number(originalAmount)
    const discountPercent = Number(quotation.discount_percentage || 0)
    const discountAmount = (subtotal * discountPercent) / 100
    const finalAmount = Number(quotation.final_amount)

    const totalsY = itemY + 50
    const labelX = 350
    const valueX = 470

    doc
        .text('Subtotal:', labelX, totalsY)
        .text(subtotal.toFixed(2), valueX, totalsY)

    doc
        .text(`Discount (${discountPercent}%):`, labelX, totalsY + 15)
        .text(`-${discountAmount.toFixed(2)}`, valueX, totalsY + 15)

    doc
        .fontSize(12)
        .text('Grand Total:', labelX, totalsY + 35, { bold: true })
        .text(finalAmount.toFixed(2), valueX, totalsY + 35, { bold: true })

    // -- Payment Terms --
    if (quotation.payment_terms) {
        doc
            .moveDown(4)
            .fontSize(12)
            .text('Payment Terms:', 50, totalsY + 80, { underline: true })
            .fontSize(10)
            .text(quotation.payment_terms, 50, totalsY + 100)
    }

    // -- Footer --
    doc
        .fontSize(10)
        .text(
            'Thank you for your business!',
            50,
            700,
            { align: 'center', width: 500 }
        )

    doc.end()
}
