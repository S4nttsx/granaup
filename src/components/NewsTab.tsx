import { useState, useEffect, useMemo } from 'react';
import { 
  Newspaper, 
  Globe, 
  TrendingUp, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Zap, 
  AlertCircle,
  ExternalLink,
  Clock,
  ChevronRight,
  RefreshCw,
  TrendingDown,
  Info,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { AppState, NewsItem } from '../types';

interface NewsTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function NewsTab({ state, updateState }: NewsTabProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const filters = ['Todos', 'Salvas', 'Brasil', 'Internacional', 'Combustíveis', 'Política', 'Mercado'];

  const fetchNews = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Using rss2json as a proxy for public RSS feeds
      const feeds = [
        { url: 'https://g1.globo.com/rss/g1/economia/', category: 'Brasil' },
        { url: 'https://www.cnnbrasil.com.br/economia/feed/', category: 'Brasil' },
        { url: 'https://valor.globo.com/rss/valor/financas/', category: 'Mercado' },
        { url: 'https://www.infomoney.com.br/feed/', category: 'Mercado' },
        { url: 'https://g1.globo.com/rss/g1/economia/combustiveis/', category: 'Combustíveis' },
        { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'Internacional' }
      ];

      const allNews: NewsItem[] = [];

      for (const feed of feeds) {
        try {
          const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
          const data = await response.json();
          
          if (data.status === 'ok') {
            const items = data.items.map((item: any) => ({
              id: item.guid || item.link,
              title: item.title,
              description: item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
              content: item.content || item.description,
              url: item.link,
              image: item.thumbnail || item.enclosure?.link || `https://picsum.photos/seed/${item.title.length}/800/400`,
              source: data.feed.title || 'Notícias',
              publishedAt: item.pubDate,
              category: feed.category as any
            }));
            allNews.push(...items);
          }
        } catch (e) {
          console.error(`Error fetching feed ${feed.url}:`, e);
        }
      }

      // Sort by date
      const sortedNews = allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      // Remove duplicates
      const uniqueNews = sortedNews.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

      setNews(uniqueNews);

      // Auto-analyze top 2 news items if they don't have analysis
      if (uniqueNews.length > 0) {
        const toAnalyze = uniqueNews.slice(0, 2);
        for (const item of toAnalyze) {
          analyzeNews(item);
        }
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
    
    // Auto refresh every 10 minutes
    const interval = setInterval(() => fetchNews(true), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const analyzeNews = async (item: NewsItem) => {
    if (analyzing === item.id) return;
    setAnalyzing(item.id);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        console.warn('GEMINI_API_KEY não configurada. A análise de notícias não funcionará.');
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise esta notícia econômica e retorne um JSON com:
        1. "impact": "positive", "negative" ou "neutral" (em relação à economia/bolso do brasileiro)
        2. "simplifiedSummary": Um resumo de 1 frase explicando de forma muito simples o que isso significa.
        
        Título: ${item.title}
        Descrição: ${item.description}`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      setNews(prev => prev.map(n => n.id === item.id ? { 
        ...n, 
        impact: result.impact, 
        simplifiedSummary: result.simplifiedSummary 
      } : n));

      // Also update saved news if it's there
      if (state.savedNews.some(n => n.id === item.id)) {
        updateState({ 
          savedNews: state.savedNews.map(n => n.id === item.id ? {
            ...n,
            impact: result.impact,
            simplifiedSummary: result.simplifiedSummary
          } : n)
        });
      }
    } catch (error) {
      console.error('Error analyzing news:', error);
    } finally {
      setAnalyzing(null);
    }
  };

  const toggleSave = (item: NewsItem) => {
    const isSaved = state.savedNews.some(n => n.id === item.id);
    if (isSaved) {
      updateState({ savedNews: state.savedNews.filter(n => n.id !== item.id) });
    } else {
      updateState({ savedNews: [...state.savedNews, item] });
    }
  };

  const filteredNews = useMemo(() => {
    const baseNews = activeFilter === 'Salvas' ? state.savedNews : news;
    return baseNews.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'Todos' || activeFilter === 'Salvas' || item.category === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [news, state.savedNews, searchQuery, activeFilter]);

  const trendingNews = useMemo(() => news.slice(0, 3), [news]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
              <Newspaper className="text-white w-6 h-6" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              Grana<span className="text-blue-600">News</span>
            </h2>
          </div>
          <p className="text-slate-500 font-medium ml-1">Seu portal de economia e mercado financeiro.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar notícias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all w-64 md:w-80 font-medium text-sm"
            />
          </div>
          <button 
            onClick={() => fetchNews(true)}
            disabled={refreshing}
            className="p-3.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-hover transition-all group"
          >
            <RefreshCw className={cn("w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-all", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2",
              activeFilter === filter 
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20" 
                : "bg-white dark:bg-dark-card text-slate-500 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:border-blue-600/50"
            )}
          >
            {filter}
            {filter === 'Salvas' && state.savedNews.length > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                activeFilter === 'Salvas' ? "bg-white text-blue-600" : "bg-blue-600 text-white"
              )}>
                {state.savedNews.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Últimas Notícias
            </h3>
            {refreshing && <span className="text-[10px] font-bold text-blue-600 animate-pulse uppercase tracking-widest">Atualizando...</span>}
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-white dark:bg-dark-card rounded-[2rem] border border-slate-200 dark:border-dark-border animate-pulse" />
              ))}
            </div>
          ) : filteredNews.length > 0 ? (
            <div className="space-y-6">
              {filteredNews.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white dark:bg-dark-card rounded-[2rem] border border-slate-200 dark:border-dark-border overflow-hidden hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-500"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 relative overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-48 md:h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-6 md:p-8 space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3" />
                          <span>{item.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.publishedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h4>

                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <AnimatePresence>
                        {item.simplifiedSummary && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                <Zap className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Explicado Fácil</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {item.simplifiedSummary}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-3">
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-dark-hover text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-all group/btn"
                          >
                            Ler mais
                            <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </a>
                          
                          {!item.simplifiedSummary && (
                            <button 
                              onClick={() => analyzeNews(item)}
                              disabled={analyzing === item.id}
                              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/10 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                            >
                              {analyzing === item.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Zap className="w-3.5 h-3.5" />
                              )}
                              Resumir
                            </button>
                          )}

                          <button 
                            onClick={() => toggleSave(item)}
                            className={cn(
                              "p-2.5 rounded-xl transition-all border",
                              state.savedNews.some(n => n.id === item.id)
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-white dark:bg-dark-hover border-slate-200 dark:border-dark-border text-slate-400 hover:text-blue-600"
                            )}
                            title={state.savedNews.some(n => n.id === item.id) ? "Remover dos salvos" : "Salvar para depois"}
                          >
                            {state.savedNews.some(n => n.id === item.id) ? (
                              <BookmarkCheck className="w-4 h-4" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {item.impact && (
                          <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                            item.impact === 'positive' ? "bg-emerald-500/10 text-emerald-500" : 
                            item.impact === 'negative' ? "bg-red-500/10 text-red-500" : 
                            "bg-slate-500/10 text-slate-500"
                          )}>
                            {item.impact === 'positive' ? <TrendingUp className="w-3 h-3" /> : 
                             item.impact === 'negative' ? <TrendingDown className="w-3 h-3" /> : 
                             <Info className="w-3 h-3" />}
                            Impacto {item.impact === 'positive' ? 'Positivo' : item.impact === 'negative' ? 'Negativo' : 'Neutro'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white dark:bg-dark-card rounded-[2.5rem] border border-dashed border-slate-200 dark:border-dark-border space-y-4">
              {activeFilter === 'Salvas' ? (
                <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
              ) : (
                <Search className="w-12 h-12 text-slate-300 mx-auto" />
              )}
              <p className="text-slate-500 font-medium">
                {activeFilter === 'Salvas' 
                  ? 'Você ainda não salvou nenhuma notícia.' 
                  : 'Nenhuma notícia encontrada para sua busca.'}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Trending Section */}
          <div className="bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200 dark:border-dark-border p-8 space-y-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Em Alta
            </h3>
            
            <div className="space-y-6">
              {trendingNews.map((item, i) => (
                <a 
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-4 group cursor-pointer"
                >
                  <span className="text-2xl font-black text-slate-200 dark:text-dark-border group-hover:text-blue-600 transition-colors">
                    0{i + 1}
                  </span>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {item.title}
                    </h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {item.source}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            <button className="w-full py-4 bg-slate-50 dark:bg-dark-hover text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 group">
              Ver todos os destaques
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Economic Indicators (Mock) */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-6 shadow-2xl shadow-blue-900/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16" />
            
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2 relative z-10">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              Indicadores
            </h3>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dólar</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black tracking-tighter">R$ 5,12</span>
                  <ArrowUpRight className="w-4 h-4 text-red-400" />
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Selic</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black tracking-tighter">10,75%</span>
                  <div className="w-2 h-2 bg-slate-400 rounded-full" />
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">IPCA</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black tracking-tighter">4,50%</span>
                  <ArrowUpRight className="w-4 h-4 text-red-400" />
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ibovespa</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black tracking-tighter">128k</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>

            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
              Atualizado em tempo real
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
