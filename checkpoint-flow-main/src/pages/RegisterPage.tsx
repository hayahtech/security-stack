import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardCheck, HardHat, Shield, Eye, Loader2 } from 'lucide-react';
import { useAuth, type ProfileRole } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { z } from 'zod';

// Roles privilegiadas exigem senha mais forte: mínimo 12 chars + caractere especial.
// Operacional mantém requisitos básicos (8 chars).
function buildRegisterSchema(role: ProfileRole) {
  const isPrivileged = role === 'inspector' || role === 'supervisor';
  const minLen = isPrivileged ? 12 : 8;
  const minMsg = isPrivileged
    ? 'Inspetores e supervisores precisam de senha com pelo menos 12 caracteres'
    : 'Senha deve ter pelo menos 8 caracteres';

  return z
    .object({
      fullName: z
        .string()
        .min(3, 'Nome deve ter pelo menos 3 caracteres')
        .max(100, 'Nome muito longo')
        .regex(/^[\p{L}\s'-]+$/u, 'Nome contém caracteres inválidos'),
      email: z
        .string()
        .min(1, 'E-mail obrigatório')
        .email('E-mail inválido')
        .max(254, 'E-mail muito longo'),
      password: z
        .string()
        .min(minLen, minMsg)
        .max(128, 'Senha muito longa')
        .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
        .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
        .refine(
          p => !isPrivileged || /[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(p),
          'Inspetores e supervisores precisam de pelo menos um caractere especial (!@#$...)',
        ),
      confirmPassword: z.string(),
    })
    .refine(d => d.password === d.confirmPassword, {
      message: 'As senhas não coincidem',
      path: ['confirmPassword'],
    });
}

const ROLES: { value: ProfileRole; label: string; icon: typeof HardHat }[] = [
  { value: 'operacional', label: 'Operacional', icon: HardHat },
  { value: 'supervisor', label: 'Supervisor', icon: Shield },
  { value: 'inspector', label: 'Inspetor', icon: Eye },
];

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProfileRole>('operacional');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = buildRegisterSchema(selectedRole).safeParse({ fullName, email, password, confirmPassword });
    if (!result.success) {
      result.error.errors.forEach(err => toast.error(err.message));
      return;
    }
    setBusy(true);
    const { error } = await signUp(result.data.email, result.data.password, result.data.fullName, selectedRole);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Solicitação enviada! Aguarde a aprovação do administrador.');
    navigate('/pending', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card shadow-sm">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10">
              <ClipboardCheck className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="font-display font-bold text-xl text-foreground">Criar conta</h1>
              <p className="text-xs text-muted-foreground mt-1">Preencha os dados abaixo para solicitar acesso</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome completo</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">E-mail corporativo</label>
              <input
                type="email"
                required
                placeholder="seu@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {selectedRole === 'operacional'
                  ? 'Senha (mínimo 8 caracteres)'
                  : 'Senha (mínimo 12 caracteres + caractere especial)'}
              </label>
              <input
                type="password"
                required
                minLength={selectedRole === 'operacional' ? 8 : 12}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Confirm password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirmar senha</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Perfil solicitado</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedRole(value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-fast',
                      selectedRole === value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-fast disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Solicitar acesso
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-xs text-primary hover:underline">
              Já tenho conta — fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
