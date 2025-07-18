import { useState } from 'react';
import { SpedProcessedData, ReportData } from '@/types/sped';
import { generateReports } from '@/services/reportService';

export const useSped = () => {
  const [processedData, setProcessedData] = useState<SpedProcessedData | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedTab, setSelectedTab] = useState('upload');

  const handleFileProcessed = (data: SpedProcessedData) => {
    console.log("Dados processados:", data);
    setProcessedData(data);
    
    if (data.records.length > 0) {
      console.log("Gerando relatórios a partir de", data.records.length, "registros");
      const reports = generateReports(data.records, data.fiscalYear);
      console.log("Relatórios gerados:", reports);
      setReportData(reports);
      
      setSelectedTab('results');
    }
  };

  const navigateToTab = (tab: string) => {
    setSelectedTab(tab);
  };

  return {
    processedData,
    reportData,
    selectedTab,
    handleFileProcessed,
    navigateToTab,
    setSelectedTab,
  };
};