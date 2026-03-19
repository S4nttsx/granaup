import { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  RefreshCw, 
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Coins,
  Newspaper,
  BookOpen,
  X,
  ChevronRight,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, NewsItem } from '../types';

interface Tip {
  title: string;
  description: string;
  horizon: 'Curto Prazo' | 'Longo Prazo';
  risk: 'Baixo' | 'Médio' | 'Alto';
  asset: string;
  reasoning: string;
  tutorial: {
    howTo: string;
    bestPlatforms: string[];
  };
}

interface InvestmentTipsTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function InvestmentTipsTab({ state, updateState }: InvestmentTipsTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);

  const fetchTips = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch News (General Finance + Crypto)
      const feeds = [
        { url: 'https://g1.globo.com/rss/g1/economia/', category: 'Brasil' },
        { url: 'https://www.infomoney.com.br/feed/', category: 'Mercado' },
        { url: 'https://cointelegraph.com.br/rss', category: 'Cripto' },
        { url: 'https://br.investing.com/rss/news_25.rss', category: 'Cripto' }
      ];

      const allNews: string[] = [];

      for (const feed of feeds) {
        try {
          const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
          const data = await response.json();
          if (data.status === 'ok') {
            data.items.slice(0, 5).forEach((item: any) => {
              allNews.push(`[${feed.category}] ${item.title}: ${item.description.replace(/<[^>]*>?/gm, '').substring(0, 100)}`);
            });
          }
        } catch (e) {
          console.error(`Error fetching feed ${feed.url}:`, e);
        }
      }

      // 2. Analyze with Gemini
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error('Chave da API Gemini não configurada. Por favor, adicione GEMINI_API_KEY nas configurações (ícone de engrenagem > Secrets).');
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Você é um analista financeiro sênior. Com base nas seguintes notícias recentes do mercado financeiro e cripto, gere 4 dicas de investimento acionáveis para o mercado brasileiro.
      Divida as dicas entre Curto Prazo (até 1 ano) e Longo Prazo (mais de 2 anos).
      Considere o cenário econômico atual (inflação, juros, tendências cripto).
      
      Notícias:
      ${allNews.length > 0 ? allNews.join('\n') : 'Nenhuma notícia recente encontrada. Use seu conhecimento geral do mercado financeiro atual para gerar dicas relevantes.'}
      
      Retorne um JSON com um array de objetos chamado 'tips', cada um com:
      - title: Título curto da dica
      - description: Resumo da dica
      - horizon: 'Curto Prazo' ou 'Longo Prazo'
      - risk: 'Baixo', 'Médio' ou 'Alto'
      - asset: O ativo ou classe de ativo recomendado
      - reasoning: Por que você está recomendando isso com base nas notícias fornecidas?
      - tutorial: Um objeto com:
          - howTo: Um guia passo a passo de como investir nesse ativo específico (máximo 300 caracteres)
          - bestPlatforms: Uma lista com os 3 melhores bancos ou corretoras para esse tipo de investimento no Brasil`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    horizon: { type: Type.STRING, enum: ['Curto Prazo', 'Longo Prazo'] },
                    risk: { type: Type.STRING, enum: ['Baixo', 'Médio', 'Alto'] },
                    asset: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    tutorial: {
                      type: Type.OBJECT,
                      properties: {
                        howTo: { type: Type.STRING },
                        bestPlatforms: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        }
                      },
                      required: ['howTo', 'bestPlatforms']
                    }
                  },
                  required: ['title', 'description', 'horizon', 'risk', 'asset', 'reasoning', 'tutorial']
                }
              }
            },
            required: ['tips']
          }
        }
      });

      let jsonText = response.text || '';
      // Clean up markdown if present
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }

      const result = JSON.parse(jsonText || '{"tips": []}');
      if (result.tips && Array.isArray(result.tips)) {
        setTips(result.tips);
        setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
      } else {
        console.error('Invalid tips format from AI:', result);
      }
    } catch (error: any) {
      console.error('Error generating tips:', error);
      setError(error.message || 'Erro ao gerar dicas de investimento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tips.length === 0) {
      fetchTips();
    }
  }, []);

  const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20">
              <Lightbulb className="text-white w-6 h-6" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              Dicas de <span className="text-amber-500">Investimento</span>
            </h2>
          </div>
          <p className="text-slate-500 font-medium ml-1">Análise inteligente baseada nas últimas notícias do mercado.</p>
        </div>

        <button 
          onClick={fetchTips}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3.5 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 group"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
          Atualizar Dicas
        </button>
      </div>

      {/* Stats/Info Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-card p-6 rounded-[2rem] border border-slate-200 dark:border-dark-border flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fonte de Dados</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Notícias em Tempo Real</p>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-card p-6 rounded-[2rem] border border-slate-200 dark:border-dark-border flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análise</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Inteligência Artificial</p>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-card p-6 rounded-[2rem] border border-slate-200 dark:border-dark-border flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Última Atualização</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{lastUpdated || 'Carregando...'}</p>
          </div>
        </div>
      </div>

      {/* Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="wait">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200 dark:border-dark-border animate-pulse" />
            ))
          ) : error ? (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Erro ao carregar dicas</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  {error}
                </p>
                <button 
                  onClick={fetchTips}
                  className="mt-4 px-6 py-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          ) : tips.length > 0 ? (
            tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200 dark:border-dark-border p-8 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  {tip.horizon === 'Curto Prazo' ? <Clock className="w-24 h-24" /> : <Target className="w-24 h-24" />}
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      tip.horizon === 'Curto Prazo' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                    )}>
                      {tip.horizon}
                    </span>
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      tip.risk === 'Baixo' ? "bg-emerald-500/10 text-emerald-500" : 
                      tip.risk === 'Médio' ? "bg-amber-500/10 text-amber-500" : 
                      "bg-red-500/10 text-red-500"
                    )}>
                      Risco {tip.risk}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-amber-500 transition-colors">
                      {tip.title}
                    </h3>
                    <p className="text-sm font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4" />
                      {tip.asset}
                    </p>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {tip.description}
                  </p>

                  <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Por que investir?</p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{tip.reasoning}"
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedTip(tip)}
                      className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-dark-hover text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 transition-all group/btn"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Tutorial
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-dark-hover rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10 text-slate-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nenhuma dica disponível</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Não foi possível gerar dicas de investimento no momento. Verifique sua conexão ou tente novamente mais tarde.
                </p>
                <button 
                  onClick={fetchTips}
                  className="mt-4 px-6 py-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {selectedTip && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTip(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden pointer-events-auto"
              >
                {/* Modal Header */}
                <div className="p-8 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-slate-50/50 dark:bg-dark-hover/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <BookOpen className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Tutorial de Investimento</h3>
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">{selectedTip.asset}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTip(null)}
                    className="p-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-slate-400 hover:text-red-500 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                  {/* How to Invest */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Como Investir</h4>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-dark-hover rounded-2xl border border-slate-100 dark:border-dark-border">
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {selectedTip.tutorial.howTo}
                      </p>
                    </div>
                  </div>

                  {/* Best Platforms */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Melhores Bancos e Corretoras</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedTip.tutorial.bestPlatforms.map((platform, i) => (
                        <div 
                          key={i}
                          className="flex items-center justify-between p-4 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl group/item hover:border-emerald-500/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{platform}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover/item:text-emerald-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-8 bg-slate-50 dark:bg-dark-hover/50 border-t border-slate-100 dark:border-dark-border">
                  <button 
                    onClick={() => setSelectedTip(null)}
                    className="w-full py-4 bg-slate-900 dark:bg-dark-card text-white font-black uppercase tracking-widest rounded-2xl hover:bg-amber-500 transition-all shadow-lg"
                  >
                    Entendi, obrigado!
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <div className="p-6 bg-slate-100 dark:bg-dark-hover rounded-2xl border border-slate-200 dark:border-dark-border flex items-start gap-4">
        <Zap className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
        <div className="space-y-1">
          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Aviso Legal</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Estas dicas são geradas por inteligência artificial com base em notícias públicas e não constituem recomendação direta de investimento. O mercado financeiro envolve riscos. Sempre consulte um profissional certificado antes de tomar decisões financeiras.
          </p>
        </div>
      </div>
    </div>
  );
}
