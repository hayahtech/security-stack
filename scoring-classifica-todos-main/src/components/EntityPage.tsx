import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { EntityTable, type EntityRow } from "@/components/EntityTable";
import { EntityForm } from "@/components/EntityForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EntityType } from "@/lib/scoring";

interface EntityPageProps {
  type: EntityType;
  title: string;
}

export function EntityPage({ type, title }: EntityPageProps) {
  const [entities, setEntities] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editEntity, setEditEntity] = useState<EntityRow | null>(null);

  const fetchEntities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("indi_entities")
      .select("*")
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load entities");
    } else {
      setEntities(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntities();
  }, [type]);

  const handleAdd = async (name: string) => {
    const { error } = await supabase.from("indi_entities").insert({ name, type });
    if (error) toast.error("Failed to add entity");
    else { toast.success(`${name} added`); fetchEntities(); }
  };

  const handleEdit = async (name: string) => {
    if (!editEntity) return;
    const { error } = await supabase.from("indi_entities").update({ name }).eq("id", editEntity.id);
    if (error) toast.error("Failed to update");
    else { toast.success("Updated"); setEditEntity(null); fetchEntities(); }
  };

  const handleDelete = async (entity: EntityRow) => {
    const { error } = await supabase.from("indi_entities").delete().eq("id", entity.id);
    if (error) toast.error("Failed to delete");
    else { toast.success(`${entity.name} deleted`); fetchEntities(); }
  };

  return (
    <AppLayout title={title}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Manage your {title.toLowerCase()} and their evaluations.</p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        </div>

        <EntityTable
          entities={entities}
          loading={loading}
          onEdit={(e) => setEditEntity(e)}
          onDelete={handleDelete}
          onRefresh={fetchEntities}
        />

        <EntityForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleAdd}
          title={`Add ${type.charAt(0).toUpperCase() + type.slice(1)}`} />

        {editEntity && (
          <EntityForm open={!!editEntity} onOpenChange={(open) => !open && setEditEntity(null)}
            onSubmit={handleEdit} initialName={editEntity.name} title="Edit Entity" />
        )}
      </div>
    </AppLayout>
  );
}
