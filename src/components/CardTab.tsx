import { useState } from 'react';
import { Plus, CreditCard, Trash2, Calendar, DollarSign, AlertCircle, Edit2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, CreditCard as Card } from '../types';

interface CardTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
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
    if (!num) return '**** **** **** ****';
    const last4 = num.slice(-4);
    return `**** **** **** ${last4}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Cartões de Crédito</h2>
          <p className="text-slate-500">Gerencie seus limites e faturas em um só lugar.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/20 hover:bg-violet-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Cartão
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-violet-500/30 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingCard ? 'Editar Cartão' : 'Novo Cartão'}</h3>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome do Cartão</label>
                <input
                  type="text"
                  placeholder="Ex: Nubank, Inter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Limite Total (R$)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Fatura Atual (R$)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={bill}
                  onChange={(e) => setBill(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Dia do Vencimento</label>
                <input
                  type="text"
                  placeholder="Ex: 15"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Número do Cartão (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: 1234 5678 9101 1121"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={editingCard ? updateCard : addCard} 
                className="flex-1 py-3 bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 hover:bg-violet-600 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingCard ? 'Atualizar Cartão' : 'Salvar Cartão'}
              </button>
              <button 
                onClick={resetForm} 
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.cards.length > 0 ? (
          state.cards.map((card) => {
            const remaining = card.limit - card.currentBill;
            const usagePercent = (card.currentBill / card.limit) * 100;

            return (
              <motion.div 
                key={card.id}
                layout
                className="relative overflow-hidden p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
              >
                {/* Visual Card Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold">{card.name}</h4>
                      <p className="text-xs text-slate-400 font-mono tracking-widest mb-1">{maskCardNumber(card.number)}</p>
                      <p className="text-sm text-slate-500">Vencimento dia {card.dueDate}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(card)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCard(card.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Fatura Atual</p>
                    <p className="text-xl font-bold text-red-500">{formatCurrency(card.currentBill)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Limite Disponível</p>
                    <p className="text-xl font-bold text-emerald-500">{formatCurrency(remaining)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Uso do Limite</span>
                    <span>{usagePercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePercent}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-violet-500"
                      )}
                    />
                  </div>
                </div>

                {usagePercent > 90 && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Atenção: Limite quase esgotado!
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">Nenhum cartão cadastrado.</h3>
            <p className="text-slate-500 mb-6">Organize suas faturas e não perca o controle.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-violet-500 text-white font-bold rounded-2xl"
            >
              Adicionar Meu Primeiro Cartão
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
