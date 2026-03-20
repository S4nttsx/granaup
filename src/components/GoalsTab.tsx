import { useState } from 'react';
import { Plus, Target, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AppState, Goal, Transaction } from '../types';

interface GoalsTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function GoalsTab({ state, updateState }: GoalsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');

  const resetForm = () => {
    setNewName('');
    setNewTarget('');
    setIsAdding(false);
    setEditingGoal(null);
  };

  const handleSaveGoal = () => {
    if (!newName || !newTarget) return;
    
    if (editingGoal) {
      const updatedGoals = state.goals.map(g => 
        g.id === editingGoal.id 
          ? { ...g, name: newName, targetValue: parseFloat(newTarget) } 
          : g
      );
      updateState({ goals: updatedGoals });
    } else {
      const goal: Goal = {
        id: Date.now().toString(),
        name: newName,
        targetValue: parseFloat(newTarget),
        currentValue: 0,
        category: 'Geral'
      };
      updateState({ goals: [...state.goals, goal] });
    }
    resetForm();
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setNewName(goal.name);
    setNewTarget(goal.targetValue.toString());
    setIsAdding(true);
  };

  const deleteGoal = (id: string) => {
    updateState({ goals: state.goals.filter(g => g.id !== id) });
  };

  const handleAddMoney = () => {
    if (!contributingGoal || !contributionAmount) return;
    
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      description: `Aporte Meta: ${contributingGoal.name}`,
      amount: amount,
      type: 'expense',
      category: 'Meta',
      date: new Date().toISOString(),
      paymentMethod: 'pix'
    };

    updateState({
      goals: state.goals.map(g => 
        g.id === contributingGoal.id ? { ...g, currentValue: g.currentValue + amount } : g
      ),
      transactions: [...state.transactions, newTransaction]
    });

    setContributingGoal(null);
    setContributionAmount('');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Minhas <span className="text-blue-600">Metas</span></h2>
          <p className="text-slate-500 font-medium">Acompanhe seu progresso e realize seus sonhos.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 group"
        >
          <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
          Nova Meta
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-10 bg-white dark:bg-dark-card rounded-[2.5rem] border border-blue-500/20 shadow-2xl shadow-blue-600/5 space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {editingGoal ? 'Editar Meta' : 'Criar Nova Meta'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome da Meta</label>
              <input
                type="text"
                placeholder="Ex: Viagem para Europa, Reserva de Emergência"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor Alvo (R$)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                <input
                  type="number"
                  placeholder="0,00"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={handleSaveGoal}
              className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              {editingGoal ? 'Atualizar Meta' : 'Salvar Meta'}
            </button>
            <button 
              onClick={resetForm}
              className="flex-1 py-4 bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-dark-hover/80 transition-all"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {contributingGoal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-dark-card p-10 rounded-[3rem] shadow-2xl max-w-md w-full border border-slate-200 dark:border-dark-border space-y-8"
          >
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Aportar em {contributingGoal.name}</h3>
              <p className="text-slate-500 font-medium">O valor será registrado como uma despesa e adicionado à meta.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Valor do Aporte</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-2xl font-bold">R$</span>
                  <input
                    autoFocus
                    type="number"
                    placeholder="0,00"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="w-full pl-16 pr-6 py-6 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-[2rem] outline-none focus:border-blue-600 text-4xl font-black tracking-tighter transition-all"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleAddMoney}
                  className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Confirmar Aporte
                </button>
                <button 
                  onClick={() => setContributingGoal(null)}
                  className="w-full py-5 bg-slate-100 dark:bg-dark-hover text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {state.goals.length > 0 ? (
          state.goals.map((goal) => {
            const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
            return (
              <motion.div 
                key={goal.id}
                layout
                className="p-10 bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200/60 dark:border-dark-border shadow-sm hover:shadow-2xl hover:shadow-blue-600/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Target className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{goal.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{goal.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 transition-opacity">
                    <button onClick={() => handleEdit(goal)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acumulado</p>
                      <p className="text-3xl font-black text-blue-600 tracking-tighter">{formatCurrency(goal.currentValue)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Objetivo</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{formatCurrency(goal.targetValue)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-100 dark:bg-dark-input rounded-full overflow-hidden p-1 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-blue-600 rounded-full shadow-lg shadow-blue-600/20"
                      />
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{progress.toFixed(1)}% Completo</span>
                      {progress >= 100 && (
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          Concluído! 🎉
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => setContributingGoal(goal)}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-slate-50 dark:bg-dark-input hover:bg-blue-600 hover:text-white rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all shadow-sm group/btn"
                  >
                    <Plus className="w-5 h-5 transition-transform group-hover/btn:rotate-90" />
                    Adicionar Aporte
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center bg-white dark:bg-dark-card rounded-[3rem] border border-dashed border-slate-200 dark:border-dark-border space-y-8">
            <div className="w-24 h-24 bg-slate-50 dark:bg-dark-input rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-dark-border">
              <Target className="w-12 h-12 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Você ainda não tem metas.</h3>
              <p className="text-slate-500 font-medium">Comece a planejar seu futuro hoje mesmo!</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all"
            >
              Criar Minha Primeira Meta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
