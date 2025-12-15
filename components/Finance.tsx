import React, { useState } from 'react';
import { Search, BookOpen, AlertCircle, ArrowUpRight, ArrowDownRight, Activity, Plus, Trash2, Save, X, Pencil } from 'lucide-react';
import { COLORS } from '../constants';

interface StockItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  shares: number;
  remarks?: string;
}

interface ResearchItem {
  id: string;
  title: string;
  preview: string;
  tags: string[];
  date: string;
}

const Finance: React.FC = () => {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [research, setResearch] = useState<ResearchItem[]>([]);

  // Add/Edit Stock State
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<Partial<StockItem>>({
    symbol: '', name: '', price: 0, change: 0, shares: 0, remarks: ''
  });

  // Add/Edit Research State
  const [isAddingResearch, setIsAddingResearch] = useState(false);
  const [editingResearchId, setEditingResearchId] = useState<string | null>(null);
  const [newResearch, setNewResearch] = useState({
    title: '', note: '', tags: ''
  });

  // Stock Handlers
  const handleSaveStock = () => {
    if (newStock.symbol && newStock.price !== undefined) {
      if (editingStockId) {
        setStocks(prev => prev.map(s => s.id === editingStockId ? {
          ...s,
          symbol: newStock.symbol!.toUpperCase(),
          name: newStock.name || '',
          price: Number(newStock.price),
          change: Number(newStock.change) || 0,
          shares: Number(newStock.shares) || 0,
          remarks: newStock.remarks || ''
        } : s));
        setEditingStockId(null);
      } else {
        setStocks([...stocks, {
          id: Date.now().toString(),
          symbol: newStock.symbol!.toUpperCase(),
          name: newStock.name || '',
          price: Number(newStock.price),
          change: Number(newStock.change) || 0,
          shares: Number(newStock.shares) || 0,
          remarks: newStock.remarks || ''
        }]);
      }
      setIsAddingStock(false);
      setNewStock({ symbol: '', name: '', price: 0, change: 0, shares: 0, remarks: '' });
    }
  };

  const handleEditStock = (stock: StockItem) => {
    setNewStock({ ...stock });
    setEditingStockId(stock.id);
    setIsAddingStock(true);
  };

  const handleCancelStock = () => {
    setIsAddingStock(false);
    setEditingStockId(null);
    setNewStock({ symbol: '', name: '', price: 0, change: 0, shares: 0, remarks: '' });
  };

  const handleDeleteStock = (id: string) => {
    setStocks(stocks.filter(s => s.id !== id));
    if (editingStockId === id) {
      handleCancelStock();
    }
  };

  // Research Handlers
  const handleSaveResearch = () => {
    if (newResearch.title && newResearch.note) {
      if (editingResearchId) {
        setResearch(prev => prev.map(r => r.id === editingResearchId ? {
          ...r,
          title: newResearch.title,
          preview: newResearch.note,
          tags: newResearch.tags.split(',').map(t => t.trim()).filter(Boolean),
          // Keep original date if editing, or update it? Let's keep original date for now.
          date: r.date 
        } : r));
        setEditingResearchId(null);
      } else {
        setResearch([...research, {
          id: Date.now().toString(),
          title: newResearch.title,
          preview: newResearch.note,
          tags: newResearch.tags.split(',').map(t => t.trim()).filter(Boolean),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }]);
      }
      setIsAddingResearch(false);
      setNewResearch({ title: '', note: '', tags: '' });
    }
  };

  const handleEditResearch = (item: ResearchItem) => {
    setNewResearch({
      title: item.title,
      note: item.preview,
      tags: item.tags.join(', ')
    });
    setEditingResearchId(item.id);
    setIsAddingResearch(true);
  };

  const handleCancelResearch = () => {
    setIsAddingResearch(false);
    setEditingResearchId(null);
    setNewResearch({ title: '', note: '', tags: '' });
  };

  const handleDeleteResearch = (id: string) => {
    setResearch(research.filter(r => r.id !== id));
    if (editingResearchId === id) {
      handleCancelResearch();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto p-1">
      {/* Left: Stock Tracking */}
      <div className={`glass-panel p-6 rounded-3xl ${COLORS.macaron.purple.border} border-t-4 flex flex-col`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Activity size={24} />
          </div>
          <div>
             <h2 className="text-2xl font-light text-slate-700">Stock Tracking</h2>
             <p className="text-xs text-slate-400">Real-time portfolio pulse</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {stocks.length === 0 && !isAddingStock && (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-sm">
              <Activity size={32} className="mb-2 opacity-50"/>
              <p>No stocks tracked yet.</p>
            </div>
          )}

          {stocks.map((stock) => (
             <div key={stock.id} className="bg-white/50 p-4 rounded-2xl border border-transparent hover:border-purple-100 group relative">
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditStock(stock)}
                    className="p-1 text-slate-300 hover:text-purple-400 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteStock(stock.id)}
                    className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs tracking-wider">
                        {stock.symbol[0]}
                      </div>
                      <div>
                         <div className="font-bold text-slate-700">{stock.symbol}</div>
                         <div className="text-[10px] text-slate-400 uppercase tracking-wide">{stock.name}</div>
                      </div>
                   </div>
                   <div className={`flex items-center gap-1 text-sm font-medium ${stock.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {stock.change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {Math.abs(stock.change)}%
                   </div>
                </div>
                <div className="flex justify-between items-end">
                   <div>
                      <div className="text-xs text-slate-400 mb-0.5">Price</div>
                      <div className="font-mono text-slate-700">${stock.price.toLocaleString()}</div>
                   </div>
                   <div className="text-right">
                      <div className="text-xs text-slate-400 mb-0.5">Value</div>
                      <div className="font-mono text-slate-700">${(stock.price * stock.shares).toLocaleString()}</div>
                   </div>
                </div>
                {stock.remarks && (
                  <div className="mt-3 pt-2 border-t border-purple-100/50 text-xs text-slate-500">
                     <span className="text-purple-400 font-medium">Note:</span> {stock.remarks}
                  </div>
                )}
             </div>
          ))}

          {isAddingStock ? (
             <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-medium text-purple-700">{editingStockId ? 'Edit Position' : 'Add New Position'}</h4>
                  <button onClick={handleCancelStock} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <input className="p-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-300" placeholder="Symbol (e.g. NVDA)" value={newStock.symbol} onChange={e => setNewStock({...newStock, symbol: e.target.value})} />
                   <input className="p-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-300" placeholder="Name (Optional)" value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                   <input type="number" className="p-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-300" placeholder="Price" value={newStock.price || ''} onChange={e => setNewStock({...newStock, price: parseFloat(e.target.value)})} />
                   <input type="number" className="p-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-300" placeholder="Shares" value={newStock.shares || ''} onChange={e => setNewStock({...newStock, shares: parseFloat(e.target.value)})} />
                   <input type="number" className="p-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-300" placeholder="Change %" value={newStock.change || ''} onChange={e => setNewStock({...newStock, change: parseFloat(e.target.value)})} />
                </div>
                <input 
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-300" 
                  placeholder="Remarks" 
                  value={newStock.remarks || ''} 
                  onChange={e => setNewStock({...newStock, remarks: e.target.value})} 
                />
                <button onClick={handleSaveStock} className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-medium flex items-center justify-center gap-2">
                  <Save size={14}/> {editingStockId ? 'Update Position' : 'Save Position'}
                </button>
             </div>
          ) : (
            <button 
              onClick={() => setIsAddingStock(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-purple-200 text-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 mt-4"
            >
               <Plus size={18} /> Add Stock
            </button>
          )}
        </div>
      </div>

      {/* Right: Research Lab */}
      <div className={`glass-panel p-6 rounded-3xl ${COLORS.macaron.blue.border} border-t-4 flex flex-col`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-sky-100 text-sky-600 rounded-xl">
            <BookOpen size={24} />
          </div>
          <div>
             <h2 className="text-2xl font-light text-slate-700">Research Lab</h2>
             <p className="text-xs text-slate-400">Deep dives & due diligence for stocks</p>
          </div>
        </div>

        <div className="bg-white/60 rounded-xl p-2 flex items-center gap-2 mb-4 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
            <Search size={18} className="text-slate-400 ml-2"/>
            <input className="bg-transparent w-full p-1 focus:outline-none text-sm placeholder:text-slate-400" placeholder="Search saved notes..." />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
           {research.length === 0 && !isAddingResearch && (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-sm">
              <BookOpen size={32} className="mb-2 opacity-50"/>
              <p>Research notes will appear here.</p>
            </div>
           )}

           {research.map((item) => (
             <div key={item.id} className="p-4 rounded-2xl border border-slate-100 bg-white/30 hover:bg-white/60 transition-all group relative">
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditResearch(item)}
                    className="p-1 text-slate-300 hover:text-sky-500 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteResearch(item.id)}
                    className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex justify-between items-start mb-1 pr-14">
                   <h4 className="font-medium text-slate-700 group-hover:text-sky-600 transition-colors">{item.title}</h4>
                   <span className="text-[10px] text-slate-400 font-mono shrink-0 pt-0.5">{item.date}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed whitespace-pre-wrap">{item.preview}</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                   {item.tags.map(tag => (
                     <span key={tag} className="text-[10px] px-2 py-0.5 bg-white border border-slate-100 rounded-md text-slate-500 font-medium">
                       {tag}
                     </span>
                   ))}
                </div>
             </div>
           ))}
           
           {isAddingResearch ? (
             <div className="bg-white p-4 rounded-2xl border border-sky-200 shadow-sm space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-medium text-sky-700">{editingResearchId ? 'Edit Entry' : 'New Research Entry'}</h4>
                  <button onClick={handleCancelResearch} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                </div>
                <input 
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-sky-300" 
                  placeholder="Title (e.g. TSLA Earnings Review)" 
                  value={newResearch.title}
                  onChange={e => setNewResearch({...newResearch, title: e.target.value})}
                />
                <textarea 
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-sky-300 resize-none" 
                  placeholder="Key takeaways, analysis, or thoughts..."
                  rows={3}
                  value={newResearch.note}
                  onChange={e => setNewResearch({...newResearch, note: e.target.value})}
                />
                <input 
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-sky-300" 
                  placeholder="Tags (comma separated)" 
                  value={newResearch.tags}
                  onChange={e => setNewResearch({...newResearch, tags: e.target.value})}
                />
                <button onClick={handleSaveResearch} className="w-full py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-sm font-medium flex items-center justify-center gap-2">
                  <Save size={14}/> {editingResearchId ? 'Update Note' : 'Save Note'}
                </button>
             </div>
           ) : (
             <button 
              onClick={() => setIsAddingResearch(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-sky-300 hover:text-sky-500 transition-colors flex items-center justify-center gap-2"
             >
               <AlertCircle size={16} /> New Research Entry
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default Finance;