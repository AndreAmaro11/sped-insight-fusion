
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { parseSpedFile } from '@/utils/spedParser';
import { Loader, FileText, AlertTriangle } from "lucide-react";

interface FileUploaderProps {
  onFileProcessed: (data: SpedProcessedData) => void;
}

export interface SpedProcessedData {
  fiscalYear: number;
  records: SpedRecord[];
}

export interface SpedRecord {
  accountCode: string;
  accountDescription: string;
  finalBalance: number;
  block: string;
  fiscalYear: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileProcessed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [filePreview, setFilePreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }
    
    if (!selectedFile.name.toLowerCase().endsWith('.txt')) {
      toast.error("Por favor, selecione um arquivo SPED em formato .txt");
      return;
    }
    
    setFile(selectedFile);
    setUploadProgress(0);
    setFilePreview('');
    setShowPreview(false);
    
    // Verificação inicial do tamanho
    if (selectedFile.size === 0) {
      toast.error("O arquivo está vazio.");
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.warning("O arquivo é muito grande (>10MB). O processamento pode demorar.");
    }
    
    console.log(`Arquivo selecionado: ${selectedFile.name}, Tamanho: ${(selectedFile.size / 1024).toFixed(2)} KB`);
    
    // Carregar amostra do conteúdo
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      // Mostrar apenas as primeiras 20 linhas
      const lines = content.split('\n').slice(0, 20);
      setFilePreview(lines.join('\n'));
    };
    reader.readAsText(selectedFile.slice(0, 10000)); // Ler apenas os primeiros 10KB para preview
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (event.dataTransfer.files?.length) {
      const droppedFile = event.dataTransfer.files[0];
      
      if (!droppedFile.name.toLowerCase().endsWith('.txt')) {
        toast.error("Por favor, selecione um arquivo SPED em formato .txt");
        return;
      }
      
      setFile(droppedFile);
      setUploadProgress(0);
      setFilePreview('');
      setShowPreview(false);
      
      // Verificação inicial
      if (droppedFile.size === 0) {
        toast.error("O arquivo está vazio.");
        return;
      }
      
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.warning("O arquivo é muito grande (>10MB). O processamento pode demorar.");
      }
      
      // Carregar amostra do conteúdo
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const lines = content.split('\n').slice(0, 20);
        setFilePreview(lines.join('\n'));
      };
      reader.readAsText(droppedFile.slice(0, 10000));
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const simulateUploadProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          processFile();
        }, 500);
      }
    }, 200);
  };

  const processFile = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    console.log("=== INICIANDO PROCESSAMENTO DO ARQUIVO ===");
    console.log(`Arquivo: ${file.name}, Tamanho: ${file.size} bytes`);
    
    try {
      toast.info("Lendo o arquivo...");
      const fileContent = await readFileContent(file);
      
      if (!fileContent || fileContent.trim() === '') {
        console.error("Arquivo vazio");
        toast.error("O arquivo está vazio ou não pôde ser lido.");
        setIsProcessing(false);
        return;
      }
      
      console.log(`Conteúdo lido com sucesso. Tamanho: ${fileContent.length} caracteres`);
      
      // Validação básica do conteúdo
      if (!fileContent.includes('|')) {
        console.error("Arquivo não parece estar no formato SPED (sem delimitadores |)");
        toast.error("O arquivo não parece estar no formato SPED esperado.");
        setIsProcessing(false);
        return;
      }
      
      toast.info("Processando dados do SPED...", { duration: 3000 });
      const processedData = parseSpedFile(fileContent);
      
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
      setIsProcessing(false);
    }
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

  const handleProcess = () => {
    if (!file) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }
    
    simulateUploadProgress();
  };
  
  const togglePreview = () => {
    if (filePreview && !showPreview) {
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
          file ? 'border-primary' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input
          type="file"
          className="hidden"
          accept=".txt"
          onChange={handleFileChange}
          ref={fileInputRef}
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          {!file ? (
            <>
              <FileText
                className="h-12 w-12 text-gray-400"
              />
              
              <div className="text-lg font-medium text-gray-700">
                Arraste e solte o arquivo SPED aqui
              </div>
              
              <p className="text-sm text-gray-500">
                ou clique para selecionar o arquivo
              </p>
              
              <p className="text-xs text-gray-400">
                Somente arquivos .txt são aceitos
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              
              <div className="text-lg font-medium text-gray-700">
                {file.name}
              </div>
              
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              
              {filePreview && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePreview();
                  }}
                  className="text-xs text-primary underline"
                >
                  {showPreview ? 'Ocultar amostra' : 'Ver amostra de conteúdo'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showPreview && filePreview && (
        <div className="mt-4 p-3 bg-gray-50 border rounded-md">
          <h4 className="text-sm font-medium mb-2">Amostra do conteúdo:</h4>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap" style={{maxHeight: '200px', overflowY: 'auto'}}>
            {filePreview}
          </pre>
        </div>
      )}
      
      {file && (
        <div className="mt-4 space-y-4">
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Carregando arquivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
          
          {isProcessing ? (
            <div className="space-y-2">
              <div className="flex items-center text-sm gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span>Processando arquivo SPED...</span>
              </div>
              <Progress value={100} className="animate-pulse" />
              <p className="text-xs text-gray-500">
                Este processo pode demorar alguns segundos dependendo do tamanho do arquivo.
              </p>
            </div>
          ) : (
            uploadProgress === 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Antes de processar, certifique-se de que este arquivo é um SPED Contábil válido.</span>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleProcess}
                  disabled={isProcessing}
                >
                  Processar Arquivo
                </Button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
