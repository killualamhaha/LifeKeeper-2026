import React, { useState } from 'react';
import { Calendar, PenTool, Lightbulb, Save, ChevronLeft, ChevronRight, Plus, CheckCircle2, Check, Briefcase } from 'lucide-react';
import { COLORS } from '../constants';
import { TargetData } from '../types';

interface DayPlan {
  text: string;
  completed: boolean;
}

const YearlyTargets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'calendar' | 'reflection'>('strategy');
  const [strategyContent, setStrategyContent] = useState('');
  
  // Reflection State
  const [ideasContent, setIdeasContent] = useState('');
  const [businessContent, setBusinessContent] = useState('');
  const [currentReflectionWeek, setCurrentReflectionWeek] = useState(19);
  const [weeklyReflections, setWeeklyReflections] = useState<Record<number, string>>({});

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date(2026, 4, 1)); // May 2026
  const [monthlyStrategies, setMonthlyStrategies] = useState<Record<string, string>>({
    '2026-4': 'Focus on launching the sustainable collection and increasing engagement on Instagram reels.'
  });
  
  // Update state to store objects instead of strings
  const [dayPlans, setDayPlans] = useState<Record<string, DayPlan>>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
    setSelectedDay(null);
  };

  const currentMonthKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;
  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const year = viewDate.getFullYear();

  const handleDayPlanUpdate = (day: number, text: string) => {
    const key = `${currentMonthKey}-${day}`;
    setDayPlans(prev => {
        const existing = prev[key] || { completed: false };
        return { ...prev, [key]: { ...existing, text } };
    });
  };

  const toggleDayPlanCompletion = (day: number) => {
    const key = `${currentMonthKey}-${day}`;
    setDayPlans(prev => {
        const existing = prev[key];
        if (existing) {
            return { ...prev, [key]: { ...existing, completed: !existing.completed } };
        }
        return prev;
    });
  };

  const handleStrategyUpdate = (val: string) => {
    setMonthlyStrategies(prev => ({
        ...prev,
        [currentMonthKey]: val
    }));
  };

  const handleWeeklyReflectionUpdate = (val: string) => {
    setWeeklyReflections(prev => ({
        ...prev,
        [currentReflectionWeek]: val
    }));
  };

  const changeReflectionWeek = (offset: number) => {
    setCurrentReflectionWeek(prev => Math.max(1, Math.min(52, prev + offset)));
  };

  const getMonthForWeek = (week: number) => {
    const d = new Date(2026, 0, 1 + (week - 1) * 7);
    return d.toLocaleString('default', { month: 'long' });
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'strategy':
        return (
          <div className="h-full flex flex-col">
            <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-100 text-sm text-purple-800">
              <h3 className="font-semibold mb-1">Strategic Focus 2026</h3>
              <p>Define your core pillars. What does success look like this year?</p>
            </div>
            <textarea 
              className="flex-1 w-full bg-white/50 rounded-2xl p-6 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 text-slate-700 leading-relaxed text-lg"
              placeholder="Start drafting your master strategy..."
              value={strategyContent}
              onChange={(e) => setStrategyContent(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors shadow-lg shadow-purple-200">
                <Save size={18} /> Save Strategy
              </button>
            </div>
          </div>
        );
      case 'calendar':
        const daysInMonth = getDaysInMonth(viewDate);
        const startDay = getFirstDayOfMonth(viewDate); // 0 = Sunday
        const blanks = Array.from({ length: startDay });
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        // Current selected plan data
        const selectedPlanKey = selectedDay ? `${currentMonthKey}-${selectedDay}` : null;
        const currentPlan = selectedPlanKey ? dayPlans[selectedPlanKey] : null;

        return (
          <div className="h-full flex flex-col overflow-hidden">
             {/* Header & Navigation */}
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-4">
                 <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-500">
                   <ChevronLeft size={20} />
                 </button>
                 <h2 className="text-2xl font-light text-slate-700 w-48 text-center select-none">
                   <span className="font-medium">{monthName}</span> {year}
                 </h2>
                 <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-500">
                   <ChevronRight size={20} />
                 </button>
               </div>
               
               {/* Quick Month Jump */}
               <div className="text-xs font-mono text-slate-400 bg-white/40 px-3 py-1 rounded-full border border-white">
                 PLANNING MODE
               </div>
             </div>

             <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Left: Calendar Grid */}
                <div className="flex-1 flex flex-col overflow-y-auto pr-2">
                   {/* Monthly Strategy Input */}
                   <div className="mb-6 bg-pink-50/50 p-4 rounded-2xl border border-pink-100">
                      <div className="flex items-center gap-2 text-pink-700 font-medium mb-2 text-sm uppercase tracking-wide">
                        <Lightbulb size={16} /> Monthly Strategy
                      </div>
                      <textarea 
                        key={`strategy-${currentMonthKey}`}
                        className="w-full bg-transparent border-none resize-none focus:outline-none text-slate-700 text-sm placeholder:text-pink-300/70"
                        placeholder={`What is the main focus for ${monthName}?`}
                        rows={2}
                        value={monthlyStrategies[currentMonthKey] || ''}
                        onChange={(e) => handleStrategyUpdate(e.target.value)}
                      />
                   </div>

                   <div className="grid grid-cols-7 gap-2 mb-2">
                      {['S','M','T','W','T','F','S'].map((d, i) => (
                        <div key={i} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
                      ))}
                   </div>
                   
                   <div className="grid grid-cols-7 gap-2 auto-rows-fr">
                      {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                      {days.map((day) => {
                        const planKey = `${currentMonthKey}-${day}`;
                        const plan = dayPlans[planKey];
                        const hasPlan = plan && plan.text.trim().length > 0;
                        const isSelected = selectedDay === day;
                        const isCompleted = plan?.completed;

                        return (
                          <div 
                            key={day} 
                            onClick={() => setSelectedDay(day)}
                            className={`min-h-[80px] rounded-xl p-2 border transition-all cursor-pointer relative group flex flex-col ${
                              isSelected 
                                ? 'bg-white border-pink-300 shadow-md ring-2 ring-pink-100' 
                                : 'bg-white/40 border-transparent hover:bg-white/80 hover:border-slate-200'
                            }`}
                          >
                            <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-pink-600' : 'text-slate-400'}`}>{day}</span>
                            
                            {hasPlan ? (
                                <div className={`text-[10px] leading-tight p-1.5 rounded-lg border line-clamp-3 ${
                                    isCompleted 
                                    ? 'bg-emerald-100 border-emerald-200 text-emerald-800' 
                                    : 'bg-white/80 border-slate-100 text-slate-600'
                                }`}>
                                  <div className="flex gap-1">
                                    {isCompleted && <Check size={10} className="mt-0.5 shrink-0" />}
                                    <span className={isCompleted ? 'line-through opacity-80' : ''}>{plan.text}</span>
                                  </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={14} className="text-slate-300" />
                                </div>
                            )}
                          </div>
                        );
                      })}
                   </div>
                </div>

                {/* Right: Day Detail / Editor */}
                {selectedDay && (
                  <div className="w-72 glass-panel border-l-4 border-l-pink-200 rounded-3xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                         <h3 className="text-3xl font-light text-slate-700">{selectedDay}</h3>
                         <p className="text-sm text-pink-500 font-medium uppercase tracking-wider">{monthName}</p>
                       </div>
                       <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                       <div className="flex items-center justify-between">
                         <label className="text-xs font-bold text-slate-400 uppercase">Content Plan</label>
                         {currentPlan && currentPlan.text.trim().length > 0 && (
                             <button 
                               onClick={() => toggleDayPlanCompletion(selectedDay)}
                               className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                                   currentPlan.completed 
                                   ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                   : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                               }`}
                             >
                                 <CheckCircle2 size={12} />
                                 {currentPlan.completed ? 'Done' : 'Mark Done'}
                             </button>
                         )}
                       </div>
                       
                       <textarea 
                          className={`flex-1 bg-white/50 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-pink-100 text-slate-700 text-sm ${currentPlan?.completed ? 'opacity-50' : ''}`}
                          placeholder="Draft post caption, story ideas, or content themes..."
                          autoFocus
                          value={currentPlan?.text || ''}
                          onChange={(e) => handleDayPlanUpdate(selectedDay, e.target.value)}
                       />
                       
                       <div className="flex gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">#Social</span>
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded text-xs">#Blog</span>
                       </div>
                    </div>
                  </div>
                )}
             </div>
          </div>
        );
      case 'reflection':
        return (
          <div className="h-full flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 h-1/2">
              {/* Ideas Section */}
              <div className="glass-panel rounded-2xl p-4 bg-amber-50/50 flex flex-col">
                 <h3 className="font-medium text-amber-700 mb-2 flex items-center gap-2"><Lightbulb size={18}/> Ideas</h3>
                 <textarea 
                    className="w-full flex-1 bg-transparent resize-none focus:outline-none text-sm" 
                    placeholder="Capture fleeting inspirations..." 
                    value={ideasContent}
                    onChange={(e) => setIdeasContent(e.target.value)}
                 />
              </div>

              {/* Weekly Reflection Section */}
              <div className="glass-panel rounded-2xl p-4 bg-sky-50/50 flex flex-col">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-sky-700 flex items-center gap-2"><PenTool size={18}/> Weekly Reflection</h3>
                    <div className="flex items-center gap-2 text-sky-700">
                        <span className="text-xs font-bold text-sky-500/80 uppercase mr-1">{getMonthForWeek(currentReflectionWeek)}</span>
                        <button onClick={() => changeReflectionWeek(-1)} className="hover:bg-sky-100 rounded p-1 transition-colors"><ChevronLeft size={16}/></button>
                        <span className="text-xs font-mono font-bold">Week {currentReflectionWeek}</span>
                        <button onClick={() => changeReflectionWeek(1)} className="hover:bg-sky-100 rounded p-1 transition-colors"><ChevronRight size={16}/></button>
                    </div>
                 </div>
                 <textarea 
                    key={`reflection-${currentReflectionWeek}`}
                    className="w-full flex-1 bg-transparent resize-none focus:outline-none text-sm placeholder:text-sky-800/40" 
                    placeholder={`How did Week ${currentReflectionWeek} go? What wins did you celebrate?`}
                    value={weeklyReflections[currentReflectionWeek] || ''}
                    onChange={(e) => handleWeeklyReflectionUpdate(e.target.value)}
                 />
              </div>
            </div>
            
            {/* Business & Collaborations */}
            <div className="h-1/2 glass-panel rounded-2xl p-6 bg-indigo-50/30 flex flex-col">
               <h3 className="font-medium text-indigo-800 mb-4 flex items-center gap-2">
                 <Briefcase size={18}/> Business & Collaborations
               </h3>
               <textarea
                 className="w-full flex-1 bg-transparent resize-none focus:outline-none text-sm placeholder:text-indigo-800/40 leading-relaxed"
                 placeholder="Track active partnerships, client details, and business milestones..."
                 value={businessContent}
                 onChange={(e) => setBusinessContent(e.target.value)}
               />
            </div>
          </div>
        );
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('strategy')}
          className={`px-6 py-2 rounded-full transition-all ${activeTab === 'strategy' ? 'bg-purple-500 text-white shadow-lg shadow-purple-200' : 'bg-white/50 text-slate-500 hover:bg-white'}`}
        >
          Strategy
        </button>
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`px-6 py-2 rounded-full transition-all ${activeTab === 'calendar' ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-white/50 text-slate-500 hover:bg-white'}`}
        >
          Content Calendar
        </button>
        <button 
          onClick={() => setActiveTab('reflection')}
          className={`px-6 py-2 rounded-full transition-all ${activeTab === 'reflection' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white/50 text-slate-500 hover:bg-white'}`}
        >
          Reflection & Brand
        </button>
      </div>

      <div className="flex-1 glass-panel rounded-3xl p-6 border-white/60 shadow-xl overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default YearlyTargets;