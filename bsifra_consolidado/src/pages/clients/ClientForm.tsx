import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { getDbErrorMessage } from "@/lib/utils";

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  email: z.union([z.string().email("Email inválido").max(255), z.literal("")]),
  phone: z.string().max(20, "Telefone muito longo"),
  company: z.string().max(255, "Nome de empresa muito longo"),
  notes: z.string().max(2000, "Observações muito longas"),
});

type FormErrors = Partial<Record<keyof z.infer<typeof clientSchema>, string>>;

const ClientForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });

  useEffect(() => {
    if (isEditing && user) {
      supabase.from("clients").select("*").eq("id", id).single().then(({ data }) => {
        if (data) setForm({ name: data.name, email: data.email ?? "", phone: data.phone ?? "", company: data.company ?? "", notes: data.notes ?? "" });
      });
    }
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const result = clientSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const payload = { ...result.data, user_id: user.id };

    const { error } = isEditing
      ? await supabase.from("clients").update(payload).eq("id", id)
      : await supabase.from("clients").insert(payload);

    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: getDbErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: isEditing ? "Cliente atualizado!" : "Cliente criado!" });
      navigate("/clients");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="default" onClick={() => navigate("/clients")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
              <Button type="button" variant="secondary" onClick={() => navigate("/clients")}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientForm;
