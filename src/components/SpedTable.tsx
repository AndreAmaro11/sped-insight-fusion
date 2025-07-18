
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
import { SpedRecord } from '@/types/sped';
import { formatCurrency } from '@/services/spedService';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SpedTableProps {
  data: SpedRecord[];
}

const SpedTable: React.FC<SpedTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filtrar dados com base no termo de busca
  const filteredData = data.filter(record => 
    !searchTerm || 
    record.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
    record.accountDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleDownloadCSV = () => {
    // Create CSV content
    let csvContent = "Conta Contábil;Descrição da Conta;Saldo Final;Ano Fiscal;Bloco\n";
    
    // Add data rows
    filteredData.forEach((record) => {
      const formattedBalance = record.finalBalance.toString().replace('.', ',');
      csvContent += `"${record.accountCode}";"${record.accountDescription}";"${formattedBalance}";"${record.fiscalYear}";"${record.block}"\n`;
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
        <div className="flex gap-2">
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
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead className="w-[100px]">Ano Fiscal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((record, index) => (
                <TableRow key={`${record.accountCode}-${index}`}>
                  <TableCell className="font-medium">{record.accountCode}</TableCell>
                  <TableCell>{record.accountDescription}</TableCell>
                  <TableCell>{formatCurrency(record.finalBalance)}</TableCell>
                  <TableCell>{record.block}</TableCell>
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
      
      {/* Informações e paginação */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="text-sm text-gray-500">
          Exibindo {currentData.length} de {filteredData.length} registros
        </div>
        
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(p => Math.max(1, p - 1));
                  }} 
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {/* Mostrar apenas algumas páginas para não sobrecarregar a UI */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1;
                const showPage = pageNumber <= 3 || pageNumber > totalPages - 2 || 
                                Math.abs(pageNumber - currentPage) <= 1;
                
                if (!showPage && (pageNumber === 4 && currentPage > 3)) {
                  return (
                    <PaginationItem key="ellipsis-1">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                if (!showPage) return null;
                
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink 
                      href="#" 
                      isActive={currentPage === pageNumber}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default SpedTable;
