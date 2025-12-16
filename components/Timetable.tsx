import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Check, Utensils, Sparkles, ChefHat, Leaf, Coffee, Moon, Sun, Pencil, X, Save, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { COLORS } from '../constants';
import { ScheduleEvent, TodoItem, MealPlan } from '../types';
import { generateMealPlan } from '../services/geminiService';

const CUISINES = ['Balanced', 'Mediterranean', 'Asian', 'Vegetarian', 'Quick & Easy', 'Keto'];

// Initial template to seed the CURRENT week if empty
const TEMPLATE_SCHEDULE_BY_DAY_INDEX: Record<number, ScheduleEvent[]> = {
    1: [ // Mon
      { id: '1', time: '08:00', activity: 'Morning Yoga' },
      { id: '2', time: '09:00', activity: 'Deep Work' },
      { id: '3', time: '12:00', activity: 'Nutrient Break' },
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
    const day = date.getDay(); // 0 is Sunday
    // Adjust to make Monday (1) the start of the week. 
    // If Sunday (0), go back 6 days. Else go back (day - 1) days.
    const diff = date.getDate() - (day === 0 ? 6 : day - 1);
    const start = new Date(date.setDate(diff));
    start.setHours(0,0,0,0);
    return start;
};

const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
};

const Timetable: React.FC = () => {
  // Navigation State
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));

  // --- DATA STATE WITH PERSISTENCE ---
  
  // Events: Keyed by "YYYY-MM-DD"
  const [events, setEvents] = useState<Record<string, ScheduleEvent[]>>(() => {
      const saved = localStorage.getItem('timetable_events_v2');
      if (saved) return JSON.parse(saved);

      // Seed current week with template if empty
      const seed: Record<string, ScheduleEvent[]> = {};
      const start = getStartOfWeek(new Date());
      for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          const dayIndex = d.getDay();
          const key = formatDateKey(d);
          // Only seed if we are strictly in the "initial" state logic (though here we just do it once on fresh load)
          // We map the static template to the dynamic dates of THIS week
          if (TEMPLATE_SCHEDULE_BY_DAY_INDEX[dayIndex]) {
             seed[key] = TEMPLATE_SCHEDULE_BY_DAY_INDEX[dayIndex];
          }
      }
      return seed;
  });

  // Todos: Global list (carrying over)
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('timetable_todos');
    return saved ? JSON.parse(saved) : INITIAL_TODOS;
  });

  // Menu: Keyed by "YYYY-MM-DD"
  const [menus, setMenus] = useState<Record<string, MealPlan>>(() => {
      const saved = localStorage.getItem('timetable_menus_v2');
      return saved ? JSON.parse(saved) : {};
  });

  // Persistence Effects
  useEffect(() => { localStorage.setItem('timetable_events_v2', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('timetable_todos', JSON.stringify(todos)); }, [todos]);
  useEffect(() => { localStorage.setItem('timetable_menus_v2', JSON.stringify(menus)); }, [menus]);


  // Computed current week days
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

  // Handlers for Navigation
  const changeWeek = (offset: number) => {
      const newStart = new Date(currentWeekStart);
      newStart.setDate(newStart.getDate() + (offset * 7));
      setCurrentWeekStart(newStart);
      // Select the monday of the new week by default
      setSelectedDateKey(formatDateKey(newStart));
  };

  const jumpToToday = () => {
      const start = getStartOfWeek(new Date());
      setCurrentWeekStart(start);
      setSelectedDateKey(formatDateKey(new Date()));
  };

  // UI State for Features
  const [ingredients, setIngredients] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('Balanced');
  const [isGeneratingMenu, setIsGeneratingMenu] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  
  // Menu Editing
  const [editingMenuDateKey, setEditingMenuDateKey] = useState<string | null>(null);
  const [tempMenuData, setTempMenuData] = useState<MealPlan>({ breakfast: '', lunch: '', dinner: '', snack: '' });


  // --- EVENT LOGIC ---

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
  };


  // --- MENU LOGIC ---
  const handleGenerateMenu = async () => {
    setIsGeneratingMenu(true);
    try {
      const result = await generateMealPlan(ingredients, selectedCuisine);
      const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedMenu = JSON.parse(cleanJson);
      
      // parsedMenu returns { "Mon": ..., "Tue": ... }
      // We need to map these to the ACTUAL dates of the current displayed week
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
          setMenus(prev => ({
              ...prev,
              [editingMenuDateKey]: tempMenuData
          }));
          setEditingMenuDateKey(null);
      }
  };

  // --- TODO LOGIC ---
  const handleAddTodo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: e.currentTarget.value,
        completed: false,
        category: 'personal'
      };
      setTodos([...todos, newTodo]);
      e.currentTarget.value = '';
    }
  };
  const toggleTodo = (id: string) => setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTodo = (id: string) => setTodos(todos.filter(t => t.id !== id));


  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto p-1 max-w-7xl mx-auto w-full relative">
      {/* Section 1: Schedule */}
      <div className={`glass-panel p-6 rounded-3xl ${COLORS.macaron.blue.border} border-t-4 flex flex-col min-h-[450px]`}>
        {/* Header & Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
           <div className="flex items-center gap-4">
             <h2 className="text-2xl font-light text-slate-700 tracking-wide">Time Capsule</h2>
             <button onClick={jumpToToday} className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors">
                 TODAY
             </button>
           </div>
           
           <div className="flex items-center gap-3 bg-white/40 p-1.5 rounded-xl border border-white">
             <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-white rounded-lg transition-colors text-slate-500"><ChevronLeft size={18}/></button>
             <span className="text-xs font-mono text-slate-600 font-bold min-w-[140px] text-center">
                {currentMonthName} • Week {currentWeekNum}, {currentYear}
             </span>
             <button onClick={() => changeWeek(1)} className="p-1 hover:bg-white rounded-lg transition-colors text-slate-500"><ChevronRight size={18}/></button>
           </div>
        </div>
        
        {/* Weekly Grid View */}
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
                  className={`rounded-2xl p-2 transition-all cursor-pointer flex flex-col gap-2 relative border-2 ${
                    isSelected 
                    ? 'bg-white/40 border-amber-200/50 shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-white/20'
                  }`}
                >
                   {/* Day Header */}
                   <div className={`text-center py-1 flex flex-col items-center ${isSelected ? 'text-amber-600' : 'text-slate-400'}`}>
                     <span className="text-[10px] font-bold uppercase tracking-wider">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                     <span className={`text-lg font-light leading-none ${isToday ? 'bg-amber-500 text-white w-7 h-7 flex items-center justify-center rounded-full shadow-md mt-1' : ''}`}>
                         {date.getDate()}
                     </span>
                   </div>
    
                   {/* Events Container */}
                   <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 pb-2 min-h-[100px]">
                     {dayEvents.map(item => (
                       <div 
                        key={item.id} 
                        onClick={(e) => { e.stopPropagation(); openEditEvent(item); }}
                        className="bg-white/80 p-2.5 rounded-xl shadow-sm border border-white hover:border-amber-100 transition-colors group cursor-pointer relative"
                       >
                         <div className="text-[10px] font-mono text-slate-400 mb-0.5">{item.time}</div>
                         <div className="text-xs text-slate-700 font-medium leading-snug">{item.activity}</div>
                         <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil size={10} className="text-slate-300" />
                         </div>
                       </div>
                     ))}
                     {dayEvents.length === 0 && (
                       <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Plus size={12} className="text-slate-300"/>
                       </div>
                     )}
                   </div>
                </div>
            );
          })}
        </div>

        {/* Add Event Input */}
        <div className="mt-4 pt-4 border-t border-slate-100/50 flex items-center gap-4">
           <div className="text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:block whitespace-nowrap">
             Add to <span className="text-amber-500 font-bold">{new Date(selectedDateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric'})}</span>
           </div>
           <div className="flex-1 relative">
             <input 
              className="w-full p-3 pl-4 bg-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-100 placeholder:text-slate-400 text-sm transition-all"
              placeholder={`Type '14:00 Meeting' to add...`}
              onKeyDown={handleAddEvent}
             />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
               <Plus size={16} />
             </div>
           </div>
        </div>
      </div>

      {/* Section 2: Todo List */}
      <div className={`glass-panel p-6 rounded-3xl ${COLORS.macaron.pink.border} border-t-4`}>
        <h2 className="text-2xl font-light mb-6 text-slate-700 tracking-wide">Focus Flow</h2>
        <div className="mb-6">
          <input 
            type="text" 
            className="w-full p-4 rounded-2xl bg-white/60 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all placeholder:text-slate-400 font-light"
            placeholder="What needs attention?"
            onKeyDown={handleAddTodo}
          />
        </div>
        <div className="space-y-3">
          {todos.map(todo => (
            <div key={todo.id} className="flex items-center gap-4 p-4 bg-white/40 rounded-2xl hover:bg-white/90 transition-all group">
              <button 
                onClick={() => toggleTodo(todo.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.completed ? 'bg-rose-400 border-rose-400' : 'border-slate-300'}`}
              >
                {todo.completed && <Check size={14} className="text-white" />}
              </button>
              <span className={`flex-1 text-lg font-light ${todo.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {todo.text}
              </span>
              <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Weekly Food Menu */}
      <div className={`glass-panel p-6 rounded-3xl ${COLORS.macaron.green.border} border-t-4 flex flex-col`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
           <div>
             <h2 className="text-2xl font-light text-slate-700 tracking-wide flex items-center gap-2">
               Weekly Fuel <Leaf size={20} className="text-emerald-500"/>
             </h2>
             <p className="text-sm text-slate-400 mt-1">Nourishment for the week ahead.</p>
           </div>

           <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:flex-none">
                <ChefHat size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  className="pl-9 pr-4 py-2 bg-white/50 rounded-xl text-sm w-full md:w-64 border border-transparent focus:border-emerald-200 focus:outline-none transition-all"
                  placeholder="Ingredients (e.g. eggs, kale)..."
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                />
             </div>
             <button 
              onClick={handleGenerateMenu}
              disabled={isGeneratingMenu}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
             >
               {isGeneratingMenu ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Sparkles size={16} />}
               <span className="hidden sm:inline">Generate</span>
             </button>
           </div>
        </div>

        {/* Cuisine Selector */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {CUISINES.map(cuisine => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                selectedCuisine === cuisine 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                : 'bg-white/40 text-slate-500 border-transparent hover:bg-white'
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>

        {/* Weekly Menu Horizontal Grid */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {weekDays.map(date => {
            const dateKey = formatDateKey(date);
            const dayMenu = menus[dateKey];
            const isEditing = editingMenuDateKey === dateKey;
            
            return (
              <div key={dateKey} className="snap-center flex-shrink-0 w-64 bg-white/30 border border-white rounded-2xl p-4 hover:bg-white/60 transition-colors group relative">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric'})}
                  </div>
                  {!isEditing && (
                    <button 
                      onClick={() => startEditMenu(dateKey)}
                      className="text-slate-300 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                     <div>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold mb-1"><Sun size={10} className="text-amber-400"/> Breakfast</div>
                       <input className="w-full p-1.5 text-xs bg-white/80 rounded border border-emerald-100 focus:outline-none" value={tempMenuData.breakfast} onChange={e => setTempMenuData({...tempMenuData, breakfast: e.target.value})} placeholder="Breakfast..."/>
                     </div>
                     <div>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold mb-1"><Sun size={10} className="text-orange-400"/> Lunch</div>
                       <input className="w-full p-1.5 text-xs bg-white/80 rounded border border-emerald-100 focus:outline-none" value={tempMenuData.lunch} onChange={e => setTempMenuData({...tempMenuData, lunch: e.target.value})} placeholder="Lunch..."/>
                     </div>
                     <div>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold mb-1"><Moon size={10} className="text-indigo-400"/> Dinner</div>
                       <input className="w-full p-1.5 text-xs bg-white/80 rounded border border-emerald-100 focus:outline-none" value={tempMenuData.dinner} onChange={e => setTempMenuData({...tempMenuData, dinner: e.target.value})} placeholder="Dinner..."/>
                     </div>
                     <div>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold mb-1"><Coffee size={10} className="text-pink-400"/> Snack</div>
                       <input className="w-full p-1.5 text-xs bg-white/80 rounded border border-emerald-100 focus:outline-none" value={tempMenuData.snack} onChange={e => setTempMenuData({...tempMenuData, snack: e.target.value})} placeholder="Snack..."/>
                     </div>
                     <div className="flex gap-2 mt-2">
                        <button onClick={saveMenu} className="flex-1 bg-emerald-500 text-white py-1 rounded text-xs font-medium hover:bg-emerald-600">Save</button>
                        <button onClick={() => setEditingMenuDateKey(null)} className="flex-1 bg-slate-200 text-slate-600 py-1 rounded text-xs font-medium hover:bg-slate-300">Cancel</button>
                     </div>
                  </div>
                ) : (
                  dayMenu ? (
                    <div className="space-y-4">
                      <div>
                         <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold mb-1"><Sun size={10} className="text-amber-400"/> Breakfast</div>
                         <div className="text-sm text-slate-700 leading-tight min-h-[1.2em]">{dayMenu.breakfast}</div>
                      </div>
                      <div>
                         <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold mb-1"><Sun size={10} className="text-orange-400"/> Lunch</div>
                         <div className="text-sm text-slate-700 leading-tight min-h-[1.2em]">{dayMenu.lunch}</div>
                      </div>
                      <div>
                         <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold mb-1"><Moon size={10} className="text-indigo-400"/> Dinner</div>
                         <div className="text-sm text-slate-700 leading-tight min-h-[1.2em]">{dayMenu.dinner}</div>
                      </div>
                      <div className="pt-2 border-t border-dashed border-slate-200">
                         <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-semibold mb-1"><Coffee size={10} className="text-pink-400"/> Snack</div>
                         <div className="text-sm text-slate-500 italic min-h-[1.2em]">{dayMenu.snack}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-slate-300">
                      <Utensils size={24} className="mb-2 opacity-50"/>
                      <span className="text-xs text-center">No menu generated</span>
                      <button 
                        onClick={() => startEditMenu(dateKey)}
                        className="mt-2 text-xs text-emerald-500 font-medium hover:underline"
                      >
                        Add manually
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Event Modal */}
      {isEventModalOpen && editingEvent && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-slate-700">Edit Event</h3>
               <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
             </div>
             <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Time</label>
                  <input 
                    className="w-full p-2 bg-slate-50 rounded-lg mt-1 focus:outline-none focus:ring-1 focus:ring-amber-200"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({...editingEvent, time: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Activity</label>
                  <input 
                    className="w-full p-2 bg-slate-50 rounded-lg mt-1 focus:outline-none focus:ring-1 focus:ring-amber-200"
                    value={editingEvent.activity}
                    onChange={(e) => setEditingEvent({...editingEvent, activity: e.target.value})}
                    autoFocus
                  />
               </div>
               <div className="flex gap-2 pt-2">
                 <button onClick={() => deleteEvent(editingEvent.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={18}/></button>
                 <button onClick={saveEditedEvent} className="flex-1 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
                   <Save size={16}/> Save Changes
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