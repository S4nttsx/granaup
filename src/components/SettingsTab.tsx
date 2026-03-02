import { AppState } from '../types';
import { 
  User, 
  Wallet, 
  Percent, 
  Trash2, 
  Download, 
  Upload, 
  Shield, 
  Moon, 
  Sun,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function SettingsTab({ state, updateState }: SettingsTabProps) {
  
  const handleExport = () => {
    const dataStr = JSON.stringify(state);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'granaup_backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        updateState(imported);
        alert('Dados importados com sucesso!');
      } catch (err) {
        alert('Erro ao importar arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const clearData = () => {
    if (confirm('Tem certeza que deseja apagar TODOS os seus dados? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('granaup_state');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold">Configurações</h2>
        <p className="text-slate-500">Personalize sua experiência no GranaUp.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Section */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            Perfil do Usuário
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500">Nome</label>
              <input 
                type="text" 
                value={state.user.name}
                onChange={(e) => updateState({ user: { ...state.user, name: e.target.value } })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500">E-mail</label>
              <input 
                type="email" 
                value={state.user.email}
                onChange={(e) => updateState({ user: { ...state.user, email: e.target.value } })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            {state.darkMode ? <Moon className="w-5 h-5 text-emerald-500" /> : <Sun className="w-5 h-5 text-emerald-500" />}
            Aparência
          </h3>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <div>
              <p className="font-bold">Modo Escuro</p>
              <p className="text-sm text-slate-500">Alterne entre o tema claro e escuro.</p>
            </div>
            <button 
              onClick={() => updateState({ darkMode: !state.darkMode })}
              className={cn(
                "w-14 h-8 rounded-full transition-all relative",
                state.darkMode ? "bg-emerald-500" : "bg-slate-300"
              )}
            >
              <motion.div 
                animate={{ x: state.darkMode ? 24 : 4 }}
                className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-sm"
              />
            </button>
          </div>
        </section>

        {/* Financial Config */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Percent className="w-5 h-5 text-emerald-500" />
            Distribuição do Salário
          </h3>
          <p className="text-sm text-slate-500 mb-6">Defina como seu salário deve ser dividido automaticamente.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PercentInput 
              label="Gastos" 
              value={state.distribution.expenses} 
              onChange={(v) => updateState({ distribution: { ...state.distribution, expenses: v } })}
            />
            <PercentInput 
              label="Metas" 
              value={state.distribution.goals} 
              onChange={(v) => updateState({ distribution: { ...state.distribution, goals: v } })}
            />
            <PercentInput 
              label="Invest." 
              value={state.distribution.investments} 
              onChange={(v) => updateState({ distribution: { ...state.distribution, investments: v } })}
            />
            <PercentInput 
              label="Cripto" 
              value={state.distribution.crypto} 
              onChange={(v) => updateState({ distribution: { ...state.distribution, crypto: v } })}
            />
          </div>
          <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Total:</span>
            <span className={cn(
              "font-bold",
              (state.distribution.expenses + state.distribution.goals + state.distribution.investments + state.distribution.crypto) === 100 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-red-500"
            )}>
              {state.distribution.expenses + state.distribution.goals + state.distribution.investments + state.distribution.crypto}%
            </span>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Gerenciamento de Dados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold transition-all"
            >
              <Download className="w-5 h-5" />
              Exportar Backup
            </button>
            <label className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold transition-all cursor-pointer">
              <Upload className="w-5 h-5" />
              Importar Backup
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button 
              onClick={clearData}
              className="md:col-span-2 flex items-center justify-center gap-2 px-6 py-4 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-2xl font-bold transition-all"
            >
              <Trash2 className="w-5 h-5" />
              Limpar Todos os Dados
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function PercentInput({ label, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
      <div className="relative">
        <input 
          type="number" 
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-full pl-4 pr-8 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
