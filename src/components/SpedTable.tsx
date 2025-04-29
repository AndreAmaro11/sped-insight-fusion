
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpedRecord } from './FileUploader';
import { formatCurrency } from '@/utils/spedParser';

interface SpedTableProps {
  data: SpedRecord[];
}

const SpedTable: React.FC<SpedTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Separar dados por bloco
  const balanceSheetData = data.filter(record => record.block === 'J100');
  const incomeStatementData = data.filter(record => record.block === 'J150');
  
  const handleDownloadCSV = (blockData: SpedRecord[], fileName: string) => {
    // Create CSV content
    let csvContent = "Conta Contábil,Descrição da Conta,Saldo Final,Bloco,Ano Fiscal\n";
    
    // Add data rows
    blockData.forEach((record) => {
      csvContent += `"${record.accountCode}","${record.accountDescription}","${record.finalBalance}","${record.block}","${record.fiscalYear}"\n`;
    });
    
    // Create a blob with the CSV data
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filtrar dados com base no termo de busca
  const filterData = (data: SpedRecord[]) => {
    if (!searchTerm) return data;
    
    return data.filter(record => 
      record.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.accountDescription.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  const filteredBalanceSheet = filterData(balanceSheetData);
  const filteredIncomeStatement = filterData(incomeStatementData);

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
      </div>
      
      {/* Tabs for Balance Sheet and Income Statement */}
      <Tabs defaultValue="balance-sheet" className="w-full">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="balance-sheet">Balanço Patrimonial (J100)</TabsTrigger>
          <TabsTrigger value="income-statement">DRE (J150)</TabsTrigger>
        </TabsList>
        
        {/* Balance Sheet Tab */}
        <TabsContent value="balance-sheet">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Balanço Patrimonial</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDownloadCSV(filteredBalanceSheet, `balanco_patrimonial_${data[0]?.fiscalYear || 'dados'}.csv`)}
            >
              Exportar CSV
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Conta Contábil</TableHead>
                  <TableHead className="max-w-[300px]">Descrição da Conta</TableHead>
                  <TableHead className="w-[150px]">Saldo Final</TableHead>
                  <TableHead className="w-[100px]">Ano Fiscal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalanceSheet.length > 0 ? (
                  filteredBalanceSheet.map((record, index) => (
                    <TableRow key={`${record.accountCode}-${record.block}-${index}`}>
                      <TableCell className="font-medium">{record.accountCode}</TableCell>
                      <TableCell>{record.accountDescription}</TableCell>
                      <TableCell>{formatCurrency(record.finalBalance)}</TableCell>
                      <TableCell>{record.fiscalYear}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      Nenhum registro de Balanço encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Exibindo {filteredBalanceSheet.length} de {balanceSheetData.length} registros
          </div>
        </TabsContent>
        
        {/* Income Statement Tab */}
        <TabsContent value="income-statement">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Demonstração do Resultado (DRE)</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDownloadCSV(filteredIncomeStatement, `dre_${data[0]?.fiscalYear || 'dados'}.csv`)}
            >
              Exportar CSV
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Conta Contábil</TableHead>
                  <TableHead className="max-w-[300px]">Descrição da Conta</TableHead>
                  <TableHead className="w-[150px]">Saldo Final</TableHead>
                  <TableHead className="w-[100px]">Ano Fiscal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncomeStatement.length > 0 ? (
                  filteredIncomeStatement.map((record, index) => (
                    <TableRow key={`${record.accountCode}-${record.block}-${index}`}>
                      <TableCell className="font-medium">{record.accountCode}</TableCell>
                      <TableCell>{record.accountDescription}</TableCell>
                      <TableCell>{formatCurrency(record.finalBalance)}</TableCell>
                      <TableCell>{record.fiscalYear}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      Nenhum registro de DRE encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Exibindo {filteredIncomeStatement.length} de {incomeStatementData.length} registros
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpedTable;
