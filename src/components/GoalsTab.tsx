import { useState } from 'react';
import { Plus, Target, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AppState, Goal } from '../types';

interface GoalsTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function GoalsTab({ state, updateState }: GoalsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');

  const addGoal = () => {
    if (!newName || !newTarget) return;
    const goal: Goal = {
      id: Date.now().toString(),
      name: newName,
      targetValue: parseFloat(newTarget),
      currentValue: 0,
      category: 'Geral'
    };
    updateState({ goals: [...state.goals, goal] });
    setNewName('');
    setNewTarget('');
    setIsAdding(false);
  };

  const deleteGoal = (id: string) => {
    updateState({ goals: state.goals.filter(g => g.id !== id) });
  };

  const addMoney = (id: string) => {
    const amount = prompt('Quanto deseja adicionar?');
    if (!amount) return;
    updateState({
      goals: state.goals.map(g => 
        g.id === id ? { ...g, currentValue: g.currentValue + parseFloat(amount) } : g
      )
    });
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Minhas Metas</h2>
          <p className="text-slate-500">Acompanhe seu progresso e realize seus sonhos.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Meta
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/30 shadow-xl"
        >
          <h3 className="text-xl font-bold mb-4">Criar Nova Meta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome da Meta (ex: Viagem, Carro)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="number"
              placeholder="Valor Alvo (R$)"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={addGoal}
              className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl"
            >
              Salvar Meta
            </button>
            <button 
              onClick={() => setIsAdding(false)}
              className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl"
            >
              Cancelar
            </button>
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
                className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{goal.name}</h4>
                      <p className="text-sm text-slate-500">{goal.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteGoal(goal.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{formatCurrency(goal.currentValue)}</span>
                    <span className="text-slate-400">de {formatCurrency(goal.targetValue)}</span>
                  </div>
                  
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-500">{progress.toFixed(1)}% completo</span>
                    <button 
                      onClick={() => addMoney(goal.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white rounded-xl text-sm font-bold transition-all"
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
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
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
