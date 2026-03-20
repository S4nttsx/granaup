import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  DollarSign, 
  Calendar, 
  Tag, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart as PieChartIcon,
  Save,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AppState, Transaction, PaymentMethod } from '../types';
import { CATEGORIES } from '../constants';

interface ExpensesTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  categories?: string[];
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ExpensesTab({ state, updateState, categories = CATEGORIES }: ExpensesTabProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Transaction | null>(null);
  
  const currentMonthName = selectedDate.toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
  const currentYear = selectedDate.getFullYear();

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  // Salary form state
  const [salaryInput, setSalaryInput] = useState(state.salary.toString());
  const [salaryDateInput, setSalaryDateInput] = useState(state.salaryDate || '');
  const [salaryObsInput, setSalaryObsInput] = useState(state.salaryObservation || '');

  // Expense/Income form state
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [expenseName, setExpenseName] = useState('');
  const [expenseValue, setExpenseValue] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(categories[0]);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseRecurrence, setExpenseRecurrence] = useState<Transaction['recurrence']>('none');
  const [expenseInstallments, setExpenseInstallments] = useState('1');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [expenseCardId, setExpenseCardId] = useState('');

  // Process recurring expenses on mount
  useEffect(() => {
    if (state.editingTransactionId) {
      const transaction = state.transactions.find(t => t.id === state.editingTransactionId);
      if (transaction) {
        handleEditExpense(transaction);
        // Clear it so it doesn't re-open
        updateState({ editingTransactionId: null });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let newTransactions = [...state.transactions];
    let changed = false;

    // Only process "parent" recurring transactions
    const recurringParents = state.transactions.filter(t => t.recurrence && t.recurrence !== 'none' && !t.parentTransactionId);

    recurringParents.forEach(parent => {
      let nextDate = new Date(parent.date);
      
      // Advance to the next occurrence
      const advanceDate = (date: Date, recurrence: string) => {
        const d = new Date(date);
        if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
        else if (recurrence === 'yearly') d.setFullYear(d.getFullYear() + 1);
        return d;
      };

      nextDate = advanceDate(nextDate, parent.recurrence!);

      // Generate occurrences up to today
      while (nextDate <= today) {
        const dateStr = nextDate.toISOString();
        const alreadyExists = state.transactions.some(t => t.parentTransactionId === parent.id && t.date === dateStr);

        if (!alreadyExists) {
          const child: Transaction = {
            ...parent,
            id: `${parent.id}-${nextDate.getTime()}`,
            date: dateStr,
            parentTransactionId: parent.id,
            recurrence: 'none' // Children are single instances
          };
          newTransactions.push(child);
          changed = true;
        }
        nextDate = advanceDate(nextDate, parent.recurrence!);
      }
    });

    if (changed) {
      updateState({ transactions: newTransactions });
    }
  }, []);

  const stats = useMemo(() => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();

    const getMonthlyValue = (t: Transaction) => {
      const tDate = new Date(t.date);
      const tMonth = tDate.getMonth();
      const tYear = tDate.getFullYear();
      const startTotalMonths = tYear * 12 + tMonth;
      const targetTotalMonths = year * 12 + month;
      const diff = targetTotalMonths - startTotalMonths;

      if (t.parentTransactionId) {
        return (tMonth === month && tYear === year) ? t.amount : 0;
      }

      if (t.recurrence && t.recurrence !== 'none') {
        const hasChildThisMonth = state.transactions.some(child => 
          child.parentTransactionId === t.id && 
          new Date(child.date).getMonth() === month && 
          new Date(child.date).getFullYear() === year
        );
        if (hasChildThisMonth) return 0;

        const totalDuration = t.installments?.total || 999;
        if (t.recurrence === 'monthly') {
          if (diff >= 0 && diff < totalDuration) return t.amount;
        } else if (t.recurrence === 'yearly') {
          const diffYears = Math.floor(diff / 12);
          const monthMatch = (diff % 12) === 0;
          if (diffYears >= 0 && diffYears < totalDuration && monthMatch) return t.amount;
        }
        return 0;
      } else {
        if (!t.installments || t.installments.total <= 1) {
          return (tMonth === month && tYear === year) ? t.amount : 0;
        } else {
          const totalInstallments = t.installments.total;
          const installmentValue = t.amount / totalInstallments;
          if (diff >= 0 && diff < totalInstallments) return installmentValue;
          return 0;
        }
      }
    };

    const monthlyTransactions = state.transactions
      .map(t => ({ ...t, monthlyAmount: getMonthlyValue(t) }))
      .filter(t => t.monthlyAmount > 0);

    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.monthlyAmount, 0);
    
    const otherIncomes = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.monthlyAmount, 0);
    
    const totalIncome = otherIncomes;
    const remaining = totalIncome - totalExpenses;

    return {
      otherIncomes,
      totalIncome,
      expenses: totalExpenses,
      remaining,
      monthlyTransactions
    };
  }, [state, selectedDate]);

  const chartData = [
    { name: 'Gasto', value: stats.expenses, color: '#ef4444' },
    { name: 'Restante', value: Math.max(0, stats.remaining), color: '#10b981' },
  ].filter(d => d.value > 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSaveSalary = () => {
    updateState({
      salary: parseFloat(salaryInput) || 0,
      salaryDate: salaryDateInput,
      salaryObservation: salaryObsInput
    });
    alert('Salário atualizado com sucesso!');
  };

  const handleAddExpense = () => {
    if (!expenseName || !expenseValue) return;
    
    const installmentsTotal = parseInt(expenseInstallments) || 1;
    const totalAmount = parseFloat(expenseValue);
    
    const newExpense: Transaction = {
      id: Date.now().toString(),
      description: expenseName,
      amount: totalAmount,
      type: transactionType,
      category: expenseCategory,
      date: new Date(expenseDate).toISOString(),
      recurrence: expenseRecurrence,
      paymentMethod: expensePaymentMethod,
      cardId: expensePaymentMethod === 'credito' ? expenseCardId : undefined,
      installments: installmentsTotal > 1 ? {
        total: installmentsTotal,
        current: 1
      } : undefined
    };

    let updatedCards = [...state.cards];
    if (transactionType === 'expense' && expensePaymentMethod === 'credito' && expenseCardId) {
      updatedCards = state.cards.map(c => {
        if (c.id === expenseCardId) {
          return {
            ...c,
            currentBill: c.currentBill + totalAmount
          };
        }
        return c;
      });
    }

    updateState({ 
      transactions: [newExpense, ...state.transactions],
      cards: updatedCards
    });
    resetExpenseForm();
  };

  const handleEditExpense = (expense: Transaction) => {
    setEditingExpense(expense);
    setTransactionType(expense.type);
    setExpenseName(expense.description);
    setExpenseValue(expense.amount.toString());
    setExpenseCategory(expense.category);
    setExpenseDate(new Date(expense.date).toISOString().split('T')[0]);
    setExpenseRecurrence(expense.recurrence || 'none');
    setExpenseInstallments(expense.installments?.total.toString() || '1');
    setExpensePaymentMethod(expense.paymentMethod || 'dinheiro');
    setExpenseCardId(expense.cardId || '');
    setIsAddingExpense(true);
  };

  const handleUpdateExpense = () => {
    if (!editingExpense || !expenseName || !expenseValue) return;

    const installmentsTotal = parseInt(expenseInstallments) || 1;
    const totalAmount = parseFloat(expenseValue);

    // Revert old card bill if it was credit
    let updatedCards = [...state.cards];
    if (editingExpense.paymentMethod === 'credito' && editingExpense.cardId) {
      updatedCards = updatedCards.map(c => {
        if (c.id === editingExpense.cardId) {
          return { ...c, currentBill: Math.max(0, c.currentBill - editingExpense.amount) };
        }
        return c;
      });
    }

    // Apply new card bill if it is credit
    if (expensePaymentMethod === 'credito' && expenseCardId) {
      updatedCards = updatedCards.map(c => {
        if (c.id === expenseCardId) {
          return { ...c, currentBill: c.currentBill + totalAmount };
        }
        return c;
      });
    }

    const updatedTransactions = state.transactions.map(t => 
      t.id === editingExpense.id 
        ? { 
            ...t, 
            description: expenseName, 
            amount: totalAmount, 
            type: transactionType,
            category: expenseCategory, 
            date: new Date(expenseDate).toISOString(),
            recurrence: expenseRecurrence,
            paymentMethod: expensePaymentMethod,
            cardId: expensePaymentMethod === 'credito' ? expenseCardId : undefined,
            installments: installmentsTotal > 1 ? {
              total: installmentsTotal,
              current: t.installments?.current || 1
            } : undefined
          } 
        : t
    );

    updateState({ 
      transactions: updatedTransactions,
      cards: updatedCards
    });
    resetExpenseForm();
  };

  const resetExpenseForm = () => {
    setTransactionType('expense');
    setExpenseName('');
    setExpenseValue('');
    setExpenseCategory(categories[0]);
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseRecurrence('none');
    setExpenseInstallments('1');
    setExpensePaymentMethod('dinheiro');
    setExpenseCardId('');
    setIsAddingExpense(false);
    setEditingExpense(null);
  };

  const deleteExpense = (expense: Transaction) => {
    let updatedCards = [...state.cards];
    
    // If it's a parent, delete all children too
    const idsToDelete = [expense.id];
    if (expense.recurrence && expense.recurrence !== 'none' && !expense.parentTransactionId) {
      state.transactions.forEach(t => {
        if (t.parentTransactionId === expense.id) {
          idsToDelete.push(t.id);
        }
      });
    }

    // Revert card bill for all deleted transactions if they were credit
    const transactionsToDelete = state.transactions.filter(t => idsToDelete.includes(t.id));
    
    transactionsToDelete.forEach(t => {
      if (t.paymentMethod === 'credito' && t.cardId) {
        updatedCards = updatedCards.map(c => {
          if (c.id === t.cardId) {
            return { ...c, currentBill: Math.max(0, c.currentBill - t.amount) };
          }
          return c;
        });
      }
    });

    updateState({ 
      transactions: state.transactions.filter(t => !idsToDelete.includes(t.id)),
      cards: updatedCards
    });
    setExpenseToDelete(null);
  };

  const getRecurrenceLabel = (r?: string) => {
    switch(r) {
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      default: return 'Única';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Month Navigation & Top Stats */}
      <div className="flex flex-col xl:flex-row items-stretch gap-6">
        <div className="flex items-center justify-between bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-200/60 dark:border-dark-border shadow-sm flex-1 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
          <button 
            onClick={() => changeMonth(-1)}
            className="p-3 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl transition-all text-slate-400 hover:text-blue-600 relative z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center px-6 relative z-10">
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{capitalizedMonth}</span>
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1.5">{currentYear}</span>
          </div>
          <button 
            onClick={() => changeMonth(1)}
            className="p-3 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl transition-all text-slate-400 hover:text-blue-600 relative z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-[2]">
          <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-dark-border shadow-sm group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5">Entradas</p>
            <p className="text-xl font-black text-emerald-600 tracking-tighter">{formatCurrency(stats.totalIncome)}</p>
          </div>
          <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-dark-border shadow-sm group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5">Saídas</p>
            <p className="text-xl font-black text-red-500 tracking-tighter">{formatCurrency(stats.expenses)}</p>
          </div>
          <div className="bg-blue-600 p-4 sm:p-6 rounded-2xl shadow-2xl shadow-blue-600/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
            <p className="text-[9px] font-bold text-blue-100/60 uppercase tracking-[0.2em] mb-1.5">Saldo Livre</p>
            <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(stats.remaining)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Left Column: Chart & Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-3xl border border-slate-200/60 dark:border-dark-border shadow-sm group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-[9px] font-black flex items-center gap-2.5 text-slate-400 uppercase tracking-[0.3em]">
                <PieChartIcon className="w-4.5 h-4.5 text-blue-600" />
                Distribuição
              </h3>
            </div>
            
            <div className="h-[240px] w-full relative z-10">
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={10}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white dark:bg-dark-card p-3 rounded-2xl shadow-2xl border border-slate-100 dark:border-dark-border">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{payload[0].name}</p>
                                <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(payload[0].value as number)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Total Gasto</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(stats.expenses)}</span>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-dark-input rounded-full flex items-center justify-center border border-slate-100 dark:border-dark-border">
                    <PieChartIcon className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50 italic">Sem dados</p>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3 relative z-10">
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-dark-input rounded-xl border border-slate-100 dark:border-dark-border group/item hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entradas</span>
                </div>
                <span className="text-base font-black text-emerald-600 tracking-tighter">+{formatCurrency(stats.totalIncome)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-dark-input rounded-xl border border-slate-100 dark:border-dark-border group/item hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/40" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saídas</span>
                </div>
                <span className="text-base font-black text-red-600 tracking-tighter">-{formatCurrency(stats.expenses)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transactions */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Extrato <span className="text-blue-600">Mensal</span></h3>
              <p className="text-sm text-slate-500 font-medium">Gerencie suas movimentações de {capitalizedMonth} com facilidade.</p>
            </div>
            <button 
              onClick={() => setIsAddingExpense(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 group"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
              Nova Transação
            </button>
          </div>

          <AnimatePresence>
            {isAddingExpense && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 bg-white dark:bg-dark-card rounded-2xl border border-blue-600/20 shadow-2xl shadow-blue-600/5 space-y-8 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                      <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{editingExpense ? 'Editar Transação' : 'Nova Transação'}</h3>
                      <p className="text-xs text-slate-500 font-medium">Preencha os detalhes da movimentação abaixo.</p>
                    </div>
                  </div>
                  <button onClick={resetExpenseForm} className="p-2.5 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl transition-all">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="flex gap-2.5 p-1.5 bg-slate-100 dark:bg-dark-input rounded-xl">
                  <button
                    onClick={() => setTransactionType('expense')}
                    className={cn(
                      "flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                      transactionType === 'expense' 
                        ? "bg-white dark:bg-dark-card text-red-600 shadow-xl" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Despesa
                  </button>
                  <button
                    onClick={() => {
                      setTransactionType('income');
                      setExpenseCategory('Renda Extra');
                      setExpenseRecurrence('none');
                      setExpenseInstallments('1');
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                      transactionType === 'income' 
                        ? "bg-white dark:bg-dark-card text-emerald-600 shadow-xl" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Entrada
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Descrição</label>
                    <input
                      type="text"
                      placeholder="Ex: Aluguel, Freelance, Mercado"
                      value={expenseName}
                      onChange={(e) => setExpenseName(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-xl outline-none focus:border-blue-600 transition-all font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Valor (R$)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">R$</span>
                      <input
                        type="number"
                        placeholder="0,00"
                        value={expenseValue}
                        onChange={(e) => setExpenseValue(e.target.value)}
                        onFocus={(e) => expenseValue === '0' && setExpenseValue('')}
                        className="w-full pl-14 pr-5 py-3.5 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-xl outline-none focus:border-blue-600 transition-all text-xl font-black tracking-tighter"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Categoria</label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-xl outline-none focus:border-blue-600 transition-all font-bold cursor-pointer appearance-none text-sm"
                      >
                        {transactionType === 'expense' ? (
                          categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))
                        ) : (
                          ['Renda Extra', 'Bônus', 'Presente', 'Investimento'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))
                        )}
                      </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Data</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Recorrência</label>
                    <select
                      value={expenseRecurrence}
                      onChange={(e) => setExpenseRecurrence(e.target.value as Transaction['recurrence'])}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-xl outline-none focus:border-blue-600 transition-all font-bold cursor-pointer appearance-none text-sm"
                    >
                      <option value="none">Única</option>
                      <option value="monthly">Mensal</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                  {expenseRecurrence !== 'none' && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                        Duração ({expenseRecurrence === 'monthly' ? 'Meses' : 'Anos'})
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={expenseInstallments}
                        onChange={(e) => setExpenseInstallments(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                        placeholder={expenseRecurrence === 'monthly' ? "Ex: 12 meses" : "Ex: 2 anos"}
                      />
                    </div>
                  )}
                  {transactionType === 'expense' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Pagamento</label>
                        <select
                          value={expensePaymentMethod}
                          onChange={(e) => setExpensePaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-xl outline-none focus:border-blue-600 transition-all font-bold cursor-pointer appearance-none text-sm"
                        >
                          <option value="dinheiro">Dinheiro</option>
                          <option value="pix">Pix</option>
                          <option value="debito">Débito</option>
                          <option value="credito">Crédito</option>
                          <option value="transferencia">Transferência</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                      {expensePaymentMethod === 'credito' && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Cartão</label>
                          <select
                            value={expenseCardId}
                            onChange={(e) => setExpenseCardId(e.target.value)}
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-xl outline-none focus:border-blue-600 transition-all font-bold cursor-pointer appearance-none text-sm"
                          >
                            <option value="">Selecione um cartão</option>
                            {state.cards.map(card => (
                              <option key={card.id} value={card.id}>{card.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button 
                    onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                    className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 text-xs"
                  >
                    {editingExpense ? 'Atualizar Transação' : 'Confirmar Transação'}
                  </button>
                  <button 
                    onClick={resetExpenseForm}
                    className="flex-1 py-4 bg-slate-100 dark:bg-dark-hover text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all text-xs"
                  >
                    Descartar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200/60 dark:border-dark-border shadow-sm overflow-hidden group">
            <div className="p-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-slate-50/30 dark:bg-dark-hover/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Histórico de Transações</h4>
              </div>
              <span className="text-[9px] font-black px-4 py-1.5 bg-white dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-full text-slate-500 shadow-sm uppercase tracking-widest">
                {stats.monthlyTransactions.length} registros
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-dark-border">
              {stats.monthlyTransactions.length > 0 ? (
                stats.monthlyTransactions.map((expense) => (
                  <motion.div 
                    key={expense.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50/80 dark:hover:bg-dark-hover/30 transition-all group/item"
                  >
                    <div className="flex items-center gap-6 min-w-0">
                      <div className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover/item:scale-110",
                        expense.type === 'expense' 
                          ? "bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20" 
                          : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-100 dark:border-emerald-500/20"
                      )}>
                        {expense.recurrence && expense.recurrence !== 'none' ? <RefreshCw className="w-5 h-5" /> : (expense.type === 'expense' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />)}
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xl font-black text-slate-900 dark:text-white truncate tracking-tighter leading-none">{expense.description}</p>
                          {expense.recurrence && expense.recurrence !== 'none' && (
                            <span className={cn(
                              "text-[8px] px-2.5 py-1 rounded-lg font-black uppercase tracking-[0.15em]",
                              expense.type === 'expense' ? "bg-red-100 dark:bg-red-900/30 text-red-600" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                            )}>
                              {getRecurrenceLabel(expense.recurrence)}
                            </span>
                          )}
                          {expense.installments && expense.installments.total > 1 && (
                            <span className="text-[8px] px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 border border-blue-100 dark:border-blue-500/20 rounded-lg font-black uppercase tracking-[0.15em]">
                              {(() => {
                                const tDate = new Date(expense.date);
                                const diff = (selectedDate.getFullYear() * 12 + selectedDate.getMonth()) - (tDate.getFullYear() * 12 + tDate.getMonth());
                                return `${diff + 1}/${expense.installments.total}`;
                              })()}x
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
                          <span className="flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-slate-300" /> {expense.category}</span>
                          <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-300" /> {new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                          {expense.paymentMethod && expense.type === 'expense' && (
                            <span className="flex items-center gap-2">
                              <CreditCardIcon className="w-3.5 h-3.5 text-slate-300" /> 
                              {expense.paymentMethod === 'credito' ? `Cartão ${state.cards.find(c => c.id === expense.cardId)?.name || ''}` : expense.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-8">
                      <div className="text-right space-y-0.5">
                        <span className={cn(
                          "block text-2xl font-black tracking-tighter leading-none",
                          expense.type === 'expense' ? "text-red-500" : "text-emerald-500"
                        )}>
                          {expense.type === 'expense' ? '-' : '+'}{formatCurrency(expense.monthlyAmount || expense.amount)}
                        </span>
                        {expense.installments && expense.installments.total > 1 && (
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest opacity-60">
                            Total: {formatCurrency(expense.amount)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5 transition-all">
                        <button 
                          onClick={() => handleEditExpense(expense)}
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all shadow-sm bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border"
                        >
                          <Edit2 className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => setExpenseToDelete(expense)}
                          className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all shadow-sm bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-dark-input rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-dark-border shadow-inner">
                    <DollarSign className="w-10 h-10 text-slate-300" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Nenhuma movimentação</h4>
                    <p className="text-sm text-slate-500 font-medium">Você ainda não registrou transações para este mês.</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingExpense(true)}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all text-sm"
                  >
                    Registrar Primeira Transação
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {expenseToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-dark-border shadow-2xl max-w-md w-full space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Excluir Transação?</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Esta ação não pode ser desfeita.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-dark-input rounded-2xl border border-slate-100 dark:border-dark-border">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{expenseToDelete.description}</p>
                <p className="text-lg font-black text-red-600 tracking-tighter">{formatCurrency(expenseToDelete.amount)}</p>
                {expenseToDelete.recurrence && expenseToDelete.recurrence !== 'none' && !expenseToDelete.parentTransactionId && (
                  <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">
                    ⚠️ Atenção: Todas as instâncias recorrentes desta despesa também serão excluídas.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => deleteExpense(expenseToDelete)}
                  className="flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all active:scale-95 text-xs shadow-xl shadow-red-600/20"
                >
                  Sim, Excluir
                </button>
                <button 
                  onClick={() => setExpenseToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-dark-hover text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all text-xs"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
