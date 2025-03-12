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
    
    if (!inviteToken) {
      toast({
        title: "Erro",
        description: "Token de convite não encontrado.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Usando o método específico para convites do Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: inviteToken, // Usa o token como a senha temporária
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          // Se o token não é uma senha válida, pode ser apenas um token de convite
          // Tente definir a senha usando o token
          const { data: userData, error: updateError } = await supabase.auth.updateUser({
            password: password
          });

          if (updateError) {
            throw updateError;
          }

          toast({
            title: "Cadastro realizado com sucesso",
            description: "Bem-vindo!",
          });

          navigate('/');
          return;
        }
        
        throw error;
      }

      // Se conseguiu fazer login com o token, agora atualize a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      toast({
        title: "Cadastro realizado com sucesso",
        description: "Bem-vindo!",
      });

      navigate('/');
    } catch (error: any) {
      console.error("Erro ao processar convite:", error);
      
      // Tente uma abordagem alternativa: usar o token diretamente
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        
        if (!resetError) {
          // Use updateUser com o token
          const { error: tokenError } = await supabase.auth.verifyOtp({
            email,
            token: inviteToken,
            type: 'recovery'
          });
          
          if (!tokenError) {
            // Defina a senha
            const { error: pwError } = await supabase.auth.updateUser({
              password: password
            });
            
            if (!pwError) {
              toast({
                title: "Cadastro realizado com sucesso",
                description: "Bem-vindo!",
              });
              
              navigate('/');
              return;
            }
          }
        }
      } catch (altError) {
        console.error("Erro na abordagem alternativa:", altError);
      }
      
      // Se chegou aqui, todas as tentativas falharam
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao processar o convite. Tente novamente ou entre em contato com o suporte.",
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