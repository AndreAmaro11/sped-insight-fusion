
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
            </svg>
            <h1 className="text-xl font-bold">SPED Insight Fusion</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/login')}>Entrar</Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="hero-gradient text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Transforme SPEDs Contábeis em Análises Estratégicas em Segundos
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-white/90 leading-relaxed">
              Extraia automaticamente DREs, Balanços e insights financeiros dos arquivos SPED Contábil. 
              Economize horas de trabalho e tome decisões mais inteligentes com poucos cliques.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 text-lg transition-all duration-300 hover:scale-105 shadow-lg"
                onClick={() => navigate('/login')}
              >
                Teste Grátis Agora
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-4 text-lg transition-all duration-300"
                onClick={() => navigate('/login')}
              >
                Fale com um Especialista
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Por que usar o SPED Insight Fusion?</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A única plataforma que transforma dados contábeis complexos em insights estratégicos para sua empresa
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Benefit 1 */}
            <div className="bg-white rounded-xl p-8 shadow-lg card-hover border border-gray-100">
              <div className="h-16 w-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11H1v3h8v8h3v-8h8v-3h-8V3H9v8z"/>
                  <circle cx="9" cy="9" r="2"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3 text-center text-gray-900">🧠 Leitura Inteligente</h4>
              <p className="text-gray-600 text-center leading-relaxed">
                Identificamos automaticamente blocos e cruzamos dados do SPED Contábil para gerar relatórios gerenciais.
              </p>
            </div>
            
            {/* Benefit 2 */}
            <div className="bg-white rounded-xl p-8 shadow-lg card-hover border border-gray-100">
              <div className="h-16 w-16 bg-green-100 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3 text-center text-gray-900">📊 Relatórios em Segundos</h4>
              <p className="text-gray-600 text-center leading-relaxed">
                DRE, Balanço Patrimonial e outros indicadores gerados automaticamente.
              </p>
            </div>
            
            {/* Benefit 3 */}
            <div className="bg-white rounded-xl p-8 shadow-lg card-hover border border-gray-100">
              <div className="h-16 w-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3 text-center text-gray-900">🏗 Engenharia Financeira</h4>
              <p className="text-gray-600 text-center leading-relaxed">
                Análises estratégicas com foco em margem, estrutura de capital e performance.
              </p>
            </div>
            
            {/* Benefit 4 */}
            <div className="bg-white rounded-xl p-8 shadow-lg card-hover border border-gray-100">
              <div className="h-16 w-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3 text-center text-gray-900">👨‍💼 Para Profissionais</h4>
              <p className="text-gray-600 text-center leading-relaxed">
                Uma ferramenta intuitiva, criada para quem precisa de dados prontos para decisão.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-12 border border-blue-100">
              <div className="mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
              <blockquote className="text-2xl font-medium text-gray-900 mb-8 leading-relaxed">
                "Reduzimos em 80% o tempo de análise dos SPEDs contábeis dos nossos clientes. Uma revolução para quem trabalha com contabilidade consultiva."
              </blockquote>
              <div className="flex items-center justify-center">
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">CA</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Carlos Almeida</p>
                  <p className="text-gray-600">Contador Sênior</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 py-16 mt-auto">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="mb-8">
              <h4 className="text-2xl font-bold text-white mb-4">
                SPED Insight Fusion
              </h4>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                Uma solução inovadora que une tecnologia e inteligência contábil para transformar dados em estratégia. 
                Desenvolvida especialmente para contadores e gestores que buscam eficiência e precisão.
              </p>
            </div>
            
            <div className="mb-8">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 text-lg transition-all duration-300 hover:scale-105"
                onClick={() => navigate('/login')}
              >
                Fale com um Especialista
              </Button>
            </div>
            
            <div className="border-t border-gray-700 pt-8">
              <p className="text-gray-400">
                &copy; 2025 SPED Insight Fusion. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
