
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import FileUploader, { SpedProcessedData, SpedRecord } from '@/components/FileUploader';
import SpedTable from '@/components/SpedTable';
import SpedDRE from '@/components/SpedDRE';
import SpedBalanco from '@/components/SpedBalanco';
import { generateReports, ReportData } from '@/utils/reportUtils';

const SpedUpload = () => {
  const [processedData, setProcessedData] = useState<SpedProcessedData | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedTab, setSelectedTab] = useState('upload');
  
  // Removendo a verificação de autenticação para simplificar o teste

  const handleFileProcessed = (data: SpedProcessedData) => {
    console.log("Dados processados:", data);
    setProcessedData(data);
    
    if (data.records.length > 0) {
      // Gerar relatórios (DRE e Balanço)
      console.log("Gerando relatórios a partir de", data.records.length, "registros");
      const reports = generateReports(data.records, data.fiscalYear);
      console.log("Relatórios gerados:", reports);
      setReportData(reports);
      
      // Mudar para a aba de resultados
      setSelectedTab('results');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16"> {/* Space for fixed navbar */}
        {/* Page header */}
        <div className="bg-white shadow">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Upload de SPED</h1>
            <p className="mt-1 text-sm text-gray-500">
              Faça upload e visualize os dados do arquivo SPED Contábil
            </p>
          </div>
        </div>
        
        {/* Main content */}
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="results" disabled={!processedData}>Dados Brutos</TabsTrigger>
              <TabsTrigger value="dre" disabled={!reportData}>DRE</TabsTrigger>
              <TabsTrigger value="balanco" disabled={!reportData}>Balanço Patrimonial</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Upload de Arquivo SPED</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUploader onFileProcessed={handleFileProcessed} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="results">
              {processedData && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Dados do SPED</h2>
                      <p className="text-sm text-gray-500">
                        Ano Fiscal: {processedData.fiscalYear} | 
                        Registros: {processedData.records.length}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        className="text-primary hover:text-primary/80 text-sm"
                        onClick={() => setSelectedTab('upload')}
                      >
                        ← Voltar para Upload
                      </button>
                      
                      {reportData && (
                        <button
                          className="text-primary hover:text-primary/80 text-sm"
                          onClick={() => setSelectedTab('dre')}
                        >
                          Ver DRE →
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <SpedTable data={processedData.records} />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="dre">
              {reportData && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Demonstração do Resultado do Exercício</h2>
                      <p className="text-sm text-gray-500">Ano Fiscal: {reportData.fiscalYear}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        className="text-primary hover:text-primary/80 text-sm"
                        onClick={() => setSelectedTab('upload')}
                      >
                        ← Voltar para Upload
                      </button>
                      
                      <button
                        className="text-primary hover:text-primary/80 text-sm"
                        onClick={() => setSelectedTab('balanco')}
                      >
                        Ver Balanço →
                      </button>
                    </div>
                  </div>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <SpedDRE data={reportData.dre} fiscalYear={reportData.fiscalYear} />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="balanco">
              {reportData && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Balanço Patrimonial</h2>
                      <p className="text-sm text-gray-500">Ano Fiscal: {reportData.fiscalYear}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        className="text-primary hover:text-primary/80 text-sm"
                        onClick={() => setSelectedTab('upload')}
                      >
                        ← Voltar para Upload
                      </button>
                      
                      <button
                        className="text-primary hover:text-primary/80 text-sm"
                        onClick={() => setSelectedTab('dre')}
                      >
                        ← Ver DRE
                      </button>
                    </div>
                  </div>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <SpedBalanco 
                        ativo={reportData.balanco.ativo} 
                        passivoPatrimonial={reportData.balanco.passivoPatrimonial} 
                        fiscalYear={reportData.fiscalYear} 
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SpedUpload;
