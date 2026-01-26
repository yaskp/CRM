/**
 * GST Calculation Utility for Construction ERP
 */

export type GSTType = 'intra_state' | 'inter_state';

export interface GSTBreakup {
    gst_type: GSTType;
    cgst_rate: number;
    sgst_rate: number;
    igst_rate: number;
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
    total_gst: number;
    grand_total: number;
}

/**
 * Detects whether a transaction is Intra-state or Inter-state
 * @param supplierStateCode 2-digit state code of the supplier (vendor)
 * @param destinationStateCode 2-digit state code of the destination (project/warehouse)
 */
export const detectGSTType = (supplierStateCode: string, destinationStateCode: string): GSTType => {
    if (!supplierStateCode || !destinationStateCode) return 'intra_state'; // Default
    return supplierStateCode === destinationStateCode ? 'intra_state' : 'inter_state';
};

/**
 * Calculates GST breakup based on amount and rate
 */
export const calculateGST = (
    baseAmount: number,
    gstRate: number, // e.g., 18 for 18%
    gstType: GSTType
): GSTBreakup => {
    const totalGstAmount = (baseAmount * gstRate) / 100;

    let cgst_rate = 0;
    let sgst_rate = 0;
    let igst_rate = 0;
    let cgst_amount = 0;
    let sgst_amount = 0;
    let igst_amount = 0;

    if (gstType === 'intra_state') {
        cgst_rate = gstRate / 2;
        sgst_rate = gstRate / 2;
        cgst_amount = totalGstAmount / 2;
        sgst_amount = totalGstAmount / 2;
    } else {
        igst_rate = gstRate;
        igst_amount = totalGstAmount;
    }

    return {
        gst_type: gstType,
        cgst_rate,
        sgst_rate,
        igst_rate,
        cgst_amount: Number(cgst_amount.toFixed(2)),
        sgst_amount: Number(sgst_amount.toFixed(2)),
        igst_amount: Number(igst_amount.toFixed(2)),
        total_gst: Number(totalGstAmount.toFixed(2)),
        grand_total: Number((baseAmount + totalGstAmount).toFixed(2))
    };
};

// Mapping of GST State Codes
export const INDIA_STATE_CODES: Record<string, string> = {
    '01': 'Jammu & Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra & Nagar Haveli and Daman & Diu',
    '27': 'Maharashtra',
    '28': 'Andhra Pradesh',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman & Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh',
    '97': 'Other Territory',
};

/**
 * Helper to get state code from GST number
 * GST format: 07AAAAA0000A1Z5 (First 2 digits are state code)
 */
export const getStateCodeFromGST = (gstNumber: string): string => {
    if (!gstNumber || gstNumber.length < 2) return '';
    return gstNumber.substring(0, 2);
};

export const getStateNameFromCode = (code: string): string => {
    return INDIA_STATE_CODES[code] || '';
};
