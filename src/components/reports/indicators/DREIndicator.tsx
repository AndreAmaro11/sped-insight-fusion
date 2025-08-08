import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { ReportFilters } from '@/types/reports';

interface DREIndicatorProps {
  filters: ReportFilters;
}

const DREIndicator: React.FC<DREIndicatorProps> = ({ filters }) => {
  const handleExport = () => {
    // TODO: Implementar exportação
    console.log('Exportando DRE com filtros:', filters);
  };

  // Mock data - será substituído por dados reais
  const mockData = {
    receita: 1500000,
    custos: 900000,
    lucroOperacional: 450000,
    lucroLiquido: 375000,
    margemLiquida: 25.0,
    crescimentoReceita: 12.5
  };

  return (
    <div className="space-y-6">
      {/* KPIs Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(mockData.receita)}
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +{mockData.crescimentoReceita}% vs período anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Operacional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(mockData.lucroOperacional)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(mockData.lucroLiquido)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margem Líquida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.margemLiquida}%</div>
          </CardContent>
        </Card>
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
                  <th className="text-right py-2">% Receita</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">Receita Bruta</td>
                  <td className="text-right py-2">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(mockData.receita)}
                  </td>
                  <td className="text-right py-2">100,0%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pl-4">(-) Custos dos Produtos Vendidos</td>
                  <td className="text-right py-2 text-red-600">
                    ({new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(mockData.custos)})
                  </td>
                  <td className="text-right py-2">60,0%</td>
                </tr>
                <tr className="border-b font-medium">
                  <td className="py-2">Lucro Operacional</td>
                  <td className="text-right py-2">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(mockData.lucroOperacional)}
                  </td>
                  <td className="text-right py-2">30,0%</td>
                </tr>
                <tr className="border-b font-bold">
                  <td className="py-2">Lucro Líquido</td>
                  <td className="text-right py-2 text-green-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(mockData.lucroLiquido)}
                  </td>
                  <td className="text-right py-2">{mockData.margemLiquida}%</td>
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
