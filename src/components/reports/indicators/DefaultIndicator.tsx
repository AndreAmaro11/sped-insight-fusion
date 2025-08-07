import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { ReportFilters } from '@/types/reports';

interface DefaultIndicatorProps {
  filters: ReportFilters;
  indicatorName: string;
  description?: string;
}

const DefaultIndicator: React.FC<DefaultIndicatorProps> = ({ 
  filters, 
  indicatorName, 
  description 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="h-5 w-5 text-orange-500" />
          {indicatorName}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <div className="space-y-4">
          <div className="text-6xl">🚧</div>
          <div>
            <h3 className="text-lg font-medium mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground text-sm">
              {description || `O indicador ${indicatorName} está sendo desenvolvido e será disponibilizado em breve.`}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Filtros aplicados: {Object.keys(filters).length > 0 ? 
              Object.entries(filters)
                .filter(([_, value]) => value)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ') 
              : 'Nenhum filtro aplicado'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DefaultIndicator;