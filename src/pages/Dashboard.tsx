
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SpedUpload = Database['public']['Tables']['sped_uploads']['Row'];

interface RecentFile extends SpedUpload {
  companies?: {
    id: string;
    name: string;
    cnpj: string;
  } | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRecentFiles();
    }
  }, [user]);

  const fetchRecentFiles = async () => {
    try {
      setIsLoadingFiles(true);
      
      const { data, error } = await supabase
        .from('sped_uploads')
        .select(`
          *,
          companies (
            id,
            name,
            cnpj
          )
        `)
        .order('upload_date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar arquivos recentes:', error);
        return;
      }

      setRecentFiles(data as RecentFile[] || []);
    } catch (error) {
      console.error('Erro ao buscar arquivos recentes:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Processado
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Processando
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Erro
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Pendente
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16"> {/* Space for fixed navbar */}
        {/* Page header */}
        <div className="bg-white shadow">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Início</h1>
          </div>
        </div>
        
        {/* Main content */}
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Quick actions */}
          <section className="mb-8">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Upload SPED Action */}
              <Card className="card-hover cursor-pointer" onClick={() => navigate('/sped-upload')}>
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <CardTitle>Upload SPED</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Faça upload de novos arquivos SPED para análise
                  </CardDescription>
                </CardContent>
              </Card>
              
              {/* Companies Action */}
              <Card className="card-hover cursor-pointer" onClick={() => navigate('/company-registration')}>
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <CardTitle>Empresas</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Gerencie cadastros de empresas para seus arquivos SPED
                  </CardDescription>
                </CardContent>
              </Card>
              
              {/* Reports Action */}
              <Card className="card-hover cursor-pointer" onClick={() => navigate('/Reports')}>
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <CardTitle>Relatórios</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Visualize relatórios e exporte dados dos seus arquivos
                  </CardDescription>
                </CardContent>
              </Card>
              
              {/* User Profile Action */}
              <Card className="card-hover cursor-pointer" onClick={() => navigate('/Administration')}>
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <CardTitle>Meu Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Atualize suas informações pessoais e preferências
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>
          
          {/* Recent Files */}
          <section className="mb-8">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Arquivos Recentes</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome do Arquivo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ano Fiscal
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Upload
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {isLoadingFiles ? (
                         <tr>
                           <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                             Carregando arquivos recentes...
                           </td>
                         </tr>
                       ) : recentFiles.length > 0 ? (
                         recentFiles.map((file) => (
                           <tr key={file.id} className="hover:bg-gray-50">
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                               {file.file_name}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {file.companies?.name || 'Não informado'}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {file.fiscal_year || '-'}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {new Date(file.upload_date).toLocaleDateString('pt-BR')}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                               {getStatusBadge(file.processing_status || 'pending')}
                             </td>
                           </tr>
                         ))
                       ) : (
                         <tr>
                           <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                             Nenhum arquivo encontrado
                           </td>
                         </tr>
                       )}
                     </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
