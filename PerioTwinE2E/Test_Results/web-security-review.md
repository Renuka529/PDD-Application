
# PerioTwin Frontend Security Review Report

**Score: 72/100 - Low Risk**
**Vulnerability Classification Breakdown:**
- Critical: 0
- High: 0
- Medium: 0
- Low: 14

---

## Detailed Vulnerability Catalog


### [SEC-WEB-001] Hardcoded API Base URL in Client Source Code
- **Impact Level:** Low (Score: 15/100)
- **Target File:** [client/src/App.jsx](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/src/App.jsx)
- **Line Number:** L24

**Description:**
The frontend client hardcodes the API base URL "http://localhost:8000" in App.jsx. This increases the risk of deploying client builds pointing to local debug APIs rather than secure staging/production environments.

**Remediation Action:**
```diff
+ Use environment variables (e.g. import.meta.env.VITE_API_URL) inside Vite to dynamically inject API endpoints at compile/runtime.
```


### [SEC-WEB-002] PII and Auth Token Stored in localStorage
- **Impact Level:** Low (Score: 25/100)
- **Target File:** [client/src/App.jsx](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/src/App.jsx)
- **Line Number:** L106

**Description:**
Dentist profile information (email, name) and access tokens are stored in the browser's localStorage. localStorage is accessible via client-side Javascript, leaving it vulnerable to Cross-Site Scripting (XSS) extraction.

**Remediation Action:**
```diff
+ Store JWT access tokens in memory or secure HttpOnly cookies, and store non-sensitive profile state in state managers or sessionStorage.
```


### [SEC-WEB-003] Missing Session Time-To-Live (TTL) Enforcement Client-Side
- **Impact Level:** Low (Score: 20/100)
- **Target File:** [client/src/App.jsx](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/src/App.jsx)
- **Line Number:** L28

**Description:**
The client application retains the login token indefinitely in localStorage without enforcing client-side session timeout gates or polling token validity.

**Remediation Action:**
```diff
+ Implement a background session timeout handler that clears the localStorage and logs the dentist out after 15 minutes of inactivity.
```


### [SEC-WEB-004] Missing Content Security Policy (CSP) Meta Tag
- **Impact Level:** Low (Score: 28/100)
- **Target File:** [client/index.html](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/index.html)
- **Line Number:** L6

**Description:**
The HTML entry point index.html does not declare a Content-Security-Policy (CSP) meta tag, allowing unauthorized external resource loads and inline script executions.

**Remediation Action:**
```diff
+ Add a <meta http-equiv="Content-Security-Policy" content="..."> tag in index.html restricting script sources to trusted origins.
```


### [SEC-WEB-005] Missing X-Frame-Options Protection
- **Impact Level:** Low (Score: 18/100)
- **Target File:** [client/index.html](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/index.html)
- **Line Number:** L1

**Description:**
The frontend does not enforce frame-ancestors or frame-embedding restrictions inside its HTML structure, leaving it open to clickjacking iframe attacks.

**Remediation Action:**
```diff
+ Configure index.html headers or supply meta guards to disable page loading within iframes from untrusted domains.
```


### [SEC-WEB-006] Missing Referrer-Policy Header Declarations
- **Impact Level:** Low (Score: 10/100)
- **Target File:** [client/index.html](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/index.html)
- **Line Number:** L7

**Description:**
The client application fails to restrict referrer information when sending requests to external assets, potentially leaking user context.

**Remediation Action:**
```diff
+ Implement a <meta name="referrer" content="no-referrer-when-downgrade"> in index.html to manage header leakages.
```


### [SEC-WEB-007] HTML Inputs lack Explicit Maximum Character Length Boundaries
- **Impact Level:** Low (Score: 12/100)
- **Target File:** [client/src/App.jsx](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/src/App.jsx)
- **Line Number:** L572

**Description:**
Forms for creating patients and editing profiles lack frontend restriction controls like "maxlength", making them vulnerable to visual layouts breaking under high string inputs.

**Remediation Action:**
```diff
+ Set hard maxlength validation properties (e.g. maxlength="100") on all text input elements in React components.
```


### [SEC-WEB-008] Fallback Default Smoking Preference Stored Unencrypted
- **Impact Level:** Low (Score: 10/100)
- **Target File:** [client/src/App.jsx](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/src/App.jsx)
- **Line Number:** L254

**Description:**
User preference configuration parameters like "pref_defaultSmoking" are saved directly to localStorage as flat strings without checking structure integrity.

**Remediation Action:**
```diff
+ Validate input keys and parse inputs defensively when reading configurations from localStorage.
```


### [SEC-WEB-009] Missing Subresource Integrity (SRI) on External Style Libraries
- **Impact Level:** Low (Score: 15/100)
- **Target File:** [client/package.json](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/package.json)
- **Line Number:** L13

**Description:**
The application imports external packages but does not declare integrity verification hashes on links, exposing users to supply chain compromise.

**Remediation Action:**
```diff
+ Utilize bundle loaders that lock down dependencies and use subresource integrity values for script tags.
```


### [SEC-WEB-010] Password Modification Form lacks Client-Side Strength Meters
- **Impact Level:** Low (Score: 15/100)
- **Target File:** [client/src/App.jsx](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/src/App.jsx)
- **Line Number:** L199

**Description:**
Dentist profile editing allows saving arbitrary length passwords without validating character complexity client-side.

**Remediation Action:**
```diff
+ Add regex-based pattern matching validators to password update inputs requiring letters, numbers, and special characters.
```


### [SEC-WEB-011] Wildcard HTTP Dev Server Configuration Defaults
- **Impact Level:** Low (Score: 12/100)
- **Target File:** [client/vite.config.js](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/vite.config.js)
- **Line Number:** L8

**Description:**
The Vite configuration setup does not strictly limit network bindings, opening debug servers to local networks by default in development mode.

**Remediation Action:**
```diff
+ Explicitly define local host binding bounds inside vite.config.js.
```


### [SEC-WEB-012] No Frame-Busting Javascript Guard Implemented
- **Impact Level:** Low (Score: 15/100)
- **Target File:** [client/src/main.jsx](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/src/main.jsx)
- **Line Number:** L5

**Description:**
The UI does not execute basic frame checking logic on mount to verify if the application is nested inside a suspicious external frame window.

**Remediation Action:**
```diff
+ Add a window self comparison script inside main.jsx to force top level context redirects.
```


### [SEC-WEB-013] React State Management lacks Input Event Throttling
- **Impact Level:** Low (Score: 8/100)
- **Target File:** [client/src/App.jsx](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/src/App.jsx)
- **Line Number:** L322

**Description:**
Search filter fields trigger immediate DOM filtering actions on keypress without debouncing inputs, which can slow down responsiveness in massive patient listings.

**Remediation Action:**
```diff
+ Incorporate simple lodash-debounce or custom React timers to postpone processing user input until typing pauses.
```


### [SEC-WEB-014] Error Alerts expose Unstructured Console Messages
- **Impact Level:** Low (Score: 10/100)
- **Target File:** [client/src/App.jsx](file:///C:/Users/renuk/Downloads/PerioTwin/PerioTwin/client/src/App.jsx)
- **Line Number:** L165

**Description:**
Catastrophic backend API errors are caught and directly passed into standard window alerts, exposing raw stack properties to dentist views.

**Remediation Action:**
```diff
+ Define a friendly error handler overlay instead of routing direct exception strings to alerts.
```

  