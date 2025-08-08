
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ReportFilters } from '@/types/reports';
import { supabase } from '@/integrations/supabase/client';

interface DREIndicatorProps {
  filters: ReportFilters;
}

interface J150Record {
  fiscal_year: number;
  account_code: string;
  account_description: string;
  account_type: string; // D = débito, C = crédito
  value: number;
}

const DREIndicator: React.FC<DREIndicatorProps> = ({ filters }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dreData, setDreData] = useState<J150Record[]>([]);
  const [totals, setTotals] = useState<{
    receita: number;
    custos: number;
    lucroOperacional: number;
    lucroLiquido: number;
    margemLiquida: number;
  }>({
    receita: 0,
    custos: 0,
    lucroOperacional: 0,
    lucroLiquido: 0,
    margemLiquida: 0
  });

  useEffect(() => {
    fetchDREData();
  }, [filters]);

  const fetchDREData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('sped_records')
        .select('*')
        .eq('block_type', 'J150');

      if (filters.fiscalYear) {
        query = query.eq('fiscal_year', filters.fiscalYear);
      }

      const { data, error } = await query;

      if (error) throw error;

      const parsedData: J150Record[] = data.map((r: any) => ({
        fiscal_year: r.fiscal_year,
        account_code: r.account_code,
        account_description: r.account_description,
        account_type: r.account_type,
        value: Number(r.value) || 0
      }));

      setDreData(parsedData);

      // Lógica de agrupamento simplificada
      const receita = parsedData
        .filter(r => r.account_description.toUpperCase().includes('RECEITA'))
        .reduce((acc, cur) => acc + (cur.account_type === 'C' ? cur.value : -cur.value), 0);

      const custos = parsedData
        .filter(r => r.account_description.toUpperCase().includes('CUSTO'))
        .reduce((acc, cur) => acc + (cur.account_type === 'D' ? cur.value : -cur.value), 0);

      const despesas = parsedData
        .filter(r => r.account_description.toUpperCase().includes('DESPESA'))
        .reduce((acc, cur) => acc + (cur.account_type === 'D' ? cur.value : -cur.value), 0);

      const lucroOperacional = receita - custos - despesas;
      const lucroLiquido = lucroOperacional; // Adapte conforme precisar
      const margemLiquida = receita !== 0 ? (lucroLiquido / receita) * 100 : 0;

      setTotals({
        receita,
        custos,
        lucroOperacional,
        lucroLiquido,
        margemLiquida
      });
    } catch (err) {
      console.error('Erro ao carregar DRE:', err);
      setError('Erro ao carregar dados da DRE');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    console.log('Exportando DRE com filtros:', filters);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchDREData}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Receita Total', value: totals.receita },
          { label: 'Lucro Operacional', value: totals.lucroOperacional },
          { label: 'Lucro Líquido', value: totals.lucroLiquido },
          { label: 'Margem Líquida', value: `${totals.margemLiquida.toFixed(1)}%` }
        ].map((item, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof item.value === 'string'
                  ? item.value
                  : new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0
                    }).format(item.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DRE Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Demonstração do Resultado do Exercício</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Conta</th>
                  <th className="text-right py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {dreData.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 text-sm">{item.account_description}</td>
                    <td className="text-right py-2 text-sm">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0
                      }).format(item.account_type === 'D' ? item.value : -item.value)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 font-bold">
                  <td className="py-2">Lucro Líquido</td>
                  <td className="text-right py-2 text-green-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(totals.lucroLiquido)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DREIndicator;
