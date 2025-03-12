import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

const InviteSignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Obtém o token da URL
  const inviteToken = searchParams.get('token');

  useEffect(() => {
    // Verifica se o token existe
    if (!inviteToken) {
      toast({
        title: "Erro",
        description: "Link de invite inválido ou expirado.",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [inviteToken, navigate, toast]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // No fluxo de convite do Supabase, usamos updateUser com o token
      const { data, error } = await supabase.auth.updateUser({
        password: password,
        data: { email_confirmed: true }
      }, {
        emailRedirectTo: window.location.origin
      });

      if (error) throw error;

      // Se o cadastro for bem-sucedido
      toast({
        title: "Cadastro realizado com sucesso",
        description: "Bem-vindo!",
      });

      // Redireciona para a página inicial
      navigate('/');
    } catch (error: any) {
      console.error("Erro ao processar convite:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao processar o convite.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <Card className="w-full max-w-md" style={{ backgroundColor: 'var(--background)'}}>
        <CardHeader>
          <h1 className="font-display text-2xl font-bold text-center" style={{ color: 'var(--text)' }}>Cadastre-se</h1>
          <p className="text-center" style={{ color: 'var(--text)' }}>Insira seu email e senha para finalizar o cadastro</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
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
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-center" style={{ color: 'var(--text)' }}>
            Já tem uma conta?{' '}
            <Button
              variant="link"
              className="text-sm p-0"
              onClick={() => navigate('/login')}
              style={{ color: 'var(--secondary)' }}
            >
              Faça login
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InviteSignUp;