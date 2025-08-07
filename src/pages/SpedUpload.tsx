
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import FileUploader from '@/components/FileUploader';
import SpedTable from '@/components/SpedTable';
import SpedDRE from '@/components/SpedDRE';
import SpedBalanco from '@/components/SpedBalanco';
import ReportNavigation from '@/components/ReportNavigation';
import { useSped } from '@/hooks/useSped';

const SpedUpload = () => {
  const {
    processedData,
    reportData,
    selectedTab,
    handleFileProcessed,
    navigateToTab,
    setSelectedTab,
  } = useSped();

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
                        CNPJ: {processedData.cnpj} |
                        Registros: {processedData.records.length}
                      </p>
                    </div>
                    
                    <ReportNavigation 
                      onNavigate={navigateToTab}
                      showDRE={!!reportData}
                    />
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
                    
                    <ReportNavigation 
                      onNavigate={navigateToTab}
                      showBalanco={true}
                    />
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
                    
                    <ReportNavigation 
                      onNavigate={navigateToTab}
                      showDRE={true}
                    />
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
