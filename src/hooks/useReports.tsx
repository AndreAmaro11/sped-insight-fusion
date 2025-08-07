import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FinancialIndicator, ReportFilters, ReportContextType } from '@/types/reports';
import { toast } from 'sonner';

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};

export const useReportData = () => {
  const [indicators, setIndicators] = useState<FinancialIndicator[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [activeTab, setActiveTab] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIndicators();
  }, []);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_indicators')
        .select('*')
        .eq('enabled', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching indicators:', error);
        toast.error('Erro ao carregar indicadores');
        return;
      }

      setIndicators(data || []);
      if (data && data.length > 0 && !activeTab) {
        setActiveTab(data[0].slug);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar indicadores');
    } finally {
      setLoading(false);
    }
  };

  return {
    indicators,
    filters,
    setFilters,
    activeTab,
    setActiveTab,
    loading,
  };
};

export { ReportContext };