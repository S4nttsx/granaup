import { useState, useEffect } from 'react';
import { Newspaper, Search, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

export default function NewsTab() {
  const [news, setNews] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<any[]>([]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Quais são as notícias mais recentes e importantes sobre o mercado financeiro brasileiro e criptomoedas hoje? Forneça um resumo estruturado com tópicos e explique o impacto de cada notícia de forma simples.",
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setNews(response.text || 'Não foi possível carregar as notícias no momento.');
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setSources(chunks.filter((c: any) => c.web).map((c: any) => c.web));
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews('Erro ao carregar notícias. Verifique sua conexão ou chave de API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            Notícias do Mercado
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
          </h2>
          <p className="text-slate-500">IA-powered insights sobre finanças e cripto.</p>
        </div>
        <button 
          onClick={fetchNews}
          disabled={loading}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-6 h-6 text-emerald-500", loading && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">IA está analisando o mercado...</p>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{news}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-lg shadow-amber-500/20">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Resumo da IA
            </h3>
            <p className="text-amber-50 text-sm leading-relaxed">
              O mercado está reagindo a novas políticas econômicas. É um bom momento para revisar sua carteira de investimentos e ficar atento às oscilações do Bitcoin.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Fontes Consultadas</h3>
            <div className="space-y-3">
              {sources.length > 0 ? (
                sources.map((source, i) => (
                  <a 
                    key={i}
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
                  >
                    <span className="text-sm font-medium truncate max-w-[200px]">{source.title || 'Ver fonte'}</span>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-500">As fontes aparecerão aqui após a análise.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
