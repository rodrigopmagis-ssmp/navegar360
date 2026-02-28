/**
 * Valida o algoritmo do CPF - Versão Profissional
 */
export const validateCPF = (cpf: string): boolean => {
    if (!cpf) return false;

    // Remove tudo que não for número
    const cleanCPF = cpf.replace(/\D/g, '');

    // Precisa ter 11 dígitos
    if (cleanCPF.length !== 11) return false;

    // Elimina CPFs com todos dígitos iguais
    if (/^(\d)\1+$/.test(cleanCPF)) return false;

    const digits = cleanCPF.split('').map(Number);

    // ======================
    // Validação 1º dígito
    // ======================
    let sum1 = 0;
    for (let i = 0; i < 9; i++) {
        sum1 += digits[i] * (10 - i);
    }
    let rest1 = (sum1 * 10) % 11;
    if (rest1 === 10) rest1 = 0;
    if (rest1 !== digits[9]) return false;

    // ======================
    // Validação 2º dígito
    // ======================
    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
        sum2 += digits[i] * (11 - i);
    }
    let rest2 = (sum2 * 10) % 11;
    if (rest2 === 10) rest2 = 0;
    if (rest2 !== digits[10]) return false;

    return true;
};

/**
 * Valida formato básico de RG (pode variar por estado, aqui usamos um padrão comum)
 * Mínimo de 7 dígitos numéricos
 */
export const validateRG = (rg: string): boolean => {
    const cleanRG = rg.replace(/\D/g, '');
    return cleanRG.length >= 7;
};

/**
 * Formata CPF (000.000.000-00)
 */
export const formatCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};
