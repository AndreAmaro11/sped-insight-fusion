
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
      <section className="hero-gradient text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Análise de SPED Contábil Inteligente</h2>
            <p className="text-xl mb-8">
              Extraia, unifique e analise informações contábeis dos arquivos SPED de forma rápida e precisa.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="font-semibold text-primary"
              onClick={() => navigate('/login')}
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-12">Recursos Principais</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg p-6 shadow-md card-hover">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Upload Simplificado</h4>
              <p className="text-gray-600">Faça upload dos seus arquivos SPED Contábil com apenas alguns cliques.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white rounded-lg p-6 shadow-md card-hover">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Extração Inteligente</h4>
              <p className="text-gray-600">Extraia automaticamente dados dos blocos 0000, J100 e J150 em segundos.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white rounded-lg p-6 shadow-md card-hover">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                  <line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Tabela Unificada</h4>
              <p className="text-gray-600">Visualize todos os saldos em uma tabela unificada para fácil análise.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-50 py-10 mt-auto">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 SPED Insight Fusion. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
