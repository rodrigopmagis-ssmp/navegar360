import React from 'react';
import { RotateCw } from 'lucide-react';

export const Home: React.FC = () => {
    return (
        <div className="relative h-full w-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
            {/* Background Image with Blur and Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 opacity-[0.35]"
                style={{
                    backgroundImage: "url('/assets/logo_landing.png')"
                }}
            />

            {/* Overlay Gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-1000">
                <div className="flex items-center gap-4 mb-6 drop-shadow-xl">
                    <div className="bg-primary-600 p-4 rounded-2xl shadow-xl shadow-primary-600/20">
                        <RotateCw className="w-12 h-12 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">
                            NAVEGAR <span className="text-primary-600">360</span>
                        </h1>
                        <p className="text-[10px] font-bold text-primary-600 uppercase tracking-[0.4em] mt-1 opacity-80">
                            Você opera, nós navegamos
                        </p>
                    </div>
                </div>

                {/* Subtle glassmorphism card for a premium touch */}
                <div className="bg-white/30 backdrop-blur-md border border-white/40 px-8 py-3 rounded-full shadow-lg">
                    <p className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
                        Plataforma de Gestão Cirúrgica Inteligente
                    </p>
                </div>
            </div>

            {/* Bottom corner credit/info */}
            <div className="absolute bottom-8 right-8 text-slate-400 text-xs font-bold uppercase tracking-widest opacity-50">
                © 2024 NAVEGAR 360 • v1.0
            </div>
        </div>
    );
};
