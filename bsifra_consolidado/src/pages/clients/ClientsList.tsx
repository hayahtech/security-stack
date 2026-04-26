import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ClientWithProjects = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  projects: { id: string }[];
};

const ClientsList = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientWithProjects[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("clients")
      .select("id, name, email, phone, company, projects(id)")
      .eq("user_id", user.id)
      .order("name");
    setClients((data ?? []) as ClientWithProjects[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = async (client: ClientWithProjects) => {
    if (client.projects && client.projects.length > 0) {
      toast({ title: "Não é possível excluir", description: "Este cliente possui projetos vinculados.", variant: "destructive" });
      return;
    }
    if (!confirm("Excluir este cliente?")) return;
    await supabase.from("clients").delete().eq("id", client.id).eq("user_id", user!.id);
    toast({ title: "Cliente excluído" });
    fetchClients();
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
        <Button asChild>
          <Link to="/clients/new"><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Link>
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email ?? "—"}</TableCell>
                    <TableCell>{client.phone ?? "—"}</TableCell>
                    <TableCell>{client.company ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link to={`/clients/${client.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(client)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsList;
