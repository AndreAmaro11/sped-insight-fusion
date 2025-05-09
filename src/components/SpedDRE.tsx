
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
import { DREItem } from '@/utils/reportUtils';
import { formatCurrency } from '@/utils/spedParser';
import { getValueColor, getItemStyles } from '@/utils/reportUtils';

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
      
      {/* DRE Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70%]">Descrição</TableHead>
              <TableHead className="w-[30%] text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={`${item.categoria}-${index}`}>
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
  );
};

export default SpedDRE;
