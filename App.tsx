import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { ExerciseArea } from './components/ExerciseArea';
import { ExerciseMode, UserState } from './types';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<ExerciseMode>(ExerciseMode.SYNTAX);
  const [userState, setUserState] = useState<UserState>({
    apiKey: process.env.API_KEY || '', 
    level: 'C1',
    topic: 'Modern Philosophy', 
  });
  
  const setTopic = (topic: string) => setUserState(prev => ({ ...prev, topic }));
  const setLevel = (level: 'B2' | 'C1' | 'C2') => setUserState(prev => ({ ...prev, level }));

  if (!userState.apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-800 p-4">
        <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-2">API Key Missing</h1>
            <p>Please ensure the environment variable API_KEY is set to use this application.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white text-slate-900 font-sans">
      <Navigation 
        currentMode={currentMode} 
        setMode={setCurrentMode} 
        userLevel={userState.level}
        setUserLevel={setLevel}
      />
      
      <main className="flex-1 flex flex-col h-screen bg-white">
        {/* Changed from absolute to flex flow to prevent overlap */}
        <header className="shrink-0 flex justify-end px-8 pt-6 pb-2 hidden md:flex z-10">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-600 bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100 shadow-sm uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                AI Powered Environment
            </div>
        </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto scroll-smooth relative px-6 pb-6 pt-2">
            <ExerciseArea 
                apiKey={userState.apiKey}
                mode={currentMode}
                topic={userState.topic}
                setTopic={setTopic}
                level={userState.level}
            />
        </div>
      </main>
    </div>
  );
}