import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dice5, AlertTriangle } from 'lucide-react';

const SorteioPage = () => {
  const [percentage, setPercentage] = useState(15);
  const [showResult, setShowResult] = useState(false);
  const [sorted, setSorted] = useState(false);

  const simulateDraw = () => {
    const result = Math.random() * 100 < percentage;
    setSorted(result);
    setShowResult(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Sorteio de Revista</h2>
        <p className="text-xs text-muted-foreground">Configuração e execução de sorteios aleatórios</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 card-shadow">
        <label className="block text-xs font-medium text-muted-foreground mb-2">
          Percentual de Sorteio: <span className="font-mono text-foreground">{percentage}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={percentage}
          onChange={e => setPercentage(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>

      <button
        onClick={simulateDraw}
        className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-ros hover:brightness-110"
      >
        <Dice5 className="h-4 w-4" />
        Simular Sorteio de Saída
      </button>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-lg border p-8 text-center card-shadow ${
            sorted
              ? 'border-destructive/50 bg-destructive/10'
              : 'border-success/50 bg-success/10'
          }`}
        >
          {sorted ? (
            <>
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive animate-pulse" />
              <h3 className="mt-4 text-xl font-bold text-destructive">REVISTA OBRIGATÓRIA</h3>
              <p className="mt-2 text-sm text-foreground">João da Silva — Crachá #042</p>
              <button
                onClick={() => setShowResult(false)}
                className="mt-4 rounded-md bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground transition-ros"
              >
                Confirmar Conclusão
              </button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-success">Liberado</h3>
              <p className="mt-1 text-sm text-muted-foreground">Não sorteado para revista.</p>
              <button
                onClick={() => setShowResult(false)}
                className="mt-4 rounded-md bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground transition-ros"
              >
                OK
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SorteioPage;
