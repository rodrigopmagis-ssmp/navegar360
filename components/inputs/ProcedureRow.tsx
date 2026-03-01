import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, Scale } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DUTModal } from '../modals/DUTModal';

export interface ProcedureType {
    id: string;
    code: string;
    description: string;
    porte?: string;
    anest?: string;
    dut?: string;
    quantity: number;
}

interface ProcedureRowProps {
    procedure: ProcedureType;
    isMain?: boolean;
    onSetMain?: (id: string) => void;
    onChange: (id: string, updates: Partial<ProcedureType>) => void;
    onRemove: (id: string) => void;
}

export const ProcedureRow: React.FC<ProcedureRowProps> = ({ procedure, isMain, onSetMain, onChange, onRemove }) => {
    const [code, setCode] = useState(procedure.code);
    const [description, setDescription] = useState(procedure.description);
    const [quantity, setQuantity] = useState(procedure.quantity);
    const [porte, setPorte] = useState(procedure.porte || '');
    const [anest, setAnest] = useState(procedure.anest || '');
    const [dut, setDut] = useState(procedure.dut || '');
    const [isSearching, setIsSearching] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [isDUTOpen, setIsDUTOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Efeito para sincronizar as mudanças feitas via código externo (se houver)
    useEffect(() => {
        const searchTimeout = setTimeout(async () => {
            const cleanterm = code.replace(/\D/g, '');

            if (code && code !== procedure.code) {
                // Pesquisa se tiver pelo menos 3 caracteres
                if (code.length >= 3) {
                    setIsSearching(true);
                    setNotFound(false);
                    try {
                        let query = supabase.from('cbhpm').select('codigo_anatomico, descricao_procedimento, categoria_porte, categoria_porte_anest, porte_anest_rs, diretriz_utilizacao');

                        // Busca unificada
                        const searchOr = [
                            `descricao_procedimento.ilike.%${code}%`,
                            `codigo_anatomico.ilike.%${code}%`
                        ];
                        if (cleanterm.length >= 3) searchOr.push(`codigo_anatomico.ilike.%${cleanterm}%`);

                        query = query.or(searchOr.join(','));

                        const { data, error } = await query.limit(10);

                        if (!error && data && data.length > 0) {
                            setSearchResults(data);
                            // Se for uma busca exata por código de 8 dígitos e houver apenas 1 resultado, preenche direto
                            if (cleanterm.length === 8 && data.length === 1) {
                                handleSelect(data[0]);
                            } else {
                                setShowResults(true);
                            }
                        } else {
                            setSearchResults([]);
                            setShowResults(false);
                            if (cleanterm.length === 8) {
                                setNotFound(true);
                                onChange(procedure.id, { code, description: '', porte: '', anest: '', dut: '' });
                            }
                        }
                    } catch (error) {
                        console.error("Erro ao buscar CBHPM:", error);
                    } finally {
                        setIsSearching(false);
                    }
                } else {
                    setSearchResults([]);
                    setShowResults(false);
                }
            } else if (!code) {
                setNotFound(false);
                onChange(procedure.id, { code });
            }
        }, 600);

        return () => clearTimeout(searchTimeout);
    }, [code]); // Depende apenas das keys de local state 'code'

    const handleSelect = (item: any) => {
        const selectedCode = item.codigo_anatomico;
        const selectedDesc = item.descricao_procedimento;
        const selectedPorte = item.categoria_porte || '';
        const selectedAnest = item.categoria_porte_anest || item.porte_anest_rs || '';
        const selectedDut = item.diretriz_utilizacao || '';

        setCode(selectedCode);
        setDescription(selectedDesc);
        setPorte(selectedPorte);
        setAnest(selectedAnest);
        setDut(selectedDut);
        setShowResults(false);
        setNotFound(false);

        onChange(procedure.id, {
            code: selectedCode,
            description: selectedDesc,
            porte: selectedPorte,
            anest: selectedAnest,
            dut: selectedDut
        });
    };

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1 flex justify-center items-center">
                    <label className="cursor-pointer p-2 flex items-center justify-center hover:bg-slate-50 rounded-full transition-colors" title="Marcar como procedimento principal">
                        <input
                            type="radio"
                            name="mainProcedure"
                            title="Definir como procedimento principal"
                            aria-label="Definir como procedimento principal"
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300 cursor-pointer"
                            checked={isMain}
                            onChange={() => onSetMain && onSetMain(procedure.id)}
                        />
                    </label>
                </div>
                <div className="col-span-2 relative">
                    <div className="relative">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Ex: 30715123"
                            className={`w-full p-2.5 bg-white border rounded-lg text-sm text-slate-700 outline-none transition-colors ${notFound ? 'border-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500'}`}
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
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
                <div className="col-span-5 relative">
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            onChange(procedure.id, { description: e.target.value });
                        }}
                        placeholder="Descreva o procedimento..."
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
                        type="text"
                        title="Porte"
                        value={porte}
                        readOnly
                        placeholder="-"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 text-center outline-none"
                    />
                </div>
                <div className="col-span-1">
                    <input
                        type="text"
                        title="Anestesia"
                        value={anest}
                        readOnly
                        placeholder="-"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 text-center outline-none"
                    />
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
                            onChange(procedure.id, { quantity: val });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 text-center focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
                <div className="col-span-1 flex justify-center">
                    <button
                        onClick={() => onRemove(procedure.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Remover"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {notFound && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs font-medium animate-in fade-in slide-in-from-top-1 w-full mt-1">
                    <AlertCircle className="w-4 h-4" />
                    Não localizamos um procedimento com este código de 8 dígitos TUSS/CBHPM na tabela. Você pode digitar a descrição manualmente acima.
                </div>
            )}

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
