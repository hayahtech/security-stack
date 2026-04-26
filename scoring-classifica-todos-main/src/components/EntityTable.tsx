import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LevelBadge } from "@/components/LevelBadge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, ClipboardCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EvaluationModal } from "@/components/EvaluationModal";
import { type EntityType } from "@/lib/scoring";

export interface EntityRow {
  id: string;
  name: string;
  type: string;
  current_score: number | null;
  created_at: string;
}

interface EntityTableProps {
  entities: EntityRow[];
  onEdit?: (entity: EntityRow) => void;
  onDelete?: (entity: EntityRow) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function EntityTable({ entities, onEdit, onDelete, onRefresh, loading }: EntityTableProps) {
  const navigate = useNavigate();
  const [evalEntity, setEvalEntity] = useState<EntityRow | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading entities...
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No entities found. Add one to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.map((entity) => (
              <TableRow key={entity.id} className="cursor-pointer" onClick={() => navigate(`/entity/${entity.id}`)}>
                <TableCell className="font-medium">{entity.name}</TableCell>
                <TableCell>{entity.current_score !== null ? Math.round(entity.current_score) : "—"}</TableCell>
                <TableCell>
                  {entity.current_score !== null ? (
                    <LevelBadge score={entity.current_score} size="sm" />
                  ) : (
                    <span className="text-muted-foreground text-sm">Not rated</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(entity.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" title="Evaluate" onClick={() => setEvalEntity(entity)}>
                      <ClipboardCheck className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/entity/${entity.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onEdit && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(entity)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(entity)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {evalEntity && (
        <EvaluationModal
          open={!!evalEntity}
          onOpenChange={(open) => !open && setEvalEntity(null)}
          entityId={evalEntity.id}
          entityName={evalEntity.name}
          entityType={evalEntity.type as EntityType}
          previousScore={evalEntity.current_score}
          onSaved={() => {
            setEvalEntity(null);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
