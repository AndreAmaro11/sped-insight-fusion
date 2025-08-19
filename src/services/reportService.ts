import { SpedRecord, DREItem, BalancoItem, ReportData } from '@/types/sped';
import { supabase } from '@/integrations/supabase/client';

// Account classification functions
const isReceitaOperacional = (code: string) => 
  code.startsWith('3.01') || code.startsWith('3.1');

const isReceitaFinanceira = (code: string) => 
  code.startsWith('3.02') || code.startsWith('3.2');

const isCustoOperacional = (code: string) => 
  code.startsWith('3.03') || code.startsWith('3.3');

const isDespesaOperacional = (code: string) => 
  code.startsWith('3.04') || code.startsWith('3.4');

const isDespesaFinanceira = (code: string) => 
  code.startsWith('3.05') || code.startsWith('3.5');

const isImpostoRenda = (code: string) => 
  code.startsWith('3.06') || code.startsWith('3.6');

const isAtivo = (code: string) => code.startsWith('1');
const isAtivoCirculante = (code: string) => code.startsWith('1.01') || code.startsWith('1.1');
const isAtivoNaoCirculante = (code: string) => code.startsWith('1.02') || code.startsWith('1.2');
const isPassivo = (code: string) => code.startsWith('2');
const isPassivoCirculante = (code: string) => code.startsWith('2.01') || code.startsWith('2.1');
const isPassivoNaoCirculante = (code: string) => code.startsWith('2.02') || code.startsWith('2.2');
const isPatrimonioLiquido = (code: string) => code.startsWith('2.03') || code.startsWith('2.3');

export const generateDRE = (records: SpedRecord[]): DREItem[] => {
  // Priorizar registros do Bloco J150 (DRE), com fallback para C650
  let dreRecords = records.filter(r => r.block === 'J150');
  
  if (dreRecords.length === 0) {
    console.warn("Nenhum registro J150 encontrado, tentando C650");
    dreRecords = records.filter(r => r.block === 'C650');
    
    if (dreRecords.length === 0) {
      console.warn("Nenhum registro J150 ou C650 encontrado para geração da DRE");
      // Fallback para lógica anterior se não houver registros J150 ou C650
      return generateDREFallback(records);
    }
  }

  let dreItems: DREItem[] = [];
  
  // Adicionar todos os itens do J150 na ordem que aparecem
  dreRecords.forEach(record => {
    dreItems.push({
      categoria: record.accountCode,
      descricao: record.accountDescription,
      valor: record.finalBalance,
      indentacao: 0
    });
  });

  // Ordenar por código de aglutinação
  dreItems.sort((a, b) => a.categoria.localeCompare(b.categoria));

  // Calcular resultado líquido (último item da DRE)
  const totalReceitas = dreItems
    .filter(item => item.valor > 0)
    .reduce((sum, item) => sum + item.valor, 0);
    
  const totalDespesas = dreItems
    .filter(item => item.valor < 0)
    .reduce((sum, item) => sum + Math.abs(item.valor), 0);
    
  const resultadoLiquido = totalReceitas - totalDespesas;
  
  dreItems.push({
    categoria: 'resultado_liquido',
    descricao: 'RESULTADO LÍQUIDO',
    valor: resultadoLiquido,
    indentacao: 0,
    isTotal: true
  });

  return dreItems;
};

// Função para gerar DRE com ordenação usando campo "ordem" do banco
export const generateDREWithOrder = async (records: SpedRecord[], uploadId?: string): Promise<DREItem[]> => {
  console.log("=== GERANDO DRE COM ORDENAÇÃO ===");
  console.log("Upload ID:", uploadId);
  
  // Priorizar registros do Bloco J150 (DRE)
  let dreRecords = records.filter(r => r.block === 'J150');
  console.log("Registros J150 encontrados:", dreRecords.length);
  
  if (dreRecords.length === 0) {
    console.warn("Nenhum registro J150 encontrado, usando ordenação padrão");
    return generateDRE(records);
  }

  // Buscar ordens do banco de dados se uploadId estiver disponível
  let ordenMap = new Map<string, number>();
  if (uploadId) {
    try {
      console.log("Buscando ordens no banco para upload_id:", uploadId);
      
      const { data: chartData, error } = await supabase
        .from('chart_of_accounts')
        .select('account_code, ordem')
        .eq('upload_id', uploadId)
        .not('ordem', 'is', null);

      if (error) {
        console.error('Erro ao buscar ordens:', error);
      } else if (chartData) {
        console.log("Dados de ordem encontrados:", chartData);
        chartData.forEach(item => {
          if (item.ordem !== null) {
            ordenMap.set(item.account_code, item.ordem);
            console.log(`Mapeando: ${item.account_code} -> ordem ${item.ordem}`);
          }
        });
        console.log("Mapa de ordens criado:", Array.from(ordenMap.entries()));
      }
    } catch (error) {
      console.error('Erro na consulta de ordens:', error);
    }
  }

  let dreItems: DREItem[] = [];
  
  // Adicionar todos os itens do J150
  dreRecords.forEach(record => {
    dreItems.push({
      categoria: record.accountCode,
      descricao: record.accountDescription,
      valor: record.finalBalance,
      indentacao: 0
    });
  });

  console.log("Items antes da ordenação:", dreItems.map(item => `${item.categoria}: ${item.descricao}`));

  // Ordenar usando a coluna "ordem" quando disponível, senão por código
  dreItems.sort((a, b) => {
    const ordemA = ordenMap.get(a.categoria);
    const ordemB = ordenMap.get(b.categoria);
    
    console.log(`Comparando: ${a.categoria} (ordem: ${ordemA}) vs ${b.categoria} (ordem: ${ordemB})`);
    
    if (ordemA !== undefined && ordemB !== undefined) {
      return ordemA - ordemB;
    }
    if (ordemA !== undefined && ordemB === undefined) {
      return -1;
    }
    if (ordemA === undefined && ordemB !== undefined) {
      return 1;
    }
    return a.categoria.localeCompare(b.categoria);
  });

  console.log("Items após a ordenação:", dreItems.map(item => `${item.categoria}: ${item.descricao}`));

  // Calcular resultado líquido (último item da DRE)
  const totalReceitas = dreItems
    .filter(item => item.valor > 0)
    .reduce((sum, item) => sum + item.valor, 0);
    
  const totalDespesas = dreItems
    .filter(item => item.valor < 0)
    .reduce((sum, item) => sum + Math.abs(item.valor), 0);
    
  const resultadoLiquido = totalReceitas - totalDespesas;
  
  dreItems.push({
    categoria: 'resultado_liquido',
    descricao: 'RESULTADO LÍQUIDO',
    valor: resultadoLiquido,
    indentacao: 0,
    isTotal: true
  });

  console.log("=== DRE FINAL GERADO ===");
  return dreItems;
};

// Função de fallback para quando não há registros J150
const generateDREFallback = (records: SpedRecord[]): DREItem[] => {
  const resultadosRecords = records.filter(record => record.accountCode.startsWith('3'));
  
  let dreItems: DREItem[] = [];
  
  // Receitas Operacionais
  const receitasOperacionais = resultadosRecords.filter(r => isReceitaOperacional(r.accountCode));
  let totalReceitasOperacionais = receitasOperacionais.reduce((sum, r) => sum + r.finalBalance, 0);
  
  if (receitasOperacionais.length > 0) {
    dreItems.push({ categoria: 'receitasOperacionais', descricao: 'RECEITAS OPERACIONAIS', valor: 0, indentacao: 0 });
    receitasOperacionais.forEach(r => {
      dreItems.push({ 
        categoria: 'receitasOperacionais', 
        descricao: r.accountDescription, 
        valor: Math.abs(r.finalBalance), 
        indentacao: 1 
      });
    });
    dreItems.push({ 
      categoria: 'receitasOperacionais', 
      descricao: 'TOTAL RECEITAS OPERACIONAIS', 
      valor: Math.abs(totalReceitasOperacionais), 
      indentacao: 0, 
      isTotalGrupo: true 
    });
  }
  
  // Custos Operacionais
  const custosOperacionais = resultadosRecords.filter(r => isCustoOperacional(r.accountCode));
  let totalCustosOperacionais = custosOperacionais.reduce((sum, r) => sum + r.finalBalance, 0);
  
  if (custosOperacionais.length > 0) {
    dreItems.push({ categoria: 'custosOperacionais', descricao: 'CUSTOS OPERACIONAIS', valor: 0, indentacao: 0 });
    custosOperacionais.forEach(r => {
      dreItems.push({ 
        categoria: 'custosOperacionais', 
        descricao: r.accountDescription, 
        valor: Math.abs(r.finalBalance), 
        indentacao: 1 
      });
    });
    dreItems.push({ 
      categoria: 'custosOperacionais', 
      descricao: 'TOTAL CUSTOS OPERACIONAIS', 
      valor: Math.abs(totalCustosOperacionais), 
      indentacao: 0, 
      isTotalGrupo: true 
    });
  }
  
  // Despesas Operacionais
  const despesasOperacionais = resultadosRecords.filter(r => isDespesaOperacional(r.accountCode));
  let totalDespesasOperacionais = despesasOperacionais.reduce((sum, r) => sum + r.finalBalance, 0);
  
  if (despesasOperacionais.length > 0) {
    dreItems.push({ categoria: 'despesasOperacionais', descricao: 'DESPESAS OPERACIONAIS', valor: 0, indentacao: 0 });
    despesasOperacionais.forEach(r => {
      dreItems.push({ 
        categoria: 'despesasOperacionais', 
        descricao: r.accountDescription, 
        valor: Math.abs(r.finalBalance), 
        indentacao: 1 
      });
    });
    dreItems.push({ 
      categoria: 'despesasOperacionais', 
      descricao: 'TOTAL DESPESAS OPERACIONAIS', 
      valor: Math.abs(totalDespesasOperacionais), 
      indentacao: 0, 
      isTotalGrupo: true 
    });
  }

  // Resultado líquido
  const resultadoLiquido = Math.abs(totalReceitasOperacionais) - Math.abs(totalCustosOperacionais) - Math.abs(totalDespesasOperacionais);
  dreItems.push({ 
    categoria: 'resultadoLiquido', 
    descricao: 'RESULTADO LÍQUIDO', 
    valor: resultadoLiquido, 
    indentacao: 0,
    isTotal: true
  });
  
  return dreItems;
};

export const generateBalanco = (records: SpedRecord[]): { ativo: BalancoItem[], passivoPatrimonial: BalancoItem[] } => {
  // Filtrar registros do Bloco J100 (Balanço Patrimonial)
  const balancoRecords = records.filter(r => r.block === 'J100');

  if (balancoRecords.length === 0) {
    console.warn("Nenhum registro J100 encontrado para geração do Balanço");
    // Fallback para lógica anterior se não houver registros J100
    return generateBalancoFallback(records);
  }

  const ativo: BalancoItem[] = [];
  const passivoPatrimonial: BalancoItem[] = [];

  // Separar por grupos de balanço baseado no código de aglutinação e descrição
  balancoRecords.forEach(record => {
    const item: BalancoItem = {
      categoria: record.accountCode,
      descricao: record.accountDescription,
      valor: record.finalBalance,
      indentacao: 0
    };

    // Determinar se é Ativo ou Passivo/PL baseado na descrição
    const descricaoUpper = record.accountDescription.toUpperCase();
    const isAtivo = descricaoUpper.includes('ATIVO') || 
                   descricaoUpper.includes('CAIXA') ||
                   descricaoUpper.includes('BANCO') ||
                   descricaoUpper.includes('ESTOQUE') ||
                   descricaoUpper.includes('INVESTIMENTO') ||
                   (record.finalBalance > 0 && !descricaoUpper.includes('PASSIVO') && !descricaoUpper.includes('CAPITAL'));

    if (isAtivo) {
      ativo.push(item);
    } else {
      passivoPatrimonial.push(item);
    }
  });

  // Ordenar por código
  ativo.sort((a, b) => a.categoria.localeCompare(b.categoria));
  passivoPatrimonial.sort((a, b) => a.categoria.localeCompare(b.categoria));

  // Calcular totais
  const totalAtivo = ativo.reduce((sum, item) => sum + item.valor, 0);
  const totalPassivoPatrimonial = passivoPatrimonial.reduce((sum, item) => sum + item.valor, 0);

  // Adicionar totais
  ativo.push({
    categoria: 'total_ativo',
    descricao: 'TOTAL DO ATIVO',
    valor: totalAtivo,
    indentacao: 0,
    isTotal: true
  });

  passivoPatrimonial.push({
    categoria: 'total_passivo_patrimonial',
    descricao: 'TOTAL DO PASSIVO + PATRIMÔNIO LÍQUIDO',
    valor: totalPassivoPatrimonial,
    indentacao: 0,
    isTotal: true
  });

  return { ativo, passivoPatrimonial };
};

// Função de fallback para quando não há registros J100
const generateBalancoFallback = (records: SpedRecord[]): { ativo: BalancoItem[], passivoPatrimonial: BalancoItem[] } => {
  const ativosRecords = records.filter(record => isAtivo(record.accountCode));
  const passivosRecords = records.filter(record => isPassivo(record.accountCode));
  
  let ativoItems: BalancoItem[] = [];
  let passivoItems: BalancoItem[] = [];
  
  // Processar contas do ATIVO
  ativosRecords.forEach(r => {
    ativoItems.push({ 
      categoria: r.accountCode, 
      descricao: r.accountDescription, 
      valor: r.finalBalance, 
      indentacao: 0 
    });
  });

  // Processar contas do PASSIVO + PATRIMÔNIO LÍQUIDO
  passivosRecords.forEach(r => {
    passivoItems.push({ 
      categoria: r.accountCode, 
      descricao: r.accountDescription, 
      valor: r.finalBalance, 
      indentacao: 0 
    });
  });

  // Calcular totais
  const totalAtivo = ativosRecords.reduce((sum, r) => sum + r.finalBalance, 0);
  const totalPassivoPatrimonial = passivosRecords.reduce((sum, r) => sum + r.finalBalance, 0);

  // Adicionar totais
  ativoItems.push({ 
    categoria: 'totalAtivo', 
    descricao: 'TOTAL DO ATIVO', 
    valor: totalAtivo, 
    indentacao: 0, 
    isTotal: true 
  });

  passivoItems.push({ 
    categoria: 'totalPassivoPatrimonioLiquido', 
    descricao: 'TOTAL PASSIVO E PATRIMÔNIO LÍQUIDO', 
    valor: totalPassivoPatrimonial, 
    indentacao: 0, 
    isTotal: true 
  });
  
  return {
    ativo: ativoItems,
    passivoPatrimonial: passivoItems
  };
};

export const generateReports = (records: SpedRecord[], fiscalYear: number): ReportData => {
  const dre = generateDRE(records);
  const balanco = generateBalanco(records);
  
  return {
    dre,
    balanco,
    fiscalYear
  };
};

export const generateReportsWithOrder = async (records: SpedRecord[], fiscalYear: number, uploadId?: string): Promise<ReportData> => {
  const dre = await generateDREWithOrder(records, uploadId);
  const balanco = generateBalanco(records);
  
  return {
    dre,
    balanco,
    fiscalYear
  };
};

export const getValueColor = (value: number): string => {
  if (value < 0) {
    return 'text-red-600';
  } else if (value > 0) {
    return 'text-green-700';
  }
  return 'text-gray-600';
};

export const getItemStyles = (item: DREItem | BalancoItem): string => {
  let styles = '';
  
  if (item.indentacao === 0) {
    styles += 'font-bold ';
  }
  
  if (item.indentacao === 1) {
    styles += 'pl-6 ';
  }
  
  if (item.isTotalGrupo) {
    styles += 'border-t border-gray-300 mt-1 pt-1 ';
  }
  
  if (item.isTotal) {
    styles += 'border-t border-t-2 border-double border-gray-800 mt-2 pt-2 text-lg ';
  }
  
  return styles.trim();
};