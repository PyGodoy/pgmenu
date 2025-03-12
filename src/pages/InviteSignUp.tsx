import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

const InviteSignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Captura o token da URL
  const inviteToken = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!inviteToken) {
        toast({
          title: "Erro",
          description: "Link de invite inválido ou expirado.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      try {
        // Verifica se o token é válido
        const { data, error } = await supabase.auth.getUser(inviteToken);

        if (error || !data) {
          throw new Error('Link de invite inválido ou expirado.');
        }

        // Define o email associado ao token
        setEmail(data.user?.email || '');
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
        navigate('/login');
      }
    };

    validateToken();
  }, [inviteToken, navigate, toast]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Valida o token novamente antes de cadastrar
      const { data: tokenData, error: tokenError } = await supabase.auth.getUser(inviteToken!);

      if (tokenError || !tokenData) {
        throw new Error('Link de invite inválido ou expirado.');
      }

      // Verifica se o email do token corresponde ao email inserido
      if (tokenData.user?.email !== email) {
        throw new Error('O email inserido não corresponde ao email do convite.');
      }

      // Cria a conta do usuário
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Cadastro realizado com sucesso",
        description: "Bem-vindo!",
      });

      navigate('/'); // Redireciona para a página inicial após o cadastro
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
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSignUp}>
        <h1>Cadastre-se</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </div>
  );
};

export default InviteSignUp;