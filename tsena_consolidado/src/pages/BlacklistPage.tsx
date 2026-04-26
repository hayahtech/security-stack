import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldBan, Plus, Trash2 } from 'lucide-react';
import NewBlacklistModal from '@/components/NewBlacklistModal';

const mockBlacklist = [
  { id: '1', name: 'José Almeida', cpf: '111.222.333-44', reason: 'Furto em área restrita', addedBy: 'Admin', date: '2024-01-15' },
  { id: '2', name: 'Marcos Souza', cpf: '555.666.777-88', reason: 'Agressão a funcionário', addedBy: 'Segurança', date: '2024-03-22' },
  { id: '3', name: 'Luciana Ferreira', cpf: '999.000.111-22', reason: 'Documentação fraudulenta', addedBy: 'Admin', date: '2024-06-10' },
];

const BlacklistPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Blacklist</h2>
        <p className="text-xs text-muted-foreground">{mockBlacklist.length} pessoas bloqueadas</p>
      </div>
      <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-md bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground transition-ros hover:brightness-110">
        <Plus className="h-3.5 w-3.5" />
        Adicionar à Blacklist
      </button>
    </div>

    <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-4 py-2.5 font-medium text-muted-foreground">Nome</th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">CPF</th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">Motivo</th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">Incluído por</th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">Data</th>
            <th className="px-4 py-2.5 font-medium text-muted-foreground">Ações</th>
          </tr>
        </thead>
        <tbody>
          {mockBlacklist.map((b, i) => (
            <motion.tr
              key={b.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-border/50 transition-ros hover:bg-secondary/50"
            >
              <td className="px-4 py-2.5 font-medium text-foreground">{b.name}</td>
              <td className="px-4 py-2.5 font-mono text-muted-foreground">{b.cpf}</td>
              <td className="px-4 py-2.5 text-destructive">{b.reason}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{b.addedBy}</td>
              <td className="px-4 py-2.5 font-mono text-muted-foreground">{b.date}</td>
              <td className="px-4 py-2.5">
                <button className="rounded p-1 text-destructive transition-ros hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
    <NewBlacklistModal open={modalOpen} onOpenChange={setModalOpen} />
  </div>
  );
};

export default BlacklistPage;
