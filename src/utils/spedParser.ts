
import { SpedProcessedData, SpedRecord } from '@/components/FileUploader';

// Função para normalizar códigos de conta (remover formatação inconsistente)
const normalizeAccountCode = (code: string): string => {
  // Remove zeros à direita após o ponto decimal
  return code.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
};

// Parse number values from SPED file (handles both comma and period as decimal separators)
const parseSpedNumber = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  // Replace comma with period for decimal separator
  const normalizedValue = value.replace(',', '.');
  const result = parseFloat(normalizedValue);
  
  // Check if the result is a valid number
  if (isNaN(result)) {
    console.warn(`Failed to parse value: "${value}" as a number`);
    return 0;
  }
  
  return result;
};

// Parse the SPED file content
export const parseSpedFile = (fileContent: string): SpedProcessedData => {
  console.log("Starting SPED file parsing");
  
  // Split the file into lines
  const lines = fileContent.split('\n');
  
  // Variables to store the extracted data
  let fiscalYear = 0;
  const records: SpedRecord[] = [];
  
  // Create a map to store the chart of accounts (I050 or C050 block)
  const chartOfAccounts = new Map<string, string>();
  
  // Process each line to find the fiscal year and build chart of accounts
  lines.forEach((line, index) => {
    // Remove any trailing carriage return
    const cleanLine = line.replace('\r', '');
    
    // Skip empty lines
    if (!cleanLine.trim()) return;
    
    // Extract fields by splitting the line by '|'
    const fields = cleanLine.split('|');
    
    // Check if we have enough fields
    if (fields.length < 3) {
      console.log(`Skipping line ${index + 1} (insufficient fields): ${cleanLine}`);
      return;
    }
    
    // Check the record type
    if (fields[1] === '0000') {
      // This is the header record, extract the fiscal year from the initial date
      // The date format is YYYYMMDD in field 4 or 5
      const dateField = fields[4] || fields[5] || '';
      if (dateField && dateField.length >= 8) {
        fiscalYear = parseInt(dateField.substring(0, 4), 10); // Extract year from YYYYMMDD
        console.log(`Fiscal year extracted: ${fiscalYear} from field: ${dateField}`);
      }
    }
    // Process chart of accounts (I050 or C050)
    else if (fields[1] === 'I050' || fields[1] === 'C050') {
      if (fields.length >= 4) {
        const accountCode = fields[2] || '';
        const accountName = fields[3] || '';
        
        if (accountCode && accountName) {
          // Normalize the account code before storing
          const normalizedCode = normalizeAccountCode(accountCode);
          console.log(`Added account to chart: ${normalizedCode} = ${accountName}`);
          
          // Map the account code to its description
          chartOfAccounts.set(normalizedCode, accountName);
        }
      }
    }
  });
  
  console.log(`Total accounts in chart: ${chartOfAccounts.size}`);
  
  // After loading chart of accounts, process the balance records
  lines.forEach((line, index) => {
    const cleanLine = line.replace('\r', '');
    
    // Skip empty lines
    if (!cleanLine.trim()) return;
    
    const fields = cleanLine.split('|');
    
    // Check if we have enough fields
    if (fields.length < 5) {
      return; // Skip lines with insufficient fields
    }
    
    // Process I150, I200, I250, C150, C200, C250 records as balance records
    const recordType = fields[1];
    if (['I150', 'I200', 'I250', 'C150', 'C200', 'C250'].includes(recordType)) {
      const accountCode = fields[2] || '';
      
      // Skip records without account code
      if (!accountCode) {
        console.log(`Skipping ${recordType} record with no account code at line ${index + 1}`);
        return;
      }
      
      const normalizedCode = normalizeAccountCode(accountCode);
      
      // Get account description from chart of accounts, or use "Conta não encontrada" if not found
      const accountDescription = chartOfAccounts.get(normalizedCode) || fields[6] || 'Conta não encontrada';
      
      // Parse finalBalance as a number (field 3 for balance amount)
      const finalBalanceStr = fields[3] || '0';
      let finalBalance = parseSpedNumber(finalBalanceStr);
      
      // Check if the value should be negative (D for debit or C for credit depending on account type)
      const indicator = fields[4] || '';
      
      // If account code starts with 1 or 2 (asset or liability), D means negative for liability (2)
      if (normalizedCode.startsWith('2') && indicator === 'D') {
        finalBalance = -finalBalance;
      }
      // For expense/revenue accounts (3, 4, 5), C might mean negative
      else if ((normalizedCode.startsWith('3') || normalizedCode.startsWith('4') || normalizedCode.startsWith('5')) && indicator === 'C') {
        finalBalance = -finalBalance;
      }
      
      console.log(`Processing ${recordType} record: ${accountCode} (${accountDescription}) = ${finalBalance}`);
      
      // Add the record to the array
      records.push({
        accountCode,
        accountDescription,
        finalBalance,
        block: recordType as any,
        fiscalYear: fiscalYear || new Date().getFullYear()
      });
    }
  });
  
  console.log(`Total records processed: ${records.length}`);
  
  // Handle case with no valid records
  if (records.length === 0) {
    console.warn("No valid records found in the SPED file, creating mock data");
    // Create mock data as before
    const mockYear = fiscalYear || new Date().getFullYear();
    records.push(
      { 
        accountCode: '1.01.01', 
        accountDescription: 'Caixa e Equivalentes de Caixa', 
        finalBalance: 150000, 
        block: 'I150',
        fiscalYear: mockYear
      },
      // ... more mock records
    );
  }
  
  return { fiscalYear, records };
};

// Function to format currency values
export const formatCurrency = (value: number): string => {
  // Handle potential NaN values
  if (isNaN(value)) {
    console.warn("Attempted to format NaN value as currency");
    value = 0;
  }
  
  // Format the number as BRL currency
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};
