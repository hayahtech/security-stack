# Custom Security Rules — Zero-Trust Blindagem Enforcement

Este arquivo define custom rules que a skill `devsecops-ci-pipeline` usa para enforçar os padrões de segurança definidos em `zero-trust-blindagem`.

---

## 1. CLIENT-SIDE SECURITY (F12 Minimalism)

### Rule: Console Logs Exposing PII
**Severity**: MEDIUM
**Pattern**: `console\.(log|debug|info|warn|error)\s*\(\s*(?:user|password|email|token|api.?key|secret|ssn|cpf|credit.?card)`
**Files**: `src/**/*.{js,ts,jsx,tsx}`
**Exclude**: `**/*.test.ts`, `**/*.spec.js`
**Message**: "❌ **Zero-Trust Violation (Seção 1 — F12 Minimalism)**\n\nConsole logs expõem PII ou tokens:\n- Nunca faça logging de passwords, tokens, credentials\n- Se precisa debugar, mascare: `user@***.com`, `***-***-1234`\n- Remova console.log em produção: `if (process.env.NODE_ENV !== 'production') { console.log(...) }`\n\n✅ **Fix**:\n```js\n// ❌ BAD\nconsole.log('User email:', user.email, 'Token:', user.token);\n\n// ✅ GOOD\nif (process.env.NODE_ENV === 'development') {\n  console.log('User ID:', user.id);\n}\n```"

### Rule: Hardcoded API Keys / Secrets
**Severity**: CRITICAL
**Pattern**: `(api[_-]?key|secret|password|token|auth.?key)\s*[=:]\s*['\"][a-zA-Z0-9]{16,}['\"]`
**Files**: `src/**/*.{js,ts,py,go,rs}`
**Message**: "❌ **Critical — Hardcoded Secret (Seção 14 — Secrets Management)**\n\nSegredos NUNCA são hardcoded:\n- Use variáveis de ambiente: `process.env.API_KEY`\n- Use Vault (HashiCorp, AWS Secrets Manager, Doppler)\n- Remova do git: `git rm --cached`, rebuild history\n\n✅ **Fix**:\n```js\n// ❌ NEVER\nconst apiKey = 'sk_live_abc123def456ghi789jkl';\n\n// ✅ ALWAYS\nconst apiKey = process.env.STRIPE_API_KEY;\n```"

### Rule: Sensitive Data in Response Payloads
**Severity**: HIGH
**Pattern**: `res\.json\(|res\.send\(|return\s+\{.*(?:password|hash|internal_id|created_by|stripe_customer_id|ssn|cpf)`
**Files**: `src/api/**/*.{js,ts}`
**Message**: "❌ **Zero-Trust Violation (Seção 1 — Payload Minimalism)**\n\nNuncas envie dados sensíveis desnecessários ao cliente:\n- Use DTOs (Data Transfer Objects) — whitelist apenas campos para renderizar\n- `password_hash`, `internal_id`, `stripe_customer_id` NUNCA vão para cliente\n- Network tab deve mostrar apenas dados necessários à UI\n\n✅ **Fix**:\n```ts\n// ❌ BAD\nres.json(user); // envia tudo (password_hash, admin_notes, etc)\n\n// ✅ GOOD\nconst dto = { id: user.id, email: user.email, name: user.name };\nres.json(dto);\n```"

### Rule: Unsafe HTML Rendering
**Severity**: HIGH
**Pattern**: `dangerouslySetInnerHTML|v-html|innerHTML\s*=\s*[^']|\.html\\(`
**Files**: `src/**/*.{jsx,tsx,vue}`
**Message**: "❌ **XSS Risk (Seção 1 — XSS Prevention)**\n\n`dangerouslySetInnerHTML` / `v-html` / `innerHTML` com input de usuário = RCE:\n- Sempre escape outputs (React/Vue fazem por padrão)\n- Se PRECISA renderizar HTML: sanitize com DOMPurify\n- Use `textContent` para texto puro\n\n✅ **Fix**:\n```jsx\n// ❌ BAD\n<div dangerouslySetInnerHTML={{__html: userInput}} />\n\n// ✅ GOOD\nimport DOMPurify from 'dompurify';\n<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />\n\n// ✅ EVEN BETTER (text)\n<div>{userInput}</div>\n```"

---

## 2. AUTHENTICATION & AUTHORIZATION

### Rule: No IDOR Check in API Endpoints
**Severity**: CRITICAL
**Pattern**: `router\.(get|post|put|delete|patch)\s*\(['\"]/api/.*:id`
**Requires**: `WHERE.*owner_id|accessControl\.check|authorize\(|RLS`
**Message**: "❌ **Critical IDOR (Seção 2 — IDOR & Broken Access Control)**\n\nENDPOINT MUTANTE SEM VALIDAÇÃO DE OWNERSHIP = ACE:\n- Toda requisição DEVE validar `owner_id` == `userId` da sessão\n- 2 camadas: middleware (authz) + query (`WHERE id = ? AND owner_id = ?`)\n- Use Row-Level Security (RLS) no banco se possível\n\n✅ **Fix**:\n```ts\n// ❌ BAD — qualquer user acessa qualquer profile\napp.get('/api/profile/:id', (req, res) => {\n  const user = db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);\n  res.json(user);\n});\n\n// ✅ GOOD\napp.get('/api/profile/:id', authenticate, (req, res) => {\n  const user = db.query('SELECT * FROM users WHERE id = ? AND owner_id = ?', \n    [req.params.id, req.user.id]);\n  if (!user) return res.status(403).json({ error: 'Forbidden' });\n  res.json(user);\n});\n```"

### Rule: Cookies Missing Security Attributes
**Severity**: HIGH
**Pattern**: `res\.cookie\s*\(\s*['\"][^'\"]+['\"],\s*[^)]*\)`
**Requires**: `httpOnly\s*:\s*true|HttpOnly|Secure|SameSite`
**Message**: "❌ **Cookie Exposure (Seção 2 — Session Security)**\n\nCookies devem ter `HttpOnly`, `Secure`, `SameSite`:\n- **HttpOnly**: bloqueia acesso via JS (previne XSS roubando sessão)\n- **Secure**: transmissão apenas HTTPS\n- **SameSite=Strict**: bloqueia requisições cross-site (CSRF)\n\n✅ **Fix**:\n```ts\n// ❌ BAD\nres.cookie('session', token);\n\n// ✅ GOOD\nres.cookie('session', token, {\n  httpOnly: true,\n  secure: process.env.NODE_ENV === 'production',\n  sameSite: 'strict',\n  maxAge: 15 * 60 * 1000 // 15 min\n});\n```"

### Rule: Weak Password Validation
**Severity**: HIGH
**Pattern**: `password.*length.*<.*8|password.*test.*\\/.*\\/.{0,7}\\/`
**Message**: "❌ **Weak Password Validation (Seção 2 — Auth)**\n\nSenhas devem ter mínimo 12 caracteres + complexidade:\n- Mínimo 12 chars\n- Upper + lower + number + special char\n- Check contra listas vazadas (HaveIBeenPwned API)\n- Use bcrypt/argon2 para hash (nunca MD5/SHA1)\n\n✅ **Fix**:\n```ts\nconst validatePassword = (pwd: string) => {\n  const minLength = pwd.length >= 12;\n  const hasUpper = /[A-Z]/.test(pwd);\n  const hasLower = /[a-z]/.test(pwd);\n  const hasNumber = /\\d/.test(pwd);\n  const hasSpecial = /[!@#$%^&*]/.test(pwd);\n  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;\n};\n```"

---

## 3. INJECTION & MANIPULATION

### Rule: SQL Injection — String Concatenation
**Severity**: CRITICAL
**Pattern**: `query\s*=\s*.*concat|query\s*=\s*.*\+.*WHERE|query\s*=\s*.*\$\{.*\}.*WHERE|execute\s*\\(\s*.*\+`
**Message**: "❌ **CRITICAL — SQL Injection (Seção 3 — Injection)**\n\nNUNCA concatene SQL:\n- EXCLUSIVAMENTE prepared statements / parametrized queries\n- ORMs seguros: Prisma, Drizzle, SQLAlchemy, TypeORM\n- NUNCA: `query = 'SELECT * FROM users WHERE id = ' + userId`\n\n✅ **Fix**:\n```ts\n// ❌ DEATH TRAP\nconst query = `SELECT * FROM users WHERE email = '${email}'`;\ndb.query(query);\n\n// ✅ SAFE\nconst query = 'SELECT * FROM users WHERE email = ?';\ndb.query(query, [email]);\n\n// ✅ SAFE (Prisma)\nconst user = await prisma.user.findUnique({ where: { email } });\n```"

### Rule: Command Injection
**Severity**: CRITICAL
**Pattern**: `exec\\s*\\(|spawn\\s*\\(|system\\s*\\(|eval\\s*\\(|Function\\s*\\(|new RegExp\\s*\\(`
**Requires**: `escape|sanitize|shellEscape|parameterized`
**Message**: "❌ **CRITICAL — Command Injection (Seção 3 — Injection)**\n\nNunca passe input direto para `exec/spawn/eval`:\n- Use APIs parametrizadas: child_process.execFile (Node.js) com array de args\n- Nunca shell=true\n- Escape/validate inputs rigorosamente\n\n✅ **Fix**:\n```ts\n// ❌ VULNERABLE\nchild_process.exec(`ffmpeg -i ${userInput} output.mp4`);\n\n// ✅ SAFE\nchild_process.execFile('ffmpeg', ['-i', userInput, 'output.mp4']);\n```"

### Rule: XXE — Unsafe XML Parsing
**Severity**: HIGH
**Pattern**: `parseXml|XMLParser|libxml|xml.parse|etree.parse`
**Message**: "❌ **XXE Risk (Seção 3 — Injection)**\n\nXML parsing desabilita entidades externas:\n- `FEATURE_SECURE_PROCESSING = true` (Java)\n- `libxml_disable_entity_loader(true)` (PHP)\n- `defusedxml` (Python)\n\n✅ **Fix**:\n```python\n# ❌ BAD\ntree = etree.parse(file)\n\n# ✅ GOOD\nfrom defusedxml import etree\ntree = etree.parse(file)\n```"

---

## 4. AVAILABILITY & RATE LIMITING

### Rule: No Rate Limiting on Login/Register
**Severity**: HIGH
**Pattern**: `router\.(post|get)\s*\\(['\"]\\/.*(?:login|register|forgot.?password|reset.?password)\s*`
**Requires**: `rateLimit|limiter|throttle|redisLimiter`
**Message**: "❌ **Brute Force Risk (Seção 4 — DoS/Abuse)**\n\nEndpoints sensíveis SEM rate limit = credential stuffing:\n- Login/Register: máximo 5 tentativas / 15 min / IP\n- Forgot password: 3 tentativas / hora / email\n- MFA: 10 tentativas / hora / conta\n- Bloqueio progressivo (exponential backoff)\n\n✅ **Fix**:\n```ts\nimport rateLimit from 'express-rate-limit';\n\nconst loginLimiter = rateLimit({\n  windowMs: 15 * 60 * 1000, // 15 min\n  max: 5, // 5 requests\n  message: 'Too many login attempts, try again later'\n});\n\napp.post('/login', loginLimiter, (req, res) => { ... });\n```"

### Rule: Missing Query Limits (DoS)
**Severity**: HIGH
**Pattern**: `db\\.query\\(|db\\.find\\(|SELECT.*FROM`
**Requires**: `LIMIT|limit|take|maxResults|pagination`
**Message**: "❌ **DoS Risk — N+1 / No Pagination (Seção 4 — Availability)**\n\nQueries SEM limite = resource exhaustion:\n- ALWAYS LIMIT: `LIMIT 100` default, máximo 1000\n- PAGINATION: offset/limit ou cursor-based\n- TIMEOUT: 5s DB max\n\n✅ **Fix**:\n```ts\n// ❌ BAD — retorna 10M rows\nconst users = await db.query('SELECT * FROM users');\n\n// ✅ GOOD\nconst users = await db.query('SELECT * FROM users LIMIT 100 OFFSET ?', [offset]);\n```"

---

## 5. CSRF & FORGERY

### Rule: POST/PUT/DELETE Without CSRF Protection
**Severity**: HIGH
**Pattern**: `router\\.(post|put|delete|patch)\\s*\\(`
**Requires**: `csrfProtection|csrf|validateToken|req\\.csrfToken`
**Message**: "❌ **CSRF Risk (Seção 6 — CSRF Protection)**\n\nEndpoints mutantes SEM CSRF tokens = account hijacking:\n- CSRF token gerado por sessão, incluído em formulários\n- Validado em servidor: token == sessão\n- SameSite=Strict cookie (defesa complementar)\n\n✅ **Fix**:\n```ts\nimport csrf from 'csurf';\nconst csrfProtection = csrf({ cookie: false });\n\napp.post('/transfer', csrfProtection, (req, res) => {\n  if (req.csrfToken() !== req.body._csrf) {\n    return res.status(403).json({ error: 'Invalid CSRF token' });\n  }\n  // process transfer\n});\n```"

---

## 6. CRYPTOGRAPHY & RANDOMNESS

### Rule: Weak Random Number Generation for Crypto
**Severity**: CRITICAL
**Pattern**: `Math\\.random\\(\\)|Random\\(\\)|rand\\(\\)|random\\.random\\(\\)`
**Context**: `token|nonce|session|secret|key|seed`
**Message**: "❌ **CRITICAL — Predictable RNG (Seção 22 — Secure Randomness)**\n\n`Math.random()` NUNCA para crypto — é previsível:\n- Tokens: `crypto.randomBytes(32).toString('hex')`\n- UUIDs: `crypto.randomUUID()`\n- Salts: `bcrypt` autogera (nunca manualmente)\n\n✅ **Fix**:\n```ts\n// ❌ VULNERABLE\nconst token = Math.random().toString(36).substring(2);\n\n// ✅ SECURE\nconst token = require('crypto').randomBytes(32).toString('hex');\n```"

### Rule: Weak Cryptographic Algorithms
**Severity**: HIGH
**Pattern**: `md5|sha1|DES|RC4|RSA.*1024|AES.*128(?!-GCM)`
**Message**: "❌ **Weak Crypto (Seção 22 — Cryptography)**\n\nAlgoritmos obsoletos:\n- ❌ MD5, SHA-1 (hash)\n- ❌ DES, RC4 (encryption)\n- ❌ RSA < 2048 bits\n- ❌ AES-128 (use AES-256)\n- ✅ SHA-256, bcrypt, argon2, AES-256-GCM, RSA-4096\n\n✅ **Fix**:\n```ts\n// ❌ BAD\nconst hash = crypto.createHash('md5').update(password).digest();\n\n// ✅ GOOD\nconst hash = await bcrypt.hash(password, 10);\n```"

---

## 7. LOGGING & AUDITORIA

### Rule: Logging Sensitive Data
**Severity**: MEDIUM
**Pattern**: `logger\\.(?:info|debug|warn|error)\\(.*(?:password|token|secret|api.?key|ssn|cpf|credit)`
**Message**: "❌ **Information Disclosure (Seção 13 — Logging)**\n\nLogs SEM sanitização = PII leakage:\n- Nunca logue passwords, tokens, secrets, PII bruta\n- Mascare: `email@***.com`, `***-***-***-1234`\n- Structured logging (JSON) para correlação\n- Imutável (append-only, S3 Object Lock)\n\n✅ **Fix**:\n```ts\n// ❌ BAD\nlogger.info('User login', { email: user.email, password: user.password });\n\n// ✅ GOOD\nlogger.info('User login', { user_id: user.id, email: maskEmail(user.email) });\n```"

---

## 8. ERROR HANDLING

### Rule: Stack Traces in Production Responses
**Severity**: MEDIUM
**Pattern**: `res\\.status\\(500\\).*stack|res\\.json\\(.*err\\.stack|res\\.send\\(.*err\\)|throw err`
**Message**: "❌ **Information Disclosure (Seção 11 — Error Handling)**\n\nStack traces expostos = recon para atacantes:\n- Nunca retorne `err.stack` ao cliente\n- Retorne: `{ error: 'Internal Server Error', id: 'uuid-para-lookup' }`\n- Guarde stack no servidor (logs imutáveis)\n\n✅ **Fix**:\n```ts\n// ❌ BAD\napp.use((err, req, res, next) => {\n  res.status(500).json({ error: err.message, stack: err.stack });\n});\n\n// ✅ GOOD\napp.use((err, req, res, next) => {\n  const traceId = uuid();\n  logger.error({ traceId, error: err, stack: err.stack });\n  res.status(500).json({ error: 'Internal error', id: traceId });\n});\n```"

---

## 9. DATA PROTECTION

### Rule: PII Without Encryption
**Severity**: HIGH
**Pattern**: `cpf|ssn|rg|cnpj|passport|credit.?card|phone.*number`
**Requires**: `encrypt|AES|crypto\\.encrypt|Cipher|bcrypt|argon2`
**Message**: "❌ **Data Protection Risk (Seção 1 & 13 — PII Protection)**\n\nDados sensíveis SEM criptografia em repouso:\n- CPF, RG, SSN, credit cards: AES-256 encrypted\n- Criptografe na aplicação (app-layer encryption)\n- Use key management: Vault, AWS KMS\n- Consentimento explícito (LGPD/GDPR)\n\n✅ **Fix**:\n```ts\nimport crypto from 'crypto';\n\nconst encrypt = (text: string) => {\n  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);\n  return cipher.update(text) + cipher.final('hex');\n};\n\n// Store encrypted\nawait db.users.update(id, { cpf: encrypt(cpf) });\n```"

---

## Summary Check

**Antes de fazer merge, valide:**

- [ ] Sem console.log em produção (F12 minimalism)
- [ ] Sem hardcoded secrets (todas variáveis de env)
- [ ] Sem PII em responses desnecessários (DTOs)
- [ ] Todo POST/PUT/DELETE tem CSRF token
- [ ] IDOR check em toda requisição com ID
- [ ] Cookies com HttpOnly, Secure, SameSite
- [ ] Sem SQL injection (prepared statements)
- [ ] Rate limit em endpoints sensíveis
- [ ] Sem console.log(token) ou sensitive info
- [ ] Crypto RNG para tokens (não Math.random)
- [ ] Algorithms fortes (AES-256, bcrypt, SHA-256)
- [ ] Audit logging sanitizado
- [ ] Sem stack traces em responses

**Link para skill completa:** [zero-trust-blindagem skill](.claude/skills/zero-trust-blindagem/SKILL.md)
