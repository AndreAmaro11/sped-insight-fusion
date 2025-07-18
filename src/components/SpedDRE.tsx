
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { DREItem } from '@/types/sped';
import { formatCurrency } from '@/services/spedService';
import { getValueColor, getItemStyles } from '@/services/reportService';

interface SpedDREProps {
  data: DREItem[];
  fiscalYear: number;
}

const SpedDRE: React.FC<SpedDREProps> = ({ data, fiscalYear }) => {
  
  const handleDownloadCSV = () => {
    // Create CSV content
    let csvContent = "Categoria;Descrição;Valor\n";
    
    // Add data rows
    data.forEach((item) => {
      const formattedBalance = item.valor.toString().replace('.', ',');
      csvContent += `"${item.categoria}";"${item.descricao}";"${formattedBalance}"\n`;
    });
    
    // Create a blob with the CSV data
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `dre_${fiscalYear}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Verificação de dados
  const hasData = data && data.length > 0;
  const hasMockData = hasData && data.some(item => item.descricao.includes('Mock') || item.categoria.includes('mock'));
  
  // Cálculos de totais
  const receitaTotal = hasData ? data
    .filter(item => item.categoria.includes('receita') && item.isTotalGrupo)
    .reduce((sum, item) => sum + item.valor, 0) : 0;
    
  const resultadoLiquido = hasData ? data
    .find(item => item.isTotal)?.valor || 0 : 0;
    
  // Indicador de lucratividade
  const isLucro = resultadoLiquido > 0;

  return (
    <div>
      {/* Header e botões */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Demonstração do Resultado do Exercício</h2>
          <p className="text-gray-500">Ano Fiscal: {fiscalYear}</p>
        </div>
        
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadCSV}
          >
            Exportar CSV
          </Button>
        </div>
      </div>
      
      {/* Feedback para dados de demonstração */}
      {hasMockData && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800">
              Exibindo dados de demonstração. Para ver seus dados reais, faça upload de um arquivo SPED válido.
            </p>
          </div>
        </div>
      )}
      
      {/* Resumo financeiro */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-md border shadow-sm">
            <p className="text-sm text-gray-500">Receita Total</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(Math.abs(receitaTotal))}</p>
          </div>
          
          <div className="bg-white p-4 rounded-md border shadow-sm">
            <p className="text-sm text-gray-500">Resultado</p>
            <p className={`text-xl font-bold ${isLucro ? 'text-green-600' : 'text-red-600'}`}>
              {isLucro ? 'Lucro' : 'Prejuízo'} de {formatCurrency(Math.abs(resultadoLiquido))}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-md border shadow-sm">
            <p className="text-sm text-gray-500">Ano Base</p>
            <p className="text-xl font-bold">{fiscalYear}</p>
          </div>
        </div>
      )}
      
      {/* DRE Table */}
      <div className="rounded-md border">
        {hasData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70%]">Descrição</TableHead>
                <TableHead className="w-[30%] text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={`${item.categoria}-${index}`} className={item.isTotal ? 'bg-gray-50' : ''}>
                  <TableCell className={`${getItemStyles(item)}`}>
                    {item.descricao}
                  </TableCell>
                  <TableCell className={`text-right ${getItemStyles(item)} ${getValueColor(item.valor)}`}>
                    {formatCurrency(item.valor)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
            <p className="text-gray-500">Não foi possível gerar a DRE. Verifique se o arquivo SPED contém os registros necessários.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpedDRE;
