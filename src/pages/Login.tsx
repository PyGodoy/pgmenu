import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Removido .single() e adicionado tratamento
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id);

          if (error) {
            console.error('Erro ao buscar perfil:', error);
            return;
          }

          // Verifica se encontrou o perfil
          if (profiles && profiles.length > 0 && profiles[0]?.is_admin) {
            navigate('/admin');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is admin - SEM .single()
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        throw new Error('Erro ao verificar permissões do usuário');
      }

      // Verifica se o perfil existe
      if (!profiles || profiles.length === 0) {
        await supabase.auth.signOut();
        throw new Error('Perfil de usuário não encontrado');
      }

      // Verifica se é admin
      if (!profiles[0]?.is_admin) {
        await supabase.auth.signOut();
        throw new Error('Acesso não autorizado. Apenas administradores podem fazer login.');
      }

      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });

      navigate('/admin');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu email",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email de recuperação enviado",
        description: "Verifique seu email para redefinir sua senha",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <Card className="w-full max-w-md" style={{ backgroundColor: 'var(--background)'}}>
        <CardHeader>
          <h1 className="font-display text-2xl font-bold text-center" style={{ color: 'var(--text)' }}>Área Administrativa</h1>
          <p className="text-center" style={{ color: 'var(--text)' }}>Entre para gerenciar seu cardápio</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ backgroundColor: 'var(--background)', color: 'var(--text)'}}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ backgroundColor: 'var(--background)', color: 'var(--text)'}}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            variant="link"
            className="text-sm"
            onClick={handleResetPassword}
            disabled={resetLoading}
            style={{ color: 'var(--secondary)' }}
          >
            {resetLoading ? "Enviando..." : "Esqueceu sua senha?"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;