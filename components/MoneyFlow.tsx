import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Wallet, Plus, X, Save, Trash2, Pencil, Heart, PiggyBank, TrendingUp, Calendar, Landmark, PieChart as PieChartIcon, LayoutList, CreditCard } from 'lucide-react';
import { Transaction } from '../types';

// Seed data to populate the chart initially
const INITIAL_TRANSACTIONS: Transaction[] = [
  // Jan
  { id: '1', date: '2026-01-15', description: 'Monthly Salary', amount: 4000, type: 'income', category: 'Work' },
  { id: '2', date: '2026-01-20', description: 'Rent & Utilities', amount: 2400, type: 'expense', category: 'Living' },
  // Feb
  { id: '3', date: '2026-02-15', description: 'Monthly Salary', amount: 4000, type: 'income', category: 'Work' },
  { id: '4', date: '2026-02-10', description: 'Valentine Gift', amount: 200, type: 'expense', category: 'Gifts' },
  { id: '5', date: '2026-02-20', description: 'Rent & Utilities', amount: 1198, type: 'expense', category: 'Living' },
  // Mar
  { id: '6', date: '2026-03-15', description: 'Monthly Salary', amount: 4000, type: 'income', category: 'Work' },
  { id: '7', date: '2026-03-05', description: 'New Laptop', amount: 2500, type: 'expense', category: 'Tech' },
  { id: '8', date: '2026-03-20', description: 'Rent & Utilities', amount: 1200, type: 'expense', category: 'Living' },
  { id: '9', date: '2026-03-25', description: 'Charity Gala', amount: 500, type: 'donation', category: 'Charity' },
  // Apr
  { id: '10', date: '2026-04-15', description: 'Monthly Salary', amount: 4200, type: 'income', category: 'Work' },
  { id: '11', date: '2026-04-20', description: 'Rent & Utilities', amount: 1200, type: 'expense', category: 'Living' },
  { id: '12', date: '2026-04-22', description: 'Local Shelter', amount: 200, type: 'donation', category: 'Community' },
  // May (Current)
  { id: '13', date: '2026-05-12', description: 'Freelance Project X', amount: 1200, type: 'income', category: 'Work' },
  { id: '14', date: '2026-05-14', description: 'Grocery - Whole Foods', amount: 154, type: 'expense', category: 'Food' },
  { id: '15', date: '2026-05-15', description: 'Cloud Subscriptions', amount: 45, type: 'expense', category: 'Tech' },
  { id: '16', date: '2026-05-18', description: 'Vintage Decor Shop', amount: 89, type: 'expense', category: 'Home' },
  { id: '17', date: '2026-05-20', description: 'Community Fund', amount: 100, type: 'donation', category: 'Charity' },
];

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  remarks: string;
  type: 'checking' | 'savings' | 'investment';
}

const INITIAL_ACCOUNTS: BankAccount[] = [
    { id: '1', name: 'Main Vault', balance: 12450, remarks: 'Primary Checking', type: 'checking' },
    { id: '2', name: 'Growth Nest', balance: 8200, remarks: 'Emergency Fund', type: 'savings' },
    { id: '3', name: 'Ventures', balance: 15300, remarks: 'Investment Portfolio', type: 'investment' },
];

const COLORS_LIST = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#0ea5e9'];

const MoneyFlow: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'yearly' | 'banking'>('overview');

  // -- STATE WITH PERSISTENCE --
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('moneyflow_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('moneyflow_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('moneyflow_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('moneyflow_accounts', JSON.stringify(accounts));
  }, [accounts]);


  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Date State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Banking State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [newAccount, setNewAccount] = useState<Partial<BankAccount>>({ name: '', balance: 0, remarks: '', type: 'savings' });

  // Form State for Transactions
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'expense',
    category: ''
  });

  // --- DERIVED DATA ---

  // Filter Transactions based on Selected Month
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Chart Data: Show yearly trend up to end of selected year
  const chartData = useMemo(() => {
    const year = parseInt(selectedMonth.split('-')[0]);
    const monthsData: Record<number, { name: string; income: number; expense: number }> = {};
    
    // Initialize 12 months
    for(let i=0; i<12; i++) {
        const d = new Date(year, i, 1);
        monthsData[i] = {
            name: d.toLocaleString('default', { month: 'short' }),
            income: 0,
            expense: 0
        };
    }

    transactions.forEach(t => {
      const date = new Date(t.date);
      if (date.getFullYear() === year) {
          const m = date.getMonth();
          if (t.type === 'income') {
              monthsData[m].income += t.amount;
          } else {
              // Treat donation as expense for chart visualization of 'outflow'
              monthsData[m].expense += t.amount;
          }
      }
    });

    return Object.values(monthsData);
  }, [transactions, selectedMonth]);

  // Yearly Summary Data
  const yearlyStats = useMemo(() => {
    const year = parseInt(selectedMonth.split('-')[0]);
    let income = 0;
    let expense = 0;
    let donation = 0;
    const categoryBreakdown: Record<string, number> = {};

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === year) {
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'donation') donation += t.amount;
        else {
          expense += t.amount;
          categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
        }
      }
    });

    const categoryData = Object.keys(categoryBreakdown).map((name) => ({
      name,
      value: categoryBreakdown[name]
    })).sort((a,b) => b.value - a.value);

    return { income, expense, donation, savings: income - (expense + donation), categoryData };
  }, [transactions, selectedMonth]);

  // Monthly Summary Totals
  const monthlySummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalDonation = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'donation') {
        totalDonation += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });

    return {
      income: totalIncome,
      savings: totalIncome - (totalExpense + totalDonation),
      donation: totalDonation
    };
  }, [filteredTransactions]);

  // Banking Summary
  const totalBankBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);


  // --- HANDLERS ---

  const handleOpenAdd = () => {
    setFormData({
      date: `${selectedMonth}-01`, 
      description: '',
      amount: '', 
      type: 'expense',
      category: ''
    } as any);
    setEditId(null);
    setIsEditing(true);
  };

  const handleEdit = (t: Transaction) => {
    setFormData({ ...t, amount: t.amount });
    setEditId(t.id);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (editId === id) setIsEditing(false);
    }
  };

  const handleSave = () => {
    if (!formData.description || !formData.amount || !formData.date) return;

    const payload: Transaction = {
      id: editId || Date.now().toString(),
      date: formData.date!,
      description: formData.description!,
      amount: Number(formData.amount),
      type: formData.type as 'income' | 'expense' | 'donation',
      category: formData.category || 'General'
    };

    if (editId) {
      setTransactions(prev => prev.map(t => t.id === editId ? payload : t));
    } else {
      setTransactions(prev => [...prev, payload]);
    }
    
    setIsEditing(false);
  };

  // Banking Handlers
  const openBankModal = (account?: BankAccount) => {
    if (account) {
        setNewAccount({ ...account });
        setEditingAccount(account);
    } else {
        setNewAccount({ name: '', balance: 0, remarks: '', type: 'savings' });
        setEditingAccount(null);
    }
    setIsBankModalOpen(true);
  }

  const saveBankAccount = () => {
    if (newAccount.name) {
        if (editingAccount) {
            setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...a, name: newAccount.name!, balance: Number(newAccount.balance), remarks: newAccount.remarks || '', type: newAccount.type as any } : a));
        } else {
            setAccounts(prev => [...prev, { id: Date.now().toString(), name: newAccount.name!, balance: Number(newAccount.balance), remarks: newAccount.remarks || '', type: newAccount.type as any }]);
        }
        setIsBankModalOpen(false);
    }
  }

  const deleteBankAccount = (id: string) => {
      setAccounts(prev => prev.filter(a => a.id !== id));
      if (editingAccount?.id === id) setIsBankModalOpen(false);
  }

  // --- RENDERERS ---

  const TransactionIcon = ({ type }: { type: string }) => {
    if (type === 'income') return <div className="p-3 rounded-full bg-emerald-100 text-emerald-600"><ArrowDownLeft size={20} /></div>;
    return <div className="p-3 rounded-full bg-rose-100 text-rose-500"><ArrowUpRight size={20} /></div>;
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden p-1 relative">
      
      {/* Top Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
         <div className="flex gap-2 bg-white/50 p-1.5 rounded-2xl border border-white shadow-sm">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-white/60'}`}
            >
              <LayoutList size={16} /> Monthly
            </button>
            <button 
              onClick={() => setActiveTab('yearly')} 
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'yearly' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-white/60'}`}
            >
              <PieChartIcon size={16} /> Yearly Report
            </button>
            <button 
              onClick={() => setActiveTab('banking')} 
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'banking' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-white/60'}`}
            >
              <Landmark size={16} /> Banking
            </button>
         </div>
         
         {/* Date Selector (Only relevant for Monthly/Yearly context) */}
         {activeTab !== 'banking' && (
             <div className="bg-white/60 backdrop-blur-md p-2 px-3 rounded-xl flex items-center gap-2 border border-white shadow-sm">
                <Calendar size={18} className="text-slate-500" />
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                  className="bg-transparent border-none text-slate-700 text-sm font-bold outline-none focus:ring-0 cursor-pointer"
                />
             </div>
         )}
      </div>

      {/* --- MONTHLY OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto animate-in fade-in duration-300 pb-20">
           {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
                <div className="glass-panel p-5 rounded-3xl border border-white/80 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Total Income</p>
                        <h3 className="text-3xl font-light text-slate-700 tracking-tight">${monthlySummary.income.toLocaleString()}</h3>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner shadow-emerald-200/50"><TrendingUp size={28} strokeWidth={1.5} /></div>
                </div>
                <div className="glass-panel p-5 rounded-3xl border border-white/80 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Net Savings</p>
                        <h3 className="text-3xl font-light text-slate-700 tracking-tight">${monthlySummary.savings.toLocaleString()}</h3>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-100 text-amber-600 shadow-inner shadow-amber-200/50"><PiggyBank size={28} strokeWidth={1.5} /></div>
                </div>
                <div className="glass-panel p-5 rounded-3xl border border-white/80 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Donations</p>
                        <h3 className="text-3xl font-light text-slate-700 tracking-tight">${monthlySummary.donation.toLocaleString()}</h3>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-100 text-rose-600 shadow-inner shadow-rose-200/50"><Heart size={28} strokeWidth={1.5} /></div>
                </div>
            </div>

            {/* Chart */}
            <div className="glass-panel rounded-3xl p-6 pt-6 pb-8 relative overflow-hidden flex flex-col min-h-[350px] flex-shrink-0">
                <h2 className="text-xl font-light text-slate-700 mb-6 flex items-center gap-2">
                    <Wallet className="text-emerald-500" /> Cashflow Rhythm
                </h2>
                <div className="w-full flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            stroke="#94a3b8" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                        />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} prefix="$" />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }} />
                        <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Transactions */}
            <div className="glass-panel rounded-3xl p-6 flex-1 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Transaction History</h3>
                <button 
                    onClick={handleOpenAdd} 
                    className="px-4 py-2 bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-300/50 flex items-center gap-2"
                >
                    <Plus size={16} /> New Record
                </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {filteredTransactions.length === 0 && (
                    <div className="text-center py-10 text-slate-400">No transactions found for {selectedMonth}.</div>
                )}
                {[...filteredTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                    <div key={t.id} className="flex items-center justify-between group p-3 hover:bg-white/40 rounded-2xl transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`p-3.5 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-500' : 'bg-rose-100 text-rose-500'}`}>
                                {t.type === 'income' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 text-sm mb-1">{t.description}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    {t.date} • {t.category}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-sm font-bold font-mono text-slate-700">
                                {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-500 bg-white shadow-sm rounded-full"><Pencil size={14}/></button>
                                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-white shadow-sm rounded-full"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </div>
        </div>
      )}

      {/* --- YEARLY REPORT TAB --- */}
      {activeTab === 'yearly' && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 animate-in slide-in-from-right-4 duration-300 pb-10">
             <div className="glass-panel p-8 rounded-[2.5rem] bg-white/40">
                <h2 className="text-3xl font-light text-slate-800 mb-8">{selectedMonth.split('-')[0]} Annual Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="p-6 bg-emerald-50/80 rounded-3xl border border-emerald-100 shadow-sm">
                      <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-2">Total Income</div>
                      <div className="text-3xl font-light text-slate-800">${yearlyStats.income.toLocaleString()}</div>
                   </div>
                   <div className="p-6 bg-rose-50/80 rounded-3xl border border-rose-100 shadow-sm">
                      <div className="text-[10px] text-rose-600 font-bold uppercase tracking-widest mb-2">Total Expenses</div>
                      <div className="text-3xl font-light text-slate-800">${yearlyStats.expense.toLocaleString()}</div>
                   </div>
                   <div className="p-6 bg-amber-50/80 rounded-3xl border border-amber-100 shadow-sm">
                      <div className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-2">Net Savings</div>
                      <div className="text-3xl font-light text-slate-800">${yearlyStats.savings.toLocaleString()}</div>
                   </div>
                   <div className="p-6 bg-purple-50/80 rounded-3xl border border-purple-100 shadow-sm">
                      <div className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mb-2">Savings Rate</div>
                      <div className="text-3xl font-light text-slate-800">
                        {yearlyStats.income > 0 ? Math.round((yearlyStats.savings / yearlyStats.income) * 100) : 0}%
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex flex-col gap-6">
                 {/* Stacked Layout for better height control */}
                 <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col h-[380px]">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><PieChartIcon size={20}/> Spending by Category</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={yearlyStats.categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {yearlyStats.categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_LIST[index % COLORS_LIST.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    itemStyle={{ color: '#334155' }}
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px' }} 
                                    formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><LayoutList size={20}/> Category Breakdown</h3>
                    <div className="space-y-4">
                        {yearlyStats.categoryData.map((cat, idx) => (
                            <div key={cat.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 hover:bg-white/70 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS_LIST[idx % COLORS_LIST.length] }} />
                                    <span className="text-base font-medium text-slate-700">{cat.name}</span>
                                </div>
                                <div className="text-base font-mono font-medium text-slate-600">${cat.value.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                 </div>
                 
                 <div className="glass-panel p-8 rounded-[2.5rem] h-[400px] flex flex-col">
                     <h3 className="font-bold text-slate-700 mb-6">Yearly Trend</h3>
                     <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }} />
                                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* --- BANKING TAB --- */}
      {activeTab === 'banking' && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto animate-in slide-in-from-right-4 duration-300 pb-20">
             <div className="glass-panel p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border-indigo-100 flex items-center justify-between flex-shrink-0">
                 <div>
                    <h2 className="text-3xl font-light text-slate-800 mb-2">Total Net Worth</h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extralight text-slate-900">${totalBankBalance.toLocaleString()}</span>
                        <span className="text-sm font-medium text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+12% YTD</span>
                    </div>
                 </div>
                 <div className="p-6 bg-indigo-100 text-indigo-600 rounded-3xl">
                     <Landmark size={48} strokeWidth={1.5} />
                 </div>
             </div>

             <div className="flex justify-between items-center flex-shrink-0">
                <h3 className="text-xl font-bold text-slate-700">Your Vaults</h3>
                <button 
                  onClick={() => openBankModal()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={18}/> Add Account
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
                {accounts.map(acc => (
                    <div key={acc.id} onClick={() => openBankModal(acc)} className="group cursor-pointer relative overflow-hidden p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        {/* Card Decoration */}
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 ${
                            acc.type === 'checking' ? 'bg-emerald-400' : acc.type === 'savings' ? 'bg-amber-400' : 'bg-purple-400'
                        }`} />
                        
                        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-2xl ${
                                    acc.type === 'checking' ? 'bg-emerald-50 text-emerald-600' : acc.type === 'savings' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
                                }`}>
                                    <CreditCard size={24} />
                                </div>
                                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{acc.type}</div>
                            </div>
                            
                            <div>
                                <h4 className="text-lg font-medium text-slate-700 mb-1">{acc.name}</h4>
                                <div className="text-3xl font-light text-slate-900">${acc.balance.toLocaleString()}</div>
                                {acc.remarks && <p className="text-xs text-slate-400 mt-2 line-clamp-1">{acc.remarks}</p>}
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
      )}
      
      {/* Edit/Add Transaction Modal */}
      {isEditing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-md border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-light text-slate-700">{editId ? 'Edit Transaction' : 'New Transaction'}</h3>
                 <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>

              {/* Segmented Control for Type */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                  <button onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Income</button>
                  <button onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.type === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500'}`}>Expense</button>
                  <button onClick={() => setFormData({...formData, type: 'donation'})} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.type === 'donation' ? 'bg-white text-purple-500 shadow-sm' : 'text-slate-500'}`}>Donation</button>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Description</label>
                    <input autoFocus className="w-full p-3 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700" placeholder="e.g. Freelance Project" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Amount ($)</label>
                        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Date</label>
                        <input type="date" className="w-full p-3 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-600" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Category</label>
                    <input className="w-full p-3 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700" placeholder="e.g. Work, Food" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} list="categories" />
                    <datalist id="categories">
                        <option value="Work" /><option value="Living" /><option value="Food" /><option value="Transport" /><option value="Donation" /><option value="Tech" /><option value="Health" /><option value="Gifts" />
                    </datalist>
                 </div>
                 <button onClick={handleSave} className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-medium shadow-lg hover:bg-slate-700 transition-colors flex justify-center items-center gap-2 mt-4">
                   <Save size={18} /> Save Record
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Bank Account Modal */}
      {isBankModalOpen && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-md border border-slate-100">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-light text-slate-700">{editingAccount ? 'Edit Account' : 'New Account'}</h3>
                  <button onClick={() => setIsBankModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
               </div>
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Bank Name</label>
                    <input className="w-full p-3 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100" placeholder="e.g. Chase" value={newAccount.name} onChange={(e) => setNewAccount({...newAccount, name: e.target.value})} autoFocus />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Balance</label>
                        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100" placeholder="0.00" value={newAccount.balance} onChange={(e) => setNewAccount({...newAccount, balance: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Type</label>
                        <select className="w-full p-3 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-600" value={newAccount.type} onChange={(e) => setNewAccount({...newAccount, type: e.target.value as any})}>
                            <option value="checking">Checking</option>
                            <option value="savings">Savings</option>
                            <option value="investment">Investment</option>
                        </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Remarks / Notes</label>
                    <textarea className="w-full p-3 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none" placeholder="e.g. Emergency funds only" rows={2} value={newAccount.remarks} onChange={(e) => setNewAccount({...newAccount, remarks: e.target.value})} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editingAccount && (
                        <button onClick={() => deleteBankAccount(editingAccount.id)} className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={20}/></button>
                    )}
                    <button onClick={saveBankAccount} className="flex-1 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors">
                        Save Account
                    </button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default MoneyFlow;