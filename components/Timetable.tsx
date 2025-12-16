import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Utensils, Sparkles, ChefHat, Leaf, Coffee, Moon, Sun, Pencil, X, Save } from 'lucide-react';
import { COLORS } from '../constants';
import { ScheduleEvent, TodoItem, MealPlan } from '../types';
import { generateMealPlan } from '../services/geminiService';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CUISINES = ['Balanced', 'Mediterranean', 'Asian', 'Vegetarian', 'Quick & Easy', 'Keto'];

const INITIAL_SCHEDULE: Record<string, ScheduleEvent[]> = {
    'Mon': [
      { id: '1', time: '08:00', activity: 'Morning Yoga' },
      { id: '2', time: '09:00', activity: 'Deep Work' },
      { id: '3', time: '12:00', activity: 'Nutrient Break' },
    ],
    'Tue': [
      { id: '4', time: '07:30', activity: 'Morning Run' },
      { id: '5', time: '09:30', activity: 'Client Sync' },
    ],
    'Wed': [
      { id: '6', time: '08:00', activity: 'Yoga Flow' },
      { id: '7', time: '14:00', activity: 'Strategy' },
    ],
    'Thu': [],
    'Fri': [
      { id: '8', time: '16:00', activity: 'Weekly Review' },
    ],
    'Sat': [
      { id: '9', time: '10:00', activity: 'Farmers Market' },
    ],
    'Sun': [
       { id: '10', time: '11:00', activity: 'Family Brunch' },
    ]
};

const INITIAL_TODOS: TodoItem[] = [
    { id: '1', text: 'Review quarterly goals', completed: false, category: 'work' },
    { id: '2', text: 'Buy hydrangeas', completed: true, category: 'personal' },
];

const Timetable: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState('Mon');

  // -- STATE WITH PERSISTENCE --
  
  // Schedule
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, ScheduleEvent[]>>(() => {
    const saved = localStorage.getItem('timetable_schedule');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });

  // Todos
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('timetable_todos');
    return saved ? JSON.parse(saved) : INITIAL_TODOS;
  });

  // Food Menu
  const [weeklyMenu, setWeeklyMenu] = useState<Record<string, MealPlan> | null>(() => {
      const saved = localStorage.getItem('timetable_menu');
      return saved ? JSON.parse(saved) : null;
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('timetable_schedule', JSON.stringify(weeklySchedule));
  }, [weeklySchedule]);

  useEffect(() => {
    localStorage.setItem('timetable_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('timetable_menu', JSON.stringify(weeklyMenu));
  }, [weeklyMenu]);


  // Food Menu UI State
  const [ingredients, setIngredients] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('Balanced');
  const [isGeneratingMenu, setIsGeneratingMenu] = useState(false);

  // Edit States
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  
  const [editingMenuDay, setEditingMenuDay] = useState<string | null>(null);
  const [tempMenuData, setTempMenuData] = useState<MealPlan>({ breakfast: '', lunch: '', dinner: '', snack: '' });

  // Todo handlers
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

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  // Schedule handlers
  const handleAddEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      // Basic time parser to allow format "09:00 Meeting"
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

      setWeeklySchedule(prev => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay] || []), newEvent]
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
      setWeeklySchedule(prev => ({
        ...prev,
        [selectedDay]: prev[selectedDay].map(e => e.id === editingEvent.id ? editingEvent : e)
      }));
      setIsEventModalOpen(false);
      setEditingEvent(null);
    }
  };

  const deleteEvent = (eventId: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].filter(e => e.id !== eventId)
    }));
    if (editingEvent?.id === eventId) {
      setIsEventModalOpen(false);
      setEditingEvent(null);
    }
  };

  // Menu Generator Handler
  const handleGenerateMenu = async () => {
    setIsGeneratingMenu(true);
    try {
      const result = await generateMealPlan(ingredients, selectedCuisine);
      const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedMenu = JSON.parse(cleanJson);
      setWeeklyMenu(parsedMenu);
    } catch (e) {
      console.error("Failed to parse menu", e);
    } finally {
      setIsGeneratingMenu(false);
    }
  };

  const startEditMenu = (day: string) => {
    const currentMenu = weeklyMenu && weeklyMenu[day] ? weeklyMenu[day] : { breakfast: '', lunch: '', dinner: '', snack: '' };
    setTempMenuData(currentMenu);
    setEditingMenuDay(day);
  };

  const saveMenu = () => {
    if (editingMenuDay) {
      setWeeklyMenu(prev => ({
        ...prev || {},
        [editingMenuDay]: tempMenuData
      }));
      setEditingMenuDay(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto p-1 max-w-7xl mx-auto w-full relative">
      {/* Section 1: Schedule */}
      <div className={`glass-panel p-6 rounded-3xl ${COLORS.macaron.blue.border} border-t-4 flex flex-col min-h-[450px]`}>
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-light text-slate-700 tracking-wide">Time Capsule</h2>
           <span className="text-xs font-mono text-slate-400 bg-white/50 px-3 py-1.5 rounded-lg border border-white">May • Week 19</span>
        </div>
        
        {/* Weekly Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 flex-1 overflow-hidden">
          {DAYS.map(day => (
            <div 
              key={day} 
              onClick={() => setSelectedDay(day)}
              className={`rounded-2xl p-2 transition-all cursor-pointer flex flex-col gap-2 relative border-2 ${
                selectedDay === day 
                ? 'bg-white/40 border-amber-200/50 shadow-sm' 
                : 'bg-transparent border-transparent hover:bg-white/20'
              }`}
            >
               {/* Day Header */}
               <div className={`text-center text-xs font-bold uppercase tracking-wider py-1 ${selectedDay === day ? 'text-amber-600' : 'text-slate-400'}`}>
                 {day}
               </div>

               {/* Events Container */}
               <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 pb-2">
                 {weeklySchedule[day]?.map(item => (
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
                 {(!weeklySchedule[day] || weeklySchedule[day].length === 0) && (
                   <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                   </div>
                 )}
               </div>
            </div>
          ))}
        </div>

        {/* Add Event Input */}
        <div className="mt-4 pt-4 border-t border-slate-100/50 flex items-center gap-4">
           <div className="text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:block whitespace-nowrap">
             Add to <span className="text-amber-500 font-bold">{selectedDay}</span>
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
          {DAYS.map(day => {
            const dayMenu = weeklyMenu ? weeklyMenu[day] : null;
            const isEditing = editingMenuDay === day;
            
            return (
              <div key={day} className="snap-center flex-shrink-0 w-64 bg-white/30 border border-white rounded-2xl p-4 hover:bg-white/60 transition-colors group relative">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    {day}
                  </div>
                  {!isEditing && (
                    <button 
                      onClick={() => startEditMenu(day)}
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
                        <button onClick={() => setEditingMenuDay(null)} className="flex-1 bg-slate-200 text-slate-600 py-1 rounded text-xs font-medium hover:bg-slate-300">Cancel</button>
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
                        onClick={() => startEditMenu(day)}
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