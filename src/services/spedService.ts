/*import { SpedProcessedData, SpedRecord, FileStructure } from '@/types/sped';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Utility functions
const normalizeAccountCode = (code: string): string => {
  return code
    .split('.')
    .map(part => part.replace(/0+$/, ''))
    .filter(part => part !== '')
    .join('.');
};

const parseSpedNumber = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  const cleanValue = value
    .replace(/\./g, '')
    .replace(',', '.');

  const result = parseFloat(cleanValue);
  
  if (isNaN(result)) {
    console.error(`Valor numérico inválido: "${value}"`);
    return 0;
  }
  
  return result;
};

const detectFileStructure = (lines: string[]): FileStructure => {
  let version = "Desconhecido";
  let headerPos = -1;
  let accountsPos = -1;
  
  for (let i = 0; i < Math.min(50, lines.length); i++) {
    const cleanLine = lines[i].trim();
    if (!cleanLine) continue;
    
    const fields = cleanLine.split('|');
    const recordType = fields[1];
    
    if (recordType === '0000') {
      headerPos = i;
      
      if (fields.length > 15) {
        if (fields[9]?.includes('ECD')) {
          version = "ECD";
        } else if (fields[9]?.includes('ECF')) {
          version = "ECF";
        }
      }
    }
    
    if (recordType && (recordType.includes('050') || recordType === 'C050' || recordType === 'I050')) {
      accountsPos = i;
      break;
    }
  }
  
  console.log(`Estrutura detectada - Versão: ${version}, Header: ${headerPos}, Contas: ${accountsPos}`);
  
  return { version, headerPos, accountsPos };
};

const analyzeDataQuality = (records: SpedRecord[]) => {
  console.log("=== ANÁLISE DE QUALIDADE DOS DADOS ===");
  
  const requiredAccounts = ['1', '1.01', '1.02', '2', '2.01', '2.03', '3', '3.01'];
  const missingAccounts = requiredAccounts.filter(
    acc => !records.some(r => r.accountCode === acc || r.accountCode.startsWith(`${acc}.`))
  );
  
  if (missingAccounts.length > 0) {
    console.warn(`Contas básicas não encontradas: ${missingAccounts.join(', ')}`);
  }
  
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
  
  const accountPatterns = new Set<string>();
  records.forEach(r => {
    const mainGroup = r.accountCode.split('.')[0];
    accountPatterns.add(mainGroup);
  });
  
  console.log(`Grupos contábeis encontrados: ${Array.from(accountPatterns).join(', ')}`);
};

const saveSpedDataToDatabase = async (processedData: SpedProcessedData, fileName: string, fileSize: number) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("Usuário não autenticado - dados não salvos no banco");
      return;
    }

    // Criar registro de upload
    const { data: uploadData, error: uploadError } = await supabase
      .from('sped_uploads')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_size: fileSize,
        fiscal_year: processedData.fiscalYear,
        total_records: processedData.records.length,
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (uploadError) {
      console.error('Erro ao criar upload:', uploadError);
      toast.error("Erro ao salvar dados do upload");
      return;
    }

    // Salvar registros SPED
    const spedRecords = processedData.records.map(record => ({
      upload_id: uploadData.id,
      account_code: record.accountCode,
      account_description: record.accountDescription,
      final_balance: record.finalBalance,
      block_type: record.block,
      fiscal_year: record.fiscalYear
    }));

    const { error: recordsError } = await supabase
      .from('sped_records')
      .insert(spedRecords);

    if (recordsError) {
      console.error('Erro ao salvar registros:', recordsError);
      toast.error("Erro ao salvar registros SPED");
      return;
    }

    // Salvar plano de contas
    const accounts = Array.from(new Set(processedData.records.map(r => ({
      code: r.accountCode,
      name: r.accountDescription
    })))).map(account => ({
      upload_id: uploadData.id,
      account_code: account.code,
      account_name: account.name,
      account_level: account.code.split('.').length
    }));

    const { error: accountsError } = await supabase
      .from('chart_of_accounts')
      .insert(accounts);

    if (accountsError) {
      console.error('Erro ao salvar plano de contas:', accountsError);
    }

    console.log("Dados salvos com sucesso no banco de dados");
    toast.success("Dados processados e salvos com sucesso!");

  } catch (error) {
    console.error('Erro ao salvar no banco:', error);
    toast.error("Erro ao salvar dados no banco");
  }
};

const processMockData = (fiscalYear: number): SpedRecord[] => {
  const mockYear = fiscalYear || new Date().getFullYear();
  
  return [
    { accountCode: '1.01.01', accountDescription: 'Caixa e Equivalentes', finalBalance: 150000, block: 'MOCK', fiscalYear: mockYear },
    { accountCode: '1.02.01', accountDescription: 'Investimentos', finalBalance: 250000, block: 'MOCK', fiscalYear: mockYear },
    { accountCode: '2.01.01', accountDescription: 'Fornecedores', finalBalance: 75000, block: 'MOCK', fiscalYear: mockYear },
    { accountCode: '2.03.01', accountDescription: 'Capital Social', finalBalance: 325000, block: 'MOCK', fiscalYear: mockYear },
    { accountCode: '3.01.01', accountDescription: 'Receita Bruta', finalBalance: -400000, block: 'MOCK', fiscalYear: mockYear },
    { accountCode: '3.03.01', accountDescription: 'Custos Operacionais', finalBalance: 250000, block: 'MOCK', fiscalYear: mockYear },
    { accountCode: '3.04.01', accountDescription: 'Despesas Administrativas', finalBalance: 100000, block: 'MOCK', fiscalYear: mockYear },
  ];
};

export const parseSpedFile = async (fileContent: string, fileName: string): Promise<SpedProcessedData> => {
  console.log("Iniciando processamento do arquivo SPED");
  
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
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    console.log(`Linha ${i+1}: ${lines[i]}`);
  }

  const fileStructure = detectFileStructure(lines);
  console.log(`Estrutura detectada: ${fileStructure.version}`, fileStructure);

  // Primeira passada: processar cabeçalho e plano de contas
  let contasProcessadas = 0;
  lines.forEach((line, index) => {
    const cleanLine = line.trim().replace('\r', '');
    if (!cleanLine) return;

    const fields = cleanLine.split('|');
    const recordType = fields[1];

    if (recordType === '0000' && fields.length >= 6) {
      const startDate = fields[3] || '';
      fiscalYear = startDate.length >= 4 ? parseInt(startDate.substring(0, 4), 10) : 0;
      console.log(`Ano fiscal identificado: ${fiscalYear}`);
      console.log(`Cabeçalho completo: ${cleanLine}`);
    }

    if ((recordType === 'C050' || recordType === 'I050' || 
         recordType?.startsWith('C05') || recordType?.startsWith('I05')) && 
        fields.length >= 6) {
      
      let accountCode = '';
      let accountName = '';
      
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
  
  let contasAmostra = Array.from(chartOfAccounts.entries()).slice(0, 10);
  console.log("Amostra do plano de contas:", contasAmostra);

  // Segunda passada: processar lançamentos
  const supportedRecordTypes = ['I155', 'C155', 'I150', 'C150', 'I250', 'C250', 'I200', 'C200'];
  
  lines.forEach((line, index) => {
    const cleanLine = line.trim().replace('\r', '');
    if (!cleanLine) return;

    const fields = cleanLine.split('|');
    if (fields.length < 3) return;
    
    const recordType = fields[1];

    if (supportedRecordTypes.includes(recordType)) {
      try {
        let accountCodePos = 3;
        let amountPos = 5;
        let indicatorPos = 6;
        
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
        
        let accountCode = fields[accountCodePos] || fields[2] || '';
        let amount = parseSpedNumber(fields[amountPos] || fields[4] || fields[3] || '0');
        let indicator = fields[indicatorPos] || fields[4] || 'D';
        
        if (!accountCode) {
          if (index < 100) console.log(`Registro sem código de conta: ${cleanLine}`);
          return;
        }

        accountCode = normalizeAccountCode(accountCode);
        
        let finalBalance = amount;
        const isCredit = indicator.toUpperCase() === 'C';
        
        const firstDigit = accountCode.charAt(0);
        if (['2', '3', '4', '5'].includes(firstDigit)) {
          finalBalance = isCredit ? amount : -amount;
        } else {
          finalBalance = isCredit ? -amount : amount;
        }

        const accountDescription = chartOfAccounts.get(accountCode) || 'Conta não identificada';
        
        if (amount !== 0) {
          records.push({
            accountCode,
            accountDescription,
            finalBalance,
            block: recordType,
            fiscalYear
          });
          
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
    
    console.log("Tentando método alternativo de processamento...");
    
    lines.forEach((line) => {
      const cleanLine = line.trim().replace('\r', '');
      if (!cleanLine) return;
      
      const fields = cleanLine.split('|');
      if (fields.length < 3) return;
      
      const recordType = fields[1];
      const isSaldoRecord = recordType && 
                          (recordType.includes('15') || 
                           recordType.includes('25') || 
                           recordType.includes('SAL'));
      
      if (isSaldoRecord) {
        try {
          let foundCode = false;
          let accountCode = '';
          let value = 0;
          
          for (let i = 2; i < Math.min(10, fields.length); i++) {
            if (fields[i] && fields[i].includes('.')) {
              accountCode = normalizeAccountCode(fields[i]);
              foundCode = true;
              
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
      
      const mockRecords = processMockData(fiscalYear);
      records.push(...mockRecords);
      
      toast.warning("Exibindo dados de exemplo para demonstração.");
    }
  }
  
  analyzeDataQuality(records);
  
  // Salvar no banco de dados
  const processedData = { 
    fiscalYear,
    records: records.sort((a, b) => a.accountCode.localeCompare(b.accountCode))
  };
  
  await saveSpedDataToDatabase(processedData, fileName, fileContent.length);
  
  return processedData;
};

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
*/


// src/services/spedService.ts

// --- INTERFACES (Tipos de Dados) ---
// Define a estrutura para cada linha do Balanço Patrimonial
export interface BalancoItem {
  nivel: number;
  descricao: string;
  saldoFinal: number;
}

// Define a estrutura para cada linha da DRE
export interface DREItem {
  ordem: number;
  descricao: string;
  saldoAtual: number;
}

// Define a estrutura do objeto retornado pela função principal
export interface SpedReports {
  balanco: {
    ativo: BalancoItem[];
    passivo: BalancoItem[];
  };
  dre: DREItem[];
}

// --- FUNÇÃO AUXILIAR ---
/**
 * Converte uma string de valor monetário no formato brasileiro (ex: "1.234,56") para um número.
 * @param valorStr String do valor a ser convertido.
 * @returns O valor convertido para número.
 */
function parseCurrency(valorStr: string): number {
  if (!valorStr || typeof valorStr !== 'string') {
    return 0;
  }
  // Remove o separador de milhar (.) e substitui a vírgula decimal (,) por ponto (.)
  const valorLimpo = valorStr.replace(/\./g, '').replace(',', '.');
  return parseFloat(valorLimpo);
}


// --- FUNÇÃO PRINCIPAL DE ANÁLISE ---
/**
 * Analisa o conteúdo de um arquivo SPED Contábil (ECD) e extrai os dados
 * do Balanço Patrimonial (J100) e da DRE (J150).
 * @param fileContent O conteúdo completo do arquivo .txt como uma string.
 * @returns Um objeto contendo os dados estruturados do Balanço e da DRE.
 */
export const analisarSpedContabil = (fileContent: string): SpedReports => {
  const linhas = fileContent.split('\n');

  const balancoAtivo: BalancoItem[] = [];
  const balancoPassivo: BalancoItem[] = [];
  const dreItens: DREItem[] = [];

  // Itera sobre cada linha do arquivo SPED
  for (const linha of linhas) {
    
    // --- LÓGICA PARA O BALANÇO PATRIMONIAL (Registro J100) ---
    if (linha.startsWith('|J100|')) {
      const campos = linha.split('|');
      // O primeiro e o último campo são vazios por causa do pipe no início e fim
      // |J100|COD_AGL|IND_COD_AGL|NIVEL_AGL|COD_AGL_SUP|IND_GRP_BAL|DESCR_COD_AGL|VL_CTA_INI|IND_DC_CTA_INI|VL_CTA_FIN|IND_DC_CTA_FIN|
      //  [0]   [1]       [2]        [3]        [4]         [5]         [6]           [7]          [8]            [9]          [10]         [11]
      
      const nivel = parseInt(campos[4], 10);
      const grupo = campos[6]; // 'A' para Ativo, 'P' para Passivo
      const descricao = campos[7];
      const saldoFinal = parseCurrency(campos[10]);

      const item: BalancoItem = { nivel, descricao, saldoFinal };

      if (grupo === 'A') {
        balancoAtivo.push(item);
      } else if (grupo === 'P') {
        balancoPassivo.push(item);
      }
    }

    // --- LÓGICA PARA A DRE (Registro J150) ---
    if (linha.startsWith('|J150|')) {
      const campos = linha.split('|');
      // |J150|NU_ORDEM|COD_AGL|...|DESCR_COD_AGL|...|VL_CTA_FIN|IND_DC_CTA_FIN|IND_GRP_DRE|
      //  [0]   [1]       [2]     [3]     ...     [7]           ...     [10]       [11]          [12]

      const ordem = parseInt(campos[2], 10);
      const descricao = campos[7];
      let saldoAtual = parseCurrency(campos[10]);
      const indicadorGrupo = campos[12]; // 'D' para Despesa, 'R' para Receita
      
      // Despesas (D) devem ter valor negativo na DRE
      if (indicadorGrupo === 'D') {
        saldoAtual = -Math.abs(saldoAtual);
      }

      dreItens.push({ ordem, descricao, saldoAtual });
    }
  }

  // Ordena os itens da DRE com base no campo NU_ORDEM para garantir a apresentação correta
  const dreOrdenada = dreItens.sort((a, b) => a.ordem - b.ordem);

  return {
    balanco: {
      ativo: balancoAtivo,
      passivo: balancoPassivo,
    },
    dre: dreOrdenada,
  };
};

/**
 * Formata um número para a moeda brasileira (BRL).
 * @param value O número a ser formatado.
 * @returns Uma string formatada como R$ 1.234,56.
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
