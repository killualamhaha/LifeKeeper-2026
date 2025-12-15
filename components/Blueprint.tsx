import React, { useState, useEffect } from 'react';
import { Key, ArrowRight, Save, Pencil, AlertTriangle, X } from 'lucide-react';
import { BlueprintData } from '../types';

const Blueprint: React.FC = () => {
  const MAX_EDITS = 3;
  const PASSWORD = "Akira123=";

  // Access State (View Lock)
  const [isAccessLocked, setIsAccessLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  // Content State
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<BlueprintData>({
    content: "This is my manifesto. \n\nI am building a life of...\n\nMy north star is...",
    lastEdited: Date.now(),
    editCount: 0
  });

  // Load data from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('blueprint_2026');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration check for old data structure
        if (parsed.vision !== undefined) {
             setData({
                 content: `MY VISION\n${parsed.vision}\n\nCORE VALUES\n${parsed.coreValues}\n\n5 YEAR HORIZON\n${parsed.fiveYearGoal}`,
                 lastEdited: parsed.lastEdited,
                 editCount: parsed.editCount
             });
        } else {
             setData(parsed);
        }
      } catch (e) {
        console.error("Failed to load blueprint data", e);
      }
    }
  }, []);

  // Handle Password Unlock
  const handleAccessUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      setIsAccessLocked(false);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPasswordInput("");
    }
  };

  // Handle Entering Edit Mode
  const handleEnterEdit = () => {
    if (data.editCount >= MAX_EDITS) {
      alert("You have reached the maximum number of changes (3) for this year. The blueprint is now permanent for the remainder of 2026.");
      return;
    }
    setIsEditing(true);
  };

  // Save Changes
  const handleSave = () => {
    const confirmSave = window.confirm(`Saving will consume 1 of your ${MAX_EDITS} annual edits. You have ${MAX_EDITS - data.editCount - 1} remaining after this. Proceed?`);
    if (!confirmSave) return;

    const newData = {
      ...data,
      lastEdited: Date.now(),
      editCount: data.editCount + 1
    };
    setData(newData);
    localStorage.setItem('blueprint_2026', JSON.stringify(newData));
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    // Revert logic could go here if we tracked previous state, 
    // but for now we just exit mode. Local modifications in textarea persist in state 
    // but won't be saved to localStorage until Save is clicked.
    // Ideally, we reload from localStorage or revert state.
    const saved = localStorage.getItem('blueprint_2026');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.content) setData(parsed); // Revert
    }
    setIsEditing(false);
  };

  const remainingEdits = MAX_EDITS - data.editCount;

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 relative">
      
      {/* Access Lock Overlay */}
      {isAccessLocked && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-white/30 flex items-center justify-center p-4 rounded-[2.5rem]">
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white max-w-sm w-full animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-slate-800 text-white rounded-full shadow-lg">
                <Key size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-light text-slate-800">Identity Check</h2>
                <p className="text-sm text-slate-500 mt-1">Protected Life Architecture</p>
              </div>
              
              <form onSubmit={handleAccessUnlock} className="w-full mt-4 flex flex-col gap-3">
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setAuthError(false); }}
                  placeholder="Enter Password"
                  className={`w-full p-4 rounded-xl bg-slate-50 border focus:outline-none transition-all ${authError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-slate-200'}`}
                  autoFocus
                />
                {authError && <span className="text-xs text-red-500 font-medium">Incorrect password. Access denied.</span>}
                <button 
                  type="submit"
                  className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  Unlock Vault <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Content (Blurred if locked to provide 'hints' of structure) */}
      <div className={`w-full h-full max-w-5xl glass-panel p-8 md:p-12 rounded-[3rem] shadow-2xl border border-white/80 relative overflow-hidden transition-all duration-500 flex flex-col ${isAccessLocked ? 'blur-md scale-[0.98] opacity-60 pointer-events-none' : 'blur-0 scale-100 opacity-100'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 shrink-0">
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-slate-800 tracking-tight">My Blueprint</h1>
              <p className="text-slate-400 mt-2 text-sm">Design your reality. Execute your vision.</p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
               {!isEditing ? (
                 <button 
                  onClick={handleEnterEdit}
                  disabled={remainingEdits === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md ${
                      remainingEdits > 0 
                      ? 'bg-slate-800 text-white hover:bg-slate-700 hover:shadow-lg' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                 >
                   <Pencil size={16} /> {remainingEdits > 0 ? 'Edit Blueprint' : 'Locked (Max Edits)'}
                 </button>
               ) : (
                 <div className="flex gap-2">
                    <button 
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-300 transition-colors"
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
                    >
                      <Save size={16} /> Save Changes
                    </button>
                 </div>
               )}
               <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-white/50 px-2 py-1 rounded-lg">
                  {remainingEdits} / {MAX_EDITS} edits remaining this year
               </div>
            </div>
        </div>

        {/* Editor / Viewer */}
        <div className="flex-1 relative bg-white/40 rounded-3xl overflow-hidden border border-white/60 shadow-inner">
            {isEditing ? (
                <textarea 
                    className="w-full h-full p-8 bg-transparent text-lg text-slate-700 leading-relaxed resize-none focus:outline-none focus:bg-white/60 transition-colors font-serif"
                    value={data.content}
                    onChange={(e) => setData({...data, content: e.target.value})}
                    placeholder="Write whatever you want here..."
                    autoFocus
                />
            ) : (
                <div className="w-full h-full p-8 overflow-y-auto text-lg text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">
                    {data.content}
                </div>
            )}
        </div>

        {isEditing && (
            <div className="mt-4 p-4 bg-amber-50 text-amber-700 text-sm rounded-2xl flex items-start gap-3 border border-amber-100 shrink-0 animate-in slide-in-from-bottom-2">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p>You are in <strong>Edit Mode</strong>. Saving these changes will permanently consume one of your annual edit slots. Make sure your words count.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Blueprint;