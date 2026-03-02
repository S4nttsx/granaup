import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Image as ImageIcon, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Eu sou o assistente IA do GranaUp. Como posso ajudar com suas finanças hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: userMessage,
        config: {
          systemInstruction: "Você é o assistente financeiro do GranaUp. Ajude o usuário com dúvidas sobre investimentos, criptomoedas, economia e organização financeira. Seja amigável, profissional e direto.",
        },
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Desculpe, não consegui processar sua solicitação.' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.' }]);
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async () => {
    if (!input.trim() || isGeneratingImage) return;
    
    const prompt = input.trim();
    setInput('');
    setIsGeneratingImage(true);
    setMessages(prev => [...prev, { role: 'user', text: `Gere uma imagem (${imageSize}): ${prompt}` }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: imageSize } },
      });

      let imageUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setMessages(prev => [...prev, { role: 'model', text: `Aqui está a imagem (${imageSize}) que você pediu:`, image: imageUrl }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: 'Não consegui gerar a imagem no momento.' }]);
      }
    } catch (error) {
      console.error('Image gen error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Erro ao gerar imagem.' }]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">IA GranaUp</h3>
            <p className="text-xs text-emerald-100">Sempre online para ajudar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={imageSize} 
            onChange={(e) => setImageSize(e.target.value as any)}
            className="bg-white/20 text-xs font-bold rounded-lg px-2 py-1 outline-none"
          >
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
          <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === 'user' ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl shadow-sm",
              msg.role === 'user' 
                ? "bg-emerald-500 text-white rounded-tr-none" 
                : "bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 rounded-tl-none"
            )}>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="AI Generated" 
                  className="mt-4 rounded-xl w-full max-w-xs shadow-lg"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Bot className="w-5 h-5 text-slate-400" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Pergunte algo ou peça uma imagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button 
                onClick={generateImage}
                disabled={!input.trim() || isGeneratingImage}
                title="Gerar imagem"
                className="p-2 text-slate-400 hover:text-amber-500 transition-colors disabled:opacity-50"
              >
                <Wand2 className={cn("w-5 h-5", isGeneratingImage && "animate-spin")} />
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
