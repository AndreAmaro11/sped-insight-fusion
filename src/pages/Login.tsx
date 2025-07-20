
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { login } from '@/utils/authUtils';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast.success("Login realizado com sucesso!");
      navigate('/dashboard');
    } catch (error) {
      toast.error("Falha no login. Por favor, verifique suas credenciais.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Acesse sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Entre com seu email e senha para acessar o sistema
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>SPED Insight Fusion</CardTitle>
            <CardDescription>
              Sistema de análise de SPED Contábil
            </CardDescription>
          </CardHeader>
          
          {/* Credenciais de teste */}
          <div className="mx-6 mb-4 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-2">Credenciais para teste:</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div><strong>Admin:</strong> admin@example.com / admin123</div>
              <div><strong>Usuário:</strong> user@example.com / user123</div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Processando..." : "Entrar"}
              </Button>
              
              <div className="text-center text-sm">
                <a 
                  href="/" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Voltar para a página inicial
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
