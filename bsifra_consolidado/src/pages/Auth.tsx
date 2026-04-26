import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import hayahLogo from "@/assets/hayah-logo.jpeg";

// Máximo de tentativas antes de bloquear temporariamente
const MAX_ATTEMPTS = 5;
// Duração inicial do bloqueio em ms (aumenta exponencialmente)
const BASE_LOCKOUT_MS = 30_000;

// Mapeia erros internos do Supabase para mensagens seguras ao usuário
function getAuthErrorMessage(error: { message?: string }): string {
  const msg = error.message?.toLowerCase() ?? "";
  if (msg.includes("invalid login credentials") || msg.includes("invalid password")) {
    return "Email ou senha incorretos.";
  }
  if (msg.includes("email not confirmed")) {
    return "Confirme seu email antes de entrar.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "Este email já está cadastrado.";
  }
  if (msg.includes("password should be at least")) {
    return "A senha deve ter no mínimo 12 caracteres.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Muitas tentativas. Aguarde alguns minutos.";
  }
  // Nunca expor mensagem interna em produção
  return "Ocorreu um erro. Tente novamente.";
}

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const navigate = useNavigate();

  const getRemainingLockoutSeconds = () => {
    if (!lockoutUntil) return 0;
    return Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
  };

  const isLockedOut = () => lockoutUntil !== null && Date.now() < lockoutUntil;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedOut()) {
      toast({
        title: "Acesso temporariamente bloqueado",
        description: `Muitas tentativas incorretas. Tente novamente em ${getRemainingLockoutSeconds()}s.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Login bem-sucedido: resetar contadores
        setFailedAttempts(0);
        setLockoutUntil(null);
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar a conta.",
        });
      }
    } catch (error: unknown) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      // Aplicar bloqueio exponencial após MAX_ATTEMPTS falhas
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockoutMs = BASE_LOCKOUT_MS * Math.pow(2, newAttempts - MAX_ATTEMPTS);
        setLockoutUntil(Date.now() + lockoutMs);
      }

      toast({
        title: "Erro de autenticação",
        description: getAuthErrorMessage(error as { message?: string }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const lockoutSeconds = getRemainingLockoutSeconds();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <img src={hayahLogo} alt="HayaH" className="mx-auto mb-6 h-48 w-48 rounded-2xl object-cover glow-cyan" />
          {!isLogin && (
            <CardTitle className="text-2xl font-bold text-foreground">Criar Conta</CardTitle>
          )}
          {!isLogin && (
            <CardDescription>Comece a gerenciar seus projetos</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  Mínimo 12 caracteres.
                </p>
              )}
            </div>
            {isLockedOut() && (
              <p className="text-sm text-destructive text-center">
                Conta bloqueada temporariamente. Aguarde {lockoutSeconds}s.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading || isLockedOut()}>
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => { setIsLogin(!isLogin); setFailedAttempts(0); setLockoutUntil(null); }}
            >
              {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
