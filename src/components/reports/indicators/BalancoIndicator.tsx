import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ReportFilters } from '@/types/reports';
import { supabase } from '@/integrations/supabase/client';

interface BalancoIndicatorProps {
  filters: ReportFilters;
}

const BalancoIndicator: React.FC<BalancoIndicatorProps> = ({ filters }) => {
  const [balancoData, setBalancoData] = useState<{
    years: number[];
    ativo: { [account: string]: { description: string; values: { [year: number]: number } } };
    passivo: { [account: string]: { description: string; values: { [year: number]: number } } };
  }>({ 
    years: [], 
    ativo: {}, 
    passivo: {} 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBalancoData();
  }, [filters]);

  const fetchBalancoData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('sped_records')
        .select('*')
        .eq('block_type', 'J100')
        .order('fiscal_year', { ascending: true })
        .order('account_code', { ascending: true });

      // Se tem filtro de ano específico, usa apenas esse ano
      // Senão, busca todos os anos disponíveis
      if (filters.fiscalYear) {
        query = query.eq('fiscal_year', filters.fiscalYear);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Organizar dados por conta e ano
        const years = [...new Set(data.map(r => r.fiscal_year))].sort();
        const ativo: { [account: string]: { description: string; values: { [year: number]: number } } } = {};
        const passivo: { [account: string]: { description: string; values: { [year: number]: number } } } = {};

        data.forEach(record => {
          const accountCode = record.account_code;
          const year = record.fiscal_year;
          const value = Number(record.final_balance) || 0;
          const description = record.account_description || '';

          // Determinar se é Ativo ou Passivo/PL baseado na descrição
          const descriptionUpper = description.toUpperCase();
          const isAtivo = descriptionUpper.includes('ATIVO') || 
                         descriptionUpper.includes('CAIXA') ||
                         descriptionUpper.includes('BANCO') ||
                         descriptionUpper.includes('ESTOQUE') ||
                         descriptionUpper.includes('INVESTIMENTO') ||
                         accountCode.startsWith('1') ||
                         (value > 0 && !descriptionUpper.includes('PASSIVO') && !descriptionUpper.includes('CAPITAL'));

          const targetGroup = isAtivo ? ativo : passivo;

          if (!targetGroup[accountCode]) {
            targetGroup[accountCode] = {
              description: description,
              values: {}
            };
          }

          targetGroup[accountCode].values[year] = value;
        });

        setBalancoData({ years, ativo, passivo });
      } else {
        setBalancoData({ years: [], ativo: {}, passivo: {} });
      }
    } catch (err) {
      console.error('Erro ao buscar dados do balanço:', err);
      setError('Erro ao carregar dados do balanço');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    console.log('Exportando Balanço com filtros:', filters);
  };

  // Calcular totais por ano
  const calculateTotals = (group: { [account: string]: { description: string; values: { [year: number]: number } } }) => {
    const totals: { [year: number]: number } = {};
    balancoData.years.forEach(year => {
      totals[year] = Object.values(group).reduce((sum, account) => {
        return sum + (account.values[year] || 0);
      }, 0);
    });
    return totals;
  };

  const ativoTotals = calculateTotals(balancoData.ativo);
  const passivoTotals = calculateTotals(balancoData.passivo);

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
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchBalancoData}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativo Total {balancoData.years.length > 0 ? `(${Math.max(...balancoData.years)})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balancoData.years.length > 0 ? (
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0
                }).format(ativoTotals[Math.max(...balancoData.years)] || 0)
              ) : 'R$ 0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Passivo + PL {balancoData.years.length > 0 ? `(${Math.max(...balancoData.years)})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balancoData.years.length > 0 ? (
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0
                }).format(passivoTotals[Math.max(...balancoData.years)] || 0)
              ) : 'R$ 0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Sheet Tables */}
      <div className="space-y-6">
        {/* Ativo */}
        <Card>
          <CardHeader>
            <CardTitle>Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(balancoData.ativo).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Conta</th>
                      {balancoData.years.map(year => (
                        <th key={year} className="text-right py-2 font-medium">
                          {year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(balancoData.ativo).map(([accountCode, account]) => (
                      <tr key={accountCode} className="border-b border-gray-100">
                        <td className="py-2 text-sm">{account.description}</td>
                        {balancoData.years.map(year => (
                          <td key={year} className="text-right py-2 text-sm">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            }).format(account.values[year] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="border-t-2 border-double border-gray-800 font-bold">
                      <td className="py-2">TOTAL ATIVO</td>
                      {balancoData.years.map(year => (
                        <td key={year} className="text-right py-2">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0
                          }).format(ativoTotals[year] || 0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum dado de ativo encontrado para os filtros selecionados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Passivo e Patrimônio Líquido */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Passivo e Patrimônio Líquido</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardHeader>
          <CardContent>
            {Object.keys(balancoData.passivo).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Conta</th>
                      {balancoData.years.map(year => (
                        <th key={year} className="text-right py-2 font-medium">
                          {year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(balancoData.passivo).map(([accountCode, account]) => (
                      <tr key={accountCode} className="border-b border-gray-100">
                        <td className="py-2 text-sm">{account.description}</td>
                        {balancoData.years.map(year => (
                          <td key={year} className="text-right py-2 text-sm">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            }).format(account.values[year] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="border-t-2 border-double border-gray-800 font-bold">
                      <td className="py-2">TOTAL PASSIVO + PATRIMÔNIO LÍQUIDO</td>
                      {balancoData.years.map(year => (
                        <td key={year} className="text-right py-2">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0
                          }).format(passivoTotals[year] || 0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum dado de passivo encontrado para os filtros selecionados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BalancoIndicator;