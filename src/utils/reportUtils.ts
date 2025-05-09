
import { SpedRecord } from '@/components/FileUploader';
import { formatCurrency } from './spedParser';

// Tipos para DRE e Balanço
export interface DREItem {
  categoria: string;
  descricao: string;
  valor: number;
  indentacao: number;
  isTotalGrupo?: boolean;
  isTotal?: boolean;
}

export interface BalancoItem {
  categoria: string;
  descricao: string;
  valor: number;
  indentacao: number;
  isTotalGrupo?: boolean;
  isTotal?: boolean;
}

export interface ReportData {
  dre: DREItem[];
  balanco: {
    ativo: BalancoItem[];
    passivoPatrimonial: BalancoItem[];
  };
  fiscalYear: number;
}

// Funções auxiliares para classificação de contas
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

// Para balanço:
const isAtivo = (code: string) => code.startsWith('1');
const isAtivoCirculante = (code: string) => code.startsWith('1.01') || code.startsWith('1.1');
const isAtivoNaoCirculante = (code: string) => code.startsWith('1.02') || code.startsWith('1.2');
const isPassivo = (code: string) => code.startsWith('2');
const isPassivoCirculante = (code: string) => code.startsWith('2.01') || code.startsWith('2.1');
const isPassivoNaoCirculante = (code: string) => code.startsWith('2.02') || code.startsWith('2.2');
const isPatrimonioLiquido = (code: string) => code.startsWith('2.03') || code.startsWith('2.3');

/**
 * Gera a DRE a partir dos registros SPED
 */
export const generateDRE = (records: SpedRecord[]): DREItem[] => {
  // Filtrar apenas as contas de resultado (classe 3)
  const resultadosRecords = records.filter(record => record.accountCode.startsWith('3'));
  
  let dreItems: DREItem[] = [];
  
  // Receitas Operacionais
  const receitasOperacionais = resultadosRecords.filter(r => isReceitaOperacional(r.accountCode));
  let totalReceitasOperacionais = receitasOperacionais.reduce((sum, r) => sum + r.finalBalance, 0);
  
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
  
  // Custos Operacionais
  const custosOperacionais = resultadosRecords.filter(r => isCustoOperacional(r.accountCode));
  let totalCustosOperacionais = custosOperacionais.reduce((sum, r) => sum + r.finalBalance, 0);
  
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
  
  // Resultado Bruto
  const resultadoBruto = Math.abs(totalReceitasOperacionais) - Math.abs(totalCustosOperacionais);
  dreItems.push({ 
    categoria: 'resultadoBruto', 
    descricao: 'RESULTADO BRUTO', 
    valor: resultadoBruto, 
    indentacao: 0, 
    isTotalGrupo: true 
  });
  
  // Despesas Operacionais
  const despesasOperacionais = resultadosRecords.filter(r => isDespesaOperacional(r.accountCode));
  let totalDespesasOperacionais = despesasOperacionais.reduce((sum, r) => sum + r.finalBalance, 0);
  
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
  
  // Resultado Operacional
  const resultadoOperacional = resultadoBruto - Math.abs(totalDespesasOperacionais);
  dreItems.push({ 
    categoria: 'resultadoOperacional', 
    descricao: 'RESULTADO OPERACIONAL', 
    valor: resultadoOperacional, 
    indentacao: 0,
    isTotalGrupo: true
  });
  
  // Receitas Financeiras
  const receitasFinanceiras = resultadosRecords.filter(r => isReceitaFinanceira(r.accountCode));
  let totalReceitasFinanceiras = receitasFinanceiras.reduce((sum, r) => sum + r.finalBalance, 0);
  
  if (receitasFinanceiras.length > 0) {
    dreItems.push({ categoria: 'receitasFinanceiras', descricao: 'RECEITAS FINANCEIRAS', valor: 0, indentacao: 0 });
    receitasFinanceiras.forEach(r => {
      dreItems.push({ 
        categoria: 'receitasFinanceiras', 
        descricao: r.accountDescription, 
        valor: Math.abs(r.finalBalance), 
        indentacao: 1 
      });
    });
    dreItems.push({ 
      categoria: 'receitasFinanceiras', 
      descricao: 'TOTAL RECEITAS FINANCEIRAS', 
      valor: Math.abs(totalReceitasFinanceiras), 
      indentacao: 0, 
      isTotalGrupo: true 
    });
  }
  
  // Despesas Financeiras
  const despesasFinanceiras = resultadosRecords.filter(r => isDespesaFinanceira(r.accountCode));
  let totalDespesasFinanceiras = despesasFinanceiras.reduce((sum, r) => sum + r.finalBalance, 0);
  
  if (despesasFinanceiras.length > 0) {
    dreItems.push({ categoria: 'despesasFinanceiras', descricao: 'DESPESAS FINANCEIRAS', valor: 0, indentacao: 0 });
    despesasFinanceiras.forEach(r => {
      dreItems.push({ 
        categoria: 'despesasFinanceiras', 
        descricao: r.accountDescription, 
        valor: Math.abs(r.finalBalance), 
        indentacao: 1 
      });
    });
    dreItems.push({ 
      categoria: 'despesasFinanceiras', 
      descricao: 'TOTAL DESPESAS FINANCEIRAS', 
      valor: Math.abs(totalDespesasFinanceiras), 
      indentacao: 0, 
      isTotalGrupo: true 
    });
  }
  
  // Resultado Financeiro
  const resultadoFinanceiro = Math.abs(totalReceitasFinanceiras) - Math.abs(totalDespesasFinanceiras);
  if (receitasFinanceiras.length > 0 || despesasFinanceiras.length > 0) {
    dreItems.push({ 
      categoria: 'resultadoFinanceiro', 
      descricao: 'RESULTADO FINANCEIRO', 
      valor: resultadoFinanceiro, 
      indentacao: 0,
      isTotalGrupo: true
    });
  }
  
  // Resultado antes do IR
  const resultadoAntesIR = resultadoOperacional + resultadoFinanceiro;
  dreItems.push({ 
    categoria: 'resultadoAntesIR', 
    descricao: 'RESULTADO ANTES DO IR', 
    valor: resultadoAntesIR, 
    indentacao: 0,
    isTotalGrupo: true
  });
  
  // Imposto de Renda
  const impostosRenda = resultadosRecords.filter(r => isImpostoRenda(r.accountCode));
  let totalImpostosRenda = impostosRenda.reduce((sum, r) => sum + r.finalBalance, 0);
  
  if (impostosRenda.length > 0) {
    dreItems.push({ categoria: 'impostoRenda', descricao: 'IMPOSTO DE RENDA', valor: 0, indentacao: 0 });
    impostosRenda.forEach(r => {
      dreItems.push({ 
        categoria: 'impostoRenda', 
        descricao: r.accountDescription, 
        valor: Math.abs(r.finalBalance), 
        indentacao: 1 
      });
    });
    dreItems.push({ 
      categoria: 'impostoRenda', 
      descricao: 'TOTAL IMPOSTO DE RENDA', 
      valor: Math.abs(totalImpostosRenda), 
      indentacao: 0, 
      isTotalGrupo: true 
    });
  }
  
  // Resultado líquido
  const resultadoLiquido = resultadoAntesIR - Math.abs(totalImpostosRenda);
  dreItems.push({ 
    categoria: 'resultadoLiquido', 
    descricao: 'RESULTADO LÍQUIDO', 
    valor: resultadoLiquido, 
    indentacao: 0,
    isTotal: true
  });
  
  return dreItems;
};

/**
 * Gera o Balanço Patrimonial a partir dos registros SPED
 */
export const generateBalanco = (records: SpedRecord[]): { ativo: BalancoItem[], passivoPatrimonial: BalancoItem[] } => {
  // Separar registros ativos e passivos
  const ativosRecords = records.filter(record => isAtivo(record.accountCode));
  const passivosRecords = records.filter(record => isPassivo(record.accountCode));
  
  // Preparar arrays para ativo e passivo
  let ativoItems: BalancoItem[] = [];
  let passivoItems: BalancoItem[] = [];
  
  // Ativo Circulante
  const ativoCirculante = ativosRecords.filter(r => isAtivoCirculante(r.accountCode));
  let totalAtivoCirculante = ativoCirculante.reduce((sum, r) => sum + r.finalBalance, 0);
  
  ativoItems.push({ categoria: 'ativoCirculante', descricao: 'ATIVO CIRCULANTE', valor: 0, indentacao: 0 });
  ativoCirculante.forEach(r => {
    ativoItems.push({ 
      categoria: 'ativoCirculante', 
      descricao: r.accountDescription, 
      valor: r.finalBalance, 
      indentacao: 1 
    });
  });
  ativoItems.push({ 
    categoria: 'ativoCirculante', 
    descricao: 'TOTAL ATIVO CIRCULANTE', 
    valor: totalAtivoCirculante, 
    indentacao: 0, 
    isTotalGrupo: true 
  });
  
  // Ativo Não Circulante
  const ativoNaoCirculante = ativosRecords.filter(r => isAtivoNaoCirculante(r.accountCode));
  let totalAtivoNaoCirculante = ativoNaoCirculante.reduce((sum, r) => sum + r.finalBalance, 0);
  
  ativoItems.push({ categoria: 'ativoNaoCirculante', descricao: 'ATIVO NÃO CIRCULANTE', valor: 0, indentacao: 0 });
  ativoNaoCirculante.forEach(r => {
    ativoItems.push({ 
      categoria: 'ativoNaoCirculante', 
      descricao: r.accountDescription, 
      valor: r.finalBalance, 
      indentacao: 1 
    });
  });
  ativoItems.push({ 
    categoria: 'ativoNaoCirculante', 
    descricao: 'TOTAL ATIVO NÃO CIRCULANTE', 
    valor: totalAtivoNaoCirculante, 
    indentacao: 0, 
    isTotalGrupo: true 
  });
  
  // Total do Ativo
  const totalAtivo = totalAtivoCirculante + totalAtivoNaoCirculante;
  ativoItems.push({ 
    categoria: 'totalAtivo', 
    descricao: 'TOTAL DO ATIVO', 
    valor: totalAtivo, 
    indentacao: 0, 
    isTotal: true 
  });
  
  // Passivo Circulante
  const passivoCirculante = passivosRecords.filter(r => isPassivoCirculante(r.accountCode));
  let totalPassivoCirculante = passivoCirculante.reduce((sum, r) => sum + r.finalBalance, 0);
  
  passivoItems.push({ categoria: 'passivoCirculante', descricao: 'PASSIVO CIRCULANTE', valor: 0, indentacao: 0 });
  passivoCirculante.forEach(r => {
    passivoItems.push({ 
      categoria: 'passivoCirculante', 
      descricao: r.accountDescription, 
      valor: r.finalBalance, 
      indentacao: 1 
    });
  });
  passivoItems.push({ 
    categoria: 'passivoCirculante', 
    descricao: 'TOTAL PASSIVO CIRCULANTE', 
    valor: totalPassivoCirculante, 
    indentacao: 0, 
    isTotalGrupo: true 
  });
  
  // Passivo Não Circulante
  const passivoNaoCirculante = passivosRecords.filter(r => isPassivoNaoCirculante(r.accountCode));
  let totalPassivoNaoCirculante = passivoNaoCirculante.reduce((sum, r) => sum + r.finalBalance, 0);
  
  passivoItems.push({ categoria: 'passivoNaoCirculante', descricao: 'PASSIVO NÃO CIRCULANTE', valor: 0, indentacao: 0 });
  passivoNaoCirculante.forEach(r => {
    passivoItems.push({ 
      categoria: 'passivoNaoCirculante', 
      descricao: r.accountDescription, 
      valor: r.finalBalance, 
      indentacao: 1 
    });
  });
  passivoItems.push({ 
    categoria: 'passivoNaoCirculante', 
    descricao: 'TOTAL PASSIVO NÃO CIRCULANTE', 
    valor: totalPassivoNaoCirculante, 
    indentacao: 0, 
    isTotalGrupo: true 
  });
  
  // Patrimônio Líquido
  const patrimonioLiquido = passivosRecords.filter(r => isPatrimonioLiquido(r.accountCode));
  let totalPatrimonioLiquido = patrimonioLiquido.reduce((sum, r) => sum + r.finalBalance, 0);
  
  passivoItems.push({ categoria: 'patrimonioLiquido', descricao: 'PATRIMÔNIO LÍQUIDO', valor: 0, indentacao: 0 });
  patrimonioLiquido.forEach(r => {
    passivoItems.push({ 
      categoria: 'patrimonioLiquido', 
      descricao: r.accountDescription, 
      valor: r.finalBalance, 
      indentacao: 1 
    });
  });
  passivoItems.push({ 
    categoria: 'patrimonioLiquido', 
    descricao: 'TOTAL PATRIMÔNIO LÍQUIDO', 
    valor: totalPatrimonioLiquido, 
    indentacao: 0, 
    isTotalGrupo: true 
  });
  
  // Total Passivo e Patrimônio Líquido
  const totalPassivoPatrimonioLiquido = totalPassivoCirculante + totalPassivoNaoCirculante + totalPatrimonioLiquido;
  passivoItems.push({ 
    categoria: 'totalPassivoPatrimonioLiquido', 
    descricao: 'TOTAL PASSIVO E PATRIMÔNIO LÍQUIDO', 
    valor: totalPassivoPatrimonioLiquido, 
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

/**
 * Retorna cor hexadecimal com base no valor (positivo = verde, negativo = vermelho)
 */
export const getValueColor = (value: number): string => {
  // Para DRE e Balanço, cor específica
  if (value < 0) {
    return 'text-red-600';
  } else if (value > 0) {
    return 'text-green-700';
  }
  return 'text-gray-600';
};

/**
 * Gera estilo com base na indentação e tipo do item
 */
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
