import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function BlockedPage() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card shadow-sm p-8 text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="font-display font-bold text-xl text-foreground">Acesso bloqueado</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Seu acesso foi negado. Entre em contato com o administrador para mais informações.
        </p>
        <button
          onClick={signOut}
          className="w-full h-10 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-accent transition-fast"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
