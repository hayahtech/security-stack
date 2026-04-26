import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const LAST_UPDATED = "24 de abril de 2026";
const CONTROLLER_NAME = "Hayah Tech Systems";
const CONTROLLER_EMAIL = "privacidade@hayahtech.com.br";

export default function PrivacidadePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 shrink-0">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Política de Privacidade</h1>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATED}</p>

        <Separator />

        {/* 1. Controlador */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">1. Controlador de Dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O controlador responsável pelo tratamento dos seus dados pessoais é <strong>{CONTROLLER_NAME}</strong>.
            Para exercer seus direitos ou tirar dúvidas, entre em contato pelo e-mail{" "}
            <a href={`mailto:${CONTROLLER_EMAIL}`} className="text-primary underline">{CONTROLLER_EMAIL}</a>.
          </p>
        </section>

        {/* 2. Dados coletados */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">2. Dados Pessoais Coletados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Coletamos os seguintes dados para viabilizar o funcionamento do sistema:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong>Identificação:</strong> nome completo, apelido, CPF ou CNPJ, telefone</li>
            <li><strong>Localização:</strong> estado, município e coordenadas geográficas da propriedade</li>
            <li><strong>Dados rurais:</strong> NIRF, Inscrição Estadual, tamanho de rebanho, tipo de atividade</li>
            <li><strong>Dados financeiros:</strong> contas bancárias, transações, orçamentos e projeções</li>
            <li><strong>Dados zootécnicos:</strong> pesagens, tratamentos, reprodução, produção de leite e EIDs de animais</li>
            <li><strong>Dados de dispositivos:</strong> leitores RFID, balanças e sensores conectados</li>
          </ul>
        </section>

        {/* 3. Finalidade */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">3. Finalidade do Tratamento</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Prestar os serviços de gestão agropecuária e financeira contratados (base legal: execução de contrato — art. 7º, V, LGPD)</li>
            <li>Cumprir obrigações legais (art. 7º, II, LGPD)</li>
            <li>Comunicar atualizações e avisos de segurança mediante consentimento explícito (art. 7º, I, LGPD)</li>
            <li>Melhorar o sistema com base em métricas de uso anonimizadas (interesse legítimo — art. 7º, IX, LGPD)</li>
          </ul>
        </section>

        {/* 4. Armazenamento */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">4. Armazenamento e Segurança</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Seus dados são armazenados em servidores seguros da Supabase (PostgreSQL), com criptografia em repouso e
            em trânsito (TLS 1.2+). Dados temporários armazenados localmente no dispositivo (fila offline) são
            protegidos com criptografia AES-256-GCM. Adotamos Row Level Security (RLS) para garantir que cada usuário
            acesse apenas seus próprios dados.
          </p>
        </section>

        {/* 5. Compartilhamento */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">5. Compartilhamento de Dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Não vendemos nem compartilhamos seus dados com terceiros para fins comerciais. Podemos compartilhar apenas
            com subprocessadores necessários para a prestação do serviço (ex.: provedor de infraestrutura cloud) e
            quando exigido por ordem judicial ou autoridade competente.
          </p>
        </section>

        {/* 6. Retenção */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">6. Prazo de Retenção</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mantemos seus dados pelo período necessário para a prestação dos serviços contratados e para cumprimento
            de obrigações legais. Após o encerramento da conta, os dados são excluídos em até 90 dias, salvo
            obrigação legal de retenção mais longa.
          </p>
        </section>

        {/* 7. Direitos */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">7. Seus Direitos (LGPD — art. 18)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Você tem direito a, a qualquer momento:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Confirmar a existência de tratamento e acessar seus dados</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
            <li>Portabilidade dos dados a outro fornecedor (mediante requisição)</li>
            <li>Revogar o consentimento a qualquer momento</li>
            <li>Opor-se ao tratamento e ser informado sobre as consequências</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para exercer qualquer desses direitos, envie e-mail para{" "}
            <a href={`mailto:${CONTROLLER_EMAIL}`} className="text-primary underline">{CONTROLLER_EMAIL}</a> com o
            assunto "Direitos LGPD". Responderemos em até 15 dias úteis.
          </p>
        </section>

        {/* 8. Cookies */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">8. Cookies e Armazenamento Local</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Utilizamos <strong>localStorage</strong> para armazenar preferências, sessão autenticada e fila offline
            de dados. Não utilizamos cookies de rastreamento ou publicidade de terceiros.
          </p>
        </section>

        {/* 9. Alterações */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">9. Alterações nesta Política</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Podemos atualizar esta Política periodicamente. Quando houver alterações materiais, notificaremos
            os usuários ativos pelo e-mail cadastrado com pelo menos 15 dias de antecedência.
          </p>
        </section>

        <Separator />

        {/* Contato */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
          <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Encarregado de Dados (DPO)</p>
            <p className="text-sm text-muted-foreground">{CONTROLLER_NAME}</p>
            <a href={`mailto:${CONTROLLER_EMAIL}`} className="text-sm text-primary underline">
              {CONTROLLER_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
