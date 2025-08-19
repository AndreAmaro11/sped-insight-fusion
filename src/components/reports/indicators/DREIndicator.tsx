import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp } from "lucide-react";
import { ReportFilters } from '@/types/reports';
import { supabase } from '@/integrations/supabase/client';

interface DREIndicatorProps {
  filters: ReportFilters;
}

type PivotMap = {
  [accountCode: string]: {
    description: string;
    values: { [year: number]: number };
  };
};

const DREIndicator: React.FC<DREIndicatorProps> = ({ filters }) => {
  const [years, setYears] = useState<number[]>([]);
  const [items, setItems] = useState<PivotMap>({});
  const [orderedCodes, setOrderedCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDREData();
  }, [filters]);

  const fetchDREData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados dos registros SPED com join para chart_of_accounts para pegar a ordem
      let query = supabase
        .from('sped_records')
        .select(`
          *,
          chart_of_accounts(ordem)
        `)
        .eq('block_type', 'J150')
        .order('fiscal_year', { ascending: true });

      if (filters.fiscalYearStart && filters.fiscalYearEnd) {
        query = query
          .gte('fiscal_year', filters.fiscalYearStart)
          .lte('fiscal_year', filters.fiscalYearEnd);
      } else if (filters.fiscalYearStart) {
        query = query.gte('fiscal_year', filters.fiscalYearStart);
      } else if (filters.fiscalYearEnd) {
        query = query.lte('fiscal_year', filters.fiscalYearEnd);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        setYears([]);
        setItems({});
        return;
      }

      const yrs = [...new Set(data.map(r => r.fiscal_year))].sort();
      const map: PivotMap = {};

      // Preparar dados com ordem e manter a ordem correta na estrutura do map
      const dataWithOrder = data.map(r => ({
        ...r,
        ordem: (r as any).chart_of_accounts?.ordem || 9999
      }));

      // Ordenar por ordem primeiro, depois por account_code
      dataWithOrder.sort((a, b) => {
        if (a.ordem !== b.ordem) {
          return a.ordem - b.ordem;
        }
        return a.account_code.localeCompare(b.account_code);
      });

      // Criar array ordenado para manter a sequência correta
      const orderedCodes: string[] = [];

      dataWithOrder.forEach(r => {
        const code = r.account_code as string;
        const desc = (r.account_description as string) || '';
        const year = r.fiscal_year as number;
        const value = Number(r.final_balance) || 0;
        
        if (!map[code]) {
          map[code] = { description: desc, values: {} };
          // Adicionar código na ordem correta apenas uma vez
          if (!orderedCodes.includes(code)) {
            orderedCodes.push(code);
          }
        }
        map[code].values[year] = value;
      });

      // Armazenar a ordem correta no estado
      setOrderedCodes(orderedCodes);

      setYears(yrs);
      setItems(map);
    } catch (e) {
      console.error('Erro ao buscar DRE:', e);
      setError('Erro ao carregar dados do DRE');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Export simple CSV: Conta;Ano1;Ano2;... usando ordem correta
    const header = ['Conta', ...years.map(String)].join(';');
    const rows = orderedCodes.map(code => {
      const item = items[code];
      if (!item) return '';
      const vals = years.map(y => String(item.values[y] ?? 0).replace('.', ','));
      return [`"${item.description}"`, ...vals].join(';');
    }).filter(row => row !== '');
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dre_j150${filters.fiscalYearStart || filters.fiscalYearEnd ? 
      `_${filters.fiscalYearStart || 'inicio'}-${filters.fiscalYearEnd || 'fim'}` : ''}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Heurísticas simples para KPIs usando ordem correta
  const latestYear = years.length ? Math.max(...years) : undefined;
  const findRow = (includes: string[]) => {
    const foundCode = orderedCodes.find(code => {
      const item = items[code];
      return item && includes.some(k => item.description?.toUpperCase().includes(k));
    });
    return foundCode ? items[foundCode] : undefined;
  };
  const receitaRow = findRow(['RECEITA LÍQUIDA', 'RECEITA BRUTA', 'RECEITA OPERACIONAL']);
  const lucroLiquidoRow = findRow(['LUCRO LÍQUIDO', 'RESULTADO LÍQUIDO', 'RESULTADO DO EXERCÍCIO']);

  const receitaValor = latestYear ? (receitaRow?.values[latestYear] ?? 0) : 0;
  const lucroLiquidoValor = latestYear ? (lucroLiquidoRow?.values[latestYear] ?? 0) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchDREData}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(receitaValor)}
            </div>
            {latestYear && (
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                {latestYear}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(lucroLiquidoValor)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DRE Table (J150) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Demonstração do Resultado do Exercício</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          {Object.keys(items).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Conta</th>
                    {years.map((y) => (
                      <th key={y} className="text-right py-2">{y}</th>
                    ))}
                  </tr>
                </thead>
                 <tbody>
                   {orderedCodes.map((code) => {
                     const item = items[code];
                     if (!item) return null;
                     return (
                       <tr key={code} className="border-b border-gray-100">
                         <td className="py-2 text-sm">{item.description}</td>
                         {years.map((y) => (
                           <td key={y} className="text-right py-2 text-sm">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(item.values[y] || 0)}
                           </td>
                         ))}
                       </tr>
                     );
                   })}
                 </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Nenhum dado de DRE encontrado para os filtros selecionados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DREIndicator;
