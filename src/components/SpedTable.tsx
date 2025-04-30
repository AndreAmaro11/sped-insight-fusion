
import React, { useState } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SpedRecord } from './FileUploader';
import { formatCurrency } from '@/utils/spedParser';

interface SpedTableProps {
  data: SpedRecord[];
}

const SpedTable: React.FC<SpedTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrar dados com base no termo de busca
  const filteredData = data.filter(record => 
    !searchTerm || 
    record.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
    record.accountDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadCSV = () => {
    // Create CSV content
    let csvContent = "Conta Contábil,Descrição da Conta,Saldo Final,Ano Fiscal\n";
    
    // Add data rows
    filteredData.forEach((record) => {
      csvContent += `"${record.accountCode}","${record.accountDescription}","${record.finalBalance}","${record.fiscalYear}"\n`;
    });
    
    // Create a blob with the CSV data
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `sped_data_${filteredData[0]?.fiscalYear || 'dados'}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Filtering and search options */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por conta ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
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
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Conta Contábil</TableHead>
              <TableHead>Descrição da Conta</TableHead>
              <TableHead className="w-[150px]">Saldo Final</TableHead>
              <TableHead className="w-[100px]">Ano Fiscal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((record, index) => (
                <TableRow key={`${record.accountCode}-${index}`}>
                  <TableCell className="font-medium">{record.accountCode}</TableCell>
                  <TableCell>{record.accountDescription}</TableCell>
                  <TableCell>{formatCurrency(record.finalBalance)}</TableCell>
                  <TableCell>{record.fiscalYear}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Exibindo {filteredData.length} de {data.length} registros
      </div>
    </div>
  );
};

export default SpedTable;
