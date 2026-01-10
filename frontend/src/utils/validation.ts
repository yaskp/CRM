// Validation utilities for Indian standards

// Phone number validation (Indian format)
export const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phone.replace(/[\s-]/g, ''))
}

// GST number validation (Indian format)
export const validateGST = (gst: string): boolean => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstRegex.test(gst.toUpperCase())
}

// PAN number validation (Indian format)
export const validatePAN = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    return panRegex.test(pan.toUpperCase())
}

// Email validation
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// Alphanumeric validation
export const validateAlphanumeric = (value: string): boolean => {
    const alphanumericRegex = /^[a-zA-Z0-9\s]+$/
    return alphanumericRegex.test(value)
}

// Number only validation
export const validateNumberOnly = (value: string): boolean => {
    const numberRegex = /^\d+$/
    return numberRegex.test(value)
}

// Decimal number validation
export const validateDecimal = (value: string): boolean => {
    const decimalRegex = /^\d+(\.\d{1,2})?$/
    return decimalRegex.test(value)
}

// IFSC code validation (Indian bank)
export const validateIFSC = (ifsc: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    return ifscRegex.test(ifsc.toUpperCase())
}

// Pincode validation (Indian)
export const validatePincode = (pincode: string): boolean => {
    const pincodeRegex = /^[1-9][0-9]{5}$/
    return pincodeRegex.test(pincode)
}

// Format phone number for display
export const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
    }
    return phone
}

// Format GST for display
export const formatGST = (gst: string): string => {
    return gst.toUpperCase()
}

// Format PAN for display
export const formatPAN = (pan: string): string => {
    return pan.toUpperCase()
}

// Validation messages
export const validationMessages = {
    phone: 'Please enter a valid 10-digit Indian mobile number',
    gst: 'Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)',
    pan: 'Please enter a valid PAN number (e.g., ABCDE1234F)',
    email: 'Please enter a valid email address',
    alphanumeric: 'Only letters and numbers are allowed',
    numberOnly: 'Only numbers are allowed',
    decimal: 'Please enter a valid decimal number',
    ifsc: 'Please enter a valid IFSC code (e.g., SBIN0001234)',
    pincode: 'Please enter a valid 6-digit pincode',
}
