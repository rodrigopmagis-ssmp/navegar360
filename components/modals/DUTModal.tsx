import React, { useEffect } from 'react';
import { X, Scale } from 'lucide-react';

interface DUTModalProps {
    isOpen: boolean;
    onClose: () => void;
    procedureCode: string;
    procedureDescription: string;
    dutText: string;
}

export const DUTModal: React.FC<DUTModalProps> = ({
    isOpen,
    onClose,
    procedureCode,
    procedureDescription,
    dutText
}) => {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative z-10 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 sm:p-6 flex items-start justify-between border-b border-slate-100 bg-white">
                    <div className="flex gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                            <Scale className="w-6 h-6" />
                        </div>
                        <div className="pt-1">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                Diretriz de Utilização (DUT)
                            </h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">
                                <span className="text-slate-700 font-bold">{procedureCode}</span> • {procedureDescription}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                        title="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 relative flex-1">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 sm:p-8">
                        <div className="prose prose-sm sm:prose-base prose-slate max-w-none whitespace-pre-wrap">
                            {dutText}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};
