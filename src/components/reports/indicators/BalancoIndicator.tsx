import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ReportFilters } from '@/types/reports';
import { supabase } from '@/integrations/supabase/client';
import { SpedRecord } from '@/types/sped';
import { generateBalanco } from '@/services/reportService';

interface BalancoIndicatorProps {
  filters: ReportFilters;
}

const BalancoIndicator: React.FC<BalancoIndicatorProps> = ({ filters }) => {
  const [balancoData, setBalancoData] = useState<{ ativo: any[], passivoPatrimonial: any[] }>({ 
    ativo: [], 
    passivoPatrimonial: [] 
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
        .eq('block_type', 'J100');

      if (filters.fiscalYear) {
        query = query.eq('fiscal_year', filters.fiscalYear);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const spedRecords: SpedRecord[] = data.map(record => ({
          accountCode: record.account_code,
          accountDescription: record.account_description || '',
          finalBalance: Number(record.final_balance) || 0,
          block: record.block_type,
          fiscalYear: record.fiscal_year
        }));

        const balanco = generateBalanco(spedRecords);
        setBalancoData(balanco);
      } else {
        setBalancoData({ ativo: [], passivoPatrimonial: [] });
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

  const totals = {
    ativoTotal: balancoData.ativo.reduce((sum, item) => sum + item.valor, 0),
    passivoTotal: balancoData.passivoPatrimonial.reduce((sum, item) => sum + item.valor, 0)
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(totals.ativoTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Passivo + Patrimônio Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(totals.passivoTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ativo */}
        <Card>
          <CardHeader>
            <CardTitle>Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {balancoData.ativo.length > 0 ? (
                balancoData.ativo.map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex justify-between ${
                      item.isTotal ? 'font-bold text-lg border-t-2 border-double pt-2 mt-2' : 
                      item.isTotalGrupo ? 'font-medium border-t pt-1 mt-1' : ''
                    } ${item.indentacao > 0 ? 'pl-4' : ''}`}
                  >
                    <span className="text-sm">{item.descricao}</span>
                    <span className={`text-sm ${item.isTotal || item.isTotalGrupo ? 'font-medium' : ''}`}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0
                      }).format(item.valor)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum dado de ativo encontrado para os filtros selecionados
                </div>
              )}
            </div>
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
            <div className="space-y-2">
              {balancoData.passivoPatrimonial.length > 0 ? (
                balancoData.passivoPatrimonial.map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex justify-between ${
                      item.isTotal ? 'font-bold text-lg border-t-2 border-double pt-2 mt-2' : 
                      item.isTotalGrupo ? 'font-medium border-t pt-1 mt-1' : ''
                    } ${item.indentacao > 0 ? 'pl-4' : ''}`}
                  >
                    <span className="text-sm">{item.descricao}</span>
                    <span className={`text-sm ${item.isTotal || item.isTotalGrupo ? 'font-medium' : ''}`}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0
                      }).format(item.valor)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum dado de passivo encontrado para os filtros selecionados
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BalancoIndicator;