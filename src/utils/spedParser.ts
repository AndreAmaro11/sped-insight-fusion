
import { SpedProcessedData, SpedRecord } from '@/components/FileUploader';
import { toast } from "sonner";

// 1. Correção na normalização de códigos de conta
const normalizeAccountCode = (code: string): string => {
  // Remove todos os zeros à direita após o último ponto, mantendo a estrutura hierárquica
  return code
    .split('.')
    .map(part => part.replace(/0+$/, '')) // Remove trailing zeros de cada parte
    .filter(part => part !== '') // Remove partes vazias
    .join('.');
};

// 2. Melhoria no parser numérico
const parseSpedNumber = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  // Remove pontos de milhar e trata vírgula decimal
  const cleanValue = value
    .replace(/\./g, '')  // Remove pontos de milhar
    .replace(',', '.');  // Substitui vírgula decimal por ponto

  const result = parseFloat(cleanValue);
  
  if (isNaN(result)) {
    console.error(`Valor numérico inválido: "${value}"`);
    return 0;
  }
  
  return result;
};

// 3. Implementação correta do parser do SPED
export const parseSpedFile = (fileContent: string): SpedProcessedData => {
  console.log("Iniciando processamento do arquivo SPED");
  
  // Verificação inicial do conteúdo
  if (!fileContent || fileContent.trim() === '') {
    console.error("Arquivo vazio");
    toast.error("O arquivo está vazio. Por favor, selecione um arquivo SPED válido.");
    return { fiscalYear: new Date().getFullYear(), records: [] };
  }
  
  console.log(`Tamanho do arquivo: ${fileContent.length} caracteres`);
  console.log(`Primeiros 100 caracteres: ${fileContent.substring(0, 100)}...`);
  
  const lines = fileContent.split('\n');
  console.log(`Total de linhas no arquivo: ${lines.length}`);
  
  let fiscalYear = 0;
  const records: SpedRecord[] = [];
  const chartOfAccounts = new Map<string, string>();
  
  // DEBUG: Amostra de linhas do arquivo
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    console.log(`Linha ${i+1}: ${lines[i]}`);
  }

  // Primeiro passo: detectar versão e estrutura do arquivo
  const fileStructure = detectFileStructure(lines);
  console.log(`Estrutura detectada: ${fileStructure.version}`, fileStructure);

  // Primeira passada: processar cabeçalho e plano de contas
  let contasProcessadas = 0;
  lines.forEach((line, index) => {
    const cleanLine = line.trim().replace('\r', '');
    if (!cleanLine) return;

    const fields = cleanLine.split('|');
    const recordType = fields[1];

    // Processar cabeçalho (0000)
    if (recordType === '0000' && fields.length >= 6) {
      const startDate = fields[3] || '';
      fiscalYear = startDate.length >= 4 ? parseInt(startDate.substring(0, 4), 10) : 0;
      console.log(`Ano fiscal identificado: ${fiscalYear}`);
      console.log(`Cabeçalho completo: ${cleanLine}`);
    }

    // Processar plano de contas (aceita C050/I050 e outras variações)
    if ((recordType === 'C050' || recordType === 'I050' || 
         recordType?.startsWith('C05') || recordType?.startsWith('I05')) && 
        fields.length >= 6) {
      
      // Tentar encontrar código da conta e descrição em posições flexíveis
      let accountCode = '';
      let accountName = '';
      
      // Busca flexível por código e nome da conta
      // Normalmente estão em posições 6/8 ou 3/5
      if (fields.length >= 9) {
        accountCode = fields[6] || fields[3] || '';
        accountName = fields[8] || fields[5] || fields[7] || '';
      } else if (fields.length >= 6) {
        accountCode = fields[3] || '';
        accountName = fields[5] || '';
      }
      
      if (accountCode) {
        const normalizedCode = normalizeAccountCode(accountCode);
        chartOfAccounts.set(normalizedCode, accountName);
        contasProcessadas++;
        
        if (contasProcessadas <= 5 || contasProcessadas % 50 === 0) {
          console.log(`Conta adicionada: ${normalizedCode} = ${accountName}`);
        }
      }
    }
  });

  console.log(`Total de contas no plano: ${chartOfAccounts.size}`);
  
  // Amostra do plano de contas
  let contasAmostra = Array.from(chartOfAccounts.entries()).slice(0, 10);
  console.log("Amostra do plano de contas:", contasAmostra);

  // Segunda passada: processar lançamentos - suporte para vários tipos de registro
  const supportedRecordTypes = ['I155', 'C155', 'I150', 'C150', 'I250', 'C250', 'I200', 'C200'];
  
  lines.forEach((line, index) => {
    const cleanLine = line.trim().replace('\r', '');
    if (!cleanLine) return;

    const fields = cleanLine.split('|');
    if (fields.length < 3) return;
    
    const recordType = fields[1];

    // Processar registros de movimento - tentativa flexível
    if (supportedRecordTypes.includes(recordType)) {
      try {
        // Determine positions based on file structure and record type
        let accountCodePos = 3;
        let amountPos = 5;
        let indicatorPos = 6;
        
        // Adjust positions based on detected structure or record type
        if (fileStructure.version === "ECD") {
          if (recordType.startsWith('I15') || recordType.startsWith('C15')) {
            accountCodePos = 3;
            amountPos = 5;
            indicatorPos = 6;
          } else if (recordType.startsWith('I25') || recordType.startsWith('C25')) {
            accountCodePos = 3;
            amountPos = 4;
            indicatorPos = 5;
          }
        } else if (fileStructure.version === "ECF") {
          accountCodePos = 2;
          amountPos = 3;
          indicatorPos = 4;
        }
        
        // Extração flexível - tenta várias posições possíveis
        let accountCode = fields[accountCodePos] || fields[2] || '';
        let amount = parseSpedNumber(fields[amountPos] || fields[4] || fields[3] || '0');
        let indicator = fields[indicatorPos] || fields[4] || 'D'; // D/C
        
        if (!accountCode) {
          // Log e pule se não encontrar código da conta
          if (index < 100) console.log(`Registro sem código de conta: ${cleanLine}`);
          return;
        }

        accountCode = normalizeAccountCode(accountCode);
        
        // Determinar a natureza do saldo
        let finalBalance = amount;
        const isCredit = indicator.toUpperCase() === 'C';
        
        // Regras de negativação conforme natureza da conta
        const firstDigit = accountCode.charAt(0);
        if (['2', '3', '4', '5'].includes(firstDigit)) {
          finalBalance = isCredit ? amount : -amount;
        } else {
          finalBalance = isCredit ? -amount : amount;
        }

        // Localizar descrição da conta
        const accountDescription = chartOfAccounts.get(accountCode) || 'Conta não identificada';
        
        // Registrar lançamento apenas se tiver valor
        if (amount !== 0) {
          records.push({
            accountCode,
            accountDescription,
            finalBalance,
            block: recordType,
            fiscalYear
          });
          
          // Log para amostra de registros
          if (records.length <= 5 || records.length % 100 === 0) {
            console.log(`Lançamento processado: Conta ${accountCode} (${accountDescription}), Valor ${finalBalance}, Tipo ${recordType}`);
          }
        }
      } catch (error) {
        console.error(`Erro ao processar linha ${index + 1}: ${error}`);
        console.debug(`Linha problemática: ${cleanLine}`);
        console.debug(`Campos separados: ${JSON.stringify(fields)}`);
      }
    }
  });

  console.log(`Total de registros processados: ${records.length}`);
  
  if (records.length === 0) {
    console.warn("Nenhum registro válido encontrado no arquivo SPED");
    toast.error("Não foi possível encontrar registros válidos no arquivo.");
    
    // Tentar processamento alternativo com outros tipos de registro
    console.log("Tentando método alternativo de processamento...");
    
    lines.forEach((line) => {
      const cleanLine = line.trim().replace('\r', '');
      if (!cleanLine) return;
      
      const fields = cleanLine.split('|');
      if (fields.length < 3) return;
      
      // Tentativa de identificar registros de saldo por padrões
      const recordType = fields[1];
      const isSaldoRecord = recordType && 
                          (recordType.includes('15') || 
                           recordType.includes('25') || 
                           recordType.includes('SAL'));
      
      if (isSaldoRecord) {
        try {
          // Busca flexível por conta
          let foundCode = false;
          let accountCode = '';
          let value = 0;
          
          // Procurar um código que pareça código contábil (com pontos)
          for (let i = 2; i < Math.min(10, fields.length); i++) {
            if (fields[i] && fields[i].includes('.')) {
              accountCode = normalizeAccountCode(fields[i]);
              foundCode = true;
              
              // Tentar encontrar o valor nos próximos campos
              for (let j = i + 1; j < Math.min(i + 5, fields.length); j++) {
                const maybeValue = parseSpedNumber(fields[j]);
                if (maybeValue !== 0) {
                  value = maybeValue;
                  break;
                }
              }
              
              break;
            }
          }
          
          if (foundCode) {
            const accountDescription = chartOfAccounts.get(accountCode) || 'Conta não identificada';
            
            records.push({
              accountCode,
              accountDescription,
              finalBalance: value,
              block: recordType,
              fiscalYear: fiscalYear || new Date().getFullYear()
            });
            
            console.log(`Registro alternativo: ${accountCode}, ${accountDescription}, ${value}`);
          }
        } catch (error) {
          console.error(`Erro no processamento alternativo: ${error}`);
        }
      }
    });
    
    if (records.length === 0) {
      console.error("Não foi possível extrair nenhum registro válido, mesmo após tentativas alternativas");
      toast.error("Não conseguimos extrair os dados do arquivo. Por favor, verifique se é um arquivo SPED Contábil válido.");
      
      // Criar dados mock como último recurso
      const mockYear = fiscalYear || new Date().getFullYear();
      
      // Ativos
      records.push(
        { accountCode: '1.01.01', accountDescription: 'Caixa e Equivalentes', finalBalance: 150000, block: 'MOCK', fiscalYear: mockYear },
        { accountCode: '1.02.01', accountDescription: 'Investimentos', finalBalance: 250000, block: 'MOCK', fiscalYear: mockYear },
      );
      
      // Passivos
      records.push(
        { accountCode: '2.01.01', accountDescription: 'Fornecedores', finalBalance: 75000, block: 'MOCK', fiscalYear: mockYear },
        { accountCode: '2.03.01', accountDescription: 'Capital Social', finalBalance: 325000, block: 'MOCK', fiscalYear: mockYear },
      );
      
      // Resultados
      records.push(
        { accountCode: '3.01.01', accountDescription: 'Receita Bruta', finalBalance: -400000, block: 'MOCK', fiscalYear: mockYear },
        { accountCode: '3.03.01', accountDescription: 'Custos Operacionais', finalBalance: 250000, block: 'MOCK', fiscalYear: mockYear },
        { accountCode: '3.04.01', accountDescription: 'Despesas Administrativas', finalBalance: 100000, block: 'MOCK', fiscalYear: mockYear },
      );
      
      toast.warning("Exibindo dados de exemplo para demonstração.");
    }
  }
  
  // Análise de qualidade dos dados
  analyzeDataQuality(records);
  
  return { 
    fiscalYear,
    records: records.sort((a, b) => a.accountCode.localeCompare(b.accountCode))
  };
};

// Nova função para detectar a estrutura do arquivo
function detectFileStructure(lines: string[]): { version: string, headerPos?: number, accountsPos?: number } {
  let version = "Desconhecido";
  let headerPos = -1;
  let accountsPos = -1;
  
  // Buscar por linhas de cabeçalho e identificar versão
  for (let i = 0; i < Math.min(50, lines.length); i++) {
    const cleanLine = lines[i].trim();
    if (!cleanLine) continue;
    
    const fields = cleanLine.split('|');
    const recordType = fields[1];
    
    if (recordType === '0000') {
      headerPos = i;
      
      // Identificar versão por campos específicos
      if (fields.length > 15) {
        if (fields[9]?.includes('ECD')) {
          version = "ECD";
        } else if (fields[9]?.includes('ECF')) {
          version = "ECF";
        } else if (fields[9]?.includes('ECF')) {
          version = "ECF";
        }
      }
    }
    
    // Procurar pelo início do plano de contas
    if (recordType && (recordType.includes('050') || recordType === 'C050' || recordType === 'I050')) {
      accountsPos = i;
      break;
    }
  }
  
  console.log(`Estrutura detectada - Versão: ${version}, Header: ${headerPos}, Contas: ${accountsPos}`);
  
  return {
    version,
    headerPos,
    accountsPos
  };
}

// Nova função para análise da qualidade dos dados
function analyzeDataQuality(records: SpedRecord[]) {
  console.log("=== ANÁLISE DE QUALIDADE DOS DADOS ===");
  
  // 1. Verificar se há contas padrão esperadas
  const requiredAccounts = ['1', '1.01', '1.02', '2', '2.01', '2.03', '3', '3.01'];
  const missingAccounts = requiredAccounts.filter(
    acc => !records.some(r => r.accountCode === acc || r.accountCode.startsWith(`${acc}.`))
  );
  
  if (missingAccounts.length > 0) {
    console.warn(`Contas básicas não encontradas: ${missingAccounts.join(', ')}`);
  }
  
  // 2. Verificar balanceamento (Ativo = Passivo + PL)
  const ativoTotal = records
    .filter(r => r.accountCode.startsWith('1'))
    .reduce((sum, r) => sum + r.finalBalance, 0);
    
  const passivoPlTotal = records
    .filter(r => r.accountCode.startsWith('2'))
    .reduce((sum, r) => sum + r.finalBalance, 0);
    
  const difference = Math.abs(ativoTotal - passivoPlTotal);
  const isBalanced = difference < 0.01;
  
  console.log(`Ativo Total: ${ativoTotal}`);
  console.log(`Passivo+PL Total: ${passivoPlTotal}`);
  console.log(`Diferença: ${difference}`);
  console.log(`Balanço equilibrado: ${isBalanced}`);
  
  if (!isBalanced) {
    console.warn("O balanço não está equilibrado. Isso pode indicar problemas no arquivo ou no processamento.");
  }
  
  // 3. Verificar padrão dos dados
  const accountPatterns = new Set<string>();
  records.forEach(r => {
    // Pegar o primeiro segmento da conta (1, 2, 3, etc)
    const mainGroup = r.accountCode.split('.')[0];
    accountPatterns.add(mainGroup);
  });
  
  console.log(`Grupos contábeis encontrados: ${Array.from(accountPatterns).join(', ')}`);
}

// 4. Função de formatação monetária segura
export const formatCurrency = (value: number): string => {
  try {
    if (isNaN(value)) {
      console.warn("Tentativa de formatar valor NaN como moeda");
      value = 0;
    }
    
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (e) {
    console.error('Erro na formatação monetária:', e);
    return 'R$ 0,00';
  }
};
