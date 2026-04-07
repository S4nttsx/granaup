import { Shield, FileText, Info, Mail, Globe, Lock, Eye, Scale } from 'lucide-react';
import { motion } from 'motion/react';
import { AppState } from '../types';

interface LegalTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function LegalTab({ state, updateState }: LegalTabProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
          Informações <span className="text-blue-600">Legais</span>
        </h2>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          Transparência e segurança são nossos pilares. Aqui você encontra nossas políticas de privacidade, termos de uso e informações sobre a plataforma.
        </p>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-wrap justify-center gap-4">
        <a href="#about" className="px-6 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold hover:border-blue-600 transition-all">Sobre Nós</a>
        <a href="#privacy" className="px-6 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold hover:border-blue-600 transition-all">Privacidade</a>
        <a href="#terms" className="px-6 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold hover:border-blue-600 transition-all">Termos de Uso</a>
        <a href="#contact" className="px-6 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold hover:border-blue-600 transition-all">Contato</a>
      </div>

      {/* About Us Section */}
      <motion.section 
        id="about"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-dark-card p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-sm space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sobre o GranaUp</h3>
        </div>
        <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            O <strong>GranaUp</strong> nasceu com a missão de democratizar a gestão financeira inteligente. Acreditamos que o controle do seu dinheiro deve ser simples, visual e poderoso.
          </p>
          <p>
            Nossa plataforma utiliza tecnologias modernas para oferecer uma visão 360º das suas finanças: desde o cafezinho diário até seus investimentos em criptomoedas e ações. Combinamos ferramentas de orçamento, simuladores de futuro e inteligência artificial para ajudar você a tomar as melhores decisões para o seu bolso.
          </p>
          <p>
            Seja você um investidor experiente ou alguém que está começando a se organizar agora, o GranaUp é o seu parceiro na jornada rumo à liberdade financeira.
          </p>
        </div>
      </motion.section>

      {/* Privacy Policy Section */}
      <motion.section 
        id="privacy"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-dark-card p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-sm space-y-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Política de Privacidade</h3>
        </div>
        
        <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed">
          <div className="space-y-3">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              1. Coleta de Dados
            </h4>
            <p>
              O GranaUp prioriza a sua privacidade. Atualmente, todos os dados financeiros inseridos na plataforma são armazenados localmente no seu navegador (LocalStorage). Não coletamos nem armazenamos seus dados financeiros em nossos servidores, a menos que você opte explicitamente por serviços de sincronização em nuvem que venham a ser implementados.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              2. Uso de Cookies e AdSense
            </h4>
            <p>
              Utilizamos o Google AdSense para exibir anúncios. O Google, como fornecedor terceirizado, utiliza cookies para exibir anúncios neste site. O uso do cookie DART pelo Google permite que ele exiba anúncios para você com base na sua visita a este e a outros sites na Internet. Você pode desativar o uso do cookie DART visitando a Política de Privacidade da rede de conteúdo e anúncios do Google.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              3. Links Externos
            </h4>
            <p>
              Nosso portal de notícias contém links para sites externos. Não somos responsáveis pelas políticas de privacidade ou conteúdo desses sites. Recomendamos que você leia as políticas de privacidade de qualquer site que visitar.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Terms of Use Section */}
      <motion.section 
        id="terms"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-dark-card p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-sm space-y-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-600/10 rounded-xl flex items-center justify-center">
            <Scale className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Termos de Uso</h3>
        </div>

        <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            Ao acessar o GranaUp, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis.
          </p>
          
          <div className="space-y-3">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">1. Uso da Licença</h4>
            <p>
              É concedida permissão para baixar temporariamente uma cópia dos materiais no site GranaUp, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">2. Isenção de Responsabilidade</h4>
            <p>
              O GranaUp é uma ferramenta de auxílio à organização financeira. Os materiais no site são fornecidos 'como estão'. O GranaUp não oferece garantias, expressas ou implícitas, e por este meio isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.
            </p>
            <p>
              <strong>Importante:</strong> O GranaUp não fornece aconselhamento financeiro profissional. Decisões de investimento devem ser tomadas com cautela e, preferencialmente, com o auxílio de um profissional certificado.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section 
        id="contact"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-2xl font-black tracking-tight">Contato</h3>
        </div>

        <div className="space-y-6 relative z-10">
          <p className="text-slate-400 font-medium">
            Dúvidas, sugestões ou feedback? Estamos prontos para ouvir você.
          </p>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/10 flex-1">
              <Mail className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-mail</p>
                <p className="font-bold">granaupp@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <div className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] pt-10">
        © {new Date().getFullYear()} GranaUp - Todos os direitos reservados.
      </div>
    </div>
  );
}
