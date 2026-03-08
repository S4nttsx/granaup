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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-600 dark:text-white">Minhas Metas</h2>
          <p className="text-slate-500">Acompanhe seu progresso e realize seus sonhos.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Meta
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white dark:bg-dark-card rounded-3xl border-2 border-blue-500/30 shadow-xl"
        >
          <h3 className="text-xl font-bold mb-4 text-blue-600 dark:text-white">
            {editingGoal ? 'Editar Meta' : 'Criar Nova Meta'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome da Meta (ex: Viagem, Carro)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Valor Alvo (R$)"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSaveGoal}
              className="px-6 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
            >
              {editingGoal ? 'Atualizar Meta' : 'Salvar Meta'}
            </button>
            <button 
              onClick={resetForm}
              className="px-6 py-2 bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-slate-400 font-bold rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {contributingGoal && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-dark-card p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-dark-border">
            <h3 className="text-2xl font-bold mb-2 text-blue-600 dark:text-white">Aportar em {contributingGoal.name}</h3>
            <p className="text-slate-500 mb-6 text-sm">O valor será abatido do seu salário mensal.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">VALOR DO APORTE (R$)</label>
                <input
                  autoFocus
                  type="number"
                  placeholder="0,00"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-2xl outline-none focus:border-blue-500 text-2xl font-bold"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleAddMoney}
                  className="flex-1 py-4 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
                >
                  Confirmar Aporte
                </button>
                <button 
                  onClick={() => setContributingGoal(null)}
                  className="px-6 py-4 bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-slate-400 font-bold rounded-2xl"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.goals.length > 0 ? (
          state.goals.map((goal) => {
            const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
            return (
              <motion.div 
                key={goal.id}
                layout
                className="p-6 bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-blue-600 dark:text-white">{goal.name}</h4>
                      <p className="text-sm text-slate-500">{goal.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(goal)} className="p-2 text-blue-500 md:text-blue-500 md:hover:bg-blue-50 dark:md:hover:bg-blue-900/20 rounded-lg">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="p-2 text-red-500 md:text-red-500 md:hover:bg-red-50 dark:md:hover:bg-red-900/20 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-blue-600 dark:text-white">{formatCurrency(goal.currentValue)}</span>
                    <span className="text-slate-400">de {formatCurrency(goal.targetValue)}</span>
                  </div>
                  
                  <div className="h-3 bg-slate-100 dark:bg-dark-input rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-500">{progress.toFixed(1)}% completo</span>
                    <button 
                      onClick={() => setContributingGoal(goal)}
                      className="flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-dark-hover hover:bg-blue-500 hover:text-white rounded-xl text-sm font-bold transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-dark-card rounded-3xl border-2 border-dashed border-slate-200 dark:border-dark-border">
            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">Você ainda não tem metas.</h3>
            <p className="text-slate-500 mb-6">Comece a planejar seu futuro hoje mesmo!</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl"
            >
              Criar Minha Primeira Meta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
