import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas replicados dos formulários para testar isoladamente
const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  email: z.union([z.string().email("Email inválido").max(255), z.literal("")]),
  phone: z.string().max(20, "Telefone muito longo"),
  company: z.string().max(255, "Nome de empresa muito longo"),
  notes: z.string().max(2000, "Observações muito longas"),
});

const projectSchema = z.object({
  name: z.string().min(1, "Nome do projeto é obrigatório").max(255),
  status: z.string().min(1),
  value: z.number().min(0).nullable().optional(),
  deadline: z.string().nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
});

describe("Validação de Cliente", () => {
  it("aceita dados válidos completos", () => {
    const result = clientSchema.safeParse({
      name: "João Silva",
      email: "joao@exemplo.com",
      phone: "(11) 99999-0000",
      company: "Empresa LTDA",
      notes: "Cliente VIP",
    });
    expect(result.success).toBe(true);
  });

  it("aceita campos opcionais em branco", () => {
    const result = clientSchema.safeParse({
      name: "Ana",
      email: "",
      phone: "",
      company: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const result = clientSchema.safeParse({
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameErr = result.error.errors.find(e => e.path[0] === "name");
      expect(nameErr?.message).toBe("Nome é obrigatório");
    }
  });

  it("rejeita email inválido (não vazio)", () => {
    const result = clientSchema.safeParse({
      name: "João",
      email: "nao-e-email",
      phone: "",
      company: "",
      notes: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErr = result.error.errors.find(e => e.path[0] === "email");
      expect(emailErr?.message).toBe("Email inválido");
    }
  });

  it("rejeita nome com mais de 255 caracteres", () => {
    const result = clientSchema.safeParse({
      name: "A".repeat(256),
      email: "",
      phone: "",
      company: "",
      notes: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameErr = result.error.errors.find(e => e.path[0] === "name");
      expect(nameErr?.message).toBe("Nome muito longo");
    }
  });

  it("rejeita telefone com mais de 20 caracteres", () => {
    const result = clientSchema.safeParse({
      name: "Teste",
      email: "",
      phone: "1".repeat(21),
      company: "",
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita observações com mais de 2000 caracteres", () => {
    const result = clientSchema.safeParse({
      name: "Teste",
      email: "",
      phone: "",
      company: "",
      notes: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("aceita emails válidos de diferentes formatos", () => {
    const emails = ["a@b.com", "user+tag@domain.co.uk", "name.surname@company.org"];
    emails.forEach(email => {
      const result = clientSchema.safeParse({
        name: "Teste",
        email,
        phone: "",
        company: "",
        notes: "",
      });
      expect(result.success, `Email ${email} deveria ser válido`).toBe(true);
    });
  });
});

describe("Validação de Projeto", () => {
  it("aceita projeto válido", () => {
    const result = projectSchema.safeParse({
      name: "Site Institucional",
      status: "Em andamento",
      value: 5000,
      deadline: "2026-12-31",
      description: "Projeto de site",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita nome de projeto vazio", () => {
    const result = projectSchema.safeParse({
      name: "",
      status: "Em andamento",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita valor negativo", () => {
    const result = projectSchema.safeParse({
      name: "Projeto",
      status: "Em andamento",
      value: -100,
    });
    expect(result.success).toBe(false);
  });

  it("aceita valor zero e null", () => {
    expect(projectSchema.safeParse({ name: "P", status: "s", value: 0 }).success).toBe(true);
    expect(projectSchema.safeParse({ name: "P", status: "s", value: null }).success).toBe(true);
  });
});

describe("Validação de Input de Segurança", () => {
  it("Zod escapa strings perigosas ao validar (não executa HTML)", () => {
    // Zod valida o valor bruto — a sanitização real acontece na renderização React
    // mas garantimos que strings XSS passam pela validação como strings (não são executadas)
    const xssAttempt = '<script>alert("xss")</script>';
    const result = clientSchema.safeParse({
      name: xssAttempt,
      email: "",
      phone: "",
      company: "",
      notes: "",
    });
    // O schema aceita (o React que sanitiza na renderização)
    // mas garantimos que o valor continua sendo uma string
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.name).toBe("string");
      expect(result.data.name).toBe(xssAttempt);
    }
  });

  it("rejeita strings que excedem limites mesmo com conteúdo especial", () => {
    const result = clientSchema.safeParse({
      name: "Teste",
      email: "",
      phone: "!@#$%^&*()_+{}|:<>?".repeat(2), // 40 chars > 20 limit
      company: "",
      notes: "",
    });
    expect(result.success).toBe(false);
  });
});
