import { differenceInDays, isPast, parseISO } from 'date-fns';

/**
 * Normalizes a date string for database insertion.
 * Converts empty strings to null.
 */
export const cleanDate = (date: string | null | undefined): string | null => {
    if (!date || date.trim() === '') return null;
    return date;
};

export type InsuranceStatus = 'expired' | 'expiring_soon' | 'valid' | 'none';

interface StatusDetails {
    status: InsuranceStatus;
    color: string;
    bgColor: string;
    text: string;
    border: string;
    label: string;
    daysRemaining?: number;
}

/**
 * Calculates the status of an insurance card based on its expiration date.
 */
export const getInsuranceStatus = (validUntil: string | null | undefined): StatusDetails => {
    if (!validUntil) {
        return { status: 'none', color: 'text-slate-400', text: 'text-slate-400', bgColor: 'bg-slate-50', border: 'border-slate-100', label: 'Não informado' };
    }

    try {
        const expiryDate = parseISO(validUntil);
        const daysRemaining = differenceInDays(expiryDate, new Date());

        if (isPast(expiryDate)) {
            return { status: 'expired', color: 'text-red-600', text: 'text-red-700', bgColor: 'bg-red-50', border: 'border-red-100', label: 'Vencido', daysRemaining };
        }

        if (daysRemaining <= 31) {
            return { status: 'expiring_soon', color: 'text-amber-600', text: 'text-amber-700', bgColor: 'bg-amber-50', border: 'border-amber-100', label: 'Vence em breve', daysRemaining };
        }

        return { status: 'valid', color: 'text-emerald-600', text: 'text-emerald-700', bgColor: 'bg-emerald-50', border: 'border-emerald-100', label: 'Válido', daysRemaining };
    } catch (error) {
        return { status: 'none', color: 'text-slate-400', text: 'text-slate-400', bgColor: 'bg-slate-50', border: 'border-slate-100', label: 'Erro na data' };
    }
};
