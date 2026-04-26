import { useScope } from '@/contexts/ScopeContext';
import { Switch } from '@/components/ui/switch';
import { Building2, User } from 'lucide-react';

export function ScopeToggle() {
  const { scope, toggleScope } = useScope();

  return (
    <div className="flex items-center gap-2">
      <Building2 className={`h-4 w-4 transition-colors ${scope === 'business' ? 'text-primary' : 'text-muted-foreground'}`} />
      <Switch
        checked={scope === 'personal'}
        onCheckedChange={toggleScope}
        className="data-[state=checked]:bg-accent"
      />
      <User className={`h-4 w-4 transition-colors ${scope === 'personal' ? 'text-accent' : 'text-muted-foreground'}`} />
      <span className="text-sm font-medium hidden sm:inline">
        {scope === 'business' ? 'Negócio' : 'Pessoal'}
      </span>
    </div>
  );
}
