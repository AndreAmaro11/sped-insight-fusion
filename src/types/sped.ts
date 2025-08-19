export interface SpedRecord {
  accountCode: string;
  accountDescription: string;
  finalBalance: number;
  block: string;
  fiscalYear: number;
}

export interface SpedProcessedData {
  fiscalYear: number;
  cnpj?: string;
  records: SpedRecord[];
  uploadId?: string;
}

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

export interface FileUploadState {
  file: File | null;
  uploadProgress: number;
  isProcessing: boolean;
  filePreview: string;
  showPreview: boolean;
}

export interface FileStructure {
  version: string;
  headerPos?: number;
  accountsPos?: number;
}