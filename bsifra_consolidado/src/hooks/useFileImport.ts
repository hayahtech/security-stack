import { useRef } from "react";
import { toast } from "@/hooks/use-toast";

const ACCEPTED_EXTENSIONS = ".txt,.md,.doc,.docx,.rtf,.csv,.json,.xml,.yaml,.yml,.html,.htm,.js,.ts,.tsx,.jsx,.py,.sql,.sh,.bash,.php,.rb,.go,.rs,.css,.scss,.log";

export function useFileImport(onImport: (content: string, fileName: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerImport = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB.", variant: "destructive" });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    try {
      const text = await file.text();
      onImport(text, file.name);
      toast({ title: "Arquivo importado", description: file.name });
    } catch {
      toast({ title: "Erro ao ler arquivo", variant: "destructive" });
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  return { inputRef, triggerImport, handleFileChange, acceptedExtensions: ACCEPTED_EXTENSIONS };
}
