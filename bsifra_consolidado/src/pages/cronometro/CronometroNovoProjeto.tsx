import { useNavigate } from 'react-router-dom';
import { ProjectForm } from '@/cronometro/components/ProjectForm';
import { useProjects } from '@/cronometro/hooks/useProjects';

const CronometroNovoProjeto = () => {
  const navigate = useNavigate();
  const { save } = useProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Novo Projeto de Cronômetro</h1>
        <p className="text-muted-foreground">Crie um projeto para registrar tempo de trabalho</p>
      </div>
      <ProjectForm
        onSave={p => {
          save(p);
          navigate('/cronometro');
        }}
        onCancel={() => navigate('/cronometro')}
      />
    </div>
  );
};

export default CronometroNovoProjeto;
