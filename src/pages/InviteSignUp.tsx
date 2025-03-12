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

  // Pega o token da URL
  const inviteToken = searchParams.get('token');
  
  // Pega o tipo de convite (deve ser "invite" para convites)
  const type = searchParams.get('type');
  
  // E também extrair o email do convite se estiver presente na URL
  const inviteEmail = searchParams.get('email');

  useEffect(() => {
    // Verifica se há um token e se o tipo é "invite"
    if (!inviteToken || type !== "invite") {
      toast({
        title: "Erro",
        description: "Link de invite inválido ou expirado.",
        variant: "destructive",
      });
      navigate('/login'); // Redireciona para o login
      return;
    }
    
    // Se o email do convite estiver disponível, preencha automaticamente
    if (inviteEmail) {
      setEmail(decodeURIComponent(inviteEmail));
    }
  }, [inviteToken, type, inviteEmail, navigate, toast]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Verificamos se o email está preenchido e corresponde ao do convite (se disponível)
      if (inviteEmail && inviteEmail !== email) {
        throw new Error('O email inserido não corresponde ao email do convite.');
      }

      // 2. Tentamos criar a conta com o email e senha
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // 3. Depois do cadastro bem-sucedido, recuperamos o token de acesso
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (session?.access_token) {
        // 4. Utilizamos o token para verificar o convite (opcional, dependendo da sua lógica de negócio)
        // Esta parte pode variar dependendo de como você implementou o sistema de convites
        // Pode ser necessário uma chamada à sua API personalizada ou a uma função RPC do Supabase
        
        toast({
          title: "Cadastro realizado com sucesso",
          description: "Bem-vindo!",
        });
        
        navigate('/'); // Redireciona para a página inicial após o cadastro
      } else {
        throw new Error('Não foi possível completar o cadastro. Tente novamente.');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
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
                disabled={!!inviteEmail} // Desabilita o campo se o email vier no convite
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