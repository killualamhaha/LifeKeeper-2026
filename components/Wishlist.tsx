import React, { useState } from 'react';
import { Star, Gift, CheckCircle2, Pencil, X, Save, Plus } from 'lucide-react';
import { COLORS } from '../constants';
import { WishlistItem } from '../types';

const Wishlist: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([
    { id: '1', title: 'Artisan Pottery Class', type: 'small_joy', completed: false, cost: 80 },
    { id: '2', title: 'Weekend at Eco-Cabin', type: 'small_joy', completed: true, cost: 300 },
    { id: '3', title: 'Start Sustainable Fashion Brand', type: 'long_term', completed: false },
    { id: '4', title: 'Visit Kyoto in Autumn', type: 'long_term', completed: false },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WishlistItem>>({});

  const toggleComplete = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
  };

  const handleEdit = (item: WishlistItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSave = () => {
    if (editForm.title?.trim()) {
        setItems(items.map(i => i.id === editingId ? { ...i, ...editForm } as WishlistItem : i));
    } else {
        // If title is empty, maybe remove it? Or just don't save. 
        // For now, let's just not save empty titles.
    }
    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    // If we were adding a new item and cancelled, strictly speaking we might want to remove it if it was empty.
    // But for simplicity, we just revert edits.
    setEditingId(null);
    setEditForm({});
  };

  const handleAddSmallJoy = () => {
      const newItem: WishlistItem = {
          id: Date.now().toString(),
          title: '',
          type: 'small_joy',
          completed: false,
          cost: 0
      };
      setItems([...items, newItem]);
      handleEdit(newItem);
  };

  const handleAddLongTerm = () => {
    const newItem: WishlistItem = {
        id: Date.now().toString(),
        title: '',
        type: 'long_term',
        completed: false
    };
    setItems([...items, newItem]);
    handleEdit(newItem);
  };

  const deleteItem = (id: string) => {
      setItems(items.filter(i => i.id !== id));
      if (editingId === id) setEditingId(null);
  }

  const SmallJoy = ({ item }: { item: WishlistItem }) => {
    const isEditing = editingId === item.id;

    if (isEditing) {
        return (
            <div className="p-4 rounded-2xl bg-white border-2 border-amber-200 shadow-lg flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                <input 
                    className="text-slate-700 font-medium bg-slate-50 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200 w-full"
                    value={editForm.title || ''} 
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    placeholder="Experience Title"
                    autoFocus
                />
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">$</span>
                    <input 
                        type="number"
                        className="text-slate-700 font-mono text-sm bg-slate-50 p-2 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-amber-200"
                        value={editForm.cost || 0} 
                        onChange={e => setEditForm({...editForm, cost: Number(e.target.value)})}
                        placeholder="Cost"
                    />
                </div>
                <div className="flex justify-between items-center mt-2">
                    <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 hover:text-red-500 hover:underline px-2">Delete</button>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"><Save size={16}/></button>
                        <button onClick={handleCancel} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"><X size={16}/></button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 rounded-2xl transition-all border group/card relative ${item.completed ? 'bg-amber-50/50 border-amber-100 opacity-60' : 'bg-white/60 border-white hover:border-amber-200 hover:shadow-lg hover:-translate-y-1'}`}>
            <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                 <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-amber-500 bg-white/80 rounded-full shadow-sm hover:shadow">
                    <Pencil size={14} />
                 </button>
            </div>
            
            <div className="flex justify-between items-start mb-2 pr-6">
                <div className={`p-2 rounded-lg ${item.completed ? 'bg-amber-100 text-amber-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Gift size={18} />
                </div>
                <button 
                  onClick={() => toggleComplete(item.id)} 
                  className={`transition-colors rounded-full ${item.completed ? 'text-emerald-500' : 'text-slate-200 hover:text-emerald-300'}`}
                  title={item.completed ? "Mark incomplete" : "Mark complete"}
                >
                  <CheckCircle2 size={24} className={item.completed ? 'fill-emerald-100' : ''} />
                </button>
            </div>
            <h4 className={`font-medium ${item.completed ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{item.title}</h4>
            {item.cost ? <div className="text-xs font-mono text-slate-400 mt-2">${item.cost}</div> : <div className="h-4 mt-2"></div>}
        </div>
    );
  };

  const LongTermGoal = ({ item }: { item: WishlistItem }) => {
    const isEditing = editingId === item.id;

    if (isEditing) {
        return (
             <div className="p-6 rounded-3xl bg-white border-2 border-purple-200 shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Editing Vision</span>
                    <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 hover:text-red-500 hover:underline">Delete</button>
                </div>
                <textarea 
                    className="text-xl font-light text-slate-800 bg-slate-50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none w-full"
                    rows={2}
                    value={editForm.title || ''} 
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    placeholder="Vision Title..."
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button onClick={handleCancel} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center gap-2 shadow-lg shadow-purple-200 font-medium"><Save size={18}/> Save Vision</button>
                </div>
             </div>
        );
    }

    return (
        <div className={`relative overflow-hidden p-6 rounded-3xl transition-all border group ${item.completed ? 'bg-slate-50 border-slate-200' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-white hover:shadow-xl'}`}>
            {/* Background Decor */}
            <div className={`absolute top-0 right-0 p-8 -mr-4 -mt-4 rounded-full blur-2xl transition-opacity ${item.completed ? 'bg-slate-200 opacity-20' : 'bg-purple-100 opacity-50 group-hover:opacity-80'}`}></div>
            
            {/* Edit Button */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                 <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-purple-600 bg-white/60 hover:bg-white rounded-full shadow-sm backdrop-blur-sm transition-all">
                    <Pencil size={16} />
                 </button>
            </div>

            <div className="relative z-10 flex items-center gap-4">
                <button 
                  onClick={() => toggleComplete(item.id)} 
                  className={`transition-all rounded-full p-1 ${item.completed ? 'text-amber-400 hover:text-amber-500' : 'text-purple-200 hover:text-purple-300'}`}
                  title={item.completed ? "Completed" : "Mark as Achieved"}
                >
                  <Star size={28} className={item.completed ? 'fill-amber-400' : 'fill-purple-100'} strokeWidth={item.completed ? 0 : 1.5} />
                </button>
                <div className="flex-1 pr-8">
                  <h3 className={`text-xl font-light leading-snug ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.title}</h3>
                  <p className={`text-xs mt-1 uppercase tracking-wider font-semibold ${item.completed ? 'text-slate-300' : 'text-purple-400'}`}>Long Term Vision</p>
                </div>
            </div>
            
            {!item.completed && (
                <div className="mt-4 w-full bg-white/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-purple-400 to-indigo-400 w-1/3 h-full rounded-full" />
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-1 overflow-y-auto">
      {/* Left: Small Joys (Access) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="glass-panel p-6 rounded-3xl sticky top-0 z-10">
          <h2 className="text-2xl font-light text-slate-700 flex items-center gap-2">
            <span className="bg-amber-100 p-2 rounded-lg text-amber-600"><Gift size={20}/></span>
            Small Joys
          </h2>
          <p className="text-sm text-slate-400 mt-1">Experiences within reach.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min">
          {items.filter(i => i.type === 'small_joy').map(item => (
            <SmallJoy key={item.id} item={item} />
          ))}
          <button 
            onClick={handleAddSmallJoy}
            className="p-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 flex flex-col items-center justify-center gap-2 hover:border-amber-300 hover:text-amber-500 hover:bg-amber-50/30 transition-all min-h-[140px]"
          >
            <PlusIcon />
            <span className="text-sm font-medium">Add Experience</span>
          </button>
        </div>
      </div>

      {/* Right: Long Term Goals */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="glass-panel p-6 rounded-3xl sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-light text-slate-700 flex items-center gap-2">
                <span className="bg-purple-100 p-2 rounded-lg text-purple-600"><Star size={20}/></span>
                North Stars
            </h2>
            <p className="text-sm text-slate-400 mt-1">Aspirations for the future.</p>
          </div>
          <button 
            onClick={handleAddLongTerm}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl shadow-lg hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
              <Plus size={16}/> New Vision
          </button>
        </div>

        <div className="space-y-4 pb-10">
           {items.filter(i => i.type === 'long_term').map(item => (
            <LongTermGoal key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
)

export default Wishlist;