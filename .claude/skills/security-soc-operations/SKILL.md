---
name: security-soc-operations
description: Especialista em Security Operations Center (SOC) e Incident Response. Cobre SIEM operations, alert triage, incident handling, forensics, threat hunting workflows, postmortems, IR playbooks. Use quando montar SOC, responder a incidentes ativos, fazer forensics, ou estruturar processos de Incident Response (NIST 800-61).
---

# 🚨 Security SOC Operations — Centro de Operações de Segurança

## ROLE E OBJETIVO

Atue como **SOC Manager** e **Incident Response Commander**. Coordene resposta a incidentes seguindo NIST 800-61, mantenha SLAs operacionais, e construa cultura de melhoria contínua.

> **Regra inegociável:** Velocidade de resposta = magnitude do dano. MTTD + MTTR são suas KPIs principais.

---

## 🎯 FRAMEWORK NIST 800-61 (Incident Response)

```
1. PREPARATION       → Ferramentas, processos, training
2. DETECTION         → SIEM alerts, threat hunting, user reports
3. ANALYSIS          → Triage, scope, severity, evidence
4. CONTAINMENT       → Isolate, prevent spread
5. ERADICATION       → Remove threat completely
6. RECOVERY          → Restore operations safely
7. POST-INCIDENT     → Lessons learned, improve
```

---

## 📋 OPERAÇÕES DE SOC

### 1️⃣ ALERT TRIAGE WORKFLOW

```
ALERT RECEIVED
    │
    ├─→ AUTO-ENRICHMENT (Tier 0)
    │   - User context (HR data)
    │   - Asset criticality (CMDB)
    │   - Threat intel (IoCs)
    │   - Historical patterns
    │
    ├─→ TIER 1: TRIAGE (5-15 min)
    │   - True positive? False positive?
    │   - Severity (P1/P2/P3/P4)
    │   - Initial scope
    │   - Escalate or close
    │
    ├─→ TIER 2: INVESTIGATION (1-4 hours)
    │   - Deep analysis
    │   - Lateral movement check
    │   - Evidence preservation
    │   - Containment recommendations
    │
    └─→ TIER 3: HUNTING & FORENSICS (4-24 hours)
        - Adversary attribution
        - Full kill chain mapping
        - Memory/disk forensics
        - Custom detections
```

**SOC Triage Decision Tree:**
```python
class AlertTriager:
    def triage(self, alert):
        # Step 1: Validate
        if self._is_known_false_positive(alert):
            return self._close_alert(alert, reason='Known FP, tuning needed')
        
        # Step 2: Enrich
        context = {
            'user': self._lookup_user(alert.user),
            'asset': self._lookup_asset(alert.host),
            'threat_intel': self._check_iocs(alert),
            'history': self._user_history(alert.user, days=30)
        }
        
        # Step 3: Severity
        severity = self._calculate_severity(alert, context)
        
        # Step 4: Route
        if severity == 'P1':  # Critical
            return self._emergency_response(alert, context)
        elif severity == 'P2':  # High
            return self._escalate_to_tier2(alert, context)
        elif severity == 'P3':  # Medium
            return self._standard_investigation(alert, context)
        else:  # P4 - Low
            return self._monitor_only(alert, context)
    
    def _calculate_severity(self, alert, context):
        score = alert.base_severity
        
        # Boost: VIP user
        if context['user'].is_vip:
            score += 30
        
        # Boost: Critical asset
        if context['asset'].criticality == 'CROWN_JEWEL':
            score += 40
        
        # Boost: Known IoCs match
        if context['threat_intel']['matched_iocs']:
            score += 50
        
        # Boost: Multiple alerts same user (correlation)
        if context['history']['recent_alerts'] > 3:
            score += 25
        
        # Map score to severity
        if score >= 100: return 'P1'
        elif score >= 70: return 'P2'
        elif score >= 40: return 'P3'
        else: return 'P4'
```

---

### 2️⃣ INCIDENT RESPONSE PLAYBOOKS

#### Playbook P1: Active Ransomware Attack

```yaml
playbook: P1_RANSOMWARE
trigger: 
  - mass_file_encryption_detected
  - ransom_note_found
  - known_ransomware_signature

immediate_actions: # T+0 to T+15 minutes
  - action: ISOLATE infected hosts (EDR network containment)
    owner: SOC Tier 1
    sla: 5 minutes
  
  - action: DISABLE compromised user accounts
    owner: SOC Tier 1
    sla: 10 minutes
  
  - action: BLOCK known C2 IPs at firewall
    owner: SOC Tier 1
    sla: 10 minutes
  
  - action: NOTIFY incident commander + executive team
    owner: SOC Tier 1
    sla: 15 minutes

investigation: # T+15 min to T+4 hours
  - action: Identify patient zero
    method: Process tree analysis, file creation timeline
  
  - action: Map full scope (lateral movement)
    method: Network flow analysis, authentication logs
  
  - action: Identify ransomware family
    method: File signature, ransom note, behavior
  
  - action: Check backup integrity
    method: Verify backups not encrypted/deleted
  
  - action: Identify exfiltrated data (double extortion)
    method: Network egress analysis, DLP logs

containment: # T+4 to T+8 hours
  - action: Network segmentation enforcement
  - action: Reset ALL credentials (password + MFA)
  - action: Deploy emergency patches
  - action: Block ransomware C2 globally

eradication: # T+8 to T+24 hours
  - action: Remove malware from all systems
  - action: Patch initial access vector
  - action: Rebuild compromised systems
  - action: Forensic preservation (legal holds)

recovery: # T+24 to T+72 hours
  - action: Restore from clean backups
  - action: Verify integrity before reconnection
  - action: Phased restoration (critical first)
  - action: Enhanced monitoring period (30 days)

post_incident: # T+72+ hours
  - action: Postmortem within 5 business days
  - action: Update playbooks with lessons learned
  - action: Tabletop exercise based on incident
  - action: Cyber insurance claim filing

communication:
  internal:
    - Executive: every 2 hours during P1
    - Employees: status updates
    - Board: if material
  external:
    - Customers: if data exfiltrated
    - Regulators: per LGPD/GDPR (72h)
    - Law enforcement: FBI/Federal Police
    - Cyber insurance: immediate
    - PR: hold until facts confirmed

decision_no_pay:
  rationale:
    - No guarantee of decryption
    - Funds criminal enterprise
    - May violate sanctions (OFAC)
    - May trigger more attacks
```

#### Playbook P1: Data Breach

```yaml
playbook: P1_DATA_BREACH
trigger:
  - large_data_exfiltration_detected
  - sensitive_data_in_external_traffic
  - DLP_critical_alert

immediate_actions:
  - Identify scope (what data, how much, whose)
  - Stop active exfiltration
  - Preserve evidence
  - Activate legal counsel

regulatory_timeline:
  LGPD_ANPD: 
    deadline: "as soon as possible"
    contents: nature, affected, mitigation
  
  GDPR_DPA:
    deadline: 72 hours
    contents: nature, categories, consequences, measures
  
  affected_individuals:
    deadline: "without undue delay" (high risk)
    contents: nature, contact, consequences, recommendations
```

---

### 3️⃣ FORENSICS WORKFLOW

#### Memory Forensics (Volatility 3)
```bash
# Capturar memória
winpmem.exe -o memory.raw

# Análise com Volatility 3
vol -f memory.raw windows.info
vol -f memory.raw windows.pslist
vol -f memory.raw windows.netscan
vol -f memory.raw windows.malfind
vol -f memory.raw windows.cmdline

# Process tree visualization
vol -f memory.raw windows.pstree

# Buscar mimikatz patterns
vol -f memory.raw windows.malfind --dump

# Extrair processo suspeito
vol -f memory.raw windows.dumpfiles --pid 1234
```

#### Disk Forensics (Autopsy/Sleuthkit)
```bash
# Criar imagem forense (chain of custody!)
dd if=/dev/sda of=/forensics/case-001.dd bs=4M conv=noerror,sync
sha256sum /forensics/case-001.dd > case-001.sha256

# Analisar com Sleuthkit
mmls case-001.dd  # Particionamento
fls -r -o 2048 case-001.dd  # Listar arquivos
icat -o 2048 case-001.dd 12345 > recovered_file

# Timeline forense
mactime -b body.txt > timeline.csv
```

#### Network Forensics (Zeek + Wireshark)
```bash
# Análise PCAP com Zeek
zeek -r capture.pcap

# Outputs:
# - conn.log (todas as conexões)
# - dns.log (queries DNS)
# - http.log (requests HTTP)
# - ssl.log (handshakes TLS)
# - files.log (arquivos transferidos)

# Buscar IoCs
zeek-cut id.orig_h id.resp_h id.resp_p < conn.log | sort -u

# Extrair arquivos suspeitos
zeek -r capture.pcap LocalZeekScripts/extract-files.zeek
```

---

### 4️⃣ KEY METRICS & SLAs

```yaml
detection_metrics:
  MTTD (Mean Time To Detect):
    target: < 1 hour
    measurement: alert_time - actual_compromise_time
  
  alerts_per_analyst_per_shift:
    target: < 50 (sustainable)
    current_avg: 75 (need automation)
  
  false_positive_rate:
    target: < 5%
    current: 12% (need tuning)

response_metrics:
  MTTR (Mean Time To Respond):
    P1: < 1 hour
    P2: < 4 hours
    P3: < 24 hours
    P4: < 72 hours
  
  escalation_accuracy:
    target: > 90% correct severity assignment
  
  containment_time:
    P1: < 4 hours
    P2: < 24 hours

quality_metrics:
  reopened_incidents:
    target: < 5%
  
  postmortem_completion:
    target: 100% within 5 business days for P1/P2
  
  improvement_actions_completed:
    target: > 80% within 30 days
```

---

### 5️⃣ POSTMORTEM TEMPLATE

```markdown
# Incident Postmortem: [INC-YYYY-MM-DD-001]

## Incident Summary
- **Severity**: P1
- **Detection time**: 2026-04-27 14:23 UTC
- **Resolution time**: 2026-04-27 22:15 UTC
- **Duration**: 7h 52m
- **Impact**: 250 users locked out, $50k revenue loss

## Timeline (UTC)
| Time | Event |
|------|-------|
| 13:00 | Initial compromise (phishing email) |
| 14:23 | EDR alert triggered |
| 14:35 | Tier 1 acknowledged, escalated to T2 |
| 15:10 | Containment initiated (host isolation) |
| 17:30 | Patient zero identified |
| 19:45 | Eradication completed |
| 22:15 | Services restored |

## Root Cause Analysis (5 Whys)

**Why 1**: Why did the user click the phishing link?
→ Email looked legitimate, mimicked CEO

**Why 2**: Why didn't email gateway block it?
→ DMARC was set to "p=none" (monitoring only)

**Why 3**: Why was DMARC in monitoring mode?
→ Concern about blocking legitimate emails during rollout

**Why 4**: Why wasn't rollout completed?
→ No clear ownership, deprioritized for new features

**Why 5**: Why no clear ownership?
→ Security team underresourced, no dedicated email security engineer

**Root Cause**: Inadequate email security posture due to resource constraints

## What Went Well
- Rapid detection (within 1.5h of activity)
- Effective containment prevented lateral movement
- Communication was clear and timely
- No data exfiltration confirmed

## What Went Wrong
- DMARC enforcement was incomplete
- User had not completed phishing training (90% completion target, was at 75%)
- Initial triage took 12 minutes (target: 5 minutes)
- Backup verification took longer than expected

## Action Items
| # | Action | Owner | Due | Status |
|---|--------|-------|-----|--------|
| 1 | Move DMARC to "p=reject" | Security | 1 week | Open |
| 2 | Mandatory phishing training | HR | 2 weeks | Open |
| 3 | Hire email security engineer | Security | 30 days | Approved |
| 4 | Update IR playbook | SOC | 5 days | In progress |
| 5 | Tabletop exercise | All | 30 days | Scheduled |

## Lessons Learned
1. Security configuration drift is real risk
2. Need dedicated owner for each control
3. Training metrics must be tracked + enforced
4. Resource constraints create cascading risk
```

---

## 🔧 SOC TECH STACK

```yaml
core:
  siem: 
    primary: Splunk Enterprise Security
    backup: Wazuh (open-source)
  
  soar:
    primary: Cortex XSOAR
    use_cases: 
      - Auto-enrichment
      - Containment automation
      - Notification routing
  
  edr:
    primary: CrowdStrike Falcon
    coverage: 100% endpoints + servers
  
  threat_intel:
    sources: [Mandiant, Recorded Future, MISP, OTX]
    integration: Auto-IoC import to SIEM/firewall
  
  case_management:
    primary: TheHive
    workflow: Alert → Case → Tasks → Resolution
  
forensics:
  memory: Volatility 3, Magnet RAM Capture
  disk: Autopsy, FTK Imager, EnCase
  network: Wireshark, Zeek, Suricata
  cloud: GRR Rapid Response, AWS GuardDuty
  
collaboration:
  ticketing: Jira Service Management
  chat: Slack (dedicated #incident channels)
  documentation: Confluence
  on-call: PagerDuty
```

---

## ✅ SOC MATURITY CHECKLIST

### Level 1 - Foundational
- [ ] SIEM deployed with critical log sources
- [ ] 24/7 monitoring (in-house or MSSP)
- [ ] Basic playbooks for top 10 alert types
- [ ] Incident classification framework
- [ ] Communication plan documented

### Level 2 - Operational
- [ ] All log sources integrated (>95% coverage)
- [ ] Threat intelligence integration
- [ ] Playbooks for top 50 scenarios
- [ ] Metrics tracking + dashboards
- [ ] Quarterly tabletop exercises

### Level 3 - Advanced
- [ ] SOAR automation for common alerts
- [ ] UEBA implemented
- [ ] Threat hunting program (weekly)
- [ ] Purple team exercises
- [ ] Continuous detection engineering

### Level 4 - Optimized
- [ ] ML-based anomaly detection
- [ ] Custom threat intelligence platform
- [ ] Adversary emulation (Atomic, MITRE Caldera)
- [ ] Zero-day research capability
- [ ] Industry threat sharing (ISACs)
