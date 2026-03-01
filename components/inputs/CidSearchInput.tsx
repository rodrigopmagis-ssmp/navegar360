import React, { useState, useEffect, useRef } from 'react';
import { Search, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CidSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

interface CidResult {
    code: string;
    description: string;
}

export const CidSearchInput: React.FC<CidSearchInputProps> = ({ value, onChange, placeholder }) => {
    const [searchTerm, setSearchTerm] = useState(value);
    const [results, setResults] = useState<CidResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchTimeout = setTimeout(async () => {
            // Se não for um valor exato igual ao selecionado e tiver pelo menos 2 caracteres
            if (searchTerm && searchTerm !== value && searchTerm.length >= 2) {
                setIsSearching(true);
                try {
                    // Busca LIKE no código ou na descrição
                    const { data, error } = await supabase
                        .from('cid10')
                        .select('code, description')
                        .or(`code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                        .limit(10);

                    if (error) throw error;

                    setResults(data || []);
                    setShowDropdown(true);
                } catch (error) {
                    console.error("Erro ao buscar CIDs:", error);
                } finally {
                    setIsSearching(false);
                }
            } else if (!searchTerm || searchTerm.length < 2) {
                setResults([]);
                setShowDropdown(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(searchTimeout);
    }, [searchTerm, value]);

    const handleSelect = (result: CidResult) => {
        const formattedCid = `${result.code} - ${result.description}`;
        setSearchTerm(formattedCid);
        onChange(formattedCid);
        setShowDropdown(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        // Ao apagar, se limparmos o campo, limpamos o valor
                        if (e.target.value === '') {
                            onChange('');
                        }
                    }}
                    onFocus={() => {
                        if (results.length > 0) setShowDropdown(true);
                    }}
                    placeholder={placeholder || "Buscar por código ou descrição..."}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none uppercase"
                />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {showDropdown && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                    {results.map((result) => (
                        <button
                            key={result.code}
                            onClick={() => handleSelect(result)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex flex-col gap-0.5"
                        >
                            <span className="text-sm font-bold text-slate-800">{result.code}</span>
                            <span className="text-xs text-slate-500 line-clamp-1">{result.description}</span>
                        </button>
                    ))}
                </div>
            )}

            {showDropdown && results.length === 0 && searchTerm.length >= 2 && !isSearching && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-4 text-center">
                    <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">Nenhum CID encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">Tente buscar por outro código ou palavra-chave.</p>
                </div>
            )}
        </div>
    );
};
