import { useState } from 'react';
import { Plus, CreditCard, Trash2, Calendar, DollarSign, AlertCircle, Edit2, X, Save, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, CreditCard as Card } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function CardTab({ state, updateState }: CardTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [bill, setBill] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [cardNumber, setCardNumber] = useState('');

  const resetForm = () => {
    setName('');
    setLimit('');
    setBill('');
    setDueDate('');
    setCardNumber('');
    setIsAdding(false);
    setEditingCard(null);
  };

  const addCard = () => {
    if (!name || !limit || !bill || !dueDate) return;
    const newCard: Card = {
      id: Date.now().toString(),
      name,
      limit: parseFloat(limit),
      currentBill: parseFloat(bill),
      dueDate,
      number: cardNumber
    };
    updateState({ cards: [...state.cards, newCard] });
    resetForm();
  };

  const updateCard = () => {
    if (!editingCard || !name || !limit || !bill || !dueDate) return;
    const updatedCards = state.cards.map(c => 
      c.id === editingCard.id 
        ? { ...c, name, limit: parseFloat(limit), currentBill: parseFloat(bill), dueDate, number: cardNumber }
        : c
    );
    updateState({ cards: updatedCards });
    resetForm();
  };

  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setName(card.name);
    setLimit(card.limit.toString());
    setBill(card.currentBill.toString());
    setDueDate(card.dueDate);
    setCardNumber(card.number || '');
    setIsAdding(true);
  };

  const deleteCard = (id: string) => {
    updateState({ cards: state.cards.filter(c => c.id !== id) });
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const maskCardNumber = (num?: string) => {
    if (!num) return '•••• •••• •••• ••••';
    const last4 = num.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
            Seus <span className="text-blue-600">Cartões</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium">Gerencie seus limites e faturas em um só lugar.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 group text-sm"
        >
          <Plus className="w-4.5 h-4.5 transition-transform group-hover:rotate-90" />
          Novo Cartão
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 bg-white dark:bg-dark-card rounded-3xl border border-blue-500/20 shadow-2xl shadow-blue-500/5"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <CreditCard className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {editingCard ? 'Editar Cartão' : 'Configurar Novo Cartão'}
                </h3>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-slate-50 dark:hover:bg-dark-hover rounded-xl transition-colors">
                <X className="w-4.5 h-4.5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Cartão</label>
                <input
                  type="text"
                  placeholder="Ex: Nubank, Inter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Limite Total (R$)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fatura Atual (R$)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={bill}
                  onChange={(e) => setBill(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dia do Vencimento</label>
                <input
                  type="text"
                  placeholder="Ex: 15"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número do Cartão (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: 1234 5678 9101 1121"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={editingCard ? updateCard : addCard} 
                className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Save className="w-4.5 h-4.5" />
                {editingCard ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </button>
              <button 
                onClick={resetForm} 
                className="px-6 py-3.5 bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {state.cards.length > 0 ? (
          state.cards.map((card) => {
            const remaining = card.limit - card.currentBill;
            const usagePercent = (card.currentBill / card.limit) * 100;

            return (
              <motion.div 
                key={card.id}
                layout
                className="relative overflow-hidden p-6 bg-white dark:bg-dark-card rounded-3xl border border-slate-200/60 dark:border-dark-border shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all group"
              >
                {/* Visual Card Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/10 transition-all" />
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/20 transition-transform group-hover:scale-110">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{card.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">{maskCardNumber(card.number)}</p>
                        <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                        <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Vence dia {card.dueDate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 transition-all">
                    <button onClick={() => handleEdit(card)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCard(card.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 dark:bg-dark-input rounded-2xl border border-slate-100 dark:border-dark-border">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Fatura Atual</p>
                    <p className="text-xl font-black text-red-600 tracking-tighter">{formatCurrency(card.currentBill)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-dark-input rounded-2xl border border-slate-100 dark:border-dark-border">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Disponível</p>
                    <p className="text-xl font-black text-emerald-600 tracking-tighter">{formatCurrency(remaining)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Utilização do Limite</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{usagePercent.toFixed(1)}%</p>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">Total {formatCurrency(card.limit)}</p>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-dark-input rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePercent}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-blue-600"
                      )}
                    />
                  </div>
                </div>

                {usagePercent > 80 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-2xl shadow-sm"
                  >
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl">
                      <AlertCircle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-black text-xs tracking-tight uppercase">Uso Elevado!</p>
                      <p className="text-[10px] font-medium opacity-80 leading-relaxed">Você atingiu {usagePercent.toFixed(1)}% do seu limite. Cuidado com os juros.</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-24 text-center bg-white dark:bg-dark-card rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-dark-border space-y-6">
            <div className="w-24 h-24 bg-slate-50 dark:bg-dark-input rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-12 h-12 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nenhum cartão cadastrado</h3>
              <p className="text-slate-500 font-medium">Organize suas faturas e não perca o controle dos seus limites.</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Adicionar Primeiro Cartão
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
