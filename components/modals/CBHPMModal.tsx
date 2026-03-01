import React, { useState, useEffect } from 'react';
import { X, Save, FileSignature, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface CBHPMItem {
    id?: string;
    codigo_anatomico: string;
    descricao_procedimento: string;
    grupo: string;
    subgrupo: string;
    fracao_porte: string;
    categoria_porte: string;
    porte_rs_fracao: string;
    custo_operacional: string;
    numero_auxiliares: string;
    portes: string;
    categoria_porte_anest: string;
    porte_anest_rs: string;
    filmes: string;
    incidencia: string;
    unidade_radiofarmaco: string;
    diretriz_utilizacao: string;
}

const normalizeDUT = (text: string): string => {
    if (!text) return '';

    // Mapping common mangled PDF encodings to correct characters
    const mapping: { [key: string]: string } = {
        'Á„': 'ção',
        'Ái': 'çõe',
        'Áo': 'ão',
        'Á': 'ç',
        '„': 'ã',
        'È': 'é',
        'Í': 'ê',
        'Ì': 'í',
        'ì': 'í',
        'Ù': 'ô',
        'Û': 'ó',
        'Â': 'â',
        '‡': 'ç',
        'ﬁ': 'ti',
        'ﬂ': 'fl',
        '—': '-',
        '≈': 'ã',
        '”': 'õ',
        'Ó': 'ó',
        'À': 'à',
        'Ú': 'ê',
        'ı': 'í'
    };

    let result = text;

    // Special cases for specific repeated patterns
    result = result.replace(/PR\"TESE/g, 'PRÓTESE');
    result = result.replace(/A\"RTICA/g, 'AÓRTICA');
    result = result.replace(/cir·rgico/g, 'cirúrgico');

    // Multi-character replacements
    result = result.replace(/Á„/g, 'ção');
    result = result.replace(/Ái/g, 'çõe');
    result = result.replace(/Á[oO]/g, 'ão');

    // Single character replacements
    Object.keys(mapping).forEach(key => {
        if (!['Á„', 'Ái', 'Áo'].includes(key)) {
            const re = new RegExp(key, 'g');
            result = result.replace(re, mapping[key]);
        }
    });

    // Special case for '·' which is usually 'á'
    result = result.replace(/·/g, 'á');

    // Final cleanup of known words to ensure quality
    result = result.replace(/Avaliação/g, 'Avaliação');
    result = result.replace(/realização/g, 'realização');
    result = result.replace(/indicação/g, 'indicação');
    result = result.replace(/oposição/g, 'oposição');
    result = result.replace(/condições/g, 'condições');
    result = result.replace(/critérios/g, 'critérios');
    result = result.replace(/sintomáticos/g, 'sintomáticos');
    result = result.replace(/inoperáveis/g, 'inoperáveis');
    result = result.replace(/logístico/g, 'logístico');
    result = result.replace(/mínimo/g, 'mínimo');
    result = result.replace(/anatômicas/g, 'anatômicas');
    result = result.replace(/cardíaco/g, 'cardíaco');
    result = result.replace(/cirurgião/g, 'cirurgião');
    result = result.replace(/experiência/g, 'experiência');

    return result;
};

interface CBHPMModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: CBHPMItem | null;
    onSaved: () => void;
}

export const CBHPMModal: React.FC<CBHPMModalProps> = ({ isOpen, onClose, item, onSaved }) => {
    const [formData, setFormData] = useState<CBHPMItem>({
        codigo_anatomico: '',
        descricao_procedimento: '',
        grupo: '',
        subgrupo: '',
        fracao_porte: '',
        categoria_porte: '',
        porte_rs_fracao: '',
        custo_operacional: '',
        numero_auxiliares: '',
        portes: '',
        categoria_porte_anest: '',
        porte_anest_rs: '',
        filmes: '',
        incidencia: '',
        unidade_radiofarmaco: '',
        diretriz_utilizacao: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (item) {
            // Sanitize item: replace null values with empty strings for controlled inputs
            const sanitizedItem = { ...item };
            Object.keys(sanitizedItem).forEach(key => {
                if ((sanitizedItem as any)[key] === null) {
                    (sanitizedItem as any)[key] = '';
                }
            });
            setFormData(sanitizedItem as CBHPMItem);
        } else {
            setFormData({
                codigo_anatomico: '',
                descricao_procedimento: '',
                grupo: '',
                subgrupo: '',
                fracao_porte: '',
                categoria_porte: '',
                porte_rs_fracao: '',
                custo_operacional: '',
                numero_auxiliares: '',
                portes: '',
                categoria_porte_anest: '',
                porte_anest_rs: '',
                filmes: '',
                incidencia: '',
                unidade_radiofarmaco: '',
                diretriz_utilizacao: ''
            });
        }
    }, [item, isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.codigo_anatomico || !formData.descricao_procedimento) {
            toast.error('Código e descrição são obrigatórios');
            return;
        }

        try {
            setIsSubmitting(true);

            // Payload strictly picking only DB-existing fields
            const payload = {
                codigo_anatomico: formData.codigo_anatomico,
                descricao_procedimento: formData.descricao_procedimento,
                grupo: formData.grupo,
                subgrupo: formData.subgrupo,
                fracao_porte: formData.fracao_porte,
                categoria_porte: formData.categoria_porte,
                porte_rs_fracao: formData.porte_rs_fracao,
                custo_operacional: formData.custo_operacional,
                numero_auxiliares: formData.numero_auxiliares,
                portes: formData.portes,
                categoria_porte_anest: formData.categoria_porte_anest,
                porte_anest_rs: formData.porte_anest_rs,
                filmes: formData.filmes,
                incidencia: formData.incidencia,
                unidade_radiofarmaco: formData.unidade_radiofarmaco,
                diretriz_utilizacao: formData.diretriz_utilizacao
            };

            let error;
            let savedData;

            if (formData.id) {
                // Update by ID
                const res = await supabase.from('cbhpm').update(payload).eq('id', formData.id).select();
                error = res.error;
                savedData = res.data;

                // Fallback: Se o resultado for vazio, tenta pelo código
                if (!error && (!savedData || savedData.length === 0)) {
                    console.log('Update by ID returned empty, trying fallback by codigo_anatomico...');
                    const fallbackRes = await supabase.from('cbhpm').update(payload).eq('codigo_anatomico', formData.codigo_anatomico).select();
                    error = fallbackRes.error;
                    savedData = fallbackRes.data;
                }
            } else {
                // Insert
                // Ensure code does not exist
                const { data: existing } = await supabase.from('cbhpm').select('id').eq('codigo_anatomico', formData.codigo_anatomico).limit(1);

                if (existing && existing.length > 0) {
                    toast.error('Já existe um procedimento com este código anatômico.');
                    setIsSubmitting(false);
                    return;
                }

                const res = await supabase.from('cbhpm').insert([payload]).select();
                error = res.error;
                savedData = res.data;
            }

            if (error) throw error;

            // Verificação Crítica: se savedData estiver vazio após o fallback, é RLS bloqueando
            if (!savedData || savedData.length === 0) {
                console.error('Save failed: Empty result set (RLS policies probably blocking INSERT/UPDATE)');
                throw new Error('Permissão negada pelo banco de dados (RLS). Por favor, execute o script SQL de liberação no Supabase.');
            }

            console.log('Dados salvos no banco:', savedData);
            toast.success(formData.id ? 'Procedimento atualizado com sucesso!' : 'Procedimento salvo com sucesso!');
            onSaved();
            onClose();

        } catch (error: any) {
            console.error('Error saving cbhpm:', error);
            toast.error(error.message || 'Erro ao salvar procedimento.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNormalizeDUT = () => {
        if (!formData.diretriz_utilizacao) {
            toast.error('O campo de diretriz está vazio');
            return;
        }

        const cleaned = normalizeDUT(formData.diretriz_utilizacao);
        if (cleaned === formData.diretriz_utilizacao) {
            toast.success('O texto já parece estar correto');
        } else {
            setFormData(prev => ({ ...prev, diretriz_utilizacao: cleaned }));
            toast.success('Texto corrigido com sucesso! Revise antes de salvar.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
            />

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl relative z-10 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-100 bg-white shrink-0 rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                            <FileSignature className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                {item?.id ? 'Editar Procedimento' : 'Novo Procedimento'}
                            </h2>
                            <p className="text-sm font-medium text-slate-500">
                                Tabela CBHPM / TUSS
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 relative flex-1">
                    <form id="cbhpm-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Seção Principal */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Dados Principais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Código (TUSS)*</label>
                                    <input
                                        type="text"
                                        title="Código TUSS ou Anatômico"
                                        name="codigo_anatomico"
                                        value={formData.codigo_anatomico}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500"
                                        placeholder="00000000"
                                    />
                                </div>
                                <div className="md:col-span-9">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Procedimento*</label>
                                    <input
                                        type="text"
                                        title="Descrição do Procedimento"
                                        placeholder="Ex: Consulta em consultório"
                                        name="descricao_procedimento"
                                        value={formData.descricao_procedimento}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Grupos e Portes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Classificação</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Grupo</label>
                                        <input type="text" title="Grupo" placeholder="Ex: Procedimentos Consultas" name="grupo" value={formData.grupo} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Subgrupo</label>
                                        <input type="text" title="Subgrupo" placeholder="Ex: Consultas" name="subgrupo" value={formData.subgrupo} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Portes e Anestesia</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria Porte</label>
                                        <input type="text" title="Categoria Porte" placeholder="Ex: 3C" name="categoria_porte" value={formData.categoria_porte} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Fração Porte</label>
                                        <input type="text" title="Fração Porte" placeholder="-" name="fracao_porte" value={formData.fracao_porte} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Custo Op.</label>
                                        <input type="text" title="Custo Operacional" placeholder="0.00" name="custo_operacional" value={formData.custo_operacional} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nº Auxiliares</label>
                                        <input type="text" title="Número Auxiliares" placeholder="0" name="numero_auxiliares" value={formData.numero_auxiliares} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Porte Anestesia</label>
                                        <input type="text" title="Porte Anestesia" placeholder="Ex: 3" name="categoria_porte_anest" value={formData.categoria_porte_anest} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Porte Anest (R$)</label>
                                        <input type="text" title="Porte Anest (R$)" placeholder="0.00" name="porte_anest_rs" value={formData.porte_anest_rs} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Diretriz Utilização */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Regras ANS</h3>
                                <button
                                    type="button"
                                    onClick={handleNormalizeDUT}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors border border-amber-200 shadow-sm"
                                    title="Corrigir acentuação distorcida de cópias do PDF da ANS"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    CORRIGIR TEXTO (PDF)
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Diretriz de Utilização (DUT)</label>
                                <textarea
                                    name="diretriz_utilizacao"
                                    title="Diretriz de Utilização (DUT)"
                                    value={formData.diretriz_utilizacao || ''}
                                    onChange={handleChange}
                                    rows={6}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 resize-y"
                                    placeholder="Descreva as diretrizes de utilização da ANS para este procedimento..."
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    O texto preenchido aqui aparecerá automaticamente no botão de balança ao selecionar o procedimento nos pedidos médicos.
                                </p>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="cbhpm-form"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {item?.id ? 'Salvar Alterações' : 'Salvar Novo Procedimento'}
                    </button>
                </div>
            </div>
        </div>
    );
};
