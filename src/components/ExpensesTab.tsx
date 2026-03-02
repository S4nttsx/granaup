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
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ExpensesTab({ state, updateState }: ExpensesTabProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null);
  
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

  // Expense form state
  const [expenseName, setExpenseName] = useState('');
  const [expenseValue, setExpenseValue] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(CATEGORIES[0]);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseRecurrence, setExpenseRecurrence] = useState<Transaction['recurrence']>('none');
  const [expenseInstallments, setExpenseInstallments] = useState('1');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [expenseCardId, setExpenseCardId] = useState('');

  // Process recurring expenses on mount
  useEffect(() => {
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
        if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
        else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
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

      if (!t.installments || t.installments.total <= 1) {
        return (tMonth === month && tYear === year) ? t.amount : 0;
      } else {
        const totalInstallments = t.installments.total;
        const installmentValue = t.amount / totalInstallments;
        const startTotalMonths = tYear * 12 + tMonth;
        const targetTotalMonths = year * 12 + month;
        const diff = targetTotalMonths - startTotalMonths;
        if (diff >= 0 && diff < totalInstallments) return installmentValue;
        return 0;
      }
    };

    const monthlyTransactions = state.transactions
      .map(t => ({ ...t, monthlyAmount: getMonthlyValue(t) }))
      .filter(t => t.monthlyAmount > 0);

    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.monthlyAmount, 0);
    
    const remaining = state.salary - totalExpenses;

    return {
      salary: state.salary,
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
      type: 'expense',
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
    if (expensePaymentMethod === 'credito' && expenseCardId) {
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
    setExpenseName('');
    setExpenseValue('');
    setExpenseCategory(CATEGORIES[0]);
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
    if (expense.paymentMethod === 'credito' && expense.cardId) {
      updatedCards = updatedCards.map(c => {
        if (c.id === expense.cardId) {
          return { ...c, currentBill: Math.max(0, c.currentBill - expense.amount) };
        }
        return c;
      });
    }

    updateState({ 
      transactions: state.transactions.filter(t => t.id !== expense.id),
      cards: updatedCards
    });
  };

  const getRecurrenceLabel = (r?: string) => {
    switch(r) {
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      default: return 'Única';
    }
  };

  return (
    <div className="space-y-8">
      {/* Month Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-blue-600 dark:text-slate-400"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center min-w-[150px]">
            <span className="text-xl font-bold text-blue-600 dark:text-white">{capitalizedMonth}</span>
            <span className="text-xs text-slate-500 font-medium">{currentYear}</span>
          </div>
          <button 
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-blue-600 dark:text-slate-400"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20">
            <p className="text-xs font-bold uppercase">Restante em {capitalizedMonth}</p>
            <p className="text-xl font-bold">{formatCurrency(stats.remaining)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Salary Section */}
        <div className="space-y-6">
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-600 dark:text-white">
              <DollarSign className="w-5 h-5 text-blue-500" />
              Meu Salário
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Valor Mensal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                  <input 
                    type="number" 
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Dia do Recebimento</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Ex: 05"
                    value={salaryDateInput}
                    onChange={(e) => setSalaryDateInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Observação</label>
                <textarea 
                  placeholder="Ex: Pagamento do trabalho principal"
                  value={salaryObsInput}
                  onChange={(e) => setSalaryObsInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>
              <button 
                onClick={handleSaveSalary}
                className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar Salário
              </button>
            </div>
          </motion.section>

          {/* Mini Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-600 dark:text-white">
              <PieChartIcon className="w-5 h-5 text-blue-500" />
              Resumo
            </h3>
            <div className="h-[200px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Sem dados para exibir
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Salário:</span>
                <span className="font-bold">{formatCurrency(stats.salary)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Despesas:</span>
                <span className="font-bold text-red-500">{formatCurrency(stats.expenses)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-sm">
                <span className="text-slate-500 font-bold">Restante:</span>
                <span className="font-bold text-emerald-500">{formatCurrency(stats.remaining)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Minhas Despesas</h3>
            <button 
              onClick={() => setIsAddingExpense(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Adicionar Despesa
            </button>
          </div>

          <AnimatePresence>
            {isAddingExpense && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-red-500/30 shadow-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">{editingExpense ? 'Editar Despesa' : 'Nova Despesa'}</h3>
                  <button onClick={resetExpenseForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome da Despesa</label>
                    <input
                      type="text"
                      placeholder="Ex: Aluguel, Mercado"
                      value={expenseName}
                      onChange={(e) => setExpenseName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Valor (R$)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={expenseValue}
                      onChange={(e) => setExpenseValue(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                    />
                    {parseInt(expenseInstallments) > 1 && (
                      <p className="text-[10px] text-slate-400">Insira o valor TOTAL da compra parcelada.</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Forma de Pagamento</label>
                    <select
                      value={expensePaymentMethod}
                      onChange={(e) => setExpensePaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
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
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Selecionar Cartão</label>
                      <select
                        value={expenseCardId}
                        onChange={(e) => setExpenseCardId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Selecione um cartão</option>
                        {state.cards.map(card => (
                          <option key={card.id} value={card.id}>{card.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 12"
                      value={expenseInstallments}
                      onChange={(e) => setExpenseInstallments(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Recorrência (Frequência)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['none', 'weekly', 'monthly', 'yearly'].map((r) => (
                        <button
                          key={r}
                          onClick={() => setExpenseRecurrence(r as any)}
                          className={cn(
                            "py-2 px-3 rounded-xl text-xs font-bold border transition-all",
                            expenseRecurrence === r 
                              ? "bg-red-500 text-white border-red-500 shadow-md" 
                              : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-red-500"
                          )}
                        >
                          {getRecurrenceLabel(r)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                  >
                    {editingExpense ? 'Atualizar Despesa' : 'Salvar Despesa'}
                  </button>
                  <button 
                    onClick={resetExpenseForm}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-bold">Lista de Despesas</h4>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                {state.transactions.filter(t => t.type === 'expense').length} itens
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.monthlyTransactions.filter(t => t.type === 'expense').length > 0 ? (
                stats.monthlyTransactions.filter(t => t.type === 'expense').map((expense) => (
                  <motion.div 
                    key={expense.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-xl flex items-center justify-center">
                        {expense.recurrence && expense.recurrence !== 'none' ? <RefreshCw className="w-5 h-5 animate-spin-slow" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{expense.description}</p>
                          {expense.recurrence && expense.recurrence !== 'none' && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-500 rounded font-bold uppercase">
                              {getRecurrenceLabel(expense.recurrence)}
                            </span>
                          )}
                          {expense.installments && expense.installments.total > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded font-bold uppercase">
                              {(() => {
                                const tDate = new Date(expense.date);
                                const diff = (selectedDate.getFullYear() * 12 + selectedDate.getMonth()) - (tDate.getFullYear() * 12 + tDate.getMonth());
                                return `${diff + 1}/${expense.installments.total}`;
                              })()}x
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {expense.category}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                          {expense.paymentMethod && (
                            <span className="flex items-center gap-1 capitalize">
                              <CreditCardIcon className="w-3 h-3" /> 
                              {expense.paymentMethod === 'credito' ? `Cartão ${state.cards.find(c => c.id === expense.cardId)?.name || ''}` : expense.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block font-bold text-red-500">-{formatCurrency(expense.monthlyAmount || expense.amount)}</span>
                        {expense.installments && expense.installments.total > 1 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Total: {formatCurrency(expense.amount)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditExpense(expense)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteExpense(expense)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhuma despesa registrada.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
