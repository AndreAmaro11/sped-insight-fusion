import React from 'react';
import { Button } from "@/components/ui/button";

interface ReportNavigationProps {
  onNavigate: (tab: string) => void;
  showDRE?: boolean;
  showBalanco?: boolean;
}

const ReportNavigation: React.FC<ReportNavigationProps> = ({ 
  onNavigate, 
  showDRE = false, 
  showBalanco = false 
}) => {
  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('upload')}
        className="text-primary hover:text-primary/80"
      >
        ← Voltar para Upload
      </Button>
      
      {showDRE && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('dre')}
          className="text-primary hover:text-primary/80"
        >
          Ver DRE →
        </Button>
      )}
      
      {showBalanco && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('balanco')}
          className="text-primary hover:text-primary/80"
        >
          Ver Balanço →
        </Button>
      )}
    </div>
  );
};

export default ReportNavigation;