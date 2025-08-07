import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from '@/components/Navbar';
import ReportFilters from '@/components/reports/ReportFilters';
import DREIndicator from '@/components/reports/indicators/DREIndicator';
import BalancoIndicator from '@/components/reports/indicators/BalancoIndicator';
import DefaultIndicator from '@/components/reports/indicators/DefaultIndicator';
import { useReportData, ReportContext } from '@/hooks/useReports';
import { Loader2, BarChart3 } from "lucide-react";

const Reports = () => {
  const reportData = useReportData();
  const { indicators, filters, setFilters, activeTab, setActiveTab, loading } = reportData;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando relatórios...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderIndicatorContent = (slug: string) => {
    switch (slug) {
      case 'dre':
        return <DREIndicator filters={filters} />;
      case 'balanco':
        return <BalancoIndicator filters={filters} />;
      default:
        const indicator = indicators.find(i => i.slug === slug);
        return (
          <DefaultIndicator 
            filters={filters}
            indicatorName={indicator?.name || 'Indicador'}
            description={indicator?.description}
          />
        );
    }
  };

  return (
    <ReportContext.Provider value={reportData}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="pt-16">
          {/* Page header */}
          <div className="bg-white shadow">
            <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Análise completa de indicadores financeiros e contábeis
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
            {/* Global Filters */}
            <ReportFilters filters={filters} onFiltersChange={setFilters} />
            
            {/* Reports Tabs */}
            {indicators.length > 0 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 flex-wrap h-auto p-1">
                  {indicators.map(indicator => (
                    <TabsTrigger 
                      key={indicator.slug} 
                      value={indicator.slug}
                      className="whitespace-nowrap"
                    >
                      {indicator.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {indicators.map(indicator => (
                  <TabsContent key={indicator.slug} value={indicator.slug}>
                    {renderIndicatorContent(indicator.slug)}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="space-y-4">
                    <div className="text-4xl">📊</div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Nenhum Indicador Disponível</h3>
                      <p className="text-muted-foreground text-sm">
                        Não foram encontrados indicadores financeiros habilitados para exibição.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ReportContext.Provider>
  );
};

export default Reports;