import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const statusColors: Record<string, { label: string; style: string; icon: typeof CheckCircle }> = {
  autorizada: { label: 'AUTORIZADA', style: 'bg-success/10 text-success border-success/30', icon: CheckCircle },
  cancelada: { label: 'CANCELADA', style: 'bg-destructive/10 text-destructive border-destructive/30', icon: XCircle },
  nao_encontrada: { label: 'NÃO ENCONTRADA', style: 'bg-warning/10 text-warning border-warning/30', icon: AlertTriangle },
};

const NfePage = () => {
  const [accessKey, setAccessKey] = useState('');
  const [result, setResult] = useState<null | {
    key: string; issuer: string; recipient: string; value: string; items: number; date: string; status: string;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [blindMode, setBlindMode] = useState(false);

  const handleConsult = () => {
    if (accessKey.length < 10) return;
    setLoading(true);
    setTimeout(() => {
      setResult({
        key: accessKey.padEnd(44, '0').substring(0, 44),
        issuer: 'Indústria Paulista LTDA',
        recipient: 'Empresa Demo S/A',
        value: 'R$ 45.230,00',
        items: 150,
        date: '15/03/2026',
        status: 'autorizada',
      });
      setLoading(false);
    }, 300);
  };

  const statusInfo = result ? statusColors[result.status] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Barreira Fiscal / Controle de NF-e</h2>
        <p className="text-xs text-muted-foreground">Consulta e validação de Notas Fiscais eletrônicas</p>
      </div>

      {/* Input */}
      <div className="rounded-lg border border-border bg-card p-4 card-shadow">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Chave de Acesso NF-e (44 dígitos)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={accessKey}
            onChange={e => setAccessKey(e.target.value)}
            maxLength={44}
            placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
            className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleConsult}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-ros hover:brightness-110 disabled:opacity-50"
          >
            <Search className="h-3.5 w-3.5" />
            Consultar
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={blindMode}
              onChange={e => setBlindMode(e.target.checked)}
              className="rounded border-border"
            />
            Modo Entrada Cega (Blind Receiving)
          </label>
        </div>
      </div>

      {/* Result */}
      {result && statusInfo && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg border ${statusInfo.style} p-4 card-shadow`}
        >
          <div className="flex items-center gap-2 mb-3">
            <statusInfo.icon className="h-5 w-5" />
            <span className="text-sm font-bold">{statusInfo.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Chave:</span>
              <p className="font-mono text-foreground break-all">{result.key}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Emitente:</span>
              <p className="text-foreground">{result.issuer}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Destinatário:</span>
              <p className="text-foreground">{result.recipient}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Valor Total:</span>
              <p className="font-mono font-semibold text-foreground">{result.value}</p>
            </div>
            {!blindMode && (
              <div>
                <span className="text-muted-foreground">Qtd. Itens:</span>
                <p className="font-mono text-foreground">{result.items}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Data Emissão:</span>
              <p className="font-mono text-foreground">{result.date}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="rounded-md bg-success px-4 py-2 text-xs font-semibold text-success-foreground transition-ros hover:brightness-110">
              Autorizar Entrada
            </button>
            <button className="rounded-md bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground transition-ros hover:brightness-110">
              Barrar Entrada
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NfePage;
