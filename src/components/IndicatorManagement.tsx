import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { FinancialIndicator } from '@/types/reports';

const IndicatorManagement = () => {
  const [indicators, setIndicators] = useState<FinancialIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<FinancialIndicator | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    display_order: 0,
    enabled: true
  });

  useEffect(() => {
    fetchIndicators();
  }, []);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_indicators')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching indicators:', error);
        toast.error('Erro ao carregar indicadores');
        return;
      }

      setIndicators(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar indicadores');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      display_order: 0,
      enabled: true
    });
    setEditingIndicator(null);
  };

  const openDialog = (indicator?: FinancialIndicator) => {
    if (indicator) {
      setEditingIndicator(indicator);
      setFormData({
        name: indicator.name,
        slug: indicator.slug,
        description: indicator.description || '',
        display_order: indicator.display_order,
        enabled: indicator.enabled
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }

    try {
      if (editingIndicator) {
        // Update existing indicator
        const { error } = await supabase
          .from('financial_indicators')
          .update({
            name: formData.name.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || null,
            display_order: formData.display_order,
            enabled: formData.enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingIndicator.id);

        if (error) {
          console.error('Error updating indicator:', error);
          toast.error('Erro ao atualizar indicador');
          return;
        }

        toast.success('Indicador atualizado com sucesso');
      } else {
        // Create new indicator
        const { error } = await supabase
          .from('financial_indicators')
          .insert({
            name: formData.name.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || null,
            display_order: formData.display_order,
            enabled: formData.enabled
          });

        if (error) {
          console.error('Error creating indicator:', error);
          toast.error('Erro ao criar indicador');
          return;
        }

        toast.success('Indicador criado com sucesso');
      }

      closeDialog();
      fetchIndicators();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao salvar indicador');
    }
  };

  const handleDelete = async (indicator: FinancialIndicator) => {
    try {
      const { error } = await supabase
        .from('financial_indicators')
        .delete()
        .eq('id', indicator.id);

      if (error) {
        console.error('Error deleting indicator:', error);
        toast.error('Erro ao excluir indicador');
        return;
      }

      toast.success('Indicador excluído com sucesso');
      fetchIndicators();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao excluir indicador');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando indicadores...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Gerenciamento de Indicadores</CardTitle>
          <CardDescription>
            {indicators.length} indicadores cadastrados no sistema
          </CardDescription>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Indicador
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingIndicator ? 'Editar Indicador' : 'Novo Indicador'}
              </DialogTitle>
              <DialogDescription>
                {editingIndicator 
                  ? 'Edite as informações do indicador'
                  : 'Preencha as informações do novo indicador'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: DRE, Balanço, FCVPL"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({...prev, slug: e.target.value}))}
                  placeholder="Ex: dre, balanco, fcvpl"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Descrição opcional do indicador"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="display_order">Ordem de Exibição</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({...prev, display_order: parseInt(e.target.value) || 0}))}
                  min="0"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(enabled) => setFormData(prev => ({...prev, enabled}))}
                />
                <Label htmlFor="enabled">Habilitado</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingIndicator ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead className="w-[100px]">Ordem</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[150px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {indicators.map((indicator) => (
                <TableRow key={indicator.id}>
                  <TableCell className="font-medium">{indicator.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {indicator.slug}
                    </code>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs">
                    <div className="truncate" title={indicator.description || ''}>
                      {indicator.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{indicator.display_order}</TableCell>
                  <TableCell>
                    {indicator.enabled ? (
                      <Badge className="bg-green-600 hover:bg-green-700">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDialog(indicator)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o indicador "{indicator.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(indicator)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {indicators.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum indicador cadastrado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IndicatorManagement;