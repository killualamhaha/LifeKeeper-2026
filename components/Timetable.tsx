import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Check, Utensils, Sparkles, ChefHat, Leaf, Coffee, Moon, Sun, Pencil, X, Save, ChevronLeft, ChevronRight, Calendar, Timer, Play, Pause, RotateCcw, Bell } from 'lucide-react';
import { COLORS } from '../constants';
import { ScheduleEvent, TodoItem, MealPlan } from '../types';
import { generateMealPlan } from '../services/geminiService';

const CUISINES = ['Balanced', 'Mediterranean', 'Asian', 'Vegetarian', 'Quick & Easy', 'Keto'];

const TEMPLATE_SCHEDULE_BY_DAY_INDEX: Record<number, ScheduleEvent[]> = {
    1: [ // Mon
      { id: '1', time: '08:00', activity: 'Morning Yoga' },
      { id: '2', time: '09:00', activity: 'Deep Work' },
      { id: '3', time: '12:00', activity: 'Nutrient Break' },
      { id: '101', time: '14:00', activity: 'Project Focus' },
      { id: '102', time: '16:00', activity: 'Reading Session' },
    ],
    2: [ // Tue
      { id: '4', time: '07:30', activity: 'Morning Run' },
      { id: '5', time: '09:30', activity: 'Client Sync' },
    ],
    3: [ // Wed
      { id: '6', time: '08:00', activity: 'Yoga Flow' },
      { id: '7', time: '14:00', activity: 'Strategy' },
    ],
    4: [], // Thu
    5: [ // Fri
      { id: '8', time: '16:00', activity: 'Weekly Review' },
    ],
    6: [ // Sat
      { id: '9', time: '10:00', activity: 'Farmers Market' },
    ],
    0: [ // Sun
       { id: '10', time: '11:00', activity: 'Family Brunch' },
    ]
};

const INITIAL_TODOS: TodoItem[] = [
    { id: '1', text: 'Review quarterly goals', completed: false, category: 'work' },
    { id: '2', text: 'Buy hydrangeas', completed: true, category: 'personal' },
];

const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); 
    const diff = date.getDate() - (day === 0 ? 6 : day - 1);
    const start = new Date(date.setDate(diff));
    start.setHours(0,0,0,0);
    return start;
};

const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
};

const Timetable: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));

  // --- DATA STATE WITH PERSISTENCE ---
  const [events, setEvents] = useState<Record<string, ScheduleEvent[]>>(() => {
      const saved = localStorage.getItem('timetable_events_v4');
      if (saved) return JSON.parse(saved);

      const seed: Record<string, ScheduleEvent[]> = {};
      const start = getStartOfWeek(new Date());
      for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          const dayIndex = d.getDay();
          const key = formatDateKey(d);
          if (TEMPLATE_SCHEDULE_BY_DAY_INDEX[dayIndex]) {
             seed[key] = TEMPLATE_SCHEDULE_BY_DAY_INDEX[dayIndex];
          }
      }
      return seed;
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('timetable_todos_v4');
    return saved ? JSON.parse(saved) : INITIAL_TODOS;
  });

  const [menus, setMenus] = useState<Record<string, MealPlan>>(() => {
      const saved = localStorage.getItem('timetable_menus_v4');
      return saved ? JSON.parse(saved) : {};
  });

  // Timer State
  const [activeTimer, setActiveTimer] = useState<{
    eventId: string;
    remainingSeconds: number;
    isRunning: boolean;
    totalSeconds: number;
  } | null>(null);

  const timerIntervalRef = useRef<number | null>(null);

  // Auto-Save Effect
  useEffect(() => { localStorage.setItem('timetable_events_v4', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('timetable_todos_v4', JSON.stringify(todos)); }, [todos]);
  useEffect(() => { localStorage.setItem('timetable_menus_v4', JSON.stringify(menus)); }, [menus]);

  // Soothing Chime Sound Logic
  const playSoothingSound = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = audioCtx.currentTime;
    // Harmonic arpeggio
    playNote(523.25, now, 1.5); // C5
    playNote(659.25, now + 0.4, 1.5); // E5
    playNote(783.99, now + 0.8, 1.5); // G5
    playNote(1046.50, now + 1.2, 2.0); // C6
  };

  // Timer Ticking
  useEffect(() => {
    if (activeTimer?.isRunning && activeTimer.remainingSeconds > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setActiveTimer(prev => {
          if (!prev) return null;
          if (prev.remainingSeconds <= 1) {
            playSoothingSound();
            return { ...prev, remainingSeconds: 0, isRunning: false };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [activeTimer?.isRunning, activeTimer?.remainingSeconds]);

  const weekDays = useMemo(() => {
      return Array.from({length: 7}, (_, i) => {
          const d = new Date(currentWeekStart);
          d.setDate(d.getDate() + i);
          return d;
      });
  }, [currentWeekStart]);

  const currentMonthName = currentWeekStart.toLocaleString('default', { month: 'long' });
  const currentWeekNum = getWeekNumber(currentWeekStart);
  const currentYear = currentWeekStart.getFullYear();

  const changeWeek = (offset: number) => {
      const newStart = new Date(currentWeekStart);
      newStart.setDate(newStart.getDate() + (offset * 7));
      setCurrentWeekStart(newStart);
      setSelectedDateKey(formatDateKey(newStart));
  };

  const jumpToToday = () => {
      const start = getStartOfWeek(new Date());
      setCurrentWeekStart(start);
      setSelectedDateKey(formatDateKey(new Date()));
  };

  const [ingredients, setIngredients] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('Balanced');
  const [isGeneratingMenu, setIsGeneratingMenu] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  
  const [editingMenuDateKey, setEditingMenuDateKey] = useState<string | null>(null);
  const [tempMenuData, setTempMenuData] = useState<MealPlan>({ breakfast: '', lunch: '', dinner: '', snack: '' });

  const [customTimerMinutes, setCustomTimerMinutes] = useState<string>('');

  const handleAddEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const val = e.currentTarget.value;
      const timeRegex = /^(\d{1,2}:\d{2})\s+(.*)$/;
      const match = val.match(timeRegex);
      let newTime = '--:--';
      let newActivity = val;
      if (match) {
        newTime = match[1];
        newActivity = match[2];
      }
      const newEvent: ScheduleEvent = {
        id: Date.now().toString(),
        time: newTime,
        activity: newActivity
      };
      setEvents(prev => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] || []), newEvent]
      }));
      e.currentTarget.value = '';
    }
  };

  const openEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setCustomTimerMinutes('');
    setIsEventModalOpen(true);
  };

  const saveEditedEvent = () => {
    if (editingEvent) {
      setEvents(prev => ({
        ...prev,
        [selectedDateKey]: (prev[selectedDateKey] || []).map(e => e.id === editingEvent.id ? editingEvent : e)
      }));
      setIsEventModalOpen(false);
      setEditingEvent(null);
    }
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => ({
      ...prev,
      [selectedDateKey]: (prev[selectedDateKey] || []).filter(e => e.id !== eventId)
    }));
    if (editingEvent?.id === eventId) {
      setIsEventModalOpen(false);
      setEditingEvent(null);
    }
    if (activeTimer?.eventId === eventId) setActiveTimer(null);
  };

  const startTimerForEvent = (eventId: string, minutes: number) => {
    setActiveTimer({
      eventId,
      remainingSeconds: minutes * 60,
      totalSeconds: minutes * 60,
      isRunning: true
    });
  };

  const toggleTimer = () => {
    if (activeTimer) setActiveTimer({ ...activeTimer, isRunning: !activeTimer.isRunning });
  };

  const resetTimer = () => {
    if (activeTimer) setActiveTimer({ ...activeTimer, remainingSeconds: activeTimer.totalSeconds, isRunning: false });
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleGenerateMenu = async () => {
    setIsGeneratingMenu(true);
    try {
      const result = await generateMealPlan(ingredients, selectedCuisine);
      const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedMenu = JSON.parse(cleanJson);
      const newMenus = { ...menus };
      const dayMap: Record<string, number> = { "Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6 };
      Object.entries(parsedMenu).forEach(([dayName, plan]) => {
          if (dayMap[dayName] !== undefined) {
             const targetDate = new Date(currentWeekStart);
             targetDate.setDate(targetDate.getDate() + dayMap[dayName]);
             newMenus[formatDateKey(targetDate)] = plan as MealPlan;
          }
      });
      setMenus(newMenus);
    } catch (e) {
      console.error("Failed to parse menu", e);
    } finally {
      setIsGeneratingMenu(false);
    }
  };

  const startEditMenu = (dateKey: string) => {
      const current = menus[dateKey] || { breakfast: '', lunch: '', dinner: '', snack: '' };
      setTempMenuData(current);
      setEditingMenuDateKey(dateKey);
  };

  const saveMenu = () => {
      if (editingMenuDateKey) {
          setMenus(prev => ({ ...prev, [editingMenuDateKey]: tempMenuData }));
          setEditingMenuDateKey(null);
      }
  };

  const handleAddTodo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: e.currentTarget.value,
        completed: false,
        category: 'personal'
      };
      setTodos(prev => [...prev, newTodo]);
      e.currentTarget.value = '';
    }
  };
  const toggleTodo = (id: string) => setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTodo = (id: string) => setTodos(prev => prev.filter(t => t.id !== id));

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto p-1 max-w-7xl mx-auto w-full relative">
      {/* Time Capsule Schedule - Fixed height for internal scrollability */}
      <div className={`glass-panel p-6 rounded-3xl ${COLORS.macaron.blue.border} border-t-4 flex flex-col h-[520px] shrink-0`}>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 shrink-0">
           <div className="flex items-center gap-4">
             <h2 className="text-2xl font-light text-slate-700 tracking-wide">Time Capsule</h2>
             <button onClick={jumpToToday} className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-widest">
                 TODAY
             </button>
           </div>
           
           <div className="flex items-center gap-3 bg-white/40 p-1.5 rounded-2xl border border-white shadow-sm">
             <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-white rounded-xl transition-colors text-slate-500"><ChevronLeft size={18}/></button>
             <span className="text-xs font-mono text-slate-600 font-bold min-w-[150px] text-center">
                {currentMonthName} • Week {currentWeekNum}, {currentYear}
             </span>
             <button onClick={() => changeWeek(1)} className="p-1.5 hover:bg-white rounded-xl transition-colors text-slate-500"><ChevronRight size={18}/></button>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 flex-1 overflow-hidden">
          {weekDays.map(date => {
            const dateKey = formatDateKey(date);
            const isSelected = selectedDateKey === dateKey;
            const isToday = formatDateKey(new Date()) === dateKey;
            const dayEvents = events[dateKey] || [];
            
            return (
                <div 
                  key={dateKey} 
                  onClick={() => setSelectedDateKey(dateKey)}
                  className={`rounded-[2rem] p-3 transition-all cursor-pointer flex flex-col gap-3 relative border-2 ${
                    isSelected 
                    ? 'bg-white/50 border-amber-200/40 shadow-xl ring-4 ring-amber-50/20' 
                    : 'bg-transparent border-transparent hover:bg-white/20'
                  } h-full overflow-hidden`}
                >
                   <div className={`text-center py-1 flex flex-col items-center shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`}>
                     <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                     <span className={`text-xl font-light leading-none mt-1 ${isToday ? 'bg-amber-500 text-white w-8 h-8 flex items-center justify-center rounded-full shadow-lg shadow-amber-200' : ''}`}>
                         {date.getDate()}
                     </span>
                   </div>
    
                   <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 pb-4 custom-scrollbar">
                     {dayEvents.map(item => {
                       const isTimerActive = activeTimer?.eventId === item.id;
                       return (
                        <div 
                          key={item.id} 
                          onClick={(e) => { e.stopPropagation(); openEditEvent(item); }}
                          className={`bg-white/90 p-3 rounded-2xl shadow-sm border border-white transition-all group cursor-pointer relative ${isTimerActive ? 'ring-2 ring-emerald-300 bg-emerald-50/50' : 'hover:border-amber-100 hover:shadow-md'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                             <div className="text-[10px] font-mono text-slate-400 font-bold">{item.time}</div>
                             {isTimerActive && (
                               <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 animate-pulse">
                                 <Timer size={10} /> {formatTimer(activeTimer.remainingSeconds)}
                               </div>
                             )}
                          </div>
                          <div className="text-xs text-slate-700 font-medium leading-snug">{item.activity}</div>
                          
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={(e) => { e.stopPropagation(); openEditEvent(item); }}
                               className="p-1.5 text-slate-400 hover:text-amber-500 bg-white rounded-lg shadow-sm"
                             >
                               <Pencil size={12} />
                             </button>
                             <button 
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 if (isTimerActive) {
                                   toggleTimer();
                                 } else {
                                   startTimerForEvent(item.id, 25); 
                                 }
                               }}
                               className={`p-1.5 rounded-lg shadow-sm transition-colors ${isTimerActive ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'text-slate-400 hover:text-emerald-500 bg-white'}`}
                             >
                               <Timer size={12} />
                             </button>
                          </div>
                        </div>
                       );
                     })}
                   </div>
                </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100/50 flex items-center gap-4 shrink-0">
           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block whitespace-nowrap opacity-60">
             Add to <span className="text-amber-500">{new Date(selectedDateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric'})}</span>
           </div>
           <div className="flex-1 relative group">
             <input 
              className="w-full p-4 pl-6 bg-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-100/30 placeholder:text-slate-400 text-sm transition-all border border-transparent focus:bg-white"
              placeholder={`Type '14:00 Meeting' to add...`}
              onKeyDown={handleAddEvent}
             />
             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-amber-400 transition-colors">
               <Plus size={20} />
             </div>
           </div>
        </div>
      </div>

      {/* Focus Flow / Todo List */}
      <div className={`glass-panel p-6 rounded-3xl ${COLORS.macaron.pink.border} border-t-4 shadow-sm shrink-0`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-slate-700 tracking-wide">Focus Flow</h2>
          <div className="flex gap-2">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg">Tasks: {todos.length}</span>
          </div>
        </div>
        <div className="mb-6 relative group">
          <input 
            type="text" 
            className="w-full p-4 pl-6 rounded-2xl bg-white/60 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-rose-100/30 transition-all placeholder:text-slate-400 font-light focus:bg-white"
            placeholder="Add a priority item..."
            onKeyDown={handleAddTodo}
          />
          <Plus size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-rose-400 transition-colors" />
        </div>
        <div className="space-y-3 pb-4">
          {todos.length === 0 && <div className="text-center py-8 text-slate-400 italic text-sm">Clear mind, focused day.</div>}
          {todos.map(todo => (
            <div key={todo.id} className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl hover:bg-white transition-all group border border-transparent hover:border-rose-100/50 hover:shadow-lg">
              <button 
                onClick={() => toggleTodo(todo.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${todo.completed ? 'bg-rose-400 border-rose-400 scale-110 shadow-lg shadow-rose-100' : 'border-slate-200 hover:border-rose-300'}`}
              >
                {todo.completed && <Check size={14} className="text-white" />}
              </button>
              <span className={`flex-1 text-lg font-light transition-all ${todo.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {todo.text}
              </span>
              <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all p-2 hover:bg-red-50 rounded-xl">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Food Menu */}
      <div className={`glass-panel p-6 rounded-3xl ${COLORS.macaron.green.border} border-t-4 flex flex-col shadow-sm pb-10`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
           <div>
             <h2 className="text-2xl font-light text-slate-700 tracking-wide flex items-center gap-2">
               Weekly Fuel <Leaf size={20} className="text-emerald-500"/>
             </h2>
             <p className="text-sm text-slate-400 mt-1">AI-Powered meal orchestration.</p>
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:flex-none">
                <ChefHat size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  className="pl-9 pr-4 py-3 bg-white/60 rounded-xl text-sm w-full md:w-72 border border-transparent focus:border-emerald-200 focus:outline-none transition-all shadow-inner focus:bg-white"
                  placeholder="Kitchen stock (e.g. salmon, kale)..."
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                />
             </div>
             <button 
              onClick={handleGenerateMenu}
              disabled={isGeneratingMenu}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center gap-2 font-medium"
             >
               {isGeneratingMenu ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Sparkles size={18} />}
               <span>Generate</span>
             </button>
           </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6 snap-x no-scrollbar">
          {weekDays.map(date => {
            const dateKey = formatDateKey(date);
            const dayMenu = menus[dateKey];
            const isEditing = editingMenuDateKey === dateKey;
            
            return (
              <div key={dateKey} className="snap-center flex-shrink-0 w-72 bg-white/40 border border-white rounded-[2.5rem] p-6 hover:bg-white/70 transition-all group relative hover:shadow-xl hover:-translate-y-1">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric'})}
                  </div>
                  {!isEditing && (
                    <button 
                      onClick={() => startEditMenu(dateKey)}
                      className="text-slate-300 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-white rounded-xl"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                     <div>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5"><Sun size={12} className="text-amber-400"/> Breakfast</div>
                       <input className="w-full p-2.5 text-xs bg-white rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-100" value={tempMenuData.breakfast} onChange={e => setTempMenuData({...tempMenuData, breakfast: e.target.value})} placeholder="Morning fuel..."/>
                     </div>
                     <div>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5"><Sun size={12} className="text-orange-400"/> Lunch</div>
                       <input className="w-full p-2.5 text-xs bg-white rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-100" value={tempMenuData.lunch} onChange={e => setTempMenuData({...tempMenuData, lunch: e.target.value})} placeholder="Midday energy..."/>
                     </div>
                     <div>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5"><Moon size={12} className="text-indigo-400"/> Dinner</div>
                       <input className="w-full p-2.5 text-xs bg-white rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-100" value={tempMenuData.dinner} onChange={e => setTempMenuData({...tempMenuData, dinner: e.target.value})} placeholder="Evening feast..."/>
                     </div>
                     <div className="flex gap-2 mt-4">
                        <button onClick={saveMenu} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md">SAVE</button>
                        <button onClick={() => setEditingMenuDateKey(null)} className="flex-1 bg-slate-100 text-slate-500 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200">CANCEL</button>
                     </div>
                  </div>
                ) : (
                  dayMenu ? (
                    <div className="space-y-5">
                      <div className="hover:translate-x-1 transition-transform">
                         <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5"><Sun size={12} className="text-amber-400"/> Breakfast</div>
                         <div className="text-sm text-slate-700 leading-snug font-medium min-h-[1.4em]">{dayMenu.breakfast}</div>
                      </div>
                      <div className="hover:translate-x-1 transition-transform">
                         <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5"><Sun size={12} className="text-orange-400"/> Lunch</div>
                         <div className="text-sm text-slate-700 leading-snug font-medium min-h-[1.4em]">{dayMenu.lunch}</div>
                      </div>
                      <div className="hover:translate-x-1 transition-transform">
                         <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5"><Moon size={12} className="text-indigo-400"/> Dinner</div>
                         <div className="text-sm text-slate-700 leading-snug font-medium min-h-[1.4em]">{dayMenu.dinner}</div>
                      </div>
                      <div className="pt-4 border-t border-dashed border-slate-100 mt-2">
                         <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5"><Coffee size={12} className="text-pink-400"/> Snack</div>
                         <div className="text-xs text-slate-500 italic font-medium opacity-80">{dayMenu.snack}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-56 flex flex-col items-center justify-center text-slate-300 gap-3">
                      <div className="p-4 bg-emerald-50/50 rounded-full text-emerald-200"><Utensils size={32} /></div>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60">No plan set</span>
                      <button 
                        onClick={() => startEditMenu(dateKey)}
                        className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-emerald-100"
                      >
                        ADD MANUALLY
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timer Overlay / Controls */}
      {activeTimer && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-8 duration-500">
           <div className={`glass-panel p-6 rounded-[2.5rem] shadow-2xl border-t-4 flex items-center gap-6 ${activeTimer.remainingSeconds === 0 ? 'bg-emerald-50 border-emerald-400 animate-bounce' : 'border-emerald-200'}`}>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Focus Flow Active</span>
                 <span className={`text-4xl font-light font-mono tracking-tighter ${activeTimer.remainingSeconds === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                   {formatTimer(activeTimer.remainingSeconds)}
                 </span>
              </div>
              
              <div className="flex items-center gap-2">
                 {activeTimer.remainingSeconds === 0 ? (
                    <button onClick={() => setActiveTimer(null)} className="p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all group">
                       <Check size={24} className="group-hover:scale-110 transition-transform"/>
                    </button>
                 ) : (
                    <>
                      <button onClick={toggleTimer} className={`p-4 rounded-full shadow-lg transition-all ${activeTimer.isRunning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-500 text-white'}`}>
                        {activeTimer.isRunning ? <Pause size={24} /> : <Play size={24} />}
                      </button>
                      <button onClick={resetTimer} className="p-4 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors">
                        <RotateCcw size={24} />
                      </button>
                      <button onClick={() => setActiveTimer(null)} className="p-2 text-slate-300 hover:text-red-400 transition-colors ml-2">
                        <X size={20}/>
                      </button>
                    </>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {isEventModalOpen && editingEvent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white/10 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md border border-slate-100">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-light text-slate-700">Refine Event</h3>
               <button onClick={() => setIsEventModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><X size={24}/></button>
             </div>
             
             <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Scheduled Time</label>
                     <input 
                       className="w-full p-4 bg-slate-50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-100/30 text-slate-700 font-mono"
                       value={editingEvent.time}
                       onChange={(e) => setEditingEvent({...editingEvent, time: e.target.value})}
                     />
                  </div>
                  <div className="flex flex-col">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Focus Timer</label>
                     <div className="flex flex-wrap gap-2">
                        {[15, 25, 50].map(m => (
                          <button 
                            key={m} 
                            onClick={() => { startTimerForEvent(editingEvent.id, m); setIsEventModalOpen(false); }}
                            className="px-3 py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100"
                          >
                            {m}m
                          </button>
                        ))}
                        <div className="flex items-center bg-slate-50 rounded-xl border border-transparent focus-within:border-emerald-100 focus-within:ring-2 focus-within:ring-emerald-50">
                            <input 
                              type="number" 
                              placeholder="Min" 
                              className="w-12 bg-transparent text-center text-xs font-bold text-slate-600 outline-none p-2"
                              value={customTimerMinutes}
                              onChange={(e) => setCustomTimerMinutes(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = parseInt(customTimerMinutes);
                                  if (val > 0) {
                                    startTimerForEvent(editingEvent.id, val);
                                    setIsEventModalOpen(false);
                                  }
                                }
                              }}
                            />
                            <button 
                              onClick={() => {
                                const val = parseInt(customTimerMinutes);
                                if (val > 0) {
                                  startTimerForEvent(editingEvent.id, val);
                                  setIsEventModalOpen(false);
                                }
                              }}
                              className="p-2 text-emerald-500 hover:text-emerald-600"
                            >
                              <Timer size={14} />
                            </button>
                        </div>
                     </div>
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Activity Essence</label>
                  <input 
                    className="w-full p-4 bg-slate-50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-100/30 text-slate-700 text-lg font-light"
                    value={editingEvent.activity}
                    onChange={(e) => setEditingEvent({...editingEvent, activity: e.target.value})}
                    autoFocus
                  />
               </div>

               <div className="flex gap-3 pt-4">
                 <button onClick={() => deleteEvent(editingEvent.id)} className="p-4 text-red-400 bg-red-50 rounded-2xl hover:bg-red-100 hover:text-red-500 transition-all"><Trash2 size={24}/></button>
                 <button onClick={saveEditedEvent} className="flex-1 bg-slate-800 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                   <Save size={20}/> Save Changes
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;