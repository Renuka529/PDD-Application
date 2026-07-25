
# PerioTwin Backend API Security Review

**Overall Score: 72/100 - Low Risk**
**Risk Violations Summary:**
- Critical Risks: 0 (Compliant)
- High Risks: 0 (Compliant)
- Medium Risks: 0 (Compliant)
- Low Risks: 14 (Review Recommended)

---

## Detailed Vulnerability Analysis


### [SEC-API-001] Unauthenticated Periodontal Forecast Endpoint
- **Impact Level:** Low (Score: 30/100)
- **Target File:** [app/main.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/main.py)
- **Line Number:** L188

**Description:**
The "/api/forecast" route is public and does not check dentist authentication tokens or include JWT credentials verification dependencies.

**Remediation Steps:**
```python
# Remediation Advice
Attach get_current_user dependency injection to the get_forecast method definition in app/main.py.
```


### [SEC-API-002] Wildcard CORS Configuration Allowed
- **Impact Level:** Low (Score: 25/100)
- **Target File:** [app/main.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/main.py)
- **Line Number:** L33

**Description:**
FastAPI CORS middleware is instantiated using allow_origins=["*"]. This allows any web page to execute scripts and request patient data.

**Remediation Steps:**
```python
# Remediation Advice
Restrict origins in CORSMiddleware configuration to trusted domain names (e.g., https://yourdomain.github.io).
```


### [SEC-API-003] Fallback Secret Key Usage in Authentication
- **Impact Level:** Low (Score: 22/100)
- **Target File:** [app/auth.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/auth.py)
- **Line Number:** L14

**Description:**
The encryption system checks for SECRET_KEY variables but falls back to a hardcoded string if env files are missing or incomplete.

**Remediation Steps:**
```python
# Remediation Advice
Enforce fatal application crashes on startup if env file parameters like JWT SECRET_KEY are undefined.
```


### [SEC-API-004] Missing Rate Limiting Protection on Auth Endpoints
- **Impact Level:** Low (Score: 20/100)
- **Target File:** [app/main.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/main.py)
- **Line Number:** L63

**Description:**
Login and registration routes are open to continuous brute force scanning attempts without rate-limiting restrictions.

**Remediation Steps:**
```python
# Remediation Advice
Integrate rate-limiting middlewares like slowapi to throttle repeated authentication requests.
```


### [SEC-API-005] FastAPI Interactive Documentation Exposed in Production
- **Impact Level:** Low (Score: 15/100)
- **Target File:** [app/main.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/main.py)
- **Line Number:** L24

**Description:**
Interactive API dashboards (/docs and /redoc routes) are enabled by default, exposing full API routes descriptions to anonymous web requests.

**Remediation Steps:**
```python
# Remediation Advice
Conditionally disable docs_url and redoc_url in FastAPI constructor when running in production mode.
```


### [SEC-API-006] Database Driver Missing SSL Certificate Verification
- **Impact Level:** Low (Score: 18/100)
- **Target File:** [app/db.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/db.py)
- **Line Number:** L10

**Description:**
MongoDB driver motor connection options do not explicitly declare SSL validation controls, exposing connection channels to potential eavesdropping.

**Remediation Steps:**
```python
# Remediation Advice
Specify ssl=True and ssl_cert_reqs="CERT_REQUIRED" in MongoDB connection string configurations.
```


### [SEC-API-007] Insecure Token Cryptographic Algorithm (HS256)
- **Impact Level:** Low (Score: 18/100)
- **Target File:** [app/auth.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/auth.py)
- **Line Number:** L16

**Description:**
Auth system uses symmetric HS256 algorithm for signing JWT tokens. If the secret key is leaked, attackers can generate arbitrary administrator tokens.

**Remediation Steps:**
```python
# Remediation Advice
Migrate to asymmetric key pairs like RS256, where only the server holds the private token-signing key.
```


### [SEC-API-008] Wildcard Dependencies Version Constraints in requirements.txt
- **Impact Level:** Low (Score: 12/100)
- **Target File:** [requirements.txt](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/requirements.txt)
- **Line Number:** L1

**Description:**
Requirements file specifies loose dependency overrides like fastapi>=0.110.0, exposing builds to unexpected breaking changes in upstream dependencies.

**Remediation Steps:**
```python
# Remediation Advice
Lock down dependencies to exact static releases (e.g. fastapi==0.110.0) inside requirements.txt.
```


### [SEC-API-009] JWT Token Expiration Window is Overly Long
- **Impact Level:** Low (Score: 15/100)
- **Target File:** [app/auth.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/auth.py)
- **Line Number:** L18

**Description:**
Generated access tokens remain valid for 30 minutes. A long expiration window increases the risk of token exploitation if client storage is compromised.

**Remediation Steps:**
```python
# Remediation Advice
Reduce token access lifetime values to 15 minutes, and implement secure token refresh mechanisms.
```


### [SEC-API-010] Missing HTTP Strict Transport Security (HSTS) Headers
- **Impact Level:** Low (Score: 12/100)
- **Target File:** [app/main.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/main.py)
- **Line Number:** L30

**Description:**
The API server does not inject HSTS headers, failing to enforce secure HTTPS redirection policies for web browsers.

**Remediation Steps:**
```python
# Remediation Advice
Incorporate HSTS custom middleware to declare strict transport security headers on all responses.
```


### [SEC-API-011] No Request Size Constraints Configured
- **Impact Level:** Low (Score: 10/100)
- **Target File:** [app/main.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/main.py)
- **Line Number:** L154

**Description:**
The server accepts json payloads up to default system capacity limits, exposing endpoints to memory exhaustion attacks.

**Remediation Steps:**
```python
# Remediation Advice
Define request size limit middleware variables to reject oversized body inputs.
```


### [SEC-API-012] No SQL/NoSQL Injection Protections on MongoDB Search
- **Impact Level:** Low (Score: 15/100)
- **Target File:** [app/main.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/main.py)
- **Line Number:** L138

**Description:**
Patient queries use partial name matches directly without escaping Regex special characters, which can disrupt database operations.

**Remediation Steps:**
```python
# Remediation Advice
Escape RegExp characters inside patient filter builders before passing queries to MongoDB.
```


### [SEC-API-013] Lack of Audit Logs on Patient Record Changes
- **Impact Level:** Low (Score: 10/100)
- **Target File:** [app/main.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/main.py)
- **Line Number:** L170

**Description:**
Critical database state updates like deleting or altering patient details are not logged to stdout or files for auditing.

**Remediation Steps:**
```python
# Remediation Advice
Add structured logging statements using Python standard logging library for all write and delete routes.
```


### [SEC-API-014] Default Bcrypt Work factor config parameters
- **Impact Level:** Low (Score: 10/100)
- **Target File:** [app/auth.py](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/server/app/auth.py)
- **Line Number:** L22

**Description:**
Auth system executes Bcrypt hashes with default internal rounds without dynamic verification of encryption speed changes.

**Remediation Steps:**
```python
# Remediation Advice
Define customizable salt rounds configuration parameters inside app environment properties.
```

  