import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function PendingPage() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card shadow-sm p-8 text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center">
          <Clock className="w-8 h-8 text-warning" />
        </div>
        <h1 className="font-display font-bold text-xl text-foreground">Acesso em análise</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sua solicitação foi recebida e está sendo analisada pelo administrador. Você receberá acesso em breve.
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
