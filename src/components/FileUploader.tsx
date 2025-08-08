
import React from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader, FileText, AlertTriangle } from "lucide-react";
import { SpedProcessedData } from '@/types/sped';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import FilePreview from './FilePreview';

interface FileUploaderProps {
  onFileProcessed: (data: SpedProcessedData) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileProcessed }) => {
  const {
    fileState,
    fileInputRef,
    setFile,
    handleProcess,
    togglePreview,
    handleUploadClick,
  } = useFileProcessing(onFileProcessed);

  const { file, uploadProgress, isProcessing, filePreview, showPreview } = fileState;
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setFile(selectedFile || null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (event.dataTransfer.files?.length) {
      const droppedFile = event.dataTransfer.files[0];
      setFile(droppedFile);
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
                Serão aceitos somente sped de Empresas Cadastradas
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
              
              <FilePreview
                filePreview={filePreview}
                showPreview={showPreview}
                onTogglePreview={togglePreview}
              />
            </>
          )}
        </div>
      </div>

      
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
