
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
  const [filteredBlock, setFilteredBlock] = useState<'all' | 'J100' | 'J150'>('all');
  
  const handleDownloadCSV = () => {
    // Create CSV content
    let csvContent = "Conta Contábil,Descrição da Conta,Saldo Final,Bloco,Ano Fiscal\n";
    
    // Add data rows
    filteredData.forEach((record) => {
      csvContent += `"${record.accountCode}","${record.accountDescription}","${record.finalBalance}","${record.block}","${record.fiscalYear}"\n`;
    });
    
    // Create a blob with the CSV data
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `sped_data_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filter data based on search term and block filter
  const filteredData = data.filter((record) => {
    const matchesSearch = 
      record.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.accountDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filteredBlock === 'all' || 
      record.block === filteredBlock;
    
    return matchesSearch && matchesFilter;
  });

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
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Filtrar por:</span>
          
          <Button
            variant={filteredBlock === 'all' ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilteredBlock('all')}
          >
            Todos
          </Button>
          
          <Button
            variant={filteredBlock === 'J100' ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilteredBlock('J100')}
          >
            J100
          </Button>
          
          <Button
            variant={filteredBlock === 'J150' ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilteredBlock('J150')}
          >
            J150
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
            Exportar CSV
          </Button>
        </div>
      </div>
      
      {/* Data table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Conta Contábil</TableHead>
              <TableHead className="max-w-[300px]">Descrição da Conta</TableHead>
              <TableHead className="w-[150px]">Saldo Final</TableHead>
              <TableHead className="w-[100px]">Bloco</TableHead>
              <TableHead className="w-[100px]">Ano Fiscal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((record, index) => (
                <TableRow key={`${record.accountCode}-${record.block}-${index}`}>
                  <TableCell className="font-medium">{record.accountCode}</TableCell>
                  <TableCell>{record.accountDescription}</TableCell>
                  <TableCell>{formatCurrency(record.finalBalance)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.block === 'J100' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {record.block}
                    </span>
                  </TableCell>
                  <TableCell>{record.fiscalYear}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Results counter */}
      <div className="mt-4 text-sm text-gray-500">
        Exibindo {filteredData.length} de {data.length} registros
      </div>
    </div>
  );
};

export default SpedTable;
