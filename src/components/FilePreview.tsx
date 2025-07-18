import React from 'react';

interface FilePreviewProps {
  filePreview: string;
  showPreview: boolean;
  onTogglePreview: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ 
  filePreview, 
  showPreview, 
  onTogglePreview 
}) => {
  if (!filePreview) return null;

  return (
    <>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onTogglePreview();
        }}
        className="text-xs text-primary underline"
      >
        {showPreview ? 'Ocultar amostra' : 'Ver amostra de conteúdo'}
      </button>

      {showPreview && (
        <div className="mt-4 p-3 bg-gray-50 border rounded-md">
          <h4 className="text-sm font-medium mb-2">Amostra do conteúdo:</h4>
          <pre 
            className="text-xs overflow-x-auto whitespace-pre-wrap" 
            style={{maxHeight: '200px', overflowY: 'auto'}}
          >
            {filePreview}
          </pre>
        </div>
      )}
    </>
  );
};

export default FilePreview;