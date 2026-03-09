import { FileX, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: typeof FileX;
}

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon = FileX }: EmptyStateProps) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center animate-slide-in">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground font-data">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="gap-2 mt-2">
            <Plus className="w-4 h-4" /> {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
