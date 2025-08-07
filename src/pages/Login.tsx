
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, resetPassword, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos - Leonardo");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error("Falha no login. Por favor, verifique suas credenciais.");
        console.error("Login error:", error);
      } else {
        toast.success("Login realizado com sucesso!");
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error("Erro inesperado. Tente novamente.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Por favor, digite seu email primeiro");
      return;
    }

    setIsResettingPassword(true);
    
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error("Erro ao enviar email de recuperação");
        console.error("Reset password error:", error);
      } else {
        toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      }
    } catch (error) {
      toast.error("Erro inesperado. Tente novamente.");
      console.error("Reset password error:", error);
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <img
          src="https://media.licdn.com/dms/image/v2/C4D0BAQGCp-lu-Mn_ow/company-logo_100_100/company-logo_100_100/0/1671668887864/lealmetrics_logo?e=1757548800&v=beta&t=9aZGhxi_Sbs3CIXd13JqtQy4HQ3ij2o88OB3tmEoQnE"
          alt="Logo LealMetrics"
          className="w-20 h-20 mx-auto mb-4"
        />
        <h2 className="mt-2 text-3xl font-bold text-gray-900">
          Acesse sua conta
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Entre com seu email e senha para acessar o sistema!
        </p>
      </div>
      
        <Card>
          <CardHeader>
            <CardTitle>SPED Insight Fusion</CardTitle>
            <CardDescription>
              Sistema de análise de SPED Contábil
            </CardDescription>
          </CardHeader>
          
          {/* Info sobre cadastro */}
          <div className="mx-6 mb-4 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-2">Novo usuário?</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Cadastre-se usando um email válido.</div>
              <div>Você receberá um email de confirmação.</div>
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
              
              <Button 
                type="button"
                variant="outline" 
                className="w-full" 
                disabled={isResettingPassword || !email}
                onClick={handleResetPassword}
              >
                {isResettingPassword ? "Enviando..." : "Esqueci minha senha"}
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
