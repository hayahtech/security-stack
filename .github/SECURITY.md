# 🔐 Security Policy & Automation

Este documento descreve como a segurança é automatizada e enforçada neste projeto via **Claude Code Security Review + Custom Rules + Multi-Tool Scanning**.

---

## Quick Start

### 1. Setup Inicial

```bash
# Clone/init repository
git clone <repo>
cd <repo>

# Setup secrets (GitHub > Settings > Secrets and variables)
# Required:
# - CLAUDE_API_KEY (Anthropic API key)
# - SNYK_TOKEN (optional, supply chain)
# - SLACK_SECURITY_WEBHOOK (optional, alerting)

# Confirm workflows are enabled
# GitHub > Actions > enable "All"
```

### 2. Make PR / Push Code

```bash
git checkout -b feature/my-feature
# implement feature
git push -u origin feature/my-feature
# Create PR
```

**Automaticamente:**
1. ✅ **Claude Code Security Review** roda (analisa alterações)
2. ✅ **Semgrep SAST** roda (detecção de padrões)
3. ✅ **Secrets Detection** roda (Gitleaks + TruffleHog)
4. ✅ **Supply Chain** roda (dependências)
5. ✅ **Security Gate** bloqueia merge se CRITICAL

### 3. Review & Fix

PR comments mostram findings com links para **zero-trust-blindagem skill** (como fixar).

```
## 🔐 Security Review — Zero-Trust Compliance

Found:
- [ ] **F12 Minimalism** — Remova console logs
- [ ] **Input Validation** — Validate todos inputs
- [ ] **CSRF Protection** — Endpoints mutantes precisam tokens

👉 [Seção 1 — zero-trust-blindagem para detalhes]
```

---

## Workflows & Gates

### Segurança Automática

| Workflow | Trigger | O Que Faz |
|----------|---------|-----------|
| **security-gates.yml** | PR/push main/staging | Claude + Semgrep + gate de CRITICAL |
| **sast-semgrep.yml** | PR/push | Detecção de padrões (SQL injection, XSS, etc) |
| **supply-chain.yml** | Package.json change / daily | npm audit, Snyk, pip-audit, dependency-check |
| **secrets-detection.yml** | PR/push | Gitleaks + TruffleHog + custom patterns |
| **dast-nightly.yml** | Nightly 3 AM | OWASP ZAP scan em staging |
| **compliance-report.yml** | Weekly Monday 9 AM | Gera relatório de compliance + Slack |

### Security Gates — Bloqueiam Merge

**CRITICAL findings bloqueiam automaticamente:**
1. Claude Code Security Review encontra CRITICAL
2. Semgrep detecta padrão crítico
3. Secrets detection encontra chave vazada (verified)
4. Supply chain encontra vulnerabilidade crítica não-patchada

**Action**: Fixe e re-request review.

---

## Custom Rules — zero-trust-blindagem Enforcement

**Arquivo**: `.github/security/custom-rules.md`

Define 30+ regras que enforçam:

- **F12 Minimalism**: Sem console.log, payload mínimo
- **Hardcoded Secrets**: CRITICAL se encontra
- **IDOR**: Todo endpoint valida ownership
- **CSRF**: Todo POST/PUT/DELETE tem token
- **SQL Injection**: Apenas prepared statements
- **XSS**: Sem dangerouslySetInnerHTML sem sanitize
- **Rate Limiting**: Endpoints sensíveis têm limites
- **Crypto RNG**: Tokens usam crypto.randomBytes
- **PII Encryption**: CPF, SSN, credit card encrypted
- **Audit Logging**: Sem PII em logs

**Link**: [Custom Rules Details](.github/security/custom-rules.md)

---

## Integration com Skills

### `zero-trust-blindagem` (38 KB, 23 seções)
**Quando**: Implementando features, designando arquitetura
**O que**: Guia de implementação segura + compliance

```
Feature PR → Claude Review → PR Comment com links para skill
"XSS risk detected — veja seção 1 (XSS prevention)"
```

### `devsecops-ci-pipeline` (24.6 KB, 11 seções)
**Quando**: Configurando workflows, setupando gates
**O que**: Automação + detecção + remedição

---

## Incident Response

### Se CRITICAL é Encontrado

1. **GitHub Issue criado automaticamente**
   - Label: `security`, `critical`
   - Assignado: security team (se configurado)

2. **Slack alerta (opcional)**
   - Webhook configurado em `SLACK_SECURITY_WEBHOOK`
   - Mensagem: "🚨 CRITICAL vulnerability found"

3. **Remediation**
   - Fix vulnerabilidade
   - Commit com mensagem: `Security: Fix [CVE/SEC-ID]`
   - Re-request review
   - Merge automaticamente (se gates passam)

### Se Secret é Vazado (Verified)

1. **TruffleHog detecta**
2. **Workflow para automaticamente**
3. **Issue criado**: "VERIFIED secret found — IMMEDIATE ACTION"

**Ações obrigatórias:**
- Revogar secret em produção
- Rotacionar credenciais
- Scan histórico git para outras instâncias
- Investigar exposure scope

---

## Monitoramento em Produção

### Daily/Weekly Reports

```
Monday 9 AM → Compliance Report gerado
- Critical findings: N
- High findings: N
- Resolved this week: N
- Remediation rate: X%
```

### Real-Time Alerts

Se configurado SIEM (Splunk, ELK) + Slack:
- Auth failure spike → Slack alert
- API abuse pattern → Slack alert
- Database slowness → Investigation

---

## Maintenance & Updates

### Checklist Semanal

- [ ] Review compliance report
- [ ] Update dependencies (supply chain)
- [ ] Check for zero-day CVEs
- [ ] Verify backups (if applicable)

### Checklist Mensal

- [ ] Run full DAST scan (ZAP)
- [ ] Review incident logs
- [ ] Audit access controls
- [ ] Verify encryption keys rotation

---

## Troubleshooting

### "Claude Code Security Review não roda"
- [ ] Verificar `CLAUDE_API_KEY` secret está setado
- [ ] Verificar quota Anthropic API
- [ ] Check workflow logs: GitHub > Actions > click workflow run

### "False positives nos findings"
- [ ] Adicione exceção em `custom-rules.md` se legítimo
- [ ] Ou desabilite regra temporariamente com comentário

### "Git secrets não detecta meu padrão"
- [ ] Adicione padrão customizado em `secrets-detection.yml`
- [ ] Ou use `.gitleaksignore` (whitelist)

---

## Links Úteis

- **Anthropic Claude Code Security Review**: https://github.com/anthropics/claude-code-security-review
- **Semgrep**: https://semgrep.dev
- **Snyk**: https://snyk.io
- **OWASP ZAP**: https://www.zaproxy.org
- **Gitleaks**: https://github.com/gitleaks/gitleaks

---

## Support

**Para dúvidas sobre:**
- **Implementação segura**: Veja `zero-trust-blindagem` skill
- **Configuração CI/CD**: Veja `devsecops-ci-pipeline` skill
- **Custom rules**: Veja `.github/security/custom-rules.md`

---

**Last Updated**: 2026-04-17
**Policy Version**: 1.0
