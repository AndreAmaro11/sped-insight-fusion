
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

    // Buscar company_id pelo CNPJ
    let companyId = null;
    if (processedData.cnpj) {
      console.log(`Buscando CNPJ: "${processedData.cnpj}"`);
      
      // Normalizar CNPJ removendo pontos, barras e espaços
      const normalizedCnpj = processedData.cnpj.replace(/[^\d]/g, '');
      console.log(`CNPJ normalizado: "${normalizedCnpj}"`);
      
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, cnpj')
        .or(`cnpj.eq.${processedData.cnpj},cnpj.eq.${normalizedCnpj}`)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar empresa:', error);
      }
      
      if (company) {
        companyId = company.id;
        console.log(`CNPJ ${processedData.cnpj} encontrado na empresa ${companyId}`);
      } else {
        console.log(`CNPJ ${processedData.cnpj} não encontrado na tabela de empresas`);
      }
    } else {
      console.log('CNPJ não fornecido');
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
        processed_at: new Date().toISOString(),
        company_id: companyId
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
    //  nomeemp = fields[5] || '';
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
 //   nomeemp,
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
