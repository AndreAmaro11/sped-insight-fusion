import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { parseSpedFile } from '@/utils/spedParser';

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
  block: 'J100' | 'J150';
  fiscalYear: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileProcessed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
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
    
    try {
      const fileContent = await readFileContent(file);
      
      const processedData = parseSpedFile(fileContent);
      
      toast.success(`Arquivo SPED processado com sucesso. Ano fiscal: ${processedData.fiscalYear}`);
      
      onFileProcessed(processedData);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Erro ao processar o arquivo. Verifique se é um arquivo SPED válido.");
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = (error) => {
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          
          <div className="text-lg font-medium text-gray-700">
            {file ? file.name : "Arraste e solte o arquivo SPED aqui"}
          </div>
          
          <p className="text-sm text-gray-500">
            {file ? `${(file.size / 1024).toFixed(2)} KB` : "ou clique para selecionar o arquivo"}
          </p>
          
          <p className="text-xs text-gray-400">
            Somente arquivos .txt são aceitos
          </p>
        </div>
      </div>

      {file && (
        <div className="mt-4 space-y-4">
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando arquivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
          
          {isProcessing ? (
            <div className="space-y-2">
              <div className="text-sm">Processando arquivo SPED...</div>
              <Progress value={100} className="animate-pulse" />
            </div>
          ) : (
            uploadProgress === 0 && (
              <Button 
                className="w-full" 
                onClick={handleProcess}
                disabled={isProcessing}
              >
                Processar Arquivo
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
