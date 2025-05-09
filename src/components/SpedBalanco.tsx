
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
      
      {/* Balanço Patrimonial em colunas */}
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
                <TableRow key={`ativo-${item.categoria}-${index}`}>
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
                <TableRow key={`passivo-${item.categoria}-${index}`}>
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
    </div>
  );
};

export default SpedBalanco;
