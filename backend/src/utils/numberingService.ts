import { Op, Transaction } from 'sequelize';
import PurchaseOrder from '../models/PurchaseOrder';
import StoreTransaction from '../models/StoreTransaction';

export const numberingService = {
    /**
     * Generate temporary reference numbers
     */
    generateTempNumber: (prefix: 'PO' | 'GRN' | 'STN' | 'SRN' | 'CON'): string => {
        return `TMP-${prefix}-${Date.now()}`;
    },

    /**
     * Generate sequential PO number: PO-YYYY-XXXX
     */
    generatePoNumber: async (transaction?: Transaction): Promise<string> => {
        const year = new Date().getFullYear();
        const prefix = `PO-${year}-`;

        const pos = await PurchaseOrder.findAll({
            where: { po_number: { [Op.like]: `${prefix}%` } },
            attributes: ['po_number'],
            transaction
        });

        let nextSequence = 1;
        if (pos.length > 0) {
            const sequences = pos.map(po => {
                const num = po.po_number || '';
                const parts = num.split('-');
                return parseInt(parts[parts.length - 1], 10);
            }).filter(s => !isNaN(s));

            if (sequences.length > 0) {
                nextSequence = Math.max(...sequences) + 1;
            }
        }

        return `${prefix}${String(nextSequence).padStart(4, '0')}`;
    },

    /**
     * Generate sequential Transaction number: TYPE-YYYY-XXXX
     */
    generateTransactionNumber: async (type: 'GRN' | 'STN' | 'SRN' | 'CONSUMPTION', transaction?: Transaction): Promise<string> => {
        const year = new Date().getFullYear();
        const prefix = `${type}-${year}-`;

        const txs = await StoreTransaction.findAll({
            where: { transaction_number: { [Op.like]: `${prefix}%` } },
            attributes: ['transaction_number'],
            transaction
        });

        let nextSequence = 1;
        if (txs.length > 0) {
            const sequences = txs.map(tx => {
                const parts = tx.transaction_number.split('-');
                return parseInt(parts[parts.length - 1], 10);
            }).filter(s => !isNaN(s));

            if (sequences.length > 0) {
                nextSequence = Math.max(...sequences) + 1;
            }
        }

        return `${prefix}${String(nextSequence).padStart(4, '0')}`;
    }
};
