import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProjectCard } from "@/cronometro/components/ProjectCard";
import type { Projeto } from "@/cronometro/types";

// ─── ErrorBoundary ────────────────────────────────────────────────────────────

const ThrowingChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error("teste de erro");
  return <div>Conteúdo normal</div>;
};

describe("ErrorBoundary", () => {
  // Silenciar o console.error do React durante os testes de erro esperado
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renderiza filhos normalmente quando não há erro", () => {
    render(
      <ErrorBoundary>
        <div>Conteúdo OK</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Conteúdo OK")).toBeInTheDocument();
  });

  it("exibe fallback padrão quando filho lança erro", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
  });

  it("exibe fallback customizado quando fornecido", () => {
    render(
      <ErrorBoundary fallback={<div>Fallback customizado</div>}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Fallback customizado")).toBeInTheDocument();
  });

  it("exibe botão 'Tentar novamente' no estado de erro", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>
    );
    const resetBtn = screen.getByText("Tentar novamente");
    expect(resetBtn).toBeInTheDocument();
    // Clicar no botão chama handleReset (setState) sem lançar exceção
    expect(() => fireEvent.click(resetBtn)).not.toThrow();
  });
});

// ─── ProjectCard ──────────────────────────────────────────────────────────────

const mockProjeto: Projeto = {
  id: "p1",
  nome: "Projeto Teste",
  contratante: "Cliente Teste",
  data_inicio: "2026-01-01",
  previsao_conclusao: "2026-12-31",
  descricao: "Descrição do projeto",
  status: "ativo",
  criado_em: "2026-01-01T00:00:00.000Z",
  etapas: [],
};

const noop = () => {};

describe("ProjectCard", () => {
  const defaultProps = {
    projeto: mockProjeto,
    isRunning: false,
    elapsedSeconds: 0,
    getTotalSeconds: () => 0,
    onStart: noop,
    onStop: noop,
    hasBeenActivated: false,
  };

  it("exibe nome e contratante do projeto", () => {
    render(
      <MemoryRouter>
        <ProjectCard {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByText("Projeto Teste")).toBeInTheDocument();
    expect(screen.getByText("Cliente Teste")).toBeInTheDocument();
  });

  it("exibe botão de play quando parado", () => {
    render(
      <MemoryRouter>
        <ProjectCard {...defaultProps} />
      </MemoryRouter>
    );
    // O botão play existe (ícone Play)
    const playButton = screen.getByRole("button");
    expect(playButton).toBeInTheDocument();
  });

  it("chama onStart ao clicar no botão play", () => {
    const onStart = vi.fn();
    render(
      <MemoryRouter>
        <ProjectCard {...defaultProps} onStart={onStart} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onStart).toHaveBeenCalledWith("p1");
  });

  it("chama onStop ao clicar quando está rodando", () => {
    const onStop = vi.fn();
    render(
      <MemoryRouter>
        <ProjectCard {...defaultProps} isRunning={true} onStop={onStop} />
      </MemoryRouter>
    );
    // Quando rodando, o primeiro botão pode ser fullscreen — pegar o de stop
    const buttons = screen.getAllByRole("button");
    const stopButton = buttons[buttons.length - 1];
    fireEvent.click(stopButton);
    expect(onStop).toHaveBeenCalledWith("p1");
  });

  it("não exibe botão de ação para projeto concluído", () => {
    render(
      <MemoryRouter>
        <ProjectCard {...defaultProps} projeto={{ ...mockProjeto, status: "concluido" }} />
      </MemoryRouter>
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("exibe texto 'Cronometrando' quando rodando", () => {
    render(
      <MemoryRouter>
        <ProjectCard {...defaultProps} isRunning={true} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Cronometrando/)).toBeInTheDocument();
  });

  it("exibe texto 'Tempo Hoje' quando parado", () => {
    render(
      <MemoryRouter>
        <ProjectCard {...defaultProps} isRunning={false} />
      </MemoryRouter>
    );
    expect(screen.getByText("Tempo Hoje")).toBeInTheDocument();
  });
});
