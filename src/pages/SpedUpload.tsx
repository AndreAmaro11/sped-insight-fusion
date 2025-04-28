
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import FileUploader, { SpedProcessedData, SpedRecord } from '@/components/FileUploader';
import SpedTable from '@/components/SpedTable';
import { isAuthenticated } from '@/utils/authUtils';

const SpedUpload = () => {
  const navigate = useNavigate();
  const [processedData, setProcessedData] = useState<SpedProcessedData | null>(null);
  
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleFileProcessed = (data: SpedProcessedData) => {
    setProcessedData(data);
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
              Faça upload e visualize os dados dos arquivos SPED Contábil
            </p>
          </div>
        </div>
        
        {/* Main content */}
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Tabs defaultValue={processedData ? "results" : "upload"} value={processedData ? "results" : "upload"}>
            <TabsList className="mb-6">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="results" disabled={!processedData}>Resultados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <Card>
                <CardContent className="pt-6">
                  <FileUploader onFileProcessed={handleFileProcessed} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="results">
              {processedData && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Resultados da Análise</h2>
                      <p className="text-sm text-gray-500">Ano Fiscal: {processedData.fiscalYear}</p>
                    </div>
                    
                    <button
                      className="text-primary hover:text-primary/80 text-sm"
                      onClick={() => setProcessedData(null)}
                    >
                      ← Voltar para Upload
                    </button>
                  </div>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <SpedTable data={processedData.records} />
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
