import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, RotateCcw } from "lucide-react";
import { ReportFilters } from '@/types/reports';
import { supabase } from '@/integrations/supabase/client';

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
}

interface Company {
  id: string;
  name: string;
  cnpj?: string;
}

const ReportFiltersComponent: React.FC<ReportFiltersProps> = ({ filters, onFiltersChange }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, cnpj')
        .eq('is_active', true)
        .eq('is_deleted', false)
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
        return;
      }

      setCompanies(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Filtros Globais</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fiscalYearStart">Ano Inicial</Label>
            <Select 
              value={filters.fiscalYearStart?.toString() || ""} 
              onValueChange={(value) => handleFilterChange('fiscalYearStart', value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ano inicial" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fiscalYearEnd">Ano Final</Label>
            <Select 
              value={filters.fiscalYearEnd?.toString() || ""} 
              onValueChange={(value) => handleFilterChange('fiscalYearEnd', value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ano final" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Select 
              value={filters.companyId || ""} 
              onValueChange={(value) => handleFilterChange('companyId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name} {company.cnpj && `(${company.cnpj})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group">Grupo</Label>
            <Select 
              value={filters.groupId || ""} 
              onValueChange={(value) => handleFilterChange('groupId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grupo1">Grupo A</SelectItem>
                <SelectItem value="grupo2">Grupo B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">Filial</Label>
            <Select 
              value={filters.branchId || ""} 
              onValueChange={(value) => handleFilterChange('branchId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a filial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filial1">Filial 1</SelectItem>
                <SelectItem value="filial2">Filial 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              placeholder="Digite o CNPJ"
              value={filters.cnpj || ""}
              onChange={(e) => handleFilterChange('cnpj', e.target.value || undefined)}
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFiltersComponent;