import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, FileSignature, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CBHPMModal } from '../modals/CBHPMModal';
import { toast } from 'react-hot-toast';

interface CBHPMItem {
    id: string;
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

export const CBHPMSettings: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<CBHPMItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CBHPMItem | null>(null);

    const loadRecent = async () => {
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('cbhpm')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setResults(data || []);
        } catch (error) {
            console.error('Error fetching recent cbhpm:', error);
            toast.error('Erro ao buscar dados.');
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (!searchTerm) {
            loadRecent();
        }
    }, [searchTerm]);

    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) return;

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Remove non-numeric chars to check if it's a code search
                const cleanCode = searchTerm.replace(/\D/g, '');

                let query = supabase.from('cbhpm').select('*');

                // If it looks like a TUSS code search (numbers only, at least 4 digits) or mixed text
                // we'll do an OR search: ilike codigo_anatomico OR ilike descricao_procedimento
                const { data, error } = await query
                    .or(`codigo_anatomico.ilike.%${searchTerm}%,descricao_procedimento.ilike.%${searchTerm}%`)
                    .limit(50);

                if (error) throw error;
                setResults(data || []);
            } catch (error) {
                console.error('Error searching cbhpm:', error);
                toast.error('Erro na pesquisa.');
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleEdit = (item: CBHPMItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleSaved = () => {
        if (!searchTerm) {
            loadRecent();
        } else {
            // trigger re-search just by resetting it simply or keep the list as is 
            // Better to reload recent if we want to see it
            setSearchTerm('');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Tabela CBHPM (TUSS)
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Gerencie procedimentos, portes e diretrizes de utilização.
                    </p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Novo Procedimento
                </button>
            </div>

            <div className="p-6">
                {/* Search Bar */}
                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquise por código TUSS ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 dark:text-slate-200"
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                        </div>
                    )}
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4">Código TUSS</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4 text-center">Porte</th>
                                <th className="p-4 text-center">Anestesia</th>
                                <th className="p-4 text-center">DUT</th>
                                <th className="p-4 text-center w-16">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {results.length > 0 ? (
                                results.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
                                                {item.codigo_anatomico}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                            {item.descricao_procedimento}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 text-center">
                                            {item.categoria_porte || '-'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 text-center">
                                            {item.categoria_porte_anest || item.porte_anest_rs || '-'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 text-center">
                                            {item.diretriz_utilizacao ? (
                                                <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                                                    Sim
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            {isSearching ? (
                                                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                                    <p className="text-sm font-medium">Nenhum procedimento encontrado.</p>
                                                    <p className="text-xs mt-1">
                                                        Tente ajustar sua busca ou cadastre um novo.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CBHPMModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={selectedItem}
                onSaved={handleSaved}
            />
        </div>
    );
};
