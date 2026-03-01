import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, Scale, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DUTModal } from '../modals/DUTModal';
import { ProcedureType } from './ProcedureRow';

interface ExamRowProps {
    exam: ProcedureType;
    categoryPrefixes: string[];
    onChange: (id: string, updates: Partial<ProcedureType>) => void;
    onRemove: (id: string) => void;
}

export const ExamRow: React.FC<ExamRowProps> = ({ exam, categoryPrefixes, onChange, onRemove }) => {
    const [code, setCode] = useState(exam.code);
    const [description, setDescription] = useState(exam.description);
    const [quantity, setQuantity] = useState(exam.quantity);
    const [dut, setDut] = useState(exam.dut || '');
    const [isSearching, setIsSearching] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [isDUTOpen, setIsDUTOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        setCode(exam.code);
        setDescription(exam.description);
        setDut(exam.dut || '');
        setQuantity(exam.quantity);
    }, [exam.code, exam.description, exam.dut, exam.quantity]);

    const searchExams = async (term: string) => {
        if (term.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            // Clean term for code-based search
            const cleanTerm = term.replace(/\D/g, '');
            const isNumeric = /^\d+$/.test(cleanTerm);

            let query = supabase
                .from('cbhpm')
                .select('codigo_anatomico, descricao_procedimento, diretriz_utilizacao');

            // Excluir cirurgias (prefixo 3)
            query = query.not('codigo_anatomico', 'ilike', '3%');

            // Aplicar filtros de categoria
            if (categoryPrefixes.length > 0) {
                // Se for a categoria 'all' (2 e 4), simplificamos
                if (categoryPrefixes.includes('2') && categoryPrefixes.includes('4')) {
                    query = query.or('codigo_anatomico.ilike.2%,codigo_anatomico.ilike.4%');
                } else {
                    const filters = categoryPrefixes.map(pref => `codigo_anatomico.ilike.${pref}%`).join(',');
                    query = query.or(filters);
                }
            }

            // Busca unificada: busca no código (original e limpo) OU na descrição
            // Usamos .or() para abranger todas as possibilidades de uma vez
            const searchOr = [
                `descricao_procedimento.ilike.%${term}%`,
                `codigo_anatomico.ilike.%${term}%`
            ];

            if (cleanTerm.length >= 3) {
                searchOr.push(`codigo_anatomico.ilike.%${cleanTerm}%`);
            }

            query = query.or(searchOr.join(','));

            const { data, error } = await query.order('descricao_procedimento').limit(15);

            if (!error && data) {
                setSearchResults(data);
                setShowResults(data.length > 0);
            }
        } catch (err) {
            console.error('Error searching exams:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelect = (item: any) => {
        const selectedCode = item.codigo_anatomico;
        const selectedDesc = item.descricao_procedimento;
        const selectedDut = item.diretriz_utilizacao || '';

        setCode(selectedCode);
        setDescription(selectedDesc);
        setDut(selectedDut);
        setShowResults(false);

        onChange(exam.id, {
            code: selectedCode,
            description: selectedDesc,
            dut: selectedDut
        });
    };

    return (
        <div className="relative space-y-2">
            <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3 relative">
                    <div className="relative">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value);
                                searchExams(e.target.value);
                            }}
                            placeholder="Código ou busca..."
                            className={`w-full p-2.5 bg-white border rounded-lg text-sm text-slate-700 outline-none transition-colors border-slate-200 focus:ring-2 focus:ring-primary-500`}
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-3 h-3 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    {showResults && (
                        <div className="absolute z-50 left-0 w-[600px] mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 overflow-y-auto overflow-x-hidden">
                            {searchResults.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(item)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                >
                                    <p className="text-[10px] font-bold text-primary-600 mb-0.5">{item.codigo_anatomico}</p>
                                    <p className="text-sm text-slate-700 leading-tight">{item.descricao_procedimento}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="col-span-7 relative">
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            onChange(exam.id, { description: e.target.value });
                        }}
                        placeholder="Descrição do exame..."
                        className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 ${dut ? 'pr-11' : ''}`}
                    />

                    {dut && (
                        <button
                            title="Ver Diretriz de Utilização (DUT)"
                            onClick={() => setIsDUTOpen(true)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100 flex items-center justify-center animate-in fade-in zoom-in"
                        >
                            <Scale className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="col-span-1">
                    <input
                        type="number"
                        title="Quantidade"
                        min="1"
                        value={quantity}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setQuantity(val);
                            onChange(exam.id, { quantity: val });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 text-center focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                <div className="col-span-1 flex justify-center">
                    <button
                        onClick={() => onRemove(exam.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Remover"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <DUTModal
                isOpen={isDUTOpen}
                onClose={() => setIsDUTOpen(false)}
                procedureCode={code}
                procedureDescription={description}
                dutText={dut}
            />
        </div>
    );
};
