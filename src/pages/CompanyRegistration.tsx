import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];
type Contract = Database['public']['Tables']['contracts']['Row'];

const CompanyRegistration = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    contract_id: '',
    is_active: true,
  });

  const [contractData, setContractData] = useState({
    name: '',
    description: '',
  });
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchCompanies(), fetchContracts()]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        contracts:contract_id (
          id,
          name
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar empresas:', error);
      throw error;
    }

    setCompanies(data || []);
  };

  const fetchContracts = async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Erro ao buscar contratos:', error);
      throw error;
    }

    setContracts(data || []);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContractInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContractData(prev => ({ ...prev, [name]: value }));
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 14) {
      value = value.slice(0, 14);
    }
    
    // Aplicar formatação progressiva
    if (value.length >= 14) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else if (value.length >= 9) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, '$1.$2.$3/$4');
    } else if (value.length >= 6) {
      value = value.replace(/^(\d{2})(\d{3})(\d+)$/, '$1.$2.$3');
    } else if (value.length >= 3) {
      value = value.replace(/^(\d{2})(\d+)$/, '$1.$2');
    }
    
    setFormData(prev => ({ ...prev, cnpj: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipcode: '',
      contract_id: '',
      is_active: true,
    });
    setEditingCompany(null);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || '',
      cnpj: company.cnpj || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      zipcode: company.zipcode || '',
      contract_id: company.contract_id || '',
      is_active: company.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }
    
    if (!formData.name || !formData.cnpj || !formData.email) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const companyData = {
        name: formData.name,
        cnpj: formData.cnpj,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipcode: formData.zipcode,
        contract_id: formData.contract_id || null,
        is_active: formData.is_active,
      };

      if (editingCompany) {
        // Update existing company
        const { data, error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', editingCompany.id)
          .select(`
            *,
            contracts:contract_id (
              id,
              name
            )
          `)
          .single();

        if (error) {
          console.error('Erro ao atualizar empresa:', error);
          toast.error("Erro ao atualizar empresa");
          return;
        }

        setCompanies(companies.map(c => c.id === editingCompany.id ? data : c));
        toast.success("Empresa atualizada com sucesso!");
      } else {
        // Create new company
        const { data, error } = await supabase
          .from('companies')
          .insert({
            ...companyData,
            created_by: user.id
          })
          .select(`
            *,
            contracts:contract_id (
              id,
              name
            )
          `)
          .single();

        if (error) {
          console.error('Erro ao criar empresa:', error);
          toast.error("Erro ao cadastrar empresa");
          return;
        }

        setCompanies([data, ...companies]);
        toast.success("Empresa cadastrada com sucesso!");
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error("Erro ao salvar empresa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_deleted: true })
        .eq('id', companyId);

      if (error) {
        console.error('Erro ao marcar empresa como excluída:', error);
        toast.error("Erro ao excluir empresa");
        return;
      }

      setCompanies(companies.filter(c => c.id !== companyId));
      toast.success("Empresa removida com sucesso!");
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast.error("Erro ao excluir empresa");
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }
    
    if (!contractData.name) {
      toast.error("Por favor, preencha o nome do contrato");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          name: contractData.name,
          description: contractData.description,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar contrato:', error);
        toast.error("Erro ao cadastrar contrato");
        return;
      }

      setContracts([...contracts, data]);
      setContractData({ name: '', description: '' });
      setIsContractDialogOpen(false);
      toast.success("Contrato cadastrado com sucesso!");
    } catch (error) {
      console.error('Erro ao cadastrar contrato:', error);
      toast.error("Erro ao cadastrar contrato");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.cnpj && company.cnpj.includes(searchTerm)) ||
    (company.email && company.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="bg-white shadow">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Empresas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie empresas e contratos vinculados aos arquivos SPED
            </p>
          </div>
        </div>
        
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <Input
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    Novo Contrato
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleCreateContract}>
                    <DialogHeader>
                      <DialogTitle>Novo Contrato</DialogTitle>
                      <DialogDescription>
                        Crie um novo contrato para agrupar empresas.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contract-name" className="text-right">
                          Nome
                        </Label>
                        <Input
                          id="contract-name"
                          name="name"
                          className="col-span-3"
                          value={contractData.name}
                          onChange={handleContractInputChange}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contract-description" className="text-right">
                          Descrição
                        </Label>
                        <Input
                          id="contract-description"
                          name="description"
                          className="col-span-3"
                          value={contractData.description}
                          onChange={handleContractInputChange}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsContractDialogOpen(false)} type="button">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Criando...' : 'Criar Contrato'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={(open) => { 
                setIsDialogOpen(open); 
                if (!open) resetForm(); 
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Nova Empresa
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingCompany ? 'Edite os dados da empresa.' : 'Preencha os dados da empresa para cadastro.'}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contract_id" className="text-right">
                          Contrato
                        </Label>
                        <Select value={formData.contract_id} onValueChange={(value) => setFormData(prev => ({ ...prev, contract_id: value }))}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione um contrato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sem contrato</SelectItem>
                            {contracts.map((contract) => (
                              <SelectItem key={contract.id} value={contract.id}>
                                {contract.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nome *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          className="col-span-3"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cnpj" className="text-right">
                          CNPJ *
                        </Label>
                        <Input
                          id="cnpj"
                          name="cnpj"
                          className="col-span-3"
                          value={formData.cnpj}
                          onChange={handleCnpjChange}
                          placeholder="12.345.678/0001-90"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          className="col-span-3"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          className="col-span-3"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="(11) 98765-4321"
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">
                          Endereço
                        </Label>
                        <Input
                          id="address"
                          name="address"
                          className="col-span-3"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="city" className="text-right">
                          Cidade
                        </Label>
                        <Input
                          id="city"
                          name="city"
                          className="col-span-3"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="state" className="text-right">
                          Estado
                        </Label>
                        <Input
                          id="state"
                          name="state"
                          className="col-span-3"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="SP"
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="zipcode" className="text-right">
                          CEP
                        </Label>
                        <Input
                          id="zipcode"
                          name="zipcode"
                          className="col-span-3"
                          value={formData.zipcode}
                          onChange={handleInputChange}
                          placeholder="01234-567"
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="is_active" className="text-right">
                          Ativo
                        </Label>
                        <div className="col-span-3">
                          <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} type="button">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (editingCompany ? 'Salvando...' : 'Cadastrando...') : (editingCompany ? 'Salvar' : 'Cadastrar')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Empresas Cadastradas</CardTitle>
              <CardDescription>
                {filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Empresa</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead className="hidden md:table-cell">Contrato</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Data de Cadastro</TableHead>
                      <TableHead className="w-[140px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  
                  <TableBody>
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>{company.cnpj}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {(company as any).contracts?.name || 'Sem contrato'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{company.email}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant={company.is_active ? "default" : "secondary"}>
                              {company.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {new Date(company.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEdit(company)}
                              >
                                Editar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleSoftDelete(company.id)}
                              >
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                          Nenhuma empresa encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegistration;