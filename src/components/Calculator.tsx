import { useState, useEffect } from 'react';
import { 
  Calculator as CalcIcon, 
  X as CloseIcon, 
  Maximize2,
  Minimize2
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
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(prev => {
        if (prev === '0') return num;
        if (prev.length >= 9) return prev; // Limit display length
        return prev + num;
      });
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue || 0;
      const newValue = performCalculation[operator](currentValue, inputValue);
      setPrevValue(newValue);
      setDisplay(String(newValue).slice(0, 9));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const performCalculation: Record<string, (prev: number, next: number) => number> = {
    '/': (prev, next) => prev / next,
    '*': (prev, next) => prev * next,
    '+': (prev, next) => prev + next,
    '-': (prev, next) => prev - next,
    '=': (prev, next) => next
  };

  const calculate = () => {
    if (!operator) return;

    const inputValue = parseFloat(display);
    const currentValue = prevValue || 0;
    const newValue = performCalculation[operator](currentValue, inputValue);

    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
    setDisplay(String(newValue).slice(0, 9));
  };

  const clear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const toggleSign = () => {
    setDisplay(prev => String(parseFloat(prev) * -1));
  };

  const percentage = () => {
    setDisplay(prev => String(parseFloat(prev) / 100));
  };

  const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

  const getButtonClass = (type: 'number' | 'operator' | 'special', active?: boolean) => {
    const base = "flex items-center justify-center text-2xl font-medium transition-all active:brightness-125 select-none";
    if (type === 'number') return cn(base, "bg-[#333333] text-white rounded-full");
    if (type === 'operator') return cn(base, "rounded-full", active ? "bg-white text-[#ff9f0a]" : "bg-[#ff9f0a] text-white");
    if (type === 'special') return cn(base, "bg-[#a5a5a5] text-black rounded-full");
    return base;
  };

  const calculatorContent = (
    <div className={cn(
      "bg-black rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col p-4",
      isPopup ? "w-[320px]" : "max-w-[360px] mx-auto h-[640px]"
    )}>
      {/* Header Controls (Only for Popup or App UI integration) */}
      <div className="flex items-center justify-between px-4 py-2 mb-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        
        <div className="flex items-center gap-2">
          {isPopup && (
            <>
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => updateState({ isCalculatorOpen: false })}
                className="p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors text-white/40"
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
          <div className="flex-1 flex flex-col items-end justify-end px-6 pb-4">
            <div className="text-white text-7xl font-light tracking-tight overflow-hidden text-ellipsis w-full text-right">
              {display.length > 6 ? (
                <span className="text-5xl">{display}</span>
              ) : display}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-3 p-2">
            {/* Row 1 */}
            <button onClick={clear} className={getButtonClass('special')}>{display === '0' && !operator ? 'AC' : 'C'}</button>
            <button onClick={toggleSign} className={getButtonClass('special')}>+/-</button>
            <button onClick={percentage} className={getButtonClass('special')}>%</button>
            <button onClick={() => handleOperator('/')} className={getButtonClass('operator', operator === '/')}>÷</button>

            {/* Row 2 */}
            <button onClick={() => handleNumber('7')} className={getButtonClass('number')}>7</button>
            <button onClick={() => handleNumber('8')} className={getButtonClass('number')}>8</button>
            <button onClick={() => handleNumber('9')} className={getButtonClass('number')}>9</button>
            <button onClick={() => handleOperator('*')} className={getButtonClass('operator', operator === '*')}>×</button>

            {/* Row 3 */}
            <button onClick={() => handleNumber('4')} className={getButtonClass('number')}>4</button>
            <button onClick={() => handleNumber('5')} className={getButtonClass('number')}>5</button>
            <button onClick={() => handleNumber('6')} className={getButtonClass('number')}>6</button>
            <button onClick={() => handleOperator('-')} className={getButtonClass('operator', operator === '-')}>−</button>

            {/* Row 4 */}
            <button onClick={() => handleNumber('1')} className={getButtonClass('number')}>1</button>
            <button onClick={() => handleNumber('2')} className={getButtonClass('number')}>2</button>
            <button onClick={() => handleNumber('3')} className={getButtonClass('number')}>3</button>
            <button onClick={() => handleOperator('+')} className={getButtonClass('operator', operator === '+')}>+</button>

            {/* Row 5 */}
            <button 
              onClick={() => handleNumber('0')} 
              className={cn(getButtonClass('number'), "col-span-2 !justify-start px-8")}
            >
              0
            </button>
            <button onClick={handleDecimal} className={getButtonClass('number')}>,</button>
            <button onClick={calculate} className={getButtonClass('operator')}>=</button>
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
          Uma ferramenta inspirada no design clássico para sua gestão diária.
        </p>
      </div>
      {calculatorContent}
    </div>
  );
}
