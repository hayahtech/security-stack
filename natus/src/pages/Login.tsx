import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { Loader2, Mail, Lock, Sprout, ArrowRight, Zap } from 'lucide-react';

/* ─── paleta extraída dos cards light ─────────────────────────
   Fundo   : #ffffff / #faf8f2 (creme)
   Ouro    : #C9950A (base) → #F0C040 (brilho) → #C9950A
   Verde   : #0d2b15 (escuro) / #1a5c2a (médio) / #2d8a45 (claro)
   Pontos  : rgba(0,0,0,0.055)
   Borda   : rgba(201,149,10,0.25)
──────────────────────────────────────────────────────────────── */

const GOLD = '#C9950A';
const GOLD_LIGHT = '#F0C040';
const GREEN_DARK = '#0d2b15';
const GREEN_MID = '#1a5c2a';
const GREEN_ACCENT = '#2d8a45';

// SVG pattern de pontos — igual ao top-left dos cards light
function DotPattern({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`absolute pointer-events-none ${className}`}
      width="160" height="160"
      aria-hidden="true"
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="rgba(0,0,0,0.055)" />
        </pattern>
      </defs>
      <rect width="160" height="160" fill="url(#dots)" />
    </svg>
  );
}

// Separador com fio dourado — igual ao das imagens
function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}60)` }} />
      <span
        className="text-[10px] font-bold tracking-[0.25em] uppercase px-1"
        style={{ color: GOLD }}
      >
        ou
      </span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${GOLD}60)` }} />
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signInWithEmail, signInWithMagicLink } = useAuth();
  const { completed: onboardingCompleted } = useOnboarding();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Insira seu e-mail'); return; }
    setLoading(true); setError(''); setSuccessMessage('');
    try {
      if (useMagicLink) {
        await signInWithMagicLink(email);
        setSuccessMessage('Link enviado! Verifique seu e-mail.');
        setEmail('');
      } else {
        if (!password) { setError('Insira sua senha'); setLoading(false); return; }
        const result = await signInWithEmail(email, password);
        if (!result?.error) navigate(onboardingCompleted ? '/' : '/onboarding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#faf8f2' }}
    >
      {/* ══════════════════════════════════════════
          PAINEL ESQUERDO — Decorativo (verde + geométrico)
          Replica o lado direito dos cards light, sem animais
      ══════════════════════════════════════════ */}
      <div
        className="hidden lg:flex relative flex-col justify-between overflow-hidden"
        style={{
          width: '44%',
          background: `linear-gradient(160deg, ${GREEN_DARK} 0%, ${GREEN_MID} 55%, ${GREEN_ACCENT} 100%)`,
        }}
      >
        {/* Fio dourado separador — igual às imagens de referência */}
        <div
          className="absolute inset-y-0 right-0 w-[4px] z-20"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${GOLD}90 12%, ${GOLD_LIGHT} 40%, ${GOLD_LIGHT} 60%, ${GOLD}90 88%, transparent 100%)`,
            boxShadow: `0 0 12px 2px ${GOLD}50`,
          }}
        />

        {/* Forma geométrica diagonal dourada no canto superior direito */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-20"
          style={{
            clipPath: 'polygon(100% 0%, 0% 0%, 100% 100%)',
            background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
          }}
        />

        {/* Forma geométrica grande verde claro no canto inferior esquerdo */}
        <div
          className="absolute bottom-0 left-0 w-64 h-64 opacity-15"
          style={{
            clipPath: 'polygon(0% 100%, 0% 30%, 70% 100%)',
            background: '#ffffff',
          }}
        />

        {/* Grade de linhas douradas sutil — evoca campos */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(${GOLD_LIGHT} 1px, transparent 1px),
              linear-gradient(90deg, ${GOLD_LIGHT} 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Círculos concêntricos — evoca o sol no campo */}
        <div className="absolute" style={{ bottom: '22%', right: '18%' }}>
          {[120, 90, 60, 32].map((size, i) => (
            <div
              key={size}
              className="absolute rounded-full border"
              style={{
                width: size,
                height: size,
                top: -size / 2,
                right: -size / 2,
                borderColor: `rgba(240,192,64,${0.08 + i * 0.06})`,
              }}
            />
          ))}
          <div
            className="w-8 h-8 rounded-full"
            style={{
              background: `radial-gradient(circle, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
              boxShadow: `0 0 40px ${GOLD}80`,
            }}
          />
        </div>

        {/* Linhas diagonais evocando horizonte */}
        <svg
          className="absolute bottom-0 left-0 right-0 opacity-20"
          viewBox="0 0 400 180"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 180 Q100 80 200 120 T400 60 L400 180Z" fill={GREEN_DARK} opacity="0.5" />
          <path d="M0 180 Q120 100 250 130 T400 90 L400 180Z" fill={GREEN_DARK} opacity="0.4" />
          {/* fio dourado de horizonte */}
          <path d="M0 140 Q100 80 200 110 T400 70" stroke={GOLD} strokeWidth="1.5" fill="none" opacity="0.5" />
        </svg>

        {/* Logo e tagline */}
        <div className="relative z-10 p-10 pt-14">
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base"
              style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 50%, ${GOLD} 100%)`,
                color: GREEN_DARK,
                boxShadow: `0 4px 20px ${GOLD}50`,
              }}
            >
              TG
            </div>
            <span
              className="text-lg font-bold tracking-wide"
              style={{
                background: `linear-gradient(90deg, ${GOLD_LIGHT}, #fff, ${GOLD_LIGHT})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Trato Gestão Rural
            </span>
          </div>

          <h1 className="text-3xl font-bold leading-snug text-white mb-3">
            Gestão completa<br />
            <span style={{ color: GOLD_LIGHT }}>da sua propriedade</span>
          </h1>
          <p className="text-sm text-white/60 leading-relaxed max-w-xs">
            Rebanho, finanças, estoque e muito mais — tudo em um só lugar.
          </p>
        </div>

        {/* Pilares — canto inferior */}
        <div className="relative z-10 p-10 pb-12 space-y-4">
          {[
            { icon: '🐄', text: 'Controle de rebanho e pesagens' },
            { icon: '💰', text: 'Fluxo de caixa e DRE rurais' },
            { icon: '📦', text: 'Estoque, máquinas e insumos' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{ background: 'rgba(255,255,255,0.1)', border: `1px solid ${GOLD}40` }}
              >
                {item.icon}
              </span>
              <span className="text-sm text-white/70">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PAINEL DIREITO — Formulário (branco, card light)
      ══════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-6 py-10">
        {/* Padrão de pontos topo-esquerdo — igual aos cards light */}
        <DotPattern className="top-0 left-0" />

        {/* Canto verde diagonal inferior-direito — igual aos cards light */}
        <div
          className="absolute bottom-0 right-0 w-48 h-48"
          style={{
            clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%)',
            background: `linear-gradient(135deg, ${GREEN_MID}, ${GREEN_DARK})`,
            opacity: 0.12,
          }}
        />
        {/* Fio dourado na diagonal do canto */}
        <div
          className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none"
          style={{
            clipPath: 'polygon(100% 0%, calc(100% - 2px) 0%, calc(0% + 2px) 100%, 0% 100%)',
            background: `linear-gradient(135deg, ${GOLD}80, ${GOLD_LIGHT}60)`,
            opacity: 0.5,
          }}
        />

        {/* Card de login */}
        <div className="relative w-full max-w-sm z-10">

          {/* Cabeçalho */}
          <div className="mb-8 text-center">
            {/* Logo mobile (visível apenas em telas pequenas) */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{
                  background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
                  color: GREEN_DARK,
                }}
              >
                TG
              </div>
              <span className="font-bold text-base" style={{ color: GOLD }}>Trato Gestão Rural</span>
            </div>

            {/* Ícone decorativo */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN_MID})`,
                boxShadow: `0 8px 24px ${GREEN_DARK}30`,
              }}
            >
              <Sprout className="h-7 w-7" style={{ color: GOLD_LIGHT }} />
            </div>

            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: '#1a1a1a' }}
            >
              Bem-vindo de volta
            </h2>
            <p className="text-sm" style={{ color: '#7a7a7a' }}>
              {useMagicLink ? 'Receba um link de acesso por e-mail' : 'Entre na sua conta'}
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo e-mail */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-[0.15em]"
                style={{ color: GOLD }}
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: `${GOLD}80` }}
                />
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: '#f5f3ec',
                    border: `1.5px solid ${error ? '#dc2626' : 'rgba(201,149,10,0.2)'}`,
                    color: '#1a1a1a',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GOLD; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#dc2626' : 'rgba(201,149,10,0.2)'; }}
                />
              </div>
            </div>

            {/* Campo senha */}
            {!useMagicLink && (
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-[0.15em]"
                  style={{ color: GOLD }}
                >
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: `${GOLD}80` }}
                  />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: '#f5f3ec',
                      border: `1.5px solid ${error ? '#dc2626' : 'rgba(201,149,10,0.2)'}`,
                      color: '#1a1a1a',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = GOLD; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#dc2626' : 'rgba(201,149,10,0.2)'; }}
                  />
                </div>
              </div>
            )}

            {/* Mensagens */}
            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#dc2626' }}
              >
                <span className="shrink-0">⚠</span> {error}
              </div>
            )}
            {successMessage && (
              <div
                className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#16a34a' }}
              >
                <span className="shrink-0">✓</span> {successMessage}
              </div>
            )}

            {/* Botão principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading
                  ? 'rgba(201,149,10,0.6)'
                  : `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 50%, ${GOLD} 100%)`,
                color: GREEN_DARK,
                boxShadow: loading ? 'none' : `0 4px 20px ${GOLD}40`,
                backgroundSize: '200% 100%',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</>
                : useMagicLink
                  ? <><Zap className="h-4 w-4" /> Enviar link de acesso</>
                  : <><ArrowRight className="h-4 w-4" /> Entrar</>
              }
            </button>
          </form>

          {/* Divisor dourado */}
          <GoldDivider />

          {/* Toggle magic link / senha */}
          <button
            type="button"
            onClick={() => { setUseMagicLink(!useMagicLink); setError(''); setPassword(''); }}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'transparent',
              border: `1.5px solid rgba(201,149,10,0.3)`,
              color: GOLD,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,149,10,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {useMagicLink ? '🔑 Prefiro usar senha' : '✉ Entrar sem senha (magic link)'}
          </button>

          {/* Rodapé */}
          <p className="mt-6 text-center text-xs" style={{ color: '#aaa' }}>
            Ao entrar você concorda com nossa{' '}
            <Link to="/privacidade" className="underline" style={{ color: GOLD }}>
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
