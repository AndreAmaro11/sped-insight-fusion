
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
import { BalancoItem } from '@/utils/reportUtils';
import { formatCurrency } from '@/utils/spedParser';
import { getValueColor, getItemStyles } from '@/utils/reportUtils';

interface SpedBalancoProps {
  ativo: BalancoItem[];
  passivoPatrimonial: BalancoItem[];
  fiscalYear: number;
}

const SpedBalanco: React.FC<SpedBalancoProps> = ({ ativo, passivoPatrimonial, fiscalYear }) => {
  
  const handleDownloadCSV = () => {
    // Create CSV content
    let csvContent = "Seção;Categoria;Descrição;Valor\n";
    
    // Add data rows - Ativo
    ativo.forEach((item) => {
      const formattedBalance = item.valor.toString().replace('.', ',');
      csvContent += `"Ativo";"${item.categoria}";"${item.descricao}";"${formattedBalance}"\n`;
    });
    
    // Add data rows - Passivo e PL
    passivoPatrimonial.forEach((item) => {
      const formattedBalance = item.valor.toString().replace('.', ',');
      csvContent += `"Passivo/PL";"${item.categoria}";"${item.descricao}";"${formattedBalance}"\n`;
    });
    
    // Create a blob with the CSV data
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `balanco_patrimonial_${fiscalYear}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Verificação de dados
  const hasData = ativo.length > 0 && passivoPatrimonial.length > 0;
  const hasMockData = hasData && (
    ativo.some(item => item.descricao.includes('Mock') || item.categoria.includes('mock')) ||
    passivoPatrimonial.some(item => item.descricao.includes('Mock') || item.categoria.includes('mock'))
  );
  
  // Cálculos de totais
  const totalAtivo = hasData ? 
    ativo.find(item => item.isTotal)?.valor || 
    ativo.reduce((sum, item) => sum + item.valor, 0) : 0;
    
  const totalPassivo = hasData ? 
    passivoPatrimonial.find(item => item.isTotal)?.valor || 
    passivoPatrimonial.reduce((sum, item) => sum + item.valor, 0) : 0;
    
  // Verificar equilíbrio
  const difference = Math.abs(totalAtivo - totalPassivo);
  const isBalanced = difference < 0.01;

  return (
    <div>
      {/* Header e botões */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Balanço Patrimonial</h2>
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
            <p className="text-sm text-gray-500">Total do Ativo</p>
            <p className="text-xl font-bold">{formatCurrency(totalAtivo)}</p>
          </div>
          
          <div className="bg-white p-4 rounded-md border shadow-sm">
            <p className="text-sm text-gray-500">Total do Passivo + PL</p>
            <p className="text-xl font-bold">{formatCurrency(totalPassivo)}</p>
          </div>
          
          <div className="bg-white p-4 rounded-md border shadow-sm flex items-center">
            {isBalanced ? (
              <div className="flex items-center text-green-600 gap-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <span className="font-medium">Balanço equilibrado</span>
              </div>
            ) : (
              <div className="flex items-center text-amber-600 gap-1">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Diferença: {formatCurrency(difference)}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Balanço Patrimonial em colunas */}
      {hasData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Coluna do Ativo */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead colSpan={2} className="text-center bg-gray-100">ATIVO</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="w-[70%]">Descrição</TableHead>
                  <TableHead className="w-[30%] text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ativo.map((item, index) => (
                  <TableRow key={`ativo-${item.categoria}-${index}`} className={item.isTotal ? 'bg-gray-50' : ''}>
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
          </div>
          
          {/* Coluna do Passivo e PL */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead colSpan={2} className="text-center bg-gray-100">PASSIVO E PATRIMÔNIO LÍQUIDO</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="w-[70%]">Descrição</TableHead>
                  <TableHead className="w-[30%] text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passivoPatrimonial.map((item, index) => (
                  <TableRow key={`passivo-${item.categoria}-${index}`} className={item.isTotal ? 'bg-gray-50' : ''}>
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
          </div>
        </div>
      ) : (
        <div className="rounded-md border p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
          <p className="text-gray-500">Não foi possível gerar o Balanço Patrimonial. Verifique se o arquivo SPED contém os registros necessários.</p>
        </div>
      )}
    </div>
  );
};

export default SpedBalanco;
