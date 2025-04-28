
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { isAuthenticated } from '@/utils/authUtils';

interface Company {
  id: number;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  createdAt: string;
}

// Mock data for companies
const mockCompanies: Company[] = [
  {
    id: 1,
    name: 'Empresa ABC Ltda',
    cnpj: '12.345.678/0001-90',
    email: 'contato@empresaabc.com',
    phone: '(11) 98765-4321',
    createdAt: '2025-04-20'
  },
  {
    id: 2,
    name: 'XYZ Comércio S.A.',
    cnpj: '98.765.432/0001-10',
    email: 'contato@xyzcomercio.com',
    phone: '(21) 91234-5678',
    createdAt: '2025-04-18'
  },
  {
    id: 3,
    name: 'Indústria QWE Ltda',
    cnpj: '45.678.901/0001-23',
    email: 'contato@qweindustria.com',
    phone: '(31) 93456-7890',
    createdAt: '2025-04-15'
  }
];

const CompanyRegistration = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Handle input changes for form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Format CNPJ as user types
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
    
    if (value.length > 14) {
      value = value.slice(0, 14);
    }
    
    // Format CNPJ as 12.345.678/0001-90
    if (value.length > 12) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else if (value.length > 8) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d*)$/, '$1.$2.$3/$4');
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d*)$/, '$1.$2.$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d*)$/, '$1.$2');
    }
    
    setFormData(prev => ({ ...prev, cnpj: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.cnpj || !formData.email || !formData.phone) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    // Add new company
    const newCompany: Company = {
      id: companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1,
      name: formData.name,
      cnpj: formData.cnpj,
      email: formData.email,
      phone: formData.phone,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setCompanies([newCompany, ...companies]);
    
    // Reset form
    setFormData({
      name: '',
      cnpj: '',
      email: '',
      phone: ''
    });
    
    // Close dialog
    setIsDialogOpen(false);
    
    toast.success("Empresa cadastrada com sucesso!");
  };

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16"> {/* Space for fixed navbar */}
        {/* Page header */}
        <div className="bg-white shadow">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Cadastro de Empresas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie as empresas vinculadas aos arquivos SPED
            </p>
          </div>
        </div>
        
        {/* Main content */}
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <Input
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Nova Empresa
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                    <DialogDescription>
                      Preencha os dados da empresa para cadastro.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Nome
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
                        CNPJ
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
                        Email
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
                        required
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} type="button">
                      Cancelar
                    </Button>
                    <Button type="submit">Cadastrar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>Nome da Empresa</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Telefone</TableHead>
                      <TableHead className="hidden md:table-cell">Data de Cadastro</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  
                  <TableBody>
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.id}</TableCell>
                          <TableCell>{company.name}</TableCell>
                          <TableCell>{company.cnpj}</TableCell>
                          <TableCell className="hidden md:table-cell">{company.email}</TableCell>
                          <TableCell className="hidden md:table-cell">{company.phone}</TableCell>
                          <TableCell className="hidden md:table-cell">{company.createdAt}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toast.info("Editar empresa " + company.name)}
                              >
                                Editar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setCompanies(companies.filter(c => c.id !== company.id));
                                  toast.success("Empresa removida com sucesso!");
                                }}
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
