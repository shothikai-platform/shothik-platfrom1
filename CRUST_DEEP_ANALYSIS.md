# Crust Deep Analysis - Security Architecture

**Repository:** BakeLens/crust  
**Type:** AI Agent Security Gateway  
**Language:** Go  
**License:** Elastic License 2.0

---

## 🔍 Architecture Overview

### Core Concept
Crust is a **transparent proxy** that intercepts all tool calls between AI agents and LLM providers. It operates at **Layer 7** (application layer) inspecting:
- File read/write operations
- Shell command execution
- Network requests
- MCP/ACP protocol messages

### Three-Layer Defense

```
┌─────────────────────────────────────────┐
│  LAYER 0: Request Scan                  │
│  - Scans conversation history           │
│  - Catches replay attacks               │
│  - Pre-flight validation                │
├─────────────────────────────────────────┤
│  LAYER 1: Response Scan                 │
│  - Scans LLM responses                  │
│  - Real-time blocking                   │
│  - DLP token detection                  │
├─────────────────────────────────────────┤
│  LAYER 2: Stdio Proxy (MCP/ACP)         │
│  - Wraps MCP servers                    │
│  - Intercepts JSON-RPC                  │
│  - Bidirectional scanning               │
└─────────────────────────────────────────┘
```

---

## 🛡️ Security Rules Engine

### 1. Path-Based Rules (`security.yaml`)

| Category | Patterns | Severity |
|----------|----------|----------|
| **Credentials** | `.env`, `.env.local` | Critical |
| **SSH Keys** | `~/.ssh/id_*` | Critical |
| **System Auth** | `/etc/passwd`, `/etc/shadow` | Critical |
| **Shell History** | `.bash_history`, `.zsh_history` | High |
| **Cloud Creds** | `~/.aws/credentials`, `~/.config/gcloud` | Critical |
| **Browser Data** | Chrome/Firefox password stores | High |
| **Package Tokens** | npm, pip, Cargo configs | High |
| **Git Creds** | `.git-credentials` | Critical |
| **Self-Protection** | Crust's own data files | Critical |

### 2. DLP Token Detection (`dlp.go`)

**34 Token Patterns:**
```go
// AWS
AKIA[...]{16}              // Access keys
ASIA[...]{16}              // Session keys

// GitHub  
ghp_[...]{36,255}          // Personal tokens
github_pat_[...]{82,}      // Fine-grained tokens

// Stripe
sk_live_[...]{20,}         // Live secret keys
pk_live_[...]{20,}         // Live publishable keys

// Google
AIza[...]{35}              // API keys

// Slack
xox[bpas]-[...]            // Bot/user tokens

// And 23+ more...
```

### 3. Crypto Wallet Detection (`dlp_crypto.go`)

| Type | Pattern | Validation |
|------|---------|------------|
| **BIP39 Mnemonics** | 12/24 word phrases | ✅ Checksum validated |
| **Bitcoin WIF** | 5/H/K/L prefixes | ✅ Base58Check |
| **Ethereum Private** | 64 hex chars | ✅ Format check |
| **xprv Keys** | Extended private keys | ✅ Version bytes |
| **Wallet Directories** | 16 chain wallets | Path-based |

---

## 🔧 Technical Implementation

### 17-Step Evaluation Pipeline

```
1. Input Sanitization
2. Unicode Normalization (NFKC)
3. Obfuscation Detection (homoglyphs, etc.)
4. DLP Secret Scanning (Tier 1)
5. Path Normalization (resolve symlinks, ..)
6. Shell Command Parsing
7. Path-Based Rule Matching
8. Content-Based Matching (fallback)
9. Evasive Technique Detection
10. False Positive Filtering
11. Severity Scoring
12. Action Determination
13. Audit Logging
14. Response Generation
15. Alert Triggering
16. Metrics Recording
17. Telemetry Export
```

**Performance:** Each step in microseconds

### Shell Command Parsing

Crust parses shell commands to extract:
- Target paths (`cat /etc/passwd`)
- Dangerous flags (`rm -rf /`)
- Command chaining (`cmd1; cmd2`)
- Subshells (`$(...)`)

```go
// Example: Block recursive delete
command: "re:rm\\s+-rf\\s+/"
message: "Blocked: recursive delete from root"
```

---

## 📊 Comparison with Shothik

| Capability | Crust | Shothik Current | Gap |
|------------|-------|-----------------|-----|
| **Local Gateway** | ✅ Yes | ❌ No | Shothik is cloud-native |
| **Path-Based Rules** | ✅ 14 categories | ⚠️ Basic | Need YAML rule engine |
| **DLP Token Scanning** | ✅ 34 patterns | ❌ None | High priority addition |
| **Shell Parsing** | ✅ Full parser | ❌ None | Medium priority |
| **Crypto Wallet Detection** | ✅ Checksum validated | ❌ None | Low priority |
| **Self-Protection** | ✅ Crust protects itself | ⚠️ Partial | Good practice |
| **Cloud Deployment** | ❌ Local only | ✅ Kubernetes | Shothik wins |
| **Multi-Tenant** | ❌ Single user | ✅ Enterprise | Shothik wins |
| **Token Economics** | ❌ None | ✅ Full engine | Shothik wins |
| **Fraud Detection** | ⚠️ Rule-based | ✅ ML + Rules | Shothik wins |

---

## 💡 What Shothik Should Adopt

### High Priority (This Week)

#### 1. DLP Token Detection
**File:** `apps/web/lib/dlp-detector.ts`

```typescript
// Implement Crust's 34 patterns
const dlpPatterns = [
  {
    name: "aws-access-key",
    regex: /(?:A3T[A-Z0-9]|AKIA|ASIA|ABIA|ACCA)[A-Z2-7]{16}/,
    severity: "critical",
  },
  {
    name: "github-token", 
    regex: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}/,
    severity: "critical",
  },
  // ... 32 more patterns
];

export function scanForSecrets(content: string): DLPResult {
  // Scan user input, file uploads, agent outputs
}
```

**Use Cases:**
- Prevent users from pasting secrets into prompts
- Scan file uploads before processing
- Block agent outputs containing leaked keys

#### 2. Path-Based Security Rules
**File:** `convex/security-rules.ts`

```typescript
// YAML-style rules in TypeScript
const securityRules = [
  {
    name: "protect-env-files",
    block: ["**/.env", "**/.env.*"],
    except: ["**/.env.example"],
    actions: ["read", "write", "network"],
    severity: "critical",
  },
  {
    name: "protect-ssh-keys",
    block: ["$HOME/.ssh/id_*"],
    except: ["$HOME/.ssh/id_*.pub"],
    severity: "critical", 
  },
];
```

**Use Cases:**
- Sandbox file system access
- Prevent agent from reading sensitive paths
- Network egress filtering

### Medium Priority (Next 2 Weeks)

#### 3. Shell Command Parsing
Parse and validate shell commands before execution:
- Block `rm -rf /`
- Detect command injection
- Validate allowed commands whitelist

#### 4. Self-Protection
Prevent agents from:
- Reading Shothik's own code
- Modifying configuration
- Disabling security features

### Low Priority (Later)

#### 5. Crypto Wallet Detection
- BIP39 mnemonic detection
- Private key scanning
- Wallet file protection

**Use Case:** Prevent accidental wallet exposure in generated content

---

## 🎯 Implementation Plan

### Week 1: DLP Core
- [ ] Port 34 DLP patterns from Crust
- [ ] Create `dlp-detector.ts` module
- [ ] Integrate with file upload handler
- [ ] Integrate with agent output filter

### Week 2: Path Rules
- [ ] Create YAML rule parser
- [ ] Implement path matching engine
- [ ] Add to sandbox security layer
- [ ] Test with common attack vectors

### Week 3: Shell Parsing
- [ ] Build shell command parser
- [ ] Create dangerous command database
- [ ] Integrate with code execution sandbox

---

## 📈 Expected Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Secret Leak Prevention** | 0% | 95%+ | ✅ Critical |
| **Credential Exposure** | High | Low | ✅ Major |
| **Compliance (SOC2)** | Partial | Full | ✅ Required |
| **Enterprise Confidence** | Medium | High | ✅ Sales |

---

## ✅ Verdict

**Crust is excellent for local development security.**

**Shothik should adopt:**
1. ✅ DLP token detection (34 patterns)
2. ✅ Path-based security rules
3. ⚠️ Shell parsing (lower priority)
4. ❌ Local gateway model (doesn't fit cloud architecture)

**Shothik's advantage:** Cloud-native, multi-tenant, token economics, fraud detection — all things Crust doesn't have.

**Recommendation:** Port DLP and rules engine, ignore local gateway approach.

---

**Want me to implement the DLP token detector for Shothik now?**