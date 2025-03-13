import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

const InviteSignUp = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Verifica se há um token no hash da URL
    const urlParams = new URLSearchParams(window.location.hash.substring(1)); // Remove o #
    const refreshToken = urlParams.get('refresh_token');

    if (!refreshToken) {
      toast({
        title: "Erro",
        description: "Token de convite inválido ou ausente",
        variant: "destructive",
      });
      navigate('/login'); // Redireciona para o login se não houver token
    }
  }, [navigate, toast]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Passo 1: Extrai o refresh_token do hash da URL
      const urlParams = new URLSearchParams(window.location.hash.substring(1)); // Remove o #
      const refreshToken = urlParams.get('refresh_token');

      if (!refreshToken) {
        throw new Error("Token de convite inválido ou ausente");
      }

      // Passo 2: Renova a sessão usando o refresh_token
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (sessionError) throw sessionError;

      // Passo 3: Define a nova senha do usuário
      const { data: userData, error: userError } = await supabase.auth.updateUser({
        password: password,
      });

      if (userError) throw userError;

      toast({
        title: "Senha definida com sucesso",
        description: "Agora você pode fazer login com sua nova senha",
      });

      // Redireciona para a página de login após definir a senha
      navigate('/login');
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
          <h1 className="font-display text-2xl font-bold text-center" style={{ color: 'var(--text)' }}>
            Finalizar Cadastro
          </h1>
          <p className="text-center" style={{ color: 'var(--text)' }}>
            Defina sua senha para concluir o cadastro
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Nova Senha
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
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Confirme a Nova Senha
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Finalizando cadastro..." : "Finalizar Cadastro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteSignUp;