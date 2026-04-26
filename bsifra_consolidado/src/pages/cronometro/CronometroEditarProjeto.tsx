import { useParams, useNavigate } from 'react-router-dom';
import { ProjectForm } from '@/cronometro/components/ProjectForm';
import { useProjects } from '@/cronometro/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const CronometroEditarProjeto = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projetos, save, remove } = useProjects();
  const projeto = projetos.find(p => p.id === id);

  if (!projeto) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Projeto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar: {projeto.nome}</h1>
          <p className="text-muted-foreground">Atualize as informações do projeto</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm('Excluir este projeto e todas as suas sessões de tempo?')) {
              remove(projeto.id);
              navigate('/cronometro');
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
        </Button>
      </div>
      <ProjectForm
        initial={projeto}
        onSave={p => {
          save(p);
          navigate('/cronometro');
        }}
        onCancel={() => navigate('/cronometro')}
      />
    </div>
  );
};

export default CronometroEditarProjeto;
