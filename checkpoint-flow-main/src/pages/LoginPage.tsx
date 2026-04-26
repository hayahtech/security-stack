import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, HardHat, Shield, Eye, Loader2, Mail, EyeOff } from 'lucide-react';
import { useAuth, type ProfileRole } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import loginBg from '@/assets/login-bg.jpg';
import { z } from 'zod';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail obrigatório')
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha muito longa'),
});

const ROLES: { value: ProfileRole; label: string; icon: typeof HardHat }[] = [
  { value: 'operacional', label: 'Operacional', icon: HardHat },
  { value: 'supervisor', label: 'Supervisor', icon: Shield },
  { value: 'inspector', label: 'Inspetor', icon: Eye },
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function LoginPage() {
  const { signIn, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ProfileRole>('operacional');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      result.error.errors.forEach(err => toast.error(err.message));
      return;
    }
    setBusy(true);
    const { error } = await signIn(result.data.email, result.data.password);
    if (error) {
      toast.error(error);
      setBusy(false);
      return;
    }
    setTimeout(() => { setBusy(false); }, 1000);
  };


  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Full-screen background */}
      <motion.img
        src={loginBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_8px_60px_rgba(0,0,0,0.4)] p-8 md:p-10"
      >
        {/* Logo */}
        <motion.div className="flex flex-col items-center gap-2 mb-6" {...fadeUp(0.1)}>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <ClipboardCheck className="w-7 h-7 text-cyan-300" />
          </div>
          <h1 className="font-display font-bold text-lg text-white tracking-widest">
            CHECKPOINT FLOW
          </h1>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector */}
          <motion.div {...fadeUp(0.2)}>
            <label className="text-xs font-medium text-white/60 mb-2 block">Perfil de acesso</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRole(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all duration-200',
                    selectedRole === value
                      ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                      : 'border-white/10 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20 hover:bg-white/10'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Divider */}
          <motion.div className="flex items-center gap-3" {...fadeUp(0.25)}>
            <div className="flex-1 h-px bg-white/10" />
          </motion.div>

          {/* Email */}
          <motion.div {...fadeUp(0.3)}>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Your Email</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="email@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm pl-4 pr-11 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 transition-all"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div {...fadeUp(0.35)}>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Your Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-12 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm pl-4 pr-11 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          {/* Remember & Forgot */}
          <motion.div className="flex items-center justify-between" {...fadeUp(0.4)}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-cyan-400" />
              <span className="text-xs text-white/50">Remember</span>
            </label>
            <button type="button" className="text-xs text-white/50 hover:text-cyan-300 transition-colors">
              Forgotten?
            </button>
          </motion.div>

          {/* Login button */}
          <motion.div {...fadeUp(0.45)}>
            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-black text-sm font-bold hover:from-cyan-300 hover:to-cyan-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(34,211,238,0.3)]"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Log In
            </button>
          </motion.div>

          {/* Divider text */}
          <motion.p className="text-center text-xs text-white/40" {...fadeUp(0.5)}>
            Don't have an account?
          </motion.p>

          {/* Sign Up link */}
          <motion.div {...fadeUp(0.55)}>
            <Link
              to="/register"
              className="block w-full h-12 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all flex items-center justify-center"
            >
              Sign Up
            </Link>
          </motion.div>
        </form>

        {/* Footer */}
        <motion.p
          className="text-center text-[10px] text-white/25 mt-6"
          {...fadeUp(0.6)}
        >
          Acesso restrito a colaboradores autorizados
        </motion.p>
      </motion.div>
    </div>
  );
}
