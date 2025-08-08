import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ReportFilters } from '@/types/reports';
import { supabase } from '@/integrations/supabase/client';

interface DREIndicatorProps {
  filters: ReportFilters;
}

const DREIndicator: React.FC<DREIndicatorProps> = ({ filters }) => {
  const [dreData, setDreData] = useState<{
    years: number[];
    receitas: { [account: string]: { description: string; values: { [year: number]: number } } };
    custos: { [account: string]: { description: string; values: { [year: number]: number } } };
    despesas: { [account: string]: { description: string; values: { [year: number]: number } } };
  }>({ 
    years: [], 
    receitas: {}, 
    custos: {}, 
    despesas: {} 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    .eq(\'block_type\', \'J150\')
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
        const receitas: { [account: string]: { description: string; values: { [year: number]: number } } } = {};
        const custos: { [account: string]: { description: string; values: { [year: number]: number } } } = {};
        const despesas: { [account: string]: { description: string; values: { [year: number]: number } } } = {};

        data.forEach(record => {
          const accountCode = record.account_code;
          const year = record.fiscal_year;
          const value = Number(record.final_balance) || 0;
          const description = record.account_description || ‘’;

          // Lógica de classificação para DRE (simplificada para exemplo)
          // Em um cenário real, isso seria baseado em um plano de contas detalhado
          const descriptionUpper = description.toUpperCase();

          if (descriptionUpper.includes(‘RECEITA’) || accountCode.startsWith(‘3’)) {
            if (!receitas[accountCode]) {
              receitas[accountCode] = { description: description, values: {} };
            }
            receitas[accountCode].values[year] = value;
          } else if (descriptionUpper.includes(‘CUSTO’) || accountCode.startsWith(‘4’)) {
            if (!custos[accountCode]) {
              custos[accountCode] = { description: description, values: {} };
            }
            custos[accountCode].values[year] = value;
          } else if (descriptionUpper.includes(‘DESPESA’) || accountCode.startsWith(‘5’)) {
            if (!despesas[accountCode]) {
              despesas[accountCode] = { description: description, values: {} };
            }
            despesas[accountCode].values[year] = value;
          }
        });

        setDreData({ years, receitas, custos, despesas });
      } else {
        setDreData({ years: [], receitas: {}, custos: {}, despesas: {} });
      }
    } catch (err)       console.error(\'Erro ao buscar dados do DRE:\', err);
      setError(\'Erro ao carregar dados do DRE\');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    console.log(\'Exportando DRE com filtros:\', filters);
  };

  // Calcular totais por ano
  const calculateTotals = (group: { [account: string]: { description: string; values: { [year: number]: number } } }) => {
    const totals: { [year: number]: number } = {};
    dreData.years.forEach(year => {
      totals[year] = Object.values(group).reduce((sum, account) => {
        return sum + (account.values[year] || 0);
      }, 0);
    });
    return totals;
  };

  const receitaTotals = calculateTotals(dreData.receitas);
  const custoTotals = calculateTotals(dreData.custos);
  const despesaTotals = calculateTotals(dreData.despesas);

  const lucroBrutoTotals: { [year: number]: number } = {};
  const lucroLiquidoTotals: { [year: number]: number } = {};
  dreData.years.forEach(year => {
    lucroBrutoTotals[year] = (receitaTotals[year] || 0) - (custoTotals[year] || 0);
    lucroLiquidoTotals[year] = lucroBrutoTotals[year] - (despesaTotals[year] || 0);
  });

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total {dreData.years.length > 0 ? `(${Math.max(...dreData.years)})` : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dreData.years.length > 0 ? (
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0
                }).format(receitaTotals[Math.max(...dreData.years)] || 0)
              ) : 'R$ 0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Bruto {dreData.years.length > 0 ? `(${Math.max(...dreData.years)})` : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dreData.years.length > 0 ? (
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0
                }).format(lucroBrutoTotals[Math.max(...dreData.years)] || 0)
              ) : 'R$ 0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido {dreData.years.length > 0 ? `(${Math.max(...dreData.years)})` : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dreData.years.length > 0 ? (
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0
                }).format(lucroLiquidoTotals[Math.max(...dreData.years)] || 0)
              ) : 'R$ 0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margem Líquida {dreData.years.length > 0 ? `(${Math.max(...dreData.years)})` : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dreData.years.length > 0 && receitaTotals[Math.max(...dreData.years)] > 0 ? (
                `${((lucroLiquidoTotals[Math.max(...dreData.years)] || 0) / (receitaTotals[Math.max(...dreData.years)] || 1) * 100).toFixed(2)}%`
              ) : '0.00%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DRE Table */}
      <div className="space-y-6">
        {/* Receitas */}
        <Card>
          <CardHeader>
            <CardTitle>Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(dreData.receitas).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Conta</th>
                      {dreData.years.map(year => (
                        <th key={year} className="text-right py-2 font-medium">
                          {year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(dreData.receitas).map(([accountCode, account]) => (
                      <tr key={accountCode} className="border-b border-gray-100">
                        <td className="py-2 text-sm">{account.description}</td>
                        {dreData.years.map(year => (
                          <td key={year} className="text-right py-2 text-sm">
                            {new Intl.NumberFormat(\'pt-BR\', {
                              style: \'currency\',
                              currency: \'BRL\',
                              minimumFractionDigits: 0
                            }).format(account.values[year] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="border-t-2 border-double border-gray-800 font-bold">
                      <td className="py-2">TOTAL RECEITAS</td>
                      {dreData.years.map(year => (
                        <td key={year} className="text-right py-2">
                          {new Intl.NumberFormat(\'pt-BR\', {
                            style: \'currency\',
                            currency: \'BRL\',
                            minimumFractionDigits: 0
                          }).format(receitaTotals[year] || 0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum dado de receita encontrado para os filtros selecionados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custos */}
        <Card>
          <CardHeader>
            <CardTitle>Custos</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(dreData.custos).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Conta</th>
                      {dreData.years.map(year => (
                        <th key={year} className="text-right py-2 font-medium">
                          {year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(dreData.custos).map(([accountCode, account]) => (
                      <tr key={accountCode} className="border-b border-gray-100">
                        <td className="py-2 text-sm">{account.description}</td>
                        {dreData.years.map(year => (
                          <td key={year} className="text-right py-2 text-sm">
                            {new Intl.NumberFormat(\'pt-BR\', {
                              style: \'currency\',
                              currency: \'BRL\',
                              minimumFractionDigits: 0
                            }).format(account.values[year] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="border-t-2 border-double border-gray-800 font-bold">
                      <td className="py-2">TOTAL CUSTOS</td>
                      {dreData.years.map(year => (
                        <td key={year} className="text-right py-2">
                          {new Intl.NumberFormat(\'pt-BR\', {
                            style: \'currency\',
                            currency: \'BRL\',
                            minimumFractionDigits: 0
                          }).format(custoTotals[year] || 0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum dado de custo encontrado para os filtros selecionados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Despesas</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardHeader>
          <CardContent>
            {Object.keys(dreData.despesas).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Conta</th>
                      {dreData.years.map(year => (
                        <th key={year} className="text-right py-2 font-medium">
                          {year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(dreData.despesas).map(([accountCode, account]) => (
                      <tr key={accountCode} className="border-b border-gray-100">
                        <td className="py-2 text-sm">{account.description}</td>
                        {dreData.years.map(year => (
                          <td key={year} className="text-right py-2 text-sm">
                            {new Intl.NumberFormat(\'pt-BR\', {
                              style: \'currency\',
                              currency: \'BRL\',
                              minimumFractionDigits: 0
                            }).format(account.values[year] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="border-t-2 border-double border-gray-800 font-bold">
                      <td className="py-2">TOTAL DESPESAS</td>
                      {dreData.years.map(year => (
                        <td key={year} className="text-right py-2">
                          {new Intl.NumberFormat(\'pt-BR\', {
                            style: \'currency\',
                            currency: \'BRL\',
                            minimumFractionDigits: 0
                          }).format(despesaTotals[year] || 0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum dado de despesa encontrado para os filtros selecionados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lucro Bruto e Líquido */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Indicador</th>
                    {dreData.years.map(year => (
                      <th key={year} className="text-right py-2 font-medium">
                        {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium">Lucro Bruto</td>
                    {dreData.years.map(year => (
                      <td key={year} className="text-right py-2">
                        {new Intl.NumberFormat(\'pt-BR\', {
                          style: \'currency\',
                          currency: \'BRL\',
                          minimumFractionDigits: 0
                        }).format(lucroBrutoTotals[year] || 0)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium">Lucro Líquido</td>
                    {dreData.years.map(year => (
                      <td key={year} className="text-right py-2">
                        {new Intl.NumberFormat(\'pt-BR\', {
                          style: \'currency\',
                          currency: \'BRL\',
                          minimumFractionDigits: 0
                        }).format(lucroLiquidoTotals[year] || 0)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DREIndicator;

