import React from 'react';
import { Anchor, Feather, Settings, Award, Sprout, ChevronRight } from 'lucide-react';
import { ExerciseMode } from '../types';

interface NavigationProps {
  currentMode: ExerciseMode | null;
  setMode: (mode: ExerciseMode) => void;
  userLevel: string;
  setUserLevel: (level: 'B2' | 'C1' | 'C2') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentMode, 
  setMode, 
  userLevel, 
  setUserLevel
}) => {
  const focusAreas = [
    { mode: ExerciseMode.SYNTAX, icon: Anchor, label: '句法攻克', desc: 'Logic & Syntax' },
    { mode: ExerciseMode.LEXICON, icon: Award, label: '词汇精雕', desc: 'Lexical Precision' },
    { mode: ExerciseMode.GRAMMAR, icon: Settings, label: '语法扫盲', desc: 'Fossilized Errors' },
  ];

  return (
    <div className="w-full md:w-72 bg-white text-slate-800 flex flex-col h-screen sticky top-0 border-r border-slate-100 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-20">
      {/* Header */}
      <div className="p-8 pb-6 cursor-pointer">
        <h1 className="text-2xl font-serif font-bold tracking-tight text-primary-700 flex items-center gap-2">
          <Sprout className="w-7 h-7 text-primary-500 fill-primary-100" />
          Eloquence
        </h1>
        <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide uppercase pl-9">Advanced English AI Coach</p>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        
        <div>
            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">练习入口</div>
            <button
                className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-primary-50 text-primary-900 shadow-sm border border-primary-100"
            >
                 <div className="mr-3 p-1.5 rounded-lg transition-colors bg-primary-100 text-primary-600">
                    <Feather className="h-5 w-5" />
                </div>
                <span className="text-base font-bold flex-1 text-left">沉浸式写作</span>
                <ChevronRight className="w-4 h-4 transition-transform text-primary-400 rotate-90" />
            </button>
        </div>

        <div className="mt-6 mb-4">
            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">核心评估体系</div>
            <div className="space-y-1">
                {focusAreas.map((item) => (
                <div
                    key={item.mode}
                    className="w-full flex flex-col items-start px-4 py-2.5 text-sm font-medium text-slate-400 cursor-default select-none"
                >
                    <div className="flex items-center w-full">
                    <div className="mr-3 text-slate-300">
                        <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                    </div>
                </div>
                ))}
            </div>
        </div>
      </div>

      {/* Level Selector */}
      <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-6">
        <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">当前能力等级</label>
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            {(['B2', 'C1', 'C2'] as const).map((lvl) => (
                <button
                key={lvl}
                onClick={() => setUserLevel(lvl)}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all duration-200 font-medium ${
                    userLevel === lvl ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
                >
                {lvl}
                </button>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};