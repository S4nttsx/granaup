import { Bell, X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, Notification } from '../types';

interface NotificationCenterProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function NotificationCenter({ state, updateState }: NotificationCenterProps) {
  const unreadCount = (state.notifications || []).filter(n => !n.read).length;
  const [isOpen, setIsOpen] = (window as any).useNotificationOpen || [false, () => {}]; // Using a hacky way to share state if needed, but let's just use local state for now
  
  // Since I can't easily share state between App and this without lifting it, 
  // I'll just manage visibility locally in this component for the dropdown.
  const [showDropdown, setShowDropdown] = (window as any).useStateNotification ? (window as any).useStateNotification() : [false, (v: boolean) => {}];

  const markAsRead = (id: string) => {
    const updated = (state.notifications || []).map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    updateState({ notifications: updated });
  };

  const clearAll = () => {
    updateState({ notifications: [] });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => (window as any).setNotificationOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-hover transition-all"
      >
        <Bell className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-dark-card">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => (window as any).setNotificationOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
                <h3 className="font-bold">Notificações</h3>
                <button 
                  onClick={clearAll}
                  className="text-xs text-slate-500 hover:text-blue-500 font-bold"
                >
                  Limpar tudo
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {(state.notifications || []).length > 0 ? (
                  (state.notifications || []).slice().reverse().map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 border-b border-slate-50 dark:border-dark-border last:border-0 transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1">{getIcon(n.type)}</div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${!n.read ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2">
                            {new Date(n.date).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhuma notificação por aqui.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
