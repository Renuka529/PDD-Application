
# Backend Dependency Security Review

An audit of packages listed in `requirements.txt` was completed.

## Dependency Security Inventory

| Package | Rule Spec | Vulnerability Info | Status |
| --- | --- | --- | --- |
| **fastapi** | `0.110.0` | No known Critical/High CVEs (Checked) | `Secure` |
| **uvicorn** | `0.28.0` | No known Critical/High CVEs (Checked) | `Secure` |
| **motor** | `3.3.2` | No known Critical/High CVEs (Checked) | `Secure` |
| **pymongo** | `4.6.2` | No known Critical/High CVEs (Checked) | `Secure` |
| **pydantic[email]** | `2.6.4` | No known Critical/High CVEs (Checked) | `Secure` |
| **numpy** | `1.26.4` | No known Critical/High CVEs (Checked) | `Secure` |
| **python-dotenv** | `1.0.1` | No known Critical/High CVEs (Checked) | `Secure` |
| **email-validator** | `2.0.0` | No known Critical/High CVEs (Checked) | `Secure` |
| **passlib[bcrypt]** | `1.7.4` | No known Critical/High CVEs (Checked) | `Secure` |
| **pyjwt** | `2.8.0` | No known Critical/High CVEs (Checked) | `Secure` |
| **python-multipart** | `0.0.9` | No known Critical/High CVEs (Checked) | `Secure` |

---

> [!TIP]
> **Dependency Best Practice**: Lock all dependencies using exact pins (e.g., `==`) rather than wildcards or lower bounds (`>=`). This secures local deployments from upstream registry compromises.
