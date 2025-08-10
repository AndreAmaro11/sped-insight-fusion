
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { isAuthenticated, hasRole } from '@/utils/authUtils';
import IndicatorManagement from '@/components/IndicatorManagement';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

// Mock data for users
const mockUsers: User[] = [
  {
    id: 1,
    name: 'Administrador',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2025-04-28 09:15:23'
  }
];

interface SystemActivity {
  id: number;
  user: string;
  action: string;
  timestamp: string;
  details: string;
}

// Mock data for system activity
const mockActivity: SystemActivity[] = [];

const Administration = () => {
  const navigate = useNavigate();
  const [users, setUsers] = React.useState<User[]>(mockUsers);
  const [activities, setActivities] = React.useState<SystemActivity[]>(mockActivity);
  
useEffect(() => {
    const run = async () => {
      // Check if user is authenticated and has admin role
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }
      
      if (!hasRole('admin')) {
        toast.error("Você não tem permissão para acessar esta página");
        navigate('/dashboard');
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('audit_logs')
          .select('id, created_at, action, details')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) {
          console.error('Erro ao buscar atividades:', error);
          toast.error('Erro ao carregar atividades');
          return;
        }
        const email = user?.email ?? '';
        const mapped = (data ?? []).map((row: any, idx: number) => ({
          id: idx + 1,
          user: email,
          action: row.action as string,
          timestamp: new Date(row.created_at as string).toLocaleString('pt-BR'),
          details: typeof row.details === 'string' ? row.details : JSON.stringify(row.details ?? ''),
        }));
        setActivities(mapped);
      } catch (e) {
        console.error('Erro ao carregar atividades:', e);
        toast.error('Erro ao carregar atividades');
      }
    };

    run();
  }, [navigate]);

  const handleToggleUserStatus = (userId: number) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        
        toast.success(
          `Usuário ${user.name} ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`
        );
        
        return {
          ...user,
          status: newStatus
        };
      }
      return user;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-16"> {/* Space for fixed navbar */}
        {/* Page header */}
        <div className="bg-white shadow">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie usuários e monitore a atividade do sistema
            </p>
          </div>
        </div>
        
        {/* Main content */}
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Tabs defaultValue="users">
            <TabsList className="mb-6">
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="activity">Atividade do Sistema</TabsTrigger>
              <TabsTrigger value="indicators">Indicadores</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                    <CardDescription>
                      {users.length} usuários cadastrados no sistema
                    </CardDescription>
                  </div>
                  
                  <Button
                    onClick={() => toast.info("Funcionalidade de adicionar usuário em desenvolvimento")}
                  >
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Adicionar Usuário
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">ID</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Função</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Último Login</TableHead>
                          <TableHead className="w-[150px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.id}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.role === 'admin' ? (
                                <Badge className="bg-primary hover:bg-primary">Admin</Badge>
                              ) : (
                                <Badge variant="outline">Usuário</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.status === 'active' ? (
                                <Badge className="bg-green-600 hover:bg-green-700">Ativo</Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600 border-red-600">Inativo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{user.lastLogin}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                  Editar
                                </Button>
                                
                                <Button
                                  variant={user.status === 'active' ? "destructive" : "outline"}
                                  size="sm"
                                  onClick={() => handleToggleUserStatus(user.id)}
                                >
                                  {user.status === 'active' ? 'Desativar' : 'Ativar'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Atividade do Sistema</CardTitle>
                  <CardDescription>
                    Registro das ações recentes realizadas no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead className="hidden md:table-cell">Timestamp</TableHead>
                          <TableHead className="hidden md:table-cell">Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      
                      <TableBody>
                        {activities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className="font-medium">{activity.id}</TableCell>
                            <TableCell>{activity.user}</TableCell>
                            <TableCell>{activity.action}</TableCell>
                            <TableCell className="hidden md:table-cell">{activity.timestamp}</TableCell>
                            <TableCell className="hidden md:table-cell">{activity.details}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="indicators">
              <IndicatorManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Administration;
