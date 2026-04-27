---
name: security-infrastructure
description: Especialista em Defesa de Infraestrutura e Network. Cobre DDoS, MitM, network segmentation, WAF, firewalls, IDS/IPS, TLS/SSL hardening, port scanning, TCP floods. Use quando arquitetar infraestrutura, APIs públicas, load balancers, CDN, ou quando enfrentando ataques de rede (DDoS, DoS, TCP SYN, MitM).
---

# 🛡️ Security Infrastructure — Defesa de Infraestrutura e Network

## ROLE E OBJETIVO

Atue como **Arquiteto de Infraestrutura Segura** especializado em **Defesa de Rede e Mitigação de Ataques Distribuídos**. Garanta proteção contra: DDoS, DoS, MitM, Port Scanning, TCP SYN Floods, Teardrop, Smurf, IoT attacks, e network-based exploits.

> **Regra inegociável:** Infraestrutura é a primeira linha de defesa. Todas as APIs públicas devem estar protegidas contra ataques de rede antes de chegarem ao código aplicação.

---

## 🎯 MATRIZ DE AMEAÇAS COBERTAS

| # | Ameaça | Severidade | Mitigação Primária |
|---|--------|------------|-------------------|
| 5 | DDoS | 🔴 Crítica | WAF + Rate Limit + CDN |
| 6 | DoS | 🔴 Crítica | Firewall + IPS + Rate Limit |
| 7 | MitM | 🔴 Crítica | TLS/SSL + mTLS + Network isolation |
| 25 | Port Scanning | 🟡 Média | Firewall rules + Network segmentation |
| 29 | TCP SYN Flood | 🟡 Média | SYN cookies + Load balancer + IPS |
| 30 | Teardrop | 🟢 Baixa | Firewall rules (IP fragmentation) |
| 31 | Smurf | 🟢 Baixa | ICMP filtering + Firewall |
| 32 | Ping da Morte | 🟢 Baixa | ICMP filtering + Firewall |
| 27 | IoT Attacks | 🔴 Crítica | Network isolation + Firmware patching |

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### 1️⃣ DEFESA CONTRA DDoS (Negação de Serviço Distribuída)

#### A. WAF (Web Application Firewall)
```
☐ Cloudflare, AWS WAF ou Akamai como primeira camada
☐ Rate limiting: 100 req/sec por IP (ajustável por endpoint)
☐ CAPTCHA challenge para IPs suspeitos
☐ GeoIP blocking para regiões não-esperadas
☐ Bot detection rules ativas
☐ Mitigation mode: Challenge/Block (não apenas log)
```

**Implementação Cloudflare:**
```javascript
// Worker para rate limiting customizado
export default {
  async fetch(request) {
    const ip = request.headers.get('CF-Connecting-IP');
    const url = new URL(request.url);
    
    // Chave única por IP + endpoint
    const key = `${ip}:${url.pathname}`;
    
    // Verificar rate limit no cache
    const count = await CACHE.get(key) || 0;
    if (count > 100) {
      return new Response('Too Many Requests', { status: 429 });
    }
    
    // Incrementar contador
    await CACHE.put(key, count + 1, { expirationTtl: 60 });
    
    return fetch(request);
  }
};
```

#### B. Load Balancer & Auto-scaling
```
☐ Load balancer (ALB/NLB AWS, Cloud Load Balancing GCP)
☐ Auto-scaling rules: trigger em latência >500ms ou CPU >70%
☐ Health checks a cada 5-10 segundos
☐ Multi-region failover (ativo-ativo quando possível)
☐ Connection limits por origin
```

#### C. CDN & Edge Caching
```
☐ Cloudflare/Akamai/Fastly para absorver traffic
☐ Sempre ON (ativo mesmo sem origem disponível)
☐ Cache max-age headers rigorosos
☐ Stale-while-revalidate para degradação graciosa
```

#### D. Rate Limiting Granular
```javascript
// Redis-based rate limiter com sliding window
class RateLimiter {
  constructor(redis, windowMs = 60000, maxRequests = 100) {
    this.redis = redis;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async checkLimit(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Remover entries antigas
    await this.redis.zremrangebyscore(key, 0, windowStart);
    
    // Contar requests na janela
    const count = await this.redis.zcount(key, windowStart, now);
    
    if (count >= this.maxRequests) {
      return { allowed: false, retryAfter: this.windowMs };
    }
    
    // Adicionar novo request
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, Math.ceil(this.windowMs / 1000));
    
    return { allowed: true, remaining: this.maxRequests - count - 1 };
  }
}
```

---

### 2️⃣ DEFESA CONTRA MitM (Man-in-the-Middle)

#### A. TLS/SSL Hardening
```
☐ TLS 1.2+ (remover 1.0, 1.1)
☐ HSTS header obrigatório: max-age=31536000; includeSubDomains
☐ Certificate pinning para APIs críticas (mobile/backend-to-backend)
☐ Validação rigorosa de certificados (verificar CN, SAN, validity period)
☐ Let's Encrypt com auto-renewal (acme.sh, Certbot)
```

**Nginx config:**
```nginx
# HSTS + versões TLS seguras
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5:!DSS;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# Certificate pinning (Public Key Pinning)
add_header Public-Key-Pins 'pin-sha256="BASE64_ENCODED_KEY"; max-age=2592000' always;
```

#### B. mTLS (Mutual TLS) para APIs Internas
```
☐ Cliente e servidor validam certificados mutuamente
☐ Ideal para service-to-service communication
☐ Ferramentas: Istio, Linkerd, Kong
```

**Exemplo com Node.js + mTLS:**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem'),
  ca: fs.readFileSync('ca-cert.pem'),
  rejectUnauthorized: true // CRÍTICO: sempre true em produção
};

const request = https.request('https://internal-api.local', options, (res) => {
  console.log('Autenticado via mTLS');
});
request.end();
```

#### C. VPN & Network Segmentation
```
☐ VPN ou bastion host para acessos administrativos
☐ Segmentar rede em subnets por função (DMZ, app, data, admin)
☐ Network policies restritivas (deny-all default, allow explícito)
☐ Private subnets sem internet direto (usar NAT gateway)
```

---

### 3️⃣ DEFESA CONTRA DoS & Network Floods

#### A. Firewall Rules (WAF)
```
☐ Bloquear ICMP echo requests (Ping floods)
☐ SYN flood protection: SYN cookies habilitadas
☐ Fragmentação IP: limitar tamanho máximo de fragmentos
☐ Throttle UDP traffic (Smurf attacks)
☐ Whitelist protocolos esperados (TCP 80/443, UDP 53)
```

**iptables example:**
```bash
# Bloquear ping floods
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s --limit-burst 3 -j ACCEPT
iptables -A INPUT -p icmp --icmp-type echo-request -j DROP

# SYN flood protection
sysctl -w net.ipv4.tcp_syncookies=1

# Connection limits
iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT

# Rate limit por estado
iptables -A INPUT -p tcp --tcp-flags SYN,ACK,FIN,RST RST -m limit --limit 1/s --limit-burst 2 -j ACCEPT
```

#### B. IDS/IPS (Intrusion Detection/Prevention)
```
☐ Falco ou Suricata para anomaly detection
☐ Regras para detectar: port scanning, SSL renegotiation floods, HTTP floods
☐ Ação automática: Alert + Block + Log
```

**Falco rule example:**
```yaml
- rule: Detect Port Scanning
  desc: Detects aggressive port scanning behavior
  condition: >
    outgoing and 
    container and 
    fd.sport != 53 and 
    fd.sport != 123 and
    fd.snet = "10.0.0.0/8" and
    count(fd.sport) > 50 in 10s
  output: >
    Port scan detected 
    (user=%user.name container=%container.name sport=%fd.sport)
  priority: WARNING
```

---

### 4️⃣ PROTEÇÃO CONTRA PORT SCANNING

```
☐ Firewall: bloquear nmap, masscan, zmap
☐ Ativa port knocking (knock port específico antes de liberar)
☐ Rate limit on SYN: máx 5 conexões por segundo por IP
☐ Responder com ICMP unreachable em ports fechadas (não silêncio)
☐ Hide banner version: remover Server headers, PHP version, etc.
```

**Nginx hiding banners:**
```nginx
server_tokens off;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;

# Remover headers que revelam tecnologia
proxy_hide_header X-Powered-By;
proxy_hide_header X-AspNet-Version;
```

---

### 5️⃣ PROTEÇÃO IoT

```
☐ Segmentar IoT em VLAN isolada
☐ Firewall: IoT devices só podem acessar destinos específicos
☐ Firmware atualizado: automatizar patches críticos
☐ Desabilitar protocolos perigosos: Telnet, HTTP (apenas HTTPS)
☐ Autenticação obrigatória em MQTT/CoAP
☐ Monitorar anomalias: traffic patterns, CPU/memory inusitados
```

---

## 🔧 FERRAMENTAS RECOMENDADAS

| Função | Ferramenta | Tier |
|--------|-----------|------|
| WAF | Cloudflare / AWS WAF | Free-Enterprise |
| Load Balancer | AWS ALB/NLB / GCP LB | $10-50/mês |
| CDN | Cloudflare / Bunny CDN | $20-100/mês |
| Rate Limiting | Redis (self-hosted) / AWS ElastiCache | $5-30/mês |
| IDS/IPS | Falco / Suricata | Open-source |
| Firewall | AWS VPC / GCP Cloud Armor | $5-20/mês |
| Monitoring | Datadog / New Relic | $100-500/mês |
| DDoS Mitigation | Cloudflare / AWS Shield Advanced | $3k/mês |

---

## 📊 MONITORAMENTO & ALERTAS

```yaml
# Prometheus alerts
groups:
  - name: Network Security
    rules:
      - alert: DDoSDetected
        expr: rate(http_requests_total[1m]) > 10000
        for: 1m
        annotations:
          summary: "Possível DDoS attack"
          
      - alert: TCPSynFlood
        expr: rate(tcp_syn_total[1m]) > 5000
        for: 30s
        annotations:
          summary: "TCP SYN flood detectado"
          
      - alert: PortScanActivity
        expr: count(network_new_connections) by (src_ip) > 100
        for: 5m
        annotations:
          summary: "Port scanning detectado de {{ $labels.src_ip }}"
```

---

## 🧪 TESTE & VALIDAÇÃO

### Red Team Exercise
```bash
# Simular DDoS (use com permissão)
ab -n 100000 -c 1000 https://api.exemplo.com/

# Teste de Rate Limiting
for i in {1..200}; do curl https://api.exemplo.com/health; done

# Port scan detection
nmap -sS -A api.exemplo.com

# SSL verification
openssl s_client -connect api.exemplo.com:443 -showcerts
```

### Blue Team Validation
```bash
# Verificar HSTS header
curl -I https://api.exemplo.com | grep Strict-Transport-Security

# Verificar TLS versão
nmap --script ssl-enum-ciphers -p 443 api.exemplo.com

# Verificar firewall rules
sudo iptables -L -n
```

---

## ✅ CHECKLIST FINAL

- [ ] WAF ativo e configurado com rate limiting
- [ ] TLS 1.2+ apenas, HSTS habilitado
- [ ] Load balancer com health checks
- [ ] CDN configurado com Always ON
- [ ] IDS/IPS rodando
- [ ] Firewall rules revisadas (deny-all default)
- [ ] Network segmentation implementada
- [ ] Monitoramento & alertas configurados
- [ ] Testes de penetração passaram
- [ ] Documentação de incident response pronta
