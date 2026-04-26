

# DocScan Pro - Plano de Implementação

## Visão Geral
Aplicação web completa para escanear documentos brasileiros via upload de imagem/PDF, extrair dados automaticamente usando IA (Claude Vision), e organizar em um registro pesquisável.

---

## Fase 1: Infraestrutura & Banco de Dados (Lovable Cloud)

- Habilitar Lovable Cloud (Supabase)
- Criar tabelas: **pessoas** (registro de pessoas com nome, CPF, data_nascimento, foto_url, etc.) e **documentos** (tipo, dados_extraidos como JSONB, status, confiança média, imagem_url, pessoa_id FK)
- Criar buckets de Storage: **documentos** (originais) e **fotos-extraidas** (fotos de rosto)
- Configurar RLS para acesso público (sem auth)
- Solicitar a chave da API Anthropic via segredo do Supabase

## Fase 2: Edge Function de Extração com Claude Vision

- Criar edge function que recebe imagem/PDF e envia ao Claude claude-sonnet-4-20250514 Vision
- Prompt especializado para documentos brasileiros (CNH, RG, CPF, etc.) que retorna JSON estruturado com campos extraídos e scores de confiança por campo
- Auto-detecção do tipo de documento
- Tratamento de erros e fallback

## Fase 3: Tela de Upload & Detecção

- Área de drag-and-drop para upload (JPG, PNG, WEBP, PDF até 10MB)
- Botão alternativo de captura de câmera
- Preview do documento antes de processar
- Badge indicando tipo de documento detectado
- Indicador de progresso durante processamento

## Fase 4: Tela de Revisão & Confirmação

- Formulário editável com todos os campos extraídos lado a lado com a imagem original
- Campos com baixa confiança destacados em amarelo
- Score de confiança visível por campo
- Botões "Confirmar e Salvar" / "Cancelar"
- Ao confirmar: salvar na tabela documentos e vincular/criar pessoa

## Fase 5: Dashboard / Tela Inicial

- Cards de estatísticas: Total de pessoas, Documentos hoje, Pendentes de revisão
- Lista de documentos recentes com ícones por tipo e badges de status
- Barra de busca (por nome, CPF, número de documento)
- Filtros por tipo de documento e status
- Botão "Novo Documento"

## Fase 6: Registro de Pessoas

- Grid de cards ou tabela com todas as pessoas cadastradas
- Cada card mostra: foto (se disponível), nome, CPF, quantidade de documentos
- Clicar em pessoa mostra todos seus documentos
- Detecção de duplicatas por CPF (mesmo CPF = mesma pessoa)

## Fase 7: Tela de Detalhe do Documento

- Exibição completa dos dados extraídos
- Preview da imagem original e foto extraída
- Edição inline de campos
- Botão de exportar para PDF
- Exclusão com confirmação

## Design & UX

- Interface 100% em Português (Brasil)
- Tema limpo e profissional com tons de azul
- Responsivo para desktop e mobile
- Toasts e feedbacks visuais em cada ação
- Ícones por tipo de documento (Lucide icons)

