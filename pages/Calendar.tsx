import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export const Calendar: React.FC = () => {
  const days = Array.from({ length: 35 }, (_, i) => {
    const day = i - 4; // Start from previous month
    return day;
  });

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button className="p-1.5 hover:bg-white rounded-md transition-all text-slate-500">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 font-bold text-sm text-slate-700">Outubro 2023</span>
                <button className="p-1.5 hover:bg-white rounded-md transition-all text-slate-500">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
            <button className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">
                Hoje
            </button>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex -space-x-2 mr-2">
                <img src="https://i.pravatar.cc/150?u=doc1" className="w-8 h-8 rounded-full border-2 border-white" alt="Doc 1" />
                <img src="https://i.pravatar.cc/150?u=doc2" className="w-8 h-8 rounded-full border-2 border-white" alt="Doc 2" />
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">+3</div>
            </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Filters */}
        <div className="w-64 border-r border-slate-200 p-6 overflow-y-auto hidden lg:block">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outubro 2023</h3>
                    <div className="flex text-slate-400 gap-1">
                        <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-slate-600" />
                        <ChevronRight className="w-4 h-4 cursor-pointer hover:text-slate-600" />
                    </div>
                </div>
                {/* Mini Calendar Grid Placeholder */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-600 font-medium mb-4">
                    <span className="text-slate-400">D</span><span className="text-slate-400">S</span><span className="text-slate-400">T</span><span className="text-slate-400">Q</span><span className="text-slate-400">Q</span><span className="text-slate-400">S</span><span className="text-slate-400">S</span>
                    {/* Simplified numbers */}
                    {Array.from({length: 35}, (_, i) => (
                        <span key={i} className={`p-1 rounded-full ${i === 24 ? 'bg-primary-600 text-white' : ''} ${i < 5 || i > 33 ? 'text-slate-300' : ''}`}>
                            {i < 5 ? 26 + i : i > 33 ? i - 33 : i - 4}
                        </span>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Médicos</h4>
                    <div className="space-y-2">
                        {['Dr. Ricardo Santos', 'Dra. Juliana Menezes', 'Dr. Fernando Costa'].map((doc, idx) => (
                            <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300" />
                                <span className="text-sm text-slate-600 group-hover:text-slate-900">{doc}</span>
                                <span className={`w-2 h-2 rounded-full ml-auto ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : 'bg-orange-500'}`}></span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Hospitais</h4>
                    <div className="space-y-2">
                        {['Hospital Santa Cruz', 'Albert Einstein'].map((hosp, idx) => (
                            <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300" />
                                <span className="text-sm text-slate-600 group-hover:text-slate-900">{hosp}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Main Grid */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-200">
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-bold text-slate-400 uppercase bg-slate-50">{day}</div>
                ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
                {days.map((day, idx) => {
                    const isToday = day === 25;
                    const dateNum = day <= 0 ? 30 + day : day > 31 ? day - 31 : day;
                    
                    return (
                        <div key={idx} className={`border-r border-b border-slate-100 p-2 min-h-[120px] ${isToday ? 'bg-blue-50/20' : ''} ${day <= 0 || day > 31 ? 'bg-slate-50/30' : ''}`}>
                            <span className={`text-sm font-semibold ${isToday ? 'text-primary-600' : day <= 0 || day > 31 ? 'text-slate-300' : 'text-slate-600'}`}>{dateNum}</span>
                            
                            {/* Mock Events */}
                            <div className="mt-2 space-y-1">
                                {day === 3 && (
                                    <div className="bg-emerald-100 text-emerald-700 border-l-2 border-emerald-500 px-2 py-1 rounded text-[10px] font-bold cursor-pointer hover:opacity-80">
                                        08:00 Carlos Mendes
                                    </div>
                                )}
                                {day === 24 && (
                                    <div className="bg-amber-100 text-amber-700 border-l-2 border-amber-500 px-2 py-1 rounded text-[10px] font-bold cursor-pointer hover:opacity-80">
                                        10:30 Ana Rezende
                                    </div>
                                )}
                                {day === 25 && (
                                    <>
                                        <div className="bg-emerald-100 text-emerald-700 border-l-2 border-emerald-500 px-2 py-1 rounded text-[10px] font-bold cursor-pointer hover:opacity-80">
                                            08:30 Carlos Mendes
                                        </div>
                                        <div className="bg-amber-100 text-amber-700 border-l-2 border-amber-500 px-2 py-1 rounded text-[10px] font-bold cursor-pointer hover:opacity-80">
                                            11:15 Maria Helena
                                        </div>
                                    </>
                                )}
                                {day === 26 && (
                                     <div className="bg-red-100 text-red-700 border-l-2 border-red-500 px-2 py-1 rounded text-[10px] font-bold cursor-pointer hover:opacity-80">
                                        07:00 Roberto Alencar
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
      
      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 bg-primary-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-primary-700 hover:scale-110 transition-all z-50">
          <Plus className="w-8 h-8" />
      </button>
    </div>
  );
};