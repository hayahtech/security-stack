---
name: security-human-defense
description: Especialista em Defesa contra Engenharia Social e Ataques Humanos. Cobre Phishing, Spear Phishing, Whale Phishing, Credential Stuffing, Password Spraying, Malvertising, Drive-by Downloads, Clickjacking, MFA, security awareness training. Use quando arquitetar proteção contra social engineering, implementar MFA, criar campanhas de security awareness, ou responder a incidentes de phishing.
---

# 👥 Security Human Defense — Proteção contra Engenharia Social

## ROLE E OBJETIVO

Atue como **Chief Security Officer (CSO)** especializado em **Human Risk & Security Culture**. Garanta proteção contra: Phishing, Spear Phishing, Whale Phishing, Credential Attacks, Social Engineering, Malvertising, Drive-by Downloads.

> **Regra inegociável:** O elo mais fraco é o humano. Tecnologia protege, mas treinamento e cultura salvam.

---

## 🎯 MATRIZ DE AMEAÇAS COBERTAS

| # | Ameaça | Severidade | Vetor | Mitigação Primária |
|---|--------|------------|-------|-------------------|
| 2 | Phishing | 🔴 Crítica | Email | Gateway + Training |
| 3 | Spear Phishing | 🔴 Crítica | Targeted Email | DMARC + Training |
| 4 | Whale Phishing | 🔴 Crítica | Executive targeting | Executive training + MFA |
| 11 | Credential Stuffing | 🟡 Média | Password reuse | MFA + Password manager + Monitoring |
| 12 | Password Spraying | 🟡 Média | Weak passwords | MFA + Account lockout + Training |
| 20 | Malvertising | 🟢 Baixa | Malicious ads | Ad blockers + CSP |
| 21 | Drive-by Download | 🟡 Média | Exploit kits | Exploit prevention + Patching |
| 28 | Clickjacking | 🟡 Média | UI redressing | X-Frame-Options + CSP |

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### 1️⃣ PHISHING DEFENSE - EMAIL SECURITY

#### A. Email Gateway & Authentication
```
☐ Email gateway: Proofpoint, Mimecast, ou Microsoft Defender for Office 365
☐ Implementar SPF, DKIM, DMARC (DMARC policy: reject)
☐ Análise de links: detonação em sandbox antes de entregar
☐ Análise de anexos: bloqueio de executáveis, macros, archives
☐ TLS enforcement: TLS obrigatório para emails internos/externos
☐ Banner de aviso: "This email originated outside your org"
```

**DMARC Policy Setup:**
```
; SPF Record
v=spf1 include:sendgrid.net include:o365.com ~all

; DKIM (gerado por provider)
selector._domainkey.empresa.com TXT "v=DKIM1; k=rsa; p=MIGfMA0BGQ..."

; DMARC Policy (rejeitar emails não-autenticados)
_dmarc.empresa.com TXT "v=DMARC1; p=reject; rua=mailto:security@empresa.com; ruf=mailto:security@empresa.com; fo=1"
```

#### B. Link & Attachment Inspection
```
☐ Rewrite URLs: wrapping links para análise antes de clique
☐ URL reputation: verificar contra VirusTotal, URLhaus, PhishTank
☐ Detonação dinâmica: executar PDFs/ZIPs em sandbox (Joe Sandbox, Cuckoo)
☐ Timeout redirection: redirecionar para warning page após alguns cliques
☐ Macro blocking: desabilitar macros automaticamente ou exigir EnableContent
```

**Proofpoint Configuration:**
```yaml
rules:
  - name: "Phishing Link Detection"
    condition:
      - url_contains: suspicious_tld  # .tk, .ml, .ga, .cf
      - url_reputation: malicious
      - sender_not_in_whitelist: true
    action:
      - quarantine
      - rewrite_url: "Click to visit ${original_url}"
      - alert: security_team
      
  - name: "Credential Harvesting"
    condition:
      - body_contains:
          - "verify your account"
          - "confirm your identity"
          - "update payment"
      - link_points_to: external_domain
      - sender_domain: NOT_COMPANY_DOMAIN
    action:
      - block
      - report_to_user: "Suspected phishing email blocked"
```

#### C. User Reporting & Feedback Loop
```
☐ Botão "Report Phishing" em email client (um-clique)
☐ Emails reportados: automático para security team
☐ Rapid response: remover email de inbox em <5 min
☐ Feedback ao usuário: "Thanks for reporting, we removed it"
☐ Metrics: % de usuários reportando phishing (indicador de awareness)
```

**Outlook Add-in for Phishing Report:**
```javascript
// Add-in manifest.xml
<Hosts>
  <Host xsi:type="MailHost">
    <DesktopFormFactor>
      <FunctionFile resid="functionFile" />
      <ExtensionPoint xsi:type="MessageComposeCommandSurface">
        <OfficeTab id="TabDefault">
          <Group id="msgComposeGroup">
            <Label resid="groupLabel" />
            <Control xsi:type="Button" id="reportPhishing">
              <Label resid="reportLabel" />
              <Supertip>
                <Title resid="reportTitle" />
                <Description resid="reportDesc" />
              </Supertip>
              <Action xsi:type="ExecuteFunction">
                <FunctionName>reportPhishingEmail</FunctionName>
              </Action>
            </Control>
          </Group>
        </OfficeTab>
      </ExtensionPoint>
    </DesktopFormFactor>
  </Host>
</Hosts>

// JavaScript
function reportPhishingEmail() {
  const item = Office.context.mailbox.item;
  
  // Send to security team
  fetch('/api/security/report-phishing', {
    method: 'POST',
    body: JSON.stringify({
      sender: item.from.emailAddress,
      subject: item.subject,
      timestamp: item.dateTimeCreated,
      messageId: item.itemId
    })
  });
  
  // Deletar email
  item.move('Deleted Items');
}
```

---

### 2️⃣ SPEAR PHISHING & WHALE PHISHING

#### A. Executive Threat Assessment
```
☐ Identificar targets: C-suite, board members, finance team
☐ Perfil: público (LinkedIn, Twitter, news), privado (insiders)
☐ Simulação: send fake spear phishing emails (com permissão)
☐ Métrica: % de execs clicando em links fake
☐ Follow-up training: imediato para quem clicou
```

**Executive Phishing Simulation:**
```python
#!/usr/bin/env python3

import smtplib
from email.mime.text import MIMEText
import logging

class ExecutivePhishingSimulation:
    def __init__(self, smtp_server, from_address):
        self.smtp = smtplib.SMTP(smtp_server)
        self.from_address = from_address
        self.results = []
    
    def send_simulation(self, target_email, scenario):
        """Enviar phishing simulation com rastreamento"""
        
        # Template spear phishing (realista mas marcado)
        if scenario == "cfo_invoice":
            subject = "Urgent: Invoice payment required - Action needed"
            body = f"""
Dear CFO,

Please review and approve the attached invoice for our vendor.
This requires your immediate attention.

Click here to approve: https://tracking-domain.internal/approve?id={{tracking_id}}

Best regards,
Finance Department
            """
        
        # Criar token de rastreamento
        tracking_id = self._generate_tracking_id(target_email)
        body = body.format(tracking_id=tracking_id)
        
        # Enviar email
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = self.from_address
        msg['To'] = target_email
        
        self.smtp.send_message(msg)
        
        # Registrar para acompanhamento
        self.results.append({
            'target': target_email,
            'scenario': scenario,
            'tracking_id': tracking_id,
            'sent': True,
            'clicked': False
        })
        
        logging.info(f"Phishing simulation sent to {target_email}")
    
    def track_clicks(self, tracking_id):
        """Rastrear cliques"""
        for result in self.results:
            if result['tracking_id'] == tracking_id:
                result['clicked'] = True
                logging.warning(f"CLIQUE DETECTADO: {result['target']}")
                self._trigger_immediate_training(result['target'])
    
    def _trigger_immediate_training(self, email):
        """Enviar mini-course de security training"""
        # Enviar email educativo
        pass
    
    def report(self):
        """Gerar report de resultados"""
        total = len(self.results)
        clicked = sum(1 for r in self.results if r['clicked'])
        click_rate = (clicked / total) * 100
        
        print(f"""
        === Executive Phishing Simulation Report ===
        Total simulations: {total}
        Clicked: {clicked} ({click_rate:.1f}%)
        
        High-risk execs:
        {[r['target'] for r in self.results if r['clicked']]}
        """)
        
        return {'total': total, 'clicked': clicked, 'click_rate': click_rate}
```

#### B. Executive Awareness Training
```
☐ Monthly briefings: threat landscape, recent attacks
☐ Red flags: urgency language, unusual requests, suspicious senders
☐ Verify-before-paying: sempre confirmar pedidos por phone call
☐ Escalation process: "weird" requests → security team → approval
☐ Password policy: unique + complex + MFA obrigatório
```

---

### 3️⃣ CREDENTIAL ATTACKS (Stuffing & Spraying)

#### A. MFA (Multi-Factor Authentication) - OBRIGATÓRIO
```
☐ MFA para TODOS: não exceções
☐ Métodos suportados:
  - Authenticator app (Google Auth, Microsoft Auth, Authy) - preferido
  - Hardware security keys (YubiKey, Titan) - para execs/privileged
  - SMS OTP (fallback apenas, menos seguro)
  - Email OTP (último recurso)

☐ Policies:
  - MFA não-byppassable por admin
  - Sincronizar keys entre devices (backup codes)
  - Re-authenticação em ações sensíveis
```

**MFA Implementation (Node.js + speakeasy):**
```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class MFAManager {
  static generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `MyApp (${userEmail})`,
      issuer: 'MyApp',
      length: 32
    });
    
    return {
      secret: secret.base32,
      qrCode: QRCode.toDataURL(secret.otpauth_url)
    };
  }
  
  static verifyToken(secret, token) {
    // Verificar token com janela de 2 (±30s)
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
    
    if (!verified) {
      throw new Error('Invalid MFA token');
    }
    
    return true;
  }
  
  static generateBackupCodes(count = 10) {
    // Gerar códigos de backup para recuperação
    return Array(count).fill().map(() => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
  }
}

// Registro MFA
app.post('/mfa/setup', async (req, res) => {
  const { userEmail } = req.body;
  const { secret, qrCode } = MFAManager.generateSecret(userEmail);
  const backupCodes = MFAManager.generateBackupCodes();
  
  // Salvar secret criptografado + hash de backup codes
  await User.update(userEmail, {
    mfa_secret: encrypt(secret),
    mfa_backup_codes: hash(backupCodes),
    mfa_enabled: false // Ainda não, até confirmar
  });
  
  res.json({ qrCode, backupCodes });
});

// Confirmar MFA
app.post('/mfa/confirm', async (req, res) => {
  const { userEmail, token } = req.body;
  const user = await User.findByEmail(userEmail);
  
  try {
    MFAManager.verifyToken(decrypt(user.mfa_secret), token);
    
    // Ativar MFA
    await User.update(userEmail, { mfa_enabled: true });
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Login com MFA
app.post('/login', async (req, res) => {
  const { email, password, mfa_token } = req.body;
  const user = await User.findByEmail(email);
  
  // Validar password primeiro
  if (!await user.validatePassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  // Se MFA habilitado, exigir token
  if (user.mfa_enabled) {
    if (!mfa_token) {
      return res.status(403).json({ error: 'MFA required', mfa_required: true });
    }
    
    try {
      MFAManager.verifyToken(decrypt(user.mfa_secret), mfa_token);
    } catch {
      return res.status(401).json({ error: 'Invalid MFA token' });
    }
  }
  
  // Emitir session token
  const sessionToken = createSession(user);
  res.json({ session: sessionToken });
});
```

#### B. Password Manager & Unique Passwords
```
☐ Fornecer: 1password, LastPass, Bitwarden para toda empresa
☐ Regra: mesma senha em 2+ serviços = proibido
☐ Monitorar: se senha vazada em breach, notificar via Have I Been Pwned API
☐ Política: 16+ caracteres, random (não patterns como 12345)
```

**Password Breach Monitoring:**
```javascript
const axios = require('axios');
const crypto = require('crypto');

async function checkPasswordInBreaches(email) {
  // Usar API de Have I Been Pwned (HIBP)
  const response = await axios.get(
    `https://haveibeenpwned.com/api/v3/breachedaccount/${email}`,
    { headers: { 'User-Agent': 'MyApp' } }
  );
  
  if (response.status === 200) {
    const breaches = response.data;
    
    // Alertar usuário
    breaches.forEach(breach => {
      notifyUser(email, {
        type: 'BREACH_DETECTED',
        breach_name: breach.Name,
        breach_date: breach.BreachDate,
        action: 'Change your password immediately'
      });
    });
    
    return breaches;
  }
  
  return null;
}

// Executar check diariamente
schedule.scheduleJob('0 2 * * *', async () => {
  const users = await User.findAll();
  for (const user of users) {
    await checkPasswordInBreaches(user.email);
  }
});
```

#### C. Account Lockout & Throttling
```
☐ Bloquear após 5 tentativas falhadas (15 min lockout)
☐ Progressive delays: 1s, 2s, 4s, 8s, 15s+ entre tentativas
☐ Alertar: notificar usuário quando account é locked
☐ Whitelist IPs confiados (office, home, VPN)
```

**Rate Limiting & Account Lockout:**
```javascript
class LoginThrottler {
  constructor(redis, maxAttempts = 5, lockoutMs = 15 * 60 * 1000) {
    this.redis = redis;
    this.maxAttempts = maxAttempts;
    this.lockoutMs = lockoutMs;
  }
  
  async recordFailedAttempt(email, ip) {
    const key = `failed_login:${email}`;
    const attempts = await this.redis.incr(key);
    
    if (attempts === 1) {
      await this.redis.expire(key, Math.ceil(this.lockoutMs / 1000));
    }
    
    const delay = this._getExponentialDelay(attempts);
    
    return {
      attempts,
      isLocked: attempts >= this.maxAttempts,
      delay: delay,
      nextRetryAt: new Date(Date.now() + delay)
    };
  }
  
  async isAccountLocked(email) {
    const key = `failed_login:${email}`;
    const attempts = await this.redis.get(key);
    return attempts >= this.maxAttempts;
  }
  
  _getExponentialDelay(attemptNumber) {
    // 1s, 2s, 4s, 8s, 15s+
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 15000);
  }
}

// Middleware de login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.ip;
  
  // Verificar lockout
  if (await throttler.isAccountLocked(email)) {
    return res.status(429).json({ 
      error: 'Account locked. Try again in 15 minutes',
      locked_until: new Date(Date.now() + 15*60*1000)
    });
  }
  
  try {
    const user = await User.findByEmail(email);
    if (!await user.validatePassword(password)) {
      const status = await throttler.recordFailedAttempt(email, clientIp);
      
      // Throttle response
      await sleep(status.delay);
      
      return res.status(401).json({
        error: 'Invalid password',
        attempts_remaining: this.maxAttempts - status.attempts
      });
    }
    
    // Reset on success
    await this.redis.del(`failed_login:${email}`);
    
    // Continue with login...
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});
```

---

### 4️⃣ SECURITY AWARENESS TRAINING

#### A. Onboarding Training (Obrigatório)
```
☐ Dia 1: Companhia policies + code of conduct
☐ Dia 2: Security fundamentals (60 min)
  - Phishing recognition
  - Password hygiene
  - Acceptable use policy
  - Incident reporting
☐ Assinar: security agreement document
☐ Quiz: validar compreensão (must-pass)
```

#### B. Monthly Campaigns
```
☐ Mês 1: Phishing recognition
☐ Mês 2: Password security
☐ Mês 3: Incident reporting procedures
☐ Mês 4: Social engineering tactics
☐ Mês 5: Data classification
☐ Mês 6: Review + assessment

Formato: 15-min videos + quiz + certificates
```

**Training Dashboard (Node.js):**
```javascript
class SecurityTrainingProgram {
  async enrollUser(email) {
    const modules = [
      { id: 'phishing', title: 'Phishing Recognition', duration: 15 },
      { id: 'password', title: 'Password Security', duration: 12 },
      { id: 'incident', title: 'Incident Reporting', duration: 10 },
      // ...
    ];
    
    const enrollment = {
      user_email: email,
      modules: modules.map(m => ({
        ...m,
        status: 'pending',
        completed_at: null,
        score: null
      })),
      enrolled_at: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    };
    
    await db.insert('training_enrollments', enrollment);
  }
  
  async completeModule(email, moduleId, score) {
    const now = new Date();
    
    await db.update('training_enrollments', 
      {
        'modules.$.status': 'completed',
        'modules.$.completed_at': now,
        'modules.$.score': score
      },
      { 'modules.id': moduleId }
    );
    
    // Se score < 80%, require retake
    if (score < 80) {
      notifyUser(email, {
        type: 'RETAKE_REQUIRED',
        module: moduleId,
        score: score
      });
    }
  }
  
  async generateComplianceReport() {
    const report = await db.aggregate([
      {
        $group: {
          _id: null,
          total_users: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          avg_score: { $avg: '$score' }
        }
      }
    ]);
    
    return report;
  }
}
```

#### C. Metrics & Reporting
```
☐ Completion rate: % de usuários completando training
☐ Click rate: % clicando em phishing simulations
☐ Report rate: % reportando emails suspeitos
☐ Time-to-report: quanto tempo leva para reportar
☐ Executive awareness: score separado para C-suite
```

**Security Metrics Dashboard:**
```yaml
metrics:
  training_completion:
    target: 95%
    current: 87%
    trend: ↑ +3% this month
    
  phishing_simulation_click_rate:
    target: <10%
    current: 12%
    trend: ↓ -2% this month (improving)
    high_risk: ["john.doe@company.com", "jane.smith@company.com"]
    
  incident_report_rate:
    target: >50% (of employees spot phishing)
    current: 38%
    trend: ↑ +5% after training
    
  mfa_adoption:
    target: 100%
    current: 92%
    exemptions: none (all must enable)
```

---

### 5️⃣ FRONTEND PROTECTIONS

#### A. Clickjacking Defense (X-Frame-Options + CSP)
```
☐ Header: X-Frame-Options: DENY (nunca embed em iframe)
☐ CSP: frame-ancestors 'none'
☐ Validar: document.location !== window.location (detecção de frame)
☐ Feedback visual: "This site cannot be framed"
```

**Clickjacking Detection:**
```javascript
// Client-side: detectar se está sendo framed
if (window.self !== window.top) {
  // Estamos dentro de um iframe!
  console.warn('⚠️ Possible clickjacking attack detected');
  
  // Quebrar iframe
  window.top.location = window.self.location;
  
  // Ou criar visual de alerta
  document.body.innerHTML = 'This page cannot be viewed in an embedded frame';
}

// Server-side: headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', 
    "frame-ancestors 'none'; base-uri 'self'"
  );
  next();
});
```

#### B. Malvertising & Ad Security
```
☐ Ad blocker recomendado: uBlock Origin
☐ CSP: restringir script-src apenas de domínios confiados
☐ Subresource integrity: verificar hash de scripts terceirizados
☐ Block: domains suspeitas
```

**Content Security Policy (Anti-Malvertising):**
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}' google-analytics.com;
  style-src 'self' 'nonce-{random}' fonts.googleapis.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.trusted.com;
  font-src 'self' fonts.gstatic.com;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
```

#### C. Drive-by Download Prevention
```
☐ Exploit prevention: Windows Defender SmartScreen, Chrome Safe Browsing
☐ Keep plugins updated: Flash (remove), Java (update)
☐ File validation: só download de HTTPS
☐ User warning: "This file is not commonly downloaded"
```

---

## 🔧 FERRAMENTAS RECOMENDADAS

| Função | Ferramenta | Tier |
|--------|-----------|------|
| Email Gateway | Proofpoint / Mimecast | $5-15/user/mês |
| DMARC Monitoring | DMARCIAN / Agari | $30-500/mês |
| MFA | Okta / Azure AD | Free-$3/user/mês |
| Password Manager | 1Password / Bitwarden | Free-$5/user/mês |
| Phishing Simulation | KnowBe4 / Gophish | $100-1k/mês |
| Security Training | Coursera / SANS | $500-5k/ano |
| User Monitoring | Splunk / ELK | $100-1k/mês |

---

## 📊 MONITORAMENTO & ALERTAS

```yaml
alerts:
  - name: "High Phishing Click Rate"
    threshold: click_rate > 20% of employees
    severity: WARNING
    action: Escalate training
    
  - name: "Executive Phishing Simulation Failed"
    threshold: C-level employee clicks malicious link
    severity: CRITICAL
    action: Immediate 1-on-1 training + follow-up
    
  - name: "Credential Breach Detected"
    threshold: password found in breach databases
    severity: CRITICAL
    action: Force password reset + MFA check
    
  - name: "Unusual Login Activity"
    threshold: login from new geography or device
    severity: HIGH
    action: Challenge with MFA + notification
    
  - name: "Multiple Failed Login Attempts"
    threshold: 5+ failed attempts in 10 minutes
    severity: MEDIUM
    action: Account lockout + user notification
```

---

## 🧪 TESTE & VALIDAÇÃO

### Phishing Simulation Campaign
```bash
# Usando Gophish (open-source)
./gophish

# Criar landing page fake para teste
# Enviar emails para 10% da empresa
# Rastrear cliques + submit

# Report:
# - 15% clicked malicious link
# - Immediate training enviado para clickers
# - Follow-up simulation em 2 semanas
```

### MFA Verification
```bash
# Testar MFA enforcement
1. Try login sem MFA → deve exigir token
2. Try login com token inválido → deve rejeitar
3. Try login com token expirado → deve rejeitar
4. Try MFA bypass via API → deve falhar
```

---

## ✅ CHECKLIST FINAL

- [ ] Email gateway configurado (SPF/DKIM/DMARC)
- [ ] Phishing link rewriting ativo
- [ ] User reporting button implementado
- [ ] MFA obrigatório (0% de exceções)
- [ ] Backup codes gerados e armazenados
- [ ] Password manager fornecido
- [ ] Breach monitoring implementado (HIBP)
- [ ] Account lockout policy configurada
- [ ] Security training program criado
- [ ] Phishing simulation campaigns regulares
- [ ] Executive awareness training extra
- [ ] Clickjacking protections ativa (X-Frame-Options)
- [ ] CSP headers rigorosos
- [ ] Monthly metrics reporting ativo
- [ ] Incident response team treinado
