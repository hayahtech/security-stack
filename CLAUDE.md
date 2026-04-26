# Claude Code Guidelines

Este documento define regras, preferências e padrões para colaboração eficiente com Claude Code neste projeto.

## 🎯 Princípios Fundamentais

- **Eficiência acima de tudo**: Economize tokens, use auto-formatting/linting
- **Async-first**: Hooks rodam em background, nunca bloqueiam
- **Type-safe**: Prefira TypeScript, Go types, Python type hints, Rust's type system
- **Test-driven**: Escreva testes ao mesmo tempo que o código
- **Zero-config**: Tudo já está auto-configurado no `settings.json`

## 🛠️ Stack Suportado

### Node.js/TypeScript
- **Runtime**: Node.js 18+
- **Package Manager**: npm/pnpm/yarn
- **Formatter**: Prettier (auto via hook)
- **Linter**: ESLint (auto via hook)
- **Testing**: Jest, Vitest, Mocha
- **Key files**: `package.json`, `tsconfig.json`, `.eslintrc`

### Python
- **Version**: Python 3.9+
- **Package Manager**: pip/poetry/pipenv
- **Formatter**: Black (auto via hook)
- **Linter**: Flake8, Pylint (auto via hook)
- **Testing**: pytest, unittest
- **Key files**: `pyproject.toml`, `setup.py`, `requirements.txt`

### Go
- **Version**: Go 1.19+
- **Formatter**: Gofmt (auto via hook)
- **Linter**: golangci-lint (auto via hook)
- **Testing**: `go test`
- **Key files**: `go.mod`, `go.sum`

### Rust
- **Version**: Rust 1.70+
- **Formatter**: Rustfmt (auto via hook)
- **Linter**: Clippy (auto via hook)
- **Testing**: `cargo test`
- **Key files**: `Cargo.toml`, `Cargo.lock`

## 🔄 Development Workflow

### 1. Writing Code
```bash
# Claude writes code
# Auto-formatter runs (Prettier/Black/gofmt/rustfmt) ✅
# Auto-linter runs (ESLint/Flake8/golangci-lint/Clippy) ✅
# Auto-tests run (pytest/npm test/go test/cargo test) ✅
```

### 2. Testing
- **Run before**: `npm test`, `pytest`, `go test ./...`, `cargo test`
- **Watch mode**: Use during development for fast feedback
- **Coverage**: Aim for 80%+ coverage on critical paths

### 3. Committing
```bash
git commit -m "Brief description

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

## 📋 Code Style Preferences

### TypeScript/JavaScript
- Use `const` by default, `let` if reassignment needed
- Prefer arrow functions for callbacks
- Use template literals for string interpolation
- Max line length: 100 characters
- No trailing commas in single-line objects

### Python
- Max line length: 120 characters (configured in flake8)
- Use type hints: `def func(x: int) -> str:`
- Prefer f-strings: `f"value: {x}"`
- Use dataclasses or Pydantic for models

### Go
- Follow Go conventions (CamelCase for exported, camelCase for private)
- Write tests in same package: `*_test.go`
- Use error wrapping: `fmt.Errorf("context: %w", err)`
- Keep functions under 50 lines when possible

### Rust
- Use Rust idioms (iterators > explicit loops)
- Prefer `?` operator for error handling
- Use `#[derive(...)]` for common traits
- Document public API with doc comments: `/// Comment`

## 🚀 Performance Guidelines

- **Token Economy**: Thinking disabled by default (use `meta+t` if needed)
- **Fast Mode**: Enabled by default (use `meta+f` to toggle)
- **Model**: Haiku for speed, switch to Sonnet (`meta+m`) for complex logic
- **Async Hooks**: All formatting/linting runs in background

## 🧪 Testing Requirements

### General
- Write tests alongside implementation
- Test edge cases and error paths
- Use descriptive test names
- Keep tests focused and isolated

### JavaScript/TypeScript
```typescript
describe('functionName', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### Python
```python
def test_function_name():
    assert result == expected

def test_error_case():
    with pytest.raises(ValueError):
        function_that_fails()
```

### Go
```go
func TestFunctionName(t *testing.T) {
    result := functionName()
    if result != expected {
        t.Errorf("got %v, want %v", result, expected)
    }
}
```

### Rust
```rust
#[test]
fn test_function_name() {
    assert_eq!(function_name(), expected);
}
```

## 🔧 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `meta+e` | Open external editor (vim/neovim) |
| `meta+t` | Toggle thinking (for complex problems) |
| `meta+f` | Toggle fast mode |
| `meta+m` | Switch model (Sonnet/Opus) |
| `meta+o` | Toggle transcript view |
| `ctrl+shift+k` | Kill running agents |

## 🎯 Skills Disponíveis

Para uma lista completa de todas as skills instaladas e disponíveis, veja [SKILLS.md](./SKILLS.md).

### Skills Principais por Categoria:

**Segurança:**
- `/zero-trust-blindagem` — Segurança zero-trust
- `/security-review` — Revisar segurança de código
- `/devsecops-ci-pipeline` — Segurança em pipelines

**Desenvolvimento:**
- `/superpowers-writing-plans` — Planejar implementação
- `/superpowers-executing-plans` — Executar planos
- `/superpowers-test-driven-development` — TDD
- `/superpowers-code-review` — Code review estruturado
- `/superpowers-systematic-debugging` — Debug sistemático

**Configuração:**
- `/update-config` — Configurar settings.json e automações
- `/keybindings-help` — Customizar atalhos
- `/schedule` — Agendar tarefas

**Dados:**
- `/data:analyze` — Análise de dados
- `/data:create-viz` — Criar visualizações
- `/data:sql-queries` — Gerar queries SQL

**Documentação:**
- `/obsidian-markdown` — Ferramentas Markdown
- `/engineering:documentation` — Documentar código

**Como invocar:**
```
/nome-da-skill [argumentos]
```

Exemplo:
```
/security-review
/loop 5m /security-review
/superpowers-writing-plans
```

## 📝 File Organization

```
project/
├── .claude/
│   └── settings.json          # Auto-configured, don't edit
├── CLAUDE.md                  # Este arquivo
├── SKILLS.md                  # Lista de skills disponíveis
├── package.json/pyproject.toml/go.mod/Cargo.toml
├── src/                       # Source code
│   ├── index.ts               # Entry point
│   └── features/
├── tests/                     # Test files
├── docs/                      # Documentation
└── .gitignore
```

## ❌ What NOT to Do

- ❌ Don't disable auto-formatting hooks
- ❌ Don't commit without tests passing
- ❌ Don't use `any` in TypeScript (use proper types)
- ❌ Don't ignore linter warnings
- ❌ Don't write tests after code (write together)
- ❌ Don't commit `console.log()` or `print()` in production code

## ✅ Best Practices

- ✅ Use type safety wherever possible
- ✅ Keep functions small and focused (<30 lines)
- ✅ Write clear commit messages
- ✅ Use descriptive variable names
- ✅ Document complex logic with comments
- ✅ Run all tests before committing
- ✅ Use meaningful branch names: `feat/`, `fix/`, `refactor/`

## 🔐 Security Checklist

- ✅ No hardcoded secrets (use env vars)
- ✅ Validate all user input
- ✅ Use parameterized queries (no SQL injection)
- ✅ Keep dependencies updated
- ✅ Use HTTPS for all external calls
- ✅ Sanitize output for XSS prevention

## 📚 Documentation

- Maintain README.md with setup instructions
- Document API endpoints with examples
- Add JSDoc/docstrings to complex functions
- Keep CHANGELOG.md updated
- Comment on "why" not "what" (code shows what)

## 🤝 Contributing

When working with Claude:
1. Provide clear requirements
2. Specify target language/framework
3. Point out existing patterns to follow
4. Ask for explanations if unclear
5. Review generated code before committing

## 🏷️ Comandos Personalizados (Códigos entre nós)

### `#obsidian`
Quando o usuario escrever **#obsidian** em qualquer mensagem, salvar IMEDIATAMENTE a conversa no Obsidian:

- **Vault**: `C:/renatorad/Obsidian/Hayah Tech Systems/Hayah Tech Systems/Claude Chats/`
- **Nome do arquivo**: `YYYY-MM-DD — [Resumo do tema principal da conversa].md`
- **Formato**: Markdown com resumo estruturado contendo:
  - Data, modelo usado
  - Resumo do que foi discutido/feito
  - Decisoes tomadas
  - Arquivos criados/modificados
  - Proximos passos
  - Links cruzados `[[...]]` para notas relacionadas
- **Se o projeto for fiodeprata**, salvar tambem em:
  `Claude Chats/obsidian-fiodeprata/06-conversas-claude/YYYY-MM-DD-[slug-do-tema].md`
- **Idioma**: Sempre em portugues
- **Nao perguntar nada** — salvar direto ao ver `#obsidian`

---

**Last Updated**: 2026-04-19
**Auto-Configured By**: Claude Code Setup Script
