# GitUpX

**AI-Powered Repository Sanitizer & Secure Auto-Publisher**

> **Version:** 1.0.0-Architecture  
> **Status:** Approved for Implementation  
> **Classification:** Internal Use  
> **Date:** 2026

> **Repository reality check:** the checked-in code now contains a working React/Vite frontend, a trainable Python context-classification backend with a runnable local server, and a small Java scaffold that remains in the tree for reference.

## Local Usage (Windows):

1. Run `git clone https://github.com/Periyannan35/GitUpX/`
2. Open the cloned folder and double-click or run `start-gitupx.bat`
3. It will automatically open `http://127.0.0.1:3000/` in your browser
4. Use the demo login (if required):
   - **Email:** `admin@gitupx.com`
   - **Password:** `admin`

Validation notes are recorded in [`docs/API_TEST_REPORT.md`](A:\GitUpX\docs\API_TEST_REPORT.md) and the submission summary is in [`docs/FINAL_DELIVERABLES.md`](A:\GitUpX\docs\FINAL_DELIVERABLES.md).

---

## Table of Contents

- [1. Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
- [2. System Architecture & Component Topology](#2-system-architecture--component-topology)
  - [2.1 Component Specifications](#21-component-specifications)
    - [A. The GitUpX Background Daemon (watcher.py)](#a-the-gitupx-background-daemon-watcherpy)
    - [B. The Frontend Administrative Dashboard](#b-the-frontend-administrative-dashboard)
    - [C. The Core Application Backend](#c-the-core-application-backend)
    - [D. The Enterprise Scan Suite](#d-the-enterprise-scan-suite)
    - [E. The Code Intelligence & AST Layer](#e-the-code-intelligence--ast-layer)
    - [F. The Data Tier & Persistence Layer](#f-the-data-tier--persistence-layer)
- [3. Comprehensive Data & Control Pipeline](#3-comprehensive-data--control-pipeline)
  - [Phase 1: Interception & Handshake](#phase-1-interception--handshake)
  - [Phase 2: Signature and Chaos Ingestion](#phase-2-signature-and-chaos-ingestion)
  - [Phase 3: Structural Context & Machine Learning Filtration](#phase-3-structural-context--machine-learning-filtration)
  - [Phase 4: AST-Driven Sanitization & Publishing](#phase-4-ast-driven-sanitization--publishing)
- [4. Production Directory Blueprint](#4-production-directory-blueprint)
- [5. Architectural Edge Cases & Fault Tolerance Matrix](#5-architectural-edge-cases--fault-tolerance-matrix)
  - [5.1 Network Dropout & Local Sinking Cache](#51-network-dropout--local-sinking-cache)
  - [5.2 Tree-Sitter Parse Crash Resiliency](#52-tree-sitter-parse-crash-resiliency)
  - [Fault Tolerance Summary](#fault-tolerance-summary)

---

## 1. Executive Summary & Problem Statement

In modern software development, credential leakage represents a severe, high-stakes threat vector. Human error remains the primary root cause of public API token, private key, and environmental configuration exposure.

Current market solutions (e.g., standard pre-commit hooks or standalone CI/CD secret scanners) suffer from two distinct flaws:

| Flaw | Description |
|------|-------------|
| **High Friction** | They interrupt the developer's immediate flow state or require manual configuration adjustments. |
| **Context-Blindness** | They rely entirely on deterministic string rules (regex/entropy), generating a high volume of false positives on mock keys or test data, leading to developers disabling the tools entirely. |

GitUpX transforms version control from a manual, anxiety-inducing tracking process into an **autonomous, context-aware publisher**. By decoupling process intercept handling from the IDE itself, operating at the Operating System layer, and filtering matches through an Abstract Syntax Tree (AST) coupled with a lightweight machine learning classifier, GitUpX guarantees absolute security without impacting developer velocity.

---

## 2. System Architecture & Component Topology

The GitUpX ecosystem is split into a low-footprint local daemon, an asynchronous high-performance API backend, a relational persistence engine, and a web-based management plane.

```
+------------------------------------------------------------------------------------------+
| LOCAL MACHINE                                                                            |
|                                                                                          |
| +--------------------+ +----------------------+                                          |
| | IDE Workspace      | | GitUpX Daemon        |                                          |
| | (VS Code/Cursor)   | | (Python / psutil)    |                                          |
| +---------+----------+ +-----------+----------+                                          |
|           |                        |                                                     |
|           v (Process Terminated)   v                                                     |
| [Intercept Event] ----------------> [OS Notification]                                  |
|                                    (User Opt-in)                                         |
|                                    v                                                     |
|                                    [Invoke Pipeline]                                     |
+------------------------------------|-----------------------------------------------------+
                                     |
                                     v (Secure REST HTTP)
+------------------------------------------------------------------------------------------+
| GITUPX ENGINE (DOCKER)                                                                   |
|                                                                                          |
| +--------------------------------------------------------------------------------------+ |
| | FastAPI Core Application Layer                                                       | |
| |                                                                                      | |
| | +------------------+ +------------------+                                            | |
| | | Scanner Engine   | | AST Parser       |                                            | |
| | | (Gitleaks/Truffle)| | (tree-sitter)   |                                            | |
| | +--------+---------+ +--------+---------+                                            | |
| |          |                    |                                                      | |
| |          +--------+-----------+                                                      | |
| |                   v                                                                  | |
| |          +------------------+                                                        | |
| |          | ML Context Classifier                                                    | |
| |          | (Scikit-Learn/TF-IDF)                                                    | |
| |          +--------+---------+                                                        | |
| |                   |                                                                  | |
| |                   v                                                                  | |
| |          +------------------+                                                        | |
| |          | Decision Engine  |                                                        | |
| |          +------------------+                                                        | |
| +--------------------------------------------------------------------------------------+ |
|                      |                                                                   |
|          +-----------+-----------+                                                       |
|          v                       v                                                       |
| +------------------+ +------------------+                                                |
| | Sanitizer Module | | DB Tier          |                                                |
| | (Source Rewriting)| | (PostgreSQL)    |                                                |
| +--------+---------+ +------------------+                                                |
|          |                                                                               |
|          v                                                                               |
| +------------------+                                                                     |
| | GitHub Publisher | ----------------> [Remote GitHub Target]                            |
| +------------------+                                                                     |
+------------------------------------------------------------------------------------------+
```

**Figure 1:** GitUpX System Architecture Overview

---

### 2.1 Component Specifications

#### A. The GitUpX Background Daemon (watcher.py)

| Attribute | Specification |
|-----------|---------------|
| **Technology** | Python, psutil, watchdog |
| **Execution Environment** | Local Host OS background thread (User Space) |
| **Responsibility** | Watches the OS process tree for target text editor signatures (`code`, `cursor`, `pycharm64`, `sublime_text`). Upon detection of process group death, it stalls git staging and triggers a cross-platform desktop UI alert requesting publication authorization. |

#### B. The Frontend Administrative Dashboard

| Attribute | Specification |
|-----------|---------------|
| **Technology** | React 19, TypeScript, Tailwind CSS, Vite |
| **Responsibility** | Renders localized real-time reporting metrics. Displays historical repositories tracked, total true-positive secrets intercepted, sanitization execution diffs, and classification tuning controls. |

#### C. The Core Application Backend

| Attribute | Specification |
|-----------|---------------|
| **Technology** | Python 3.11+, standard library HTTP server, pure Python text model, SQLAlchemy |
| **Responsibility** | Exposes auth, workspace, scan, prediction, and training endpoints via `backend/server.py`; trains and persists the secret-context classifier from the dataset in `backend/data/sample_dataset.json`. |

#### D. The Enterprise Scan Suite

| Attribute | Specification |
|-----------|---------------|
| **Technology** | Native gitleaks & trufflehog binaries wrapped via Python Subprocess |
| **Responsibility** | Executes high-speed concurrent signature analysis, known vendor pattern mapping, and structural Shannon entropy checking against file line buffers. |

#### E. The Code Intelligence & AST Layer

| Attribute | Specification |
|-----------|---------------|
| **Technology** | tree-sitter |
| **Responsibility** | Resolves file tokens down to an Abstract Syntax Tree (AST) layout. When the Scan Suite flags a specific text range, tree-sitter isolates the structural parent block (e.g., assessing if a string belongs within an object property declaration named `mock_key` versus an operational environment flag). |

#### F. The Data Tier & Persistence Layer

| Attribute | Specification |
|-----------|---------------|
| **Technology** | PostgreSQL, SQLAlchemy Core (ORM), Alembic |
| **Responsibility** | Transactional persistence of execution logs, encrypted user authentication profiles, local repository mapping rules, metadata hashes of identified false positives, and compliance reporting schemas. |

---

## 3. Comprehensive Data & Control Pipeline

When an editor tracking boundary is hit, GitUpX routes code updates through a deterministic multi-tiered validation pipeline:

### Phase 1: Interception & Handshake

The `watcher.py` module detects that the active PID for VS Code dropped to zero.

1. A native OS notification fires: *"Developer Session Ended. Secure GitUpX Workspace Synchronization?"*
2. **If User Aborts:** System cancels the hook execution and exits clean.
3. **If User Confirms:** The daemon blocks external manual execution vectors, captures the current changed file tracking paths via git, and communicates with the local FastAPI endpoint.

### Phase 2: Signature and Chaos Ingestion

The engine passes modified files through **gitleaks** to quickly isolate high-confidence regex rules (e.g., AWS standard patterns, OpenAI organization hashes).

Concurrently, **trufflehog** runs baseline validation routines checking for highly randomized, cryptographic text block shapes that strongly indicate passwords, private key certificates, or random string variables.

### Phase 3: Structural Context & Machine Learning Filtration

For any candidate token identified in Phase 2, **tree-sitter** compiles that specific file scope into a structural code node tree. It extracts the matching target variable name, scope type, and parent method context block.

The extracted text neighborhood is vectorized via a lightweight **TF-IDF Pipeline** and passed into a trained **Logistic Regression / Random Forest** classifier (`models/ml_model.py`).

The model classifies the context block:

| Classification | Criteria | Action |
|------------------|----------|--------|
| **Mock / Test Context** | The string contains references to test objects, test domains, sandbox keys, or fake data configurations. | **Bypass block / Mark safe** |
| **Production Context** | The structural context implies a hardcoded operational parameter or live environment configuration state. | **Flag for Immediate Sanitization** |

### Phase 4: AST-Driven Sanitization & Publishing

Files flagged as high-risk are sent to `sanitizer.py`.

Rather than using standard, broad text searches that risk corrupting code file syntax, `sanitizer.py` uses the precise syntax tree byte coordinates provided by tree-sitter to rewrite only the targeted assignment value, swapping it for a secure token string (e.g., `"GITUPX_MASKED_SECRET"`).

The sanitized updates are safely committed.

The `github_push.py` module establishes a connection to the user's remote target, confirms transmission capability, signs the commit payload, and pushes the code to the target repository.

---

## 4. Production Directory Blueprint

The following directory structure defines the complete GitUpX project layout for production deployment:

```
gitupx/
├── backend/
│   ├── app/
│   │   ├── api/                    # Async Router Controllers
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── dashboard.py
│   │   │   │   └── workspace.py
│   │   ├── core/                   # Environment configs, security rules
│   │   │   ├── config.py           # Global configuration via Pydantic
│   │   │   └── database.py         # SQLAlchemy engine pool
│   │   ├── decision/               # Orchestration layer
│   │   │   └── decision_engine.py
│   │   ├── models/                 # ML assets & Relational Schemas
│   │   │   ├── db_models.py        # SQLAlchemy Data models
│   │   │   └── ml_model.py         # Scikit-learn Classifier
│   │   ├── publisher/              # Git wrapper and GitHub API
│   │   │   └── github_push.py
│   │   ├── sanitizer/              # AST structural modifier
│   │   │   └── sanitizer.py
│   │   ├── scanner/                # Multi-layer secret hunting
│   │   │   ├── entropy.py          # Shannon entropy algorithms
│   │   │   ├── file_scanner.py     # Gitleaks/Trufflehog wrapper
│   │   │   └── regex_rules.py      # Custom regex mappings
│   │   └── utils/                  # Loggers and helpers
│   │       └── logger.py
│   ├── data/                       # Classifier footprints & datasets
│   │   └── sample_dataset.json
│   ├── alembic/                    # Schema migration tracks
│   ├── Dockerfile                  # Sandbox compilation wrapper
│   └── requirements.txt            # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── assets/                 # UI static vector media
│   │   ├── components/             # Atomic Tailwind UI components
│   │   ├── hooks/                  # React Query API abstractions
│   │   ├── pages/                  # Dashboard, Logs, Config
│   │   ├── App.tsx                 # SPA Router core
│   │   └── main.tsx                # DOM bootstrap
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
├── daemon/
│   └── watcher.py                  # OS background daemon
├── docker-compose.yml              # PG, API, Dashboard orchestration
└── README.md
```

**Figure 2:** GitUpX Production Directory Structure

---

## 5. Architectural Edge Cases & Fault Tolerance Matrix

### 5.1 Network Dropout & Local Sinking Cache

If internet routing failure drops the active connection while processing an auto-publishing cycle, GitUpX triggers a fallback state:

1. The local Git repository records an incremental commit on an encrypted, temporary local staging branch.
2. A file system indicator (`.gitupx_pending_sync`) stores the locked commit metadata locally.
3. An asynchronous watcher loop uses an **exponential backoff retry** pattern to automatically push the code once stable external network connections are re-established.

### 5.2 Tree-Sitter Parse Crash Resiliency

If a developer saves a syntactically invalid code file (e.g., unclosed brackets or compiler errors) right before closing their editor, tree-sitter may fail to build a complete AST.

**Fallback Rule:** GitUpX defaults to an ultra-conservative **"Fail-Secure"** strategy. If the AST parser throws an exception or cannot securely resolve a node context line, the Machine Learning filter is bypassed. The system assumes maximum risk, blocks the raw file stream, and routes the token to `sanitizer.py` for standard text replacement or quarantines the file completely.

### Fault Tolerance Summary

| Edge Case | Fallback Strategy | System Impact |
|-----------|-------------------|---------------|
| **Network Dropout** | Local staging branch + `.gitupx_pending_sync` + exponential backoff retry | Deferred push, no data loss |
| **Tree-Sitter Parse Crash** | Fail-Secure: bypass ML, assume max risk, quarantine or sanitize | Conservative blocking |
| **User Abort on Prompt** | Cancel hook execution, exit clean | No changes applied |
| **Invalid Git State** | Skip processing, log diagnostic, notify user | Graceful degradation |

---

> **GitUpX**  
> AI-Powered Repository Sanitizer & Secure Auto-Publisher  
> Document Version 1.0.0-Architecture  
> GitUpX Engineering Team | CONFIDENTIAL

---

### 🛡️ [GitUpX AST Secured](https://github.com)
> **Status:** ✅ Clean & Verified (AST Sanitized & Masked against production secrets)
> **Latest Audit:** `#a63e2231` on branch `main`
> **Verified Committer:** `Periy` (`periyannanmarch@gmail.com`)
> *See full automated audit in [GITUPX_SECURITY_REPORT.md](./GITUPX_SECURITY_REPORT.md)*
