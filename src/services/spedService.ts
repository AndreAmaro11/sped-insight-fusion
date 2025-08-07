
import { SpedProcessedData, SpedRecord, FileStructure } from '@/types/sped';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const normalizeAccountCode = (code: string): string => {
  return code
    .split('.')
    .map(part => part.replace(/0+$/, ''))
    .filter(part => part !== '')
    .join('.');
};

const parseSpedNumber = (value: string): number => {
  if (!value || value.trim() === '') return 0;

  const cleanValue = value.replace(/\./g, '').replace(',', '.');
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
  const missingAccounts = requiredAccounts.filter(acc =>
    !records.some(r => r.accountCode === acc || r.accountCode.startsWith(`${acc}.`))
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

    const spedRecords = processedData.records.map(record => ({
      upload_id: uploadData.id,
      account_code: record.accountCode,
      account_description: record.accountDescription,
      final_balance: record.finalBalance,
      block_type: record.block,
      fiscal_year: record.fiscalYear
    }));

    const { error: recordsError } = await supabase.from('sped_records').insert(spedRecords);
    if (recordsError) {
      console.error('Erro ao salvar registros:', recordsError);
      toast.error("Erro ao salvar registros SPED");
      return;
    }

    const accounts = Array.from(new Set(processedData.records.map(r => ({
      code: r.accountCode,
      name: r.accountDescription
    })))).map(account => ({
      upload_id: uploadData.id,
      account_code: account.code,
      account_name: account.name,
      account_level: account.code.split('.').length
    }));

    const { error: accountsError } = await supabase.from('chart_of_accounts').insert(accounts);
    if (accountsError) console.error('Erro ao salvar plano de contas:', accountsError);

    console.log("Dados salvos com sucesso no banco de dados");
    toast.success("Dados processados e salvos com sucesso!");
  } catch (error) {
    console.error('Erro ao salvar no banco:', error);
    toast.error("Erro ao salvar dados no banco");
  }
};

export const parseSpedFile = async (fileContent: string, fileName: string): Promise<SpedProcessedData> => {
  console.log("Iniciando processamento do arquivo SPED");

  if (!fileContent || fileContent.trim() === '') {
    console.error("Arquivo vazio");
    toast.error("O arquivo está vazio. Por favor, selecione um arquivo SPED válido.");
    return { fiscalYear: new Date().getFullYear(), cnpj: '', records: [] };
  }

  const lines = fileContent.split('\n');
  let fiscalYear = 0;
  let cnpj = '';
  const records: SpedRecord[] = [];
  const chartOfAccounts = new Map<string, string>();

  lines.forEach((line, index) => {
    const cleanLine = line.trim().replace('\r', '');
    if (!cleanLine) return;
    const fields = cleanLine.split('|');
    const recordType = fields[1];

    if (recordType === '0000' && fields.length >= 6) {
      const startDate = fields[3] || '';
      fiscalYear = startDate.length >= 8 ? parseInt(startDate.substring(4), 10) : 0;
      cnpj = fields[6] || '';
    }

    if ((recordType === 'C050' || recordType === 'I050' || recordType?.startsWith('C05') || recordType?.startsWith('I05')) && fields.length >= 6) {
      let accountCode = fields[6] || fields[3] || '';
      let accountName = fields[8] || fields[5] || fields[7] || '';
      if (accountCode) {
        const normalizedCode = normalizeAccountCode(accountCode);
        chartOfAccounts.set(normalizedCode, accountName);
      }
    }
  });

  lines.forEach((line, index) => {
    const cleanLine = line.trim().replace('\r', '');
    if (!cleanLine) return;
    const fields = cleanLine.split('|');
    const recordType = fields[1];

    if (recordType === 'J100' && fields.length >= 12) {
      try {
        const codAgl = fields[2] || '';
        const descricao = fields[7] || '';
        const valorFinal = parseSpedNumber(fields[10] || '0');
        const indicadorDC = fields[11] || 'D';
        const grupoBalanco = fields[6] || '';
        let finalBalance = indicadorDC.toUpperCase() === 'C' ? valorFinal : -valorFinal;
        if (grupoBalanco === 'A') finalBalance *= -1;
        records.push({ accountCode: codAgl, accountDescription: descricao, finalBalance, block: 'J100', fiscalYear });
      } catch (error) {
        console.error(`Erro ao processar J100 linha ${index + 1}: ${error}`);
      }
    }

    if (recordType === 'J150' && fields.length >= 13) {
      try {
        const codAgl = fields[2] || '';
        const descricao = fields[7] || '';
        const valorFinal = parseSpedNumber(fields[10] || '0');
        const indicadorDC = fields[11] || 'D';
        const grupoDRE = fields[6] || '';
        let finalBalance = valorFinal;
        const isCredit = indicadorDC.toUpperCase() === 'C';
        if (grupoDRE === 'R') finalBalance = isCredit ? valorFinal : -valorFinal;
        else if (grupoDRE === 'D') finalBalance = isCredit ? -valorFinal : valorFinal;
        records.push({ accountCode: codAgl, accountDescription: descricao, finalBalance, block: 'J150', fiscalYear });
      } catch (error) {
        console.error(`Erro ao processar J150 linha ${index + 1}: ${error}`);
      }
    }
  });

  if (records.length === 0) {
    console.error("Não foi possível extrair nenhum registro válido, mesmo após tentativas alternativas");
    toast.error("Não conseguimos extrair os dados do arquivo. Por favor, verifique se é um arquivo SPED Contábil válido.");
    return { fiscalYear, cnpj, records: [] };
  }

  analyzeDataQuality(records);

  const processedData: SpedProcessedData = {
    fiscalYear,
    cnpj,
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


/*
import { SpedProcessedData, SpedRecord, FileStructure } from '@/types/sped';
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
  let cnpj = '';
  
  lines.forEach((line, index) => {
    const cleanLine = line.trim().replace('\r', '');
    if (!cleanLine) return;

    const fields = cleanLine.split('|');
    const recordType = fields[1];

    if (recordType === '0000' && fields.length >= 7) {
      // Campos do registro 0000:
      // [0]|[1]|[2]|[3]|[4]|[5]|[6]|...
      // |0000|LECD|01012024|31122024|EMPRESA|CNPJ|...
      const startDate = fields[3] || '';  // Data inicial
      const endDate = fields[4] || '';    // Data final
      cnpj = fields[6] || '';              // CNPJ
      
      fiscalYear = startDate.length >= 8 ? parseInt(startDate.substring(4), 10) : 0;
      
      console.log(`Cabeçalho processado:`);
      console.log(`- Data inicial: ${startDate}`);
      console.log(`- Data final: ${endDate}`);
      console.log(`- CNPJ: ${cnpj}`);
      console.log(`- Ano fiscal: ${fiscalYear}`);
      console.log(`- Linha completa: ${cleanLine}`);
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

  // Segunda passada: processar registros do Bloco J (Demonstrações Contábeis)
  const supportedRecordTypes = ['J100', 'J150'];
  
  lines.forEach((line, index) => {
    const cleanLine = line.trim().replace('\r', '');
    if (!cleanLine) return;

    const fields = cleanLine.split('|');
    if (fields.length < 3) return;
    
    const recordType = fields[1];

    // Processar Registro J100 (Balanço Patrimonial)
    if (recordType === 'J100' && fields.length >= 12) {
      try {
        // Campos do J100 conforme Manual ECD:
        // |J100|COD_AGL|IND_COD_AGL|NIVEL_AGL|COD_AGL_SUP|IND_GRP_BAL|DESCR_COD_AGL|VL_CTA_INI|IND_DC_CTA_INI|VL_CTA_FIN|IND_DC_CTA_FIN|
        //  [0]   [1]      [2]        [3]       [4]         [5]         [6]           [7]         [8]           [9]         [10]         [11]
        
        const codAgl = fields[2] || '';           // COD_AGL
        const descricao = fields[7] || '';        // DESCR_COD_AGL  
        const valorFinal = parseSpedNumber(fields[10] || '0'); // VL_CTA_FIN
        const indicadorDC = fields[11] || 'D';    // IND_DC_CTA_FIN
        
        if (!codAgl || !descricao) return;
        
        // Aplicar sinal baseado no indicador D/C
        let finalBalance = valorFinal;
        const isCredit = indicadorDC.toUpperCase() === 'C';
        
        // Para contas do Ativo (grupo A), débito é positivo
        // Para contas do Passivo/PL (grupo P), crédito é positivo
        const grupoBalanco = fields[6] || ''; // IND_GRP_BAL
        if (grupoBalanco === 'A') {
          finalBalance = isCredit ? -valorFinal : valorFinal;
        } else if (grupoBalanco === 'P') {
          finalBalance = isCredit ? valorFinal : -valorFinal;
        }
        
        records.push({
          accountCode: codAgl,
          accountDescription: descricao,
          finalBalance,
          block: 'J100',
          fiscalYear
        });
        
        if (records.length <= 10 || records.length % 50 === 0) {
          console.log(`J100 processado: ${codAgl} - ${descricao}, Valor: ${finalBalance}`);
        }
        
      } catch (error) {
        console.error(`Erro ao processar J100 linha ${index + 1}: ${error}`);
      }
    }
    
    // Processar Registro J150 (DRE)
    if (recordType === 'J150' && fields.length >= 13) {
      try {
        // Campos do J150 conforme Manual ECD:
        // |J150|COD_AGL|IND_COD_AGL|NIVEL_AGL|COD_AGL_SUP|IND_GRP_DRE|DESCR_COD_AGL|VL_CTA_INI|IND_DC_CTA_INI|VL_CTA_FIN|IND_DC_CTA_FIN|
        //  [0]   [1]      [2]        [3]       [4]         [5]         [6]           [7]         [8]           [9]         [10]         [11]
        
        const codAgl = fields[2] || '';           // COD_AGL
        const descricao = fields[7] || '';        // DESCR_COD_AGL
        const valorFinal = parseSpedNumber(fields[10] || '0'); // VL_CTA_FIN
        const indicadorDC = fields[11] || 'D';    // IND_DC_CTA_FIN
        const grupoDRE = fields[6] || '';         // IND_GRP_DRE
        
        if (!codAgl || !descricao) return;
        
        // Aplicar sinal baseado no indicador D/C e grupo DRE
        let finalBalance = valorFinal;
        const isCredit = indicadorDC.toUpperCase() === 'C';
        
        // Para DRE: Receitas (R) são crédito (positivo), Despesas (D) são débito (negativo)
        if (grupoDRE === 'R') {
          finalBalance = isCredit ? valorFinal : -valorFinal;
        } else if (grupoDRE === 'D') {
          finalBalance = isCredit ? -valorFinal : valorFinal;
        }
        
        records.push({
          accountCode: codAgl,
          accountDescription: descricao,
          finalBalance,
          block: 'J150',
          fiscalYear
        });
        
        if (records.length <= 10 || records.length % 50 === 0) {
          console.log(`J150 processado: ${codAgl} - ${descricao}, Valor: ${finalBalance}`);
        }
        
      } catch (error) {
        console.error(`Erro ao processar J150 linha ${index + 1}: ${error}`);
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

 // Alteração Amaro 
  // Salvar no banco de dados
//  const processedData = { 
  //  fiscalYear,
    //cnpj,
    //records: records.sort((a, b) => a.accountCode.localeCompare(b.accountCode))
 // };
  
//Alteração ChatGPT-Amaro
const processedData: SpedProcessedData = { 
  fiscalYear,
  cnpj,
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
