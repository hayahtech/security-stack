import { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  icon: LucideIcon;
  description?: string;
}

export function PlaceholderPage({ title, icon: Icon, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-2xl bg-primary/10 p-6">
        <Icon className="h-12 w-12 text-primary" />
      </div>
      <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground">{description ?? "Em breve..."}</p>
    </div>
  );
}
