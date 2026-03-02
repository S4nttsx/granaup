import { useState } from 'react';
import { Mail, Lock, User, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  onLogin: (user: { name: string; email: string }) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ name: name || 'Usuário', email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-4">
              <Wallet className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">GranaUp</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-center">
              {isRegistering ? 'Crie sua conta para começar' : 'Bem-vindo de volta ao seu controle financeiro'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Seu Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  required
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              {isRegistering ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Ou</span>
              </div>
            </div>

            <button
              onClick={() => onLogin({ name: 'Visitante', email: 'visitante@granaup.com' })}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all"
            >
              Continuar como Visitante
            </button>

            <p className="text-center text-slate-500 text-sm">
              {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="ml-1 text-emerald-500 font-bold hover:underline"
              >
                {isRegistering ? 'Faça login' : 'Cadastre-se'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
