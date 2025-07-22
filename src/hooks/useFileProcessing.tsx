import { useState, useRef } from 'react';
import { toast } from "sonner";
import { SpedProcessedData, FileUploadState } from '@/types/sped';
import { parseSpedFile } from '@/services/spedService';

export const useFileProcessing = (onFileProcessed: (data: SpedProcessedData) => void) => {
  const [fileState, setFileState] = useState<FileUploadState>({
    file: null,
    uploadProgress: 0,
    isProcessing: false,
    filePreview: '',
    showPreview: false,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith('.txt')) {
      toast.error("Por favor, selecione um arquivo SPED em formato .txt");
      return false;
    }
    
    if (file.size === 0) {
      toast.error("O arquivo está vazio.");
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.warning("O arquivo é muito grande (>10MB). O processamento pode demorar.");
    }
    
    return true;
  };

  const loadFilePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').slice(0, 20);
      setFileState(prev => ({ ...prev, filePreview: lines.join('\n') }));
    };
    reader.readAsText(file.slice(0, 10000));
  };

  const setFile = (file: File | null) => {
    if (!file) {
      setFileState(prev => ({ ...prev, file: null, filePreview: '', showPreview: false }));
      return;
    }

    if (!validateFile(file)) return;

    console.log(`Arquivo selecionado: ${file.name}, Tamanho: ${(file.size / 1024).toFixed(2)} KB`);
    
    setFileState(prev => ({
      ...prev,
      file,
      uploadProgress: 0,
      filePreview: '',
      showPreview: false
    }));

    loadFilePreview(file);
  };

  const simulateUploadProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFileState(prev => ({ ...prev, uploadProgress: progress }));
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          processFile();
        }, 500);
      }
    }, 200);
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log("Iniciando leitura do arquivo...");
      const reader = new FileReader();
      
      reader.onload = (event) => {
        console.log("Arquivo lido com sucesso");
        const content = event.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = (error) => {
        console.error("Erro ao ler arquivo:", error);
        reject(error);
      };
      
      reader.readAsText(file);
    });
  };

  const processFile = async () => {
    if (!fileState.file) return;
    
    setFileState(prev => ({ ...prev, isProcessing: true }));
    console.log("=== INICIANDO PROCESSAMENTO DO ARQUIVO ===");
    console.log(`Arquivo: ${fileState.file.name}, Tamanho: ${fileState.file.size} bytes`);
    
    try {
      toast.info("Lendo o arquivo...");
      const fileContent = await readFileContent(fileState.file);
      
      if (!fileContent || fileContent.trim() === '') {
        console.error("Arquivo vazio");
        toast.error("O arquivo está vazio ou não pôde ser lido.");
        setFileState(prev => ({ ...prev, isProcessing: false }));
        return;
      }
      
      console.log(`Conteúdo lido com sucesso. Tamanho: ${fileContent.length} caracteres`);
      
      if (!fileContent.includes('|')) {
        console.error("Arquivo não parece estar no formato SPED (sem delimitadores |)");
        toast.error("O arquivo não parece estar no formato SPED esperado.");
        setFileState(prev => ({ ...prev, isProcessing: false }));
        return;
      }
      
      toast.info("Processando dados do SPED...", { duration: 3000 });
      const processedData = await parseSpedFile(fileContent, fileState.file.name);
      
      if (processedData.records.length === 0) {
        toast.warning("Não foram encontrados registros contábeis no arquivo.", { duration: 5000 });
      } else {
        toast.success(`Arquivo SPED processado com sucesso. ${processedData.records.length} registros encontrados.`);
      }
      
      onFileProcessed(processedData);
    } catch (error) {
      console.error("Erro ao processar o arquivo:", error);
      toast.error("Erro ao processar o arquivo. Verifique se é um arquivo SPED válido.");
    } finally {
      setFileState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleProcess = () => {
    if (!fileState.file) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }
    
    simulateUploadProgress();
  };

  const togglePreview = () => {
    setFileState(prev => ({ 
      ...prev, 
      showPreview: prev.filePreview && !prev.showPreview 
    }));
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return {
    fileState,
    fileInputRef,
    setFile,
    handleProcess,
    togglePreview,
    handleUploadClick,
  };
};