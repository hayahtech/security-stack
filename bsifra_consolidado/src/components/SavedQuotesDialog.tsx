import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { History, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getDbErrorMessage } from "@/lib/utils";

interface SavedQuote {
  id: string;
  client_name: string;
  client_document: string | null;
  suggested_price: number;
  created_at: string;
  hourly_rate: number;
  hours: number;
  complexity_label: string;
  margin_percent: number;
  extra_costs: number;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SavedQuotesDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuotes = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("saved_quotes")
      .select("id, client_name, client_document, suggested_price, created_at, hourly_rate, hours, complexity_label, margin_percent, extra_costs")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (data) setQuotes(data);
  };

  useEffect(() => {
    if (open) fetchQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_quotes").delete().eq("id", id).eq("user_id", user!.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: getDbErrorMessage(error), variant: "destructive" });
    } else {
      setQuotes(quotes.filter(q => q.id !== id));
      toast({ title: "Orçamento excluído" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Orçamentos Salvos</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : quotes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum orçamento salvo ainda.</p>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{q.client_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(q.created_at).toLocaleDateString("pt-BR")} • {q.hours}h • {q.complexity_label} • Margem {q.margin_percent}%
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-lg font-bold text-primary whitespace-nowrap">R$ {fmt(q.suggested_price)}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SavedQuotesDialog;
