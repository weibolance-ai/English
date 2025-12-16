import React, { useState } from 'react';
import { DailyProgress } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trophy, Target, Flame, Clock } from 'lucide-react';

interface ProgressDashboardProps {
  dailyProgress: DailyProgress;
  streakHistory: string[];
  setDailyGoal: (minutes: number) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ dailyProgress, streakHistory, setDailyGoal }) => {
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Goal Input State
  const [goalInput, setGoalInput] = useState(Math.ceil(dailyProgress.goalSeconds / 60));
  const [isSaved, setIsSaved] = useState(false);

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  // Adjust so Monday is 0, Sunday is 6 if desired, but standard 0=Sun is fine for rendering
  const dayOffset = firstDayOfMonth; 

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleSaveGoal = () => {
    if (goalInput > 0 && goalInput <= 180) {
      setDailyGoal(goalInput);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const isDateCompleted = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return streakHistory.includes(dateStr);
  };
  
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  // Stats
  const totalDays = streakHistory.length;
  // Simple current streak calc (this is a basic implementation)
  const calculateStreak = () => {
    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    // Check if today is done, if so start counting back, else start from yesterday
    let checkDate = new Date();
    if (!streakHistory.includes(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
        const str = checkDate.toISOString().split('T')[0];
        if (streakHistory.includes(str)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
            <CalendarIcon className="w-8 h-8" />
        </div>
        <div>
            <h2 className="text-2xl font-serif font-bold text-slate-800">进阶记录</h2>
            <p className="text-slate-500">坚持是时间的复利</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-orange-50 text-orange-500 rounded-full">
                <Flame className="w-6 h-6" />
            </div>
            <div>
                <div className="text-sm text-slate-400 font-bold uppercase">当前连胜</div>
                <div className="text-2xl font-bold text-slate-800">{calculateStreak()} <span className="text-sm font-normal text-slate-400">天</span></div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-500 rounded-full">
                <Target className="w-6 h-6" />
            </div>
            <div>
                <div className="text-sm text-slate-400 font-bold uppercase">累计打卡</div>
                <div className="text-2xl font-bold text-slate-800">{totalDays} <span className="text-sm font-normal text-slate-400">天</span></div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-purple-50 text-purple-500 rounded-full">
                <Trophy className="w-6 h-6" />
            </div>
            <div>
                <div className="text-sm text-slate-400 font-bold uppercase">今日状态</div>
                <div className="text-2xl font-bold text-slate-800">
                    {dailyProgress.completed ? '已达成' : `${Math.ceil((dailyProgress.goalSeconds - dailyProgress.secondsActive) / 60)} 分钟剩余`}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-slate-700">
                    {year}年 {month + 1}月
                </h3>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-7 gap-4 mb-4 text-center">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                    <div key={d} className="text-xs font-bold text-slate-400 uppercase">{d}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: dayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const completed = isDateCompleted(day);
                    const today = isToday(day);
                    
                    return (
                        <div key={day} className="flex flex-col items-center">
                            <div className={`
                                w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all
                                ${today ? 'ring-2 ring-primary-300 ring-offset-2' : ''}
                                ${completed 
                                    ? 'bg-primary-500 text-white shadow-md shadow-primary-200' 
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}
                            `}>
                                {day}
                            </div>
                            {completed && <div className="w-1 h-1 bg-primary-500 rounded-full mt-1" />}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Goal Settings Section */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                每日目标设定
            </h3>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-500 mb-2">
                        每日练习时长 (分钟)
                    </label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="range" 
                            min="5" 
                            max="60" 
                            step="5"
                            value={goalInput}
                            onChange={(e) => setGoalInput(Number(e.target.value))}
                            className="w-full accent-primary-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-lg font-bold text-primary-700 w-12 text-right">
                            {goalInput}
                        </span>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-500 leading-relaxed border border-slate-100">
                    科学建议：初学者建议设置在 <span className="font-bold text-slate-700">15-20分钟</span>。保持连续性比单次长时间突击更重要。
                </div>

                <button 
                    onClick={handleSaveGoal}
                    className={`w-full py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 ${
                        isSaved ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                >
                    {isSaved ? '设置已保存' : '保存设置'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};