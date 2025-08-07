import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ReportFilters } from '@/types/reports';

interface BalancoIndicatorProps {
  filters: ReportFilters;
}

const BalancoIndicator: React.FC<BalancoIndicatorProps> = ({ filters }) => {
  const handleExport = () => {
    console.log('Exportando Balanço com filtros:', filters);
  };

  // Mock data
  const mockData = {
    ativoTotal: 2500000,
    ativoCirculante: 800000,
    ativoNaoCirculante: 1700000,
    passivoTotal: 2500000,
    passivoCirculante: 600000,
    patrimonioLiquido: 1900000
  };

  return (
    <div className="space-y-6">
      {/* KPIs Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              }).format(mockData.ativoTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Passivo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(mockData.passivoTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Patrimônio Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(mockData.patrimonioLiquido)}
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
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Ativo Circulante</h4>
                <div className="space-y-1 pl-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Caixa e Equivalentes</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(300000)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Contas a Receber</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(400000)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Estoques</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(100000)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                  <span>Total Ativo Circulante</span>
                  <span>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(mockData.ativoCirculante)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Ativo Não Circulante</h4>
                <div className="space-y-1 pl-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Imobilizado</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(1500000)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Intangível</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(200000)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                  <span>Total Ativo Não Circulante</span>
                  <span>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(mockData.ativoNaoCirculante)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg pt-4 border-t-2">
                <span>TOTAL ATIVO</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(mockData.ativoTotal)}
                </span>
              </div>
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
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Passivo Circulante</h4>
                <div className="space-y-1 pl-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Fornecedores</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(350000)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Obrigações Fiscais</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(250000)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                  <span>Total Passivo Circulante</span>
                  <span>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(mockData.passivoCirculante)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Patrimônio Líquido</h4>
                <div className="space-y-1 pl-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Capital Social</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(1000000)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Lucros Acumulados</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(900000)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                  <span>Total Patrimônio Líquido</span>
                  <span>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(mockData.patrimonioLiquido)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg pt-4 border-t-2">
                <span>TOTAL PASSIVO + PL</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(mockData.passivoTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BalancoIndicator;