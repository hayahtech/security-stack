---
name: security-advanced-threats
description: Especialista em Defesa contra Ameaças Avançadas (Advanced Threat Defense). Cobre APT (Advanced Persistent Threats), Zero-Click Exploits, Zero-Day Vulnerabilities, Water Hole Attacks, Cryptojacking, Threat Hunting, SIEM, SOC operations. Use quando arquitetar SOC, implementar threat hunting, responder a incidentes APT, gerenciar zero-day patches, ou integrar threat intelligence.
---

# 🎯 Security Advanced Threats — Defesa contra Ameaças Avançadas

## ROLE E OBJETIVO

Atue como **Threat Hunter Sênior** e **SOC Analyst Tier 3** especializado em **APT (Advanced Persistent Threats)** e **Zero-Day Defense**. Garanta detecção e resposta a ameaças sofisticadas que evadem defesas tradicionais.

> **Regra inegociável:** Assume breach. APTs já estão dentro — encontre-os antes que causem dano. Threat hunting é proativo, não reativo.

---

## 🎯 MATRIZ DE AMEAÇAS COBERTAS

| # | Ameaça | Severidade | Tipo | Mitigação Primária |
|---|--------|------------|------|-------------------|
| 16 | Zero-Click Exploit | 🔴 Crítica | Remote exploit | Patch mgmt + Sandboxing + Threat intel |
| 17 | APT (Advanced Persistent Threat) | 🔴 Crítica | Stealth | EDR + SIEM + Threat hunting + SOC |
| 18 | Supply Chain Attack | 🔴 Crítica | Trusted relationship | SBOM + Behavioral analysis + Zero trust |
| 22 | Cryptojacking | 🟡 Média | Resource theft | Resource monitoring + Anomaly detection |
| 24 | Water Hole Attack | 🟡 Média | Targeted infection | DNS filtering + EDR + Threat intel |

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### 1️⃣ APT DEFENSE — KILL CHAIN MITIGATION

#### A. Cyber Kill Chain Framework (Lockheed Martin)

```
1. RECONNAISSANCE   → OSINT monitoring + Honeytokens
2. WEAPONIZATION    → Threat intel feeds
3. DELIVERY         → Email gateway + Web filtering
4. EXPLOITATION     → EDR + Patch mgmt + EMET/HVCI
5. INSTALLATION     → AppLocker + Code signing + FIM
6. C2 (Command)     → DNS filtering + Network monitoring
7. ACTIONS          → DLP + Behavior analytics
```

#### B. MITRE ATT&CK Coverage Matrix

```
☐ Mapear detection rules para cada TTP (Tactics, Techniques, Procedures)
☐ Coverage mínimo 80% das técnicas mais comuns
☐ Ferramentas: ATT&CK Navigator, DeTT&CT, Atomic Red Team
☐ Auditoria mensal: gaps + new TTPs
```

**ATT&CK Coverage Tracking:**
```yaml
coverage:
  initial_access:
    - T1566 (Phishing): COVERED (email gateway + sandbox)
    - T1190 (Exploit Public App): COVERED (WAF + patch mgmt)
    - T1133 (External Remote Services): COVERED (MFA + VPN)
    - T1078 (Valid Accounts): PARTIAL (need UEBA)
    
  execution:
    - T1059 (Command and Scripting): COVERED (PowerShell logging + AMSI)
    - T1053 (Scheduled Task): COVERED (FIM + audit logs)
    - T1106 (Native API): GAPS (need API monitoring)
    
  persistence:
    - T1547 (Boot/Logon Autostart): COVERED (registry monitoring)
    - T1136 (Create Account): COVERED (AD audit + alerts)
    - T1098 (Account Manipulation): COVERED (privileged access mgmt)
    
  defense_evasion:
    - T1027 (Obfuscated Files): GAPS (need ML-based detection)
    - T1070 (Indicator Removal): COVERED (immutable logs)
    - T1562 (Impair Defenses): COVERED (EDR tamper protection)
```

#### C. Threat Hunting Process

```python
class ThreatHunter:
    """
    Hipótese-driven threat hunting baseado em MITRE ATT&CK
    """
    
    def __init__(self, siem_client, edr_client, threat_intel):
        self.siem = siem_client
        self.edr = edr_client
        self.intel = threat_intel
    
    def hunt_credential_dumping(self, time_range='7d'):
        """
        Hunt para T1003 - OS Credential Dumping
        Indicators:
        - LSASS access from non-system processes
        - Mimikatz patterns
        - Mass authentication failures
        """
        
        hypotheses = [
            {
                'name': 'LSASS Memory Access',
                'query': '''
                    process_name=lsass.exe
                    AND access_type=ReadProcessMemory
                    AND requesting_process NOT IN (system_processes_whitelist)
                ''',
                'severity': 'CRITICAL'
            },
            {
                'name': 'Mimikatz Indicators',
                'query': '''
                    (cmdline_contains="sekurlsa" 
                     OR cmdline_contains="mimikatz"
                     OR cmdline_contains="invoke-mimikatz"
                     OR file_hash IN (mimikatz_known_hashes))
                ''',
                'severity': 'CRITICAL'
            },
            {
                'name': 'Suspicious Authentication Pattern',
                'query': '''
                    event_id=4625  -- Failed logon
                    | bin _time span=5m 
                    | stats count by src_ip, target_account
                    | where count > 50
                ''',
                'severity': 'HIGH'
            }
        ]
        
        findings = []
        for hypothesis in hypotheses:
            results = self.siem.search(hypothesis['query'], time_range)
            if results:
                findings.append({
                    'hypothesis': hypothesis['name'],
                    'severity': hypothesis['severity'],
                    'matches': len(results),
                    'samples': results[:5]
                })
        
        return findings
    
    def hunt_lateral_movement(self):
        """
        Hunt para T1021 - Remote Services / Lateral Movement
        """
        return self.siem.search('''
            event_id IN (4624, 4648)  -- Successful logon, explicit creds
            | bin _time span=1h
            | stats dc(target_host) as unique_hosts by src_account, src_ip
            | where unique_hosts > 5  -- 1 user, 5+ hosts em 1h = suspicious
            | sort -unique_hosts
        ''')
    
    def hunt_persistence(self):
        """
        Hunt para T1547 - Boot/Logon Autostart Execution
        """
        registry_keys = [
            'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
            'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
            'HKLM\\System\\CurrentControlSet\\Services'
        ]
        
        findings = []
        for key in registry_keys:
            new_entries = self.siem.search(f'''
                event_id=4657  -- Registry value modified
                AND object_name="{key}"
                AND _time > now() - 7d
            ''')
            
            for entry in new_entries:
                # Verificar se é assinatura conhecida ou nova
                if not self._is_known_legitimate(entry):
                    findings.append({
                        'key': key,
                        'value': entry.value_name,
                        'process': entry.creating_process,
                        'risk': self._calculate_risk(entry)
                    })
        
        return findings
    
    def _is_known_legitimate(self, entry):
        """Verificar contra whitelist + threat intel"""
        return entry.process_hash in self.whitelist_hashes
```

#### D. UEBA (User & Entity Behavior Analytics)

```
☐ Baseline normal behavior por usuário/dispositivo
☐ Detectar anomalias: 
  - Login fora de horário usual
  - Acesso a recursos não-típicos
  - Volume de dados anormal (exfiltração)
  - Geografia inusitada
☐ Risk scoring: cada anomalia += score
☐ Auto-response: score > threshold → MFA challenge ou block
```

**UEBA Risk Scoring (Python):**
```python
class UEBAScorer:
    BASELINE_FACTORS = {
        'login_hour': 0.15,
        'login_geography': 0.20,
        'login_device': 0.10,
        'data_volume': 0.20,
        'resource_access': 0.15,
        'failed_attempts': 0.20
    }
    
    def calculate_risk(self, user_id, current_event):
        baseline = self.get_baseline(user_id)
        score = 0
        flags = []
        
        # Hour anomaly
        if not self._is_normal_hour(current_event['time'], baseline['hours']):
            score += 0.15 * 100
            flags.append('UNUSUAL_HOUR')
        
        # Geography
        if current_event['country'] not in baseline['countries']:
            score += 0.20 * 100
            flags.append('NEW_GEOGRAPHY')
        
        # Device
        if current_event['device_id'] not in baseline['devices']:
            score += 0.10 * 100
            flags.append('NEW_DEVICE')
        
        # Data volume (z-score > 3 = anomaly)
        z_score = (current_event['data_volume'] - baseline['avg_volume']) / baseline['std_volume']
        if z_score > 3:
            score += 0.20 * 100
            flags.append(f'DATA_VOLUME_ANOMALY_Z{z_score:.1f}')
        
        # Failed attempts
        if current_event['failed_logins_24h'] > 5:
            score += 0.20 * 100
            flags.append('MULTIPLE_FAILED_LOGINS')
        
        return {
            'risk_score': score,
            'flags': flags,
            'action': self._determine_action(score)
        }
    
    def _determine_action(self, score):
        if score >= 80:
            return 'BLOCK_AND_ALERT'
        elif score >= 50:
            return 'CHALLENGE_MFA'
        elif score >= 30:
            return 'LOG_AND_MONITOR'
        else:
            return 'ALLOW'
```

---

### 2️⃣ ZERO-DAY DEFENSE

#### A. Patch Management Strategy

```
☐ Inventory: 100% de assets visíveis (CMDB atualizado)
☐ CVE monitoring: NIST NVD + vendor advisories
☐ Risk-based patching:
  - CRITICAL (RCE, auth bypass): 24h
  - HIGH (privilege esc, data leak): 72h
  - MEDIUM: 7 dias
  - LOW: 30 dias
☐ Patch testing: staging env antes de prod
☐ Rollback plan: para cada patch
☐ Compliance reporting: % patched por SLA
```

**Patch Management Automation:**
```python
import requests
from datetime import datetime, timedelta

class PatchManager:
    SLA = {
        'CRITICAL': timedelta(hours=24),
        'HIGH': timedelta(hours=72),
        'MEDIUM': timedelta(days=7),
        'LOW': timedelta(days=30)
    }
    
    def fetch_new_cves(self):
        """Buscar CVEs novos do NVD"""
        url = 'https://services.nvd.nist.gov/rest/json/cves/2.0'
        params = {
            'lastModStartDate': (datetime.now() - timedelta(days=1)).isoformat(),
            'lastModEndDate': datetime.now().isoformat()
        }
        response = requests.get(url, params=params)
        return response.json()['vulnerabilities']
    
    def assess_impact(self, cve):
        """Avaliar impacto baseado em CVSS + exploitability"""
        cvss = cve['metrics']['cvssMetricV31'][0]['cvssData']
        
        score = cvss['baseScore']
        severity = cvss['baseSeverity']
        
        # Bonus: se exploit público disponível
        if self._has_public_exploit(cve['cve']['id']):
            score += 1.5
            severity = 'CRITICAL'
        
        # Bonus: se afeta nossos assets
        affected_assets = self._find_affected_assets(cve)
        
        return {
            'cve_id': cve['cve']['id'],
            'cvss_score': score,
            'severity': severity,
            'affected_assets': affected_assets,
            'sla': self.SLA[severity],
            'deadline': datetime.now() + self.SLA[severity]
        }
    
    def auto_remediate(self, assessment):
        """Aplicar patch automatizado se possível"""
        if assessment['severity'] in ['CRITICAL', 'HIGH']:
            for asset in assessment['affected_assets']:
                # Test em staging primeiro
                if self._test_patch_in_staging(asset, assessment['cve_id']):
                    self._deploy_patch_production(asset, assessment['cve_id'])
                    self._notify_team(f"Patched {asset.id} for {assessment['cve_id']}")
                else:
                    self._create_ticket_manual_review(asset, assessment)
```

#### B. Virtual Patching (WAF/IPS)

```
☐ WAF rules: bloquear exploit attempts ANTES de patch oficial
☐ IPS signatures: vendor feeds (Snort, Suricata, AlienVault)
☐ Custom rules: criar baseado em PoC público
☐ Test: validar que rule não bloqueia traffic legítimo
```

**Virtual Patch Example (ModSecurity):**
```apache
# Virtual patch para CVE-2023-12345 (RCE via path traversal)
# Aplicar antes do patch oficial estar disponível

SecRule REQUEST_URI "@contains ../../../" \
  "id:9001001,\
   phase:1,\
   block,\
   msg:'Virtual Patch CVE-2023-12345 - Path Traversal',\
   logdata:'Matched: %{REQUEST_URI}',\
   tag:'attack-rce',\
   tag:'cve-2023-12345',\
   severity:CRITICAL"

SecRule REQUEST_URI "@rx /admin/(setup|config)\.php" \
  "id:9001002,\
   phase:1,\
   chain,\
   block,\
   msg:'Virtual Patch - Unauthenticated admin access'"
   SecRule REQUEST_HEADERS:Cookie "!@rx auth_token=" \
     "t:none"
```

#### C. Exploit Mitigation Technologies

```
☐ Windows: ASLR, DEP, CFG, HVCI, Credential Guard
☐ Linux: ASLR, NX, KASLR, SMEP/SMAP, kpti
☐ Browsers: Site isolation, sandboxing, Spectre mitigations
☐ Memory tagging: ARM MTE, Intel CET
☐ Compiler hardening: stack canaries, FORTIFY_SOURCE
```

---

### 3️⃣ ZERO-CLICK EXPLOIT DEFENSE

#### A. Attack Surface Reduction

```
☐ Disable: protocolos não-usados (NetBIOS, LLMNR, mDNS legacy)
☐ Disable: features não-usadas (Office macros, Adobe Flash, ActiveX)
☐ Sandbox: navegadores, email clients, document viewers
☐ Update aggressively: zero-tolerance para versões vulneráveis
☐ Remove: PUAs (Potentially Unwanted Applications)
```

**Attack Surface Reduction (Windows):**
```powershell
# ASR Rules - Microsoft Defender
$asrRules = @{
    # Block credential stealing from LSASS
    "9e6c4e1f-7d60-472f-ba1a-a39ef669e4b2" = "Enabled"
    
    # Block Office apps from creating child processes
    "d4f940ab-401b-4efc-aadc-ad5f3c50688a" = "Enabled"
    
    # Block executable files from running unless they meet criteria
    "01443614-cd74-433a-b99e-2ecdc07bfc25" = "Enabled"
    
    # Block JavaScript or VBScript from launching downloaded executable
    "d3e037e1-3eb8-44c8-a917-57927947596d" = "Enabled"
    
    # Block Office applications from injecting code into other processes
    "75668c1f-73b5-4cf0-bb93-3ecf5cb7cc84" = "Enabled"
    
    # Block executable content from email
    "be9ba2d9-53ea-4cdc-84e5-9b1eeee46550" = "Enabled"
    
    # Block process creations from PSExec and WMI
    "d1e49aac-8f56-4280-b9ba-993a6d77406c" = "Enabled"
    
    # Block untrusted USB processes
    "b2b3f03d-6a65-4f7b-a9c7-1c7ef74a9ba4" = "Enabled"
}

foreach ($rule in $asrRules.Keys) {
    Set-MpPreference -AttackSurfaceReductionRules_Ids $rule `
                     -AttackSurfaceReductionRules_Actions $asrRules[$rule]
}
```

#### B. Privileged Access Management

```
☐ Just-in-Time (JIT): admin access apenas durante necessidade
☐ Just-Enough-Admin (JEA): scope limitado por papel
☐ Privileged Access Workstations (PAWs): hardware dedicado
☐ MFA always: para qualquer acesso privilegiado
☐ Session recording: tudo que admin faz é gravado
```

---

### 4️⃣ THREAT INTELLIGENCE & SIEM

#### A. Threat Intelligence Platform

```
☐ Feeds:
  - MISP (open-source community)
  - AlienVault OTX (free tier)
  - Mandiant Threat Intel (commercial)
  - Recorded Future (commercial)
  - abuse.ch (URLhaus, ThreatFox, MalwareBazaar)

☐ Categorias:
  - IoCs: IPs, domains, file hashes, URLs
  - TTPs: MITRE ATT&CK techniques
  - APT actors: profiles, motivations, campaigns
  - Industry-specific: financial, healthcare, etc.

☐ Integration:
  - SIEM: auto-import IoCs
  - Firewall: auto-block known bad IPs
  - DNS: sinkhole malicious domains
  - EDR: scan for IOCs
```

**Threat Intel Integration:**
```python
import requests
from datetime import datetime

class ThreatIntelAggregator:
    def __init__(self, misp_url, otx_key):
        self.misp_url = misp_url
        self.otx_key = otx_key
    
    def fetch_iocs(self):
        """Agregar IoCs de múltiplas fontes"""
        all_iocs = {
            'ips': set(),
            'domains': set(),
            'hashes': set(),
            'urls': set()
        }
        
        # MISP feed
        misp_data = self._fetch_misp()
        for event in misp_data:
            for attr in event['Attribute']:
                self._categorize_ioc(attr, all_iocs)
        
        # AlienVault OTX
        otx_data = self._fetch_otx()
        for pulse in otx_data:
            for indicator in pulse['indicators']:
                self._categorize_ioc(indicator, all_iocs)
        
        # abuse.ch URLhaus
        urlhaus_data = self._fetch_urlhaus()
        all_iocs['urls'].update(urlhaus_data)
        
        return all_iocs
    
    def push_to_defenses(self, iocs):
        """Enviar IoCs para todas as ferramentas de defesa"""
        
        # Firewall: block IPs
        self._update_firewall_blocklist(iocs['ips'])
        
        # DNS: sinkhole domains
        self._update_dns_blocklist(iocs['domains'])
        
        # EDR: scan for hashes
        self._scan_for_hashes(iocs['hashes'])
        
        # WAF: block URLs
        self._update_waf_blocklist(iocs['urls'])
        
        # SIEM: criar correlation rules
        self._update_siem_iocs(iocs)
```

#### B. SIEM Architecture

```
☐ Log sources (mínimo):
  - Endpoints: EDR + Windows/Linux logs
  - Network: Firewall, IDS/IPS, NetFlow
  - Identity: AD, SSO, MFA
  - Cloud: AWS CloudTrail, Azure Activity, GCP Audit
  - Apps: Web servers, databases, application logs
  - Security tools: WAF, email gateway, DLP

☐ Retention:
  - Hot tier: 30-90 dias (consultas rápidas)
  - Warm tier: 6-12 meses
  - Cold tier: 7 anos (compliance)

☐ Correlation rules:
  - Use cases comuns (200+ rules)
  - Custom rules para industry-specific
  - Tuning contínuo (false positive < 5%)
```

**SIEM Correlation Rule Example (Splunk):**
```spl
| union
  [search index=auth event_type=failed_login earliest=-1h]
  [search index=endpoint event_type=process_creation cmdline="*mimikatz*" earliest=-1h]
  [search index=network destination_ip IN (threat_intel_ips) earliest=-1h]
| eval correlation_window="1h"
| stats values(event_type) as events_seen,
        dc(event_type) as event_types_count,
        values(src_ip) as source_ips,
        values(user) as affected_users
        by host
| where event_types_count >= 2
| eval risk_score=case(
    event_types_count >= 3, 100,
    event_types_count == 2, 75,
    1==1, 50
)
| where risk_score >= 75
| sort -risk_score
```

#### C. SOC Operations (Tier 1/2/3)

```
☐ Tier 1 (Triage): 
  - 24/7 coverage
  - Initial alert review
  - Common playbooks
  - Escalation criteria

☐ Tier 2 (Investigation):
  - Deep-dive analysis
  - Threat hunting
  - Incident response coordination
  - Custom queries

☐ Tier 3 (Engineering):
  - SIEM tuning
  - Threat hunting strategy
  - Custom detections
  - Adversary emulation
```

**SOC Playbook Template:**
```yaml
playbook:
  id: PB-001
  name: "Suspicious PowerShell Execution"
  trigger: 
    - alert_id: "PWSH-001"
    - severity: "HIGH"
  
  steps:
    - step: 1
      action: "Validate alert"
      checks:
        - Is this a known false positive?
        - Is the host in scope?
        - Is the user a service account?
      decision:
        true_positive: continue to step 2
        false_positive: close + tune rule
    
    - step: 2
      action: "Enrich context"
      collect:
        - User behavior (UEBA score)
        - Host reputation
        - Process tree
        - Network connections
        - File hashes
      tools:
        - EDR (CrowdStrike)
        - Threat Intel (VirusTotal)
        - SIEM (Splunk)
    
    - step: 3
      action: "Determine severity"
      criteria:
        CRITICAL: 
          - Privileged user
          - Lateral movement attempt
          - Known APT TTPs
        HIGH:
          - Standard user
          - Suspicious cmdline
        MEDIUM:
          - Likely legitimate but anomalous
    
    - step: 4
      action: "Containment"
      if_critical:
        - Isolate host (EDR)
        - Disable user account
        - Block C2 IPs at firewall
      if_high:
        - Monitor enhanced
        - Notify user/manager
    
    - step: 5
      action: "Investigation"
      tools:
        - Memory forensics (Volatility)
        - Disk forensics (Autopsy)
        - Network capture (Wireshark)
      output: incident_report.md
    
    - step: 6
      action: "Eradication & Recovery"
      tasks:
        - Remove malware
        - Patch vulnerability
        - Reset credentials
        - Restore from backup if needed
    
    - step: 7
      action: "Lessons learned"
      tasks:
        - Postmortem
        - Update detection rules
        - Update playbook
        - Threat intel sharing
```

---

### 5️⃣ WATER HOLE ATTACK DEFENSE

```
☐ DNS filtering: Cisco Umbrella, Cloudflare Gateway, Quad9
☐ Web filtering: bloquear categorias de risco (gambling, adult, P2P)
☐ Browser isolation: render web pages em VM remota (Menlo, Authentic8)
☐ Endpoint protection: detect drive-by downloads
☐ Threat intel: monitor compromised legitimate sites
```

**DNS Filtering Configuration (Pi-hole + threat feeds):**
```bash
# /etc/pihole/adlists.list
https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
https://urlhaus.abuse.ch/downloads/hostfile/
https://phishing.army/download/phishing_army_blocklist_extended.txt
https://raw.githubusercontent.com/HorusTeknoloji/TR-PhishingList/master/url-lists.txt

# Update list a cada 6h
0 */6 * * * /usr/local/bin/pihole -g
```

---

### 6️⃣ CRYPTOJACKING DETECTION

```
☐ CPU monitoring: alertar em uso > 80% sustained
☐ Network monitoring: connections para mining pools
☐ Process monitoring: known miners (XMRig, CCMiner, T-Rex)
☐ Browser-side: bloquear scripts de mining
☐ Container/K8s: resource quotas + monitoring
```

**Cryptojacking Detection Rules:**
```yaml
falco_rules:
  - rule: Cryptocurrency Mining Process
    desc: Detect crypto mining processes
    condition: >
      spawned_process and (
        proc.name in (xmrig, t-rex, ccminer, cgminer, bfgminer, ethminer) or
        proc.cmdline contains "stratum+tcp" or
        proc.cmdline contains "cryptonight" or
        proc.cmdline contains "ethash" or
        proc.cmdline contains "randomx"
      )
    output: Cryptocurrency miner detected (user=%user.name command=%proc.cmdline)
    priority: CRITICAL
    
  - rule: Cryptocurrency Mining Network Connection
    desc: Detect connections to known mining pools
    condition: >
      outgoing and (
        fd.sip in (mining_pool_ips) or
        fd.sport in (3333, 4444, 5555, 7777, 14444)
      )
    output: Mining pool connection (dest=%fd.sip:%fd.sport)
    priority: WARNING
```

---

## 🔧 FERRAMENTAS RECOMENDADAS

| Função | Ferramenta Open-Source | Ferramenta Commercial |
|--------|------------------------|----------------------|
| SIEM | Wazuh, ELK, Graylog | Splunk, QRadar, Sentinel |
| SOAR | Shuffle, TheHive | Cortex XSOAR, Splunk SOAR |
| Threat Intel | MISP, OpenCTI | Recorded Future, Mandiant |
| EDR | Wazuh, OSQuery | CrowdStrike, SentinelOne |
| Threat Hunting | Velociraptor, Atomic Red Team | Mandiant Advantage |
| UEBA | Securonix Snypr CE | Exabeam, Microsoft Sentinel |
| Sandbox | Cuckoo, ANY.RUN free | Joe Sandbox, FireEye |
| Patch Mgmt | Ansible + custom | ManageEngine, Tanium |

---

## 📊 KEY METRICS (KPIs)

```yaml
detection:
  mean_time_to_detect: "< 1 hour" # Target
  current: "4 hours"
  
response:
  mean_time_to_respond: "< 4 hours"
  current: "12 hours"
  
remediation:
  mean_time_to_remediate: "< 24 hours" 
  current: "72 hours"
  
coverage:
  mitre_attack_coverage: "> 80%"
  current: "65%"
  
patch:
  critical_within_24h: "> 95%"
  current: "78%"
  high_within_72h: "> 90%"
  current: "85%"

soc:
  alert_to_action_ratio: "> 90% actioned"
  false_positive_rate: "< 5%"
  current_fp: "12%"
```

---

## 🧪 ADVERSARY EMULATION

### Atomic Red Team Tests
```bash
# Instalar Atomic Red Team
Invoke-WebRequest -Uri "https://github.com/redcanaryco/atomic-red-team/archive/master.zip" -OutFile "ART.zip"

# Executar teste para T1003.001 (LSASS Memory)
Invoke-AtomicTest T1003.001

# Verificar se EDR detectou
# Se sim: rule funciona ✅
# Se não: criar/tunar detection rule
```

### Purple Team Exercise
```
Week 1: Red team simula APT campaign
Week 2: Blue team detecta + responde
Week 3: Joint debrief + improvements
Week 4: Re-test com new detections
```

---

## ✅ CHECKLIST FINAL

- [ ] SIEM com 100% das log sources críticas
- [ ] MITRE ATT&CK coverage > 80%
- [ ] Threat hunting executado weekly
- [ ] Threat intel feeds integrados
- [ ] UEBA configurado para top 100 usuários
- [ ] SOC playbooks para top 20 alertas
- [ ] Patch management com SLAs definidos
- [ ] Virtual patching ativo no WAF
- [ ] DNS filtering implementado
- [ ] Cryptojacking detection rules ativas
- [ ] Atomic Red Team tests mensais
- [ ] Tabletop exercises trimestrais
- [ ] Lessons learned alimentando improvements
