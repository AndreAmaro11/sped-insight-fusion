
import { SpedProcessedData, SpedRecord } from '@/components/FileUploader';

// Parse the SPED file content
export const parseSpedFile = (fileContent: string): SpedProcessedData => {
  // Split the file into lines
  const lines = fileContent.split('\n');
  
  // Variables to store the extracted data
  let fiscalYear = '';
  const records: SpedRecord[] = [];
  
  // Create a map to store the chart of accounts (I050 block)
  const chartOfAccounts = new Map<string, string>();
  
  // Process each line
  lines.forEach(line => {
    // Remove any trailing carriage return
    const cleanLine = line.replace('\r', '');
    
    // Extract fields by splitting the line by '|'
    const fields = cleanLine.split('|');
    
    // Check the record type
    if (fields[1] === '0000') {
      // This is the header record, extract the fiscal year from the initial date
      // The date format is DDMMYYYY - take the last 4 characters for the year
      const initialDateField = fields[4];
      if (initialDateField && initialDateField.length >= 8) {
        fiscalYear = initialDateField.substring(4, 8); // Extract year from DDMMYYYY
      }
    }
    else if (fields[1] === 'I050') {
      // Process I050 record (Chart of Accounts)
      if (fields.length >= 4) {
        // Map the account code to its description
        chartOfAccounts.set(fields[2], fields[3]);
      }
    }
    else if (fields[1] === 'J100') {
      // Process J100 record (Balance Sheet)
      if (fields.length >= 6) {
        const accountCode = fields[2] || '';
        // Get account description from chart of accounts, or use the one in J100 if not found
        const accountDescription = chartOfAccounts.get(accountCode) || fields[3] || '';
        
        records.push({
          accountCode,
          accountDescription,
          finalBalance: fields[5] || '',
          block: 'J100',
          fiscalYear: fiscalYear
        });
      }
    } 
    else if (fields[1] === 'J150') {
      // Process J150 record (Income Statement)
      if (fields.length >= 6) {
        const accountCode = fields[2] || '';
        // Get account description from chart of accounts, or use the one in J150 if not found
        const accountDescription = chartOfAccounts.get(accountCode) || fields[3] || '';
        
        records.push({
          accountCode,
          accountDescription,
          finalBalance: fields[5] || '',
          block: 'J150',
          fiscalYear: fiscalYear
        });
      }
    }
  });
  
  // Mock data in case the file doesn't contain valid records
  if (records.length === 0) {
    // If there are no records (or the file format was invalid), create mock data
    fiscalYear = fiscalYear || '2023';  // Default year if not found
    
    // Create some mock records for demonstration
    records.push(
      { 
        accountCode: '1.01.01', 
        accountDescription: 'Caixa e Equivalentes de Caixa', 
        finalBalance: '150000.00', 
        block: 'J100',
        fiscalYear 
      },
      { 
        accountCode: '1.02.01', 
        accountDescription: 'Investimentos', 
        finalBalance: '250000.00', 
        block: 'J100',
        fiscalYear 
      },
      { 
        accountCode: '2.01.01', 
        accountDescription: 'Fornecedores', 
        finalBalance: '75000.00', 
        block: 'J100',
        fiscalYear 
      },
      { 
        accountCode: '3.01', 
        accountDescription: 'Receita Líquida', 
        finalBalance: '500000.00', 
        block: 'J150',
        fiscalYear 
      },
      { 
        accountCode: '3.02', 
        accountDescription: 'Custo dos Produtos Vendidos', 
        finalBalance: '300000.00', 
        block: 'J150',
        fiscalYear 
      }
    );
  }
  
  return { fiscalYear, records };
};

// Function to format currency values
export const formatCurrency = (value: string): string => {
  if (!value) return 'R$ 0,00';
  
  // Convert string to number
  const numValue = parseFloat(value.replace(',', '.'));
  
  // Format the number
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(numValue);
};
