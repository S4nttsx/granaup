import { useState, useEffect, useRef } from 'react';
import { 
  Calculator as CalcIcon, 
  X, 
  Minus, 
  Plus, 
  Divide, 
  X as CloseIcon, 
  Delete,
  Maximize2,
  Minimize2,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState } from '../types';

interface CalculatorProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  isPopup?: boolean;
}

export default function Calculator({ state, updateState, isPopup = false }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  
  const handleNumber = (num: string) => {
    setDisplay(prev => prev === '0' ? num : prev + num);
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      // Using Function constructor as a safer alternative to eval for simple math
      // In a real app, use a math library
      const result = new Function('return ' + fullEquation.replace('x', '*'))();
      setDisplay(String(result));
      setEquation('');
    } catch (e) {
      setDisplay('Erro');
      setEquation('');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const backspace = () => {
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

  const buttons = [
    { label: 'C', action: clear, color: 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' },
    { label: 'DEL', action: backspace, color: 'bg-slate-500/10 text-slate-500 hover:bg-slate-500 hover:text-white' },
    { label: '%', action: () => handleOperator('%'), color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white' },
    { label: '/', action: () => handleOperator('/'), color: 'bg-blue-500 text-white hover:bg-blue-600' },
    { label: '7', action: () => handleNumber('7'), color: 'bg-white dark:bg-dark-hover text-slate-700 dark:text-slate-200 hover:bg-slate-100' },
    { label: '8', action: () => handleNumber('8'), color: 'bg-white dark:bg-dark-hover text-slate-700 dark:text-slate-200 hover:bg-slate-100' },
    { label: '9', action: () => handleNumber('9'), color: 'bg-white dark:bg-dark-hover text-slate-700 dark:text-slate-200 hover:bg-slate-100' },
    { label: 'x', action: () => handleOperator('*'), color: 'bg-blue-500 text-white hover:bg-blue-600' },
    { label: '4', action: () => handleNumber('4'), color: 'bg-white dark:bg-dark-hover text-slate-700 dark:text-slate-200 hover:bg-slate-100' },
    { label: '5', action: () => handleNumber('5'), color: 'bg-white dark:bg-dark-hover text-slate-700 dark:text-slate-200 hover:bg-slate-100' },
    { label: '6', action: () => handleNumber('6'), color: 'bg-white dark:bg-dark-hover text-slate-700 dark:text-slate-200 hover:bg-slate-100' },
    { label: '-', action: () => handleOperator('-'), color: 'bg-blue-500 text-white hover:bg-blue-600' },
    { label: '1', action: () => handleNumber('1'), color: 'bg-white dark:bg-dark-hover text-slate-700 dark:text-slate-200 hover:bg-slate-100' },
    { label: '2', action: () => handleNumber('2'), color: 'bg-white dark:bg-dark-hover text-slate-700 dark:text-slate-200 hover:bg-slate-100' },
    { label: '3', action: () => handleNumber('3'), color: 'bg-white dark:bg-dark-hover text-slate-700 dark:text-slate-200 hover:bg-slate-100' },
    { label: '+', action: () => handleOperator('+'), color: 'bg-blue-500 text-white hover:bg-blue-600' },
    { label: '0', action: () => handleNumber('0'), color: 'bg-white dark:bg-dark-hover text-slate-700 dark:text-slate-200 hover:bg-slate-100', span: 'col-span-2' },
    { label: '.', action: () => handleNumber('.'), color: 'bg-white dark:bg-dark-hover text-slate-700 dark:text-slate-200 hover:bg-slate-100' },
    { label: '=', action: calculate, color: 'bg-emerald-500 text-white hover:bg-emerald-600' },
  ];

  const calculatorContent = (
    <div className={cn(
      "bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden flex flex-col",
      isPopup ? "w-80" : "max-w-md mx-auto h-[600px]"
    )}>
      {/* Header */}
      <div className="p-6 bg-slate-50 dark:bg-dark-hover border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <CalcIcon className="text-white w-5 h-5" />
          </div>
          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Calculadora</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {!isPopup && (
            <button 
              onClick={() => updateState({ isCalculatorOpen: true })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all"
              title="Abrir em modo flutuante"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Modo Flutuante
            </button>
          )}
          {isPopup && (
            <>
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-dark-border rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => updateState({ isCalculatorOpen: false })}
                className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Display */}
          <div className="p-8 bg-slate-900 flex flex-col items-end justify-center gap-2 min-h-[140px]">
            <p className="text-slate-500 text-sm font-bold h-6">{equation}</p>
            <p className="text-white text-5xl font-black tracking-tighter overflow-hidden text-ellipsis w-full text-right">
              {display}
            </p>
          </div>

          {/* Keypad */}
          <div className="p-6 grid grid-cols-4 gap-3 flex-1">
            {buttons.map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                className={cn(
                  "h-14 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-sm",
                  btn.color,
                  btn.span || ""
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (isPopup) {
    return (
      <motion.div
        drag
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-24 right-8 z-[1000] cursor-move"
      >
        {calculatorContent}
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
          Calculadora <span className="text-blue-600">Financeira</span>
        </h2>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          Uma ferramenta simples e poderosa para ajudar você a organizar suas contas e planejar seus investimentos.
        </p>
      </div>
      {calculatorContent}
    </div>
  );
}
