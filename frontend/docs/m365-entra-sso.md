# Microsoft 365 sign-in (Microsoft Entra ID) — AIVA Portal v5.7

Authorization Code + PKCE, confidential client. The browser never sees the client secret or the
tokens; the Portal keeps only its own `aiva_session` cookie (same as LDAP).

## 1. Entra admin center (one-time)

1. **Entra admin center → Identity → Applications → App registrations → New registration**
   - Name: `AIVA Portal`
   - Supported account types: **Accounts in this organizational directory only (Single tenant)**
   - Redirect URI: platform **Web** → `https://<portal-host>/api/auth/microsoft/callback`
     (dev: `http://localhost:5173/api/auth/microsoft/callback` — add as a second Web URI)
2. **Overview** → copy **Application (client) ID** → `ENTRA_CLIENT_ID`,
   **Directory (tenant) ID** → `ENTRA_TENANT_ID`.
3. **Certificates & secrets → Client secrets → New client secret** → copy the **Value** (not the
   Secret ID) → `ENTRA_CLIENT_SECRET`. Note the expiry date and rotate before it.
4. **API permissions**: `Microsoft Graph → openid, profile, email` (delegated). They are default;
   grant admin consent so users are not prompted.
5. Optional, recommended: **Enterprise applications → AIVA Portal → Properties → Assignment
   required = Yes**, then assign the AP/Receiver groups. Users not assigned get `access_denied`,
   which the login page shows as "ยังไม่ได้รับสิทธิ์".

## 2. Portal environment

```env
ENTRA_TENANT_ID=<GUID>
ENTRA_CLIENT_ID=<GUID>
ENTRA_CLIENT_SECRET=<secret value>
ENTRA_REDIRECT_URI=https://<portal-host>/api/auth/microsoft/callback
```

All set → `GET /api/auth/providers` answers `m365: true` and the login page enables the
Microsoft 365 tab. None set → tab disabled, LDAP only. Partly set in production → the server
refuses to start (`productionConfigProblems`).

## 3. Who gets in

Same rule as LDAP: the person must already exist in **สิทธิ์และการเชื่อมบัญชี** (matched by e-mail,
or by sAMAccountName = the part of the UPN before `@`, which holds for a hybrid directory synced from
on-prem AD) and be active. `AUTH_BOOTSTRAP_ADMINS` still becomes SA on first sign-in.

## 4. Errors the user sees

| Situation | Redirect | Login page shows |
|---|---|---|
| Cancelled / bad state / token refused | `/login?error=cred` | ลงชื่อเข้าใช้ด้วย Microsoft ไม่สำเร็จ |
| Not assigned / not in Portal / inactive | `/login?error=noaccess` | บัญชีนี้ยังไม่ได้รับสิทธิ์ใช้งาน |
| Microsoft unreachable / not configured | `/login?error=timeout` | เชื่อมต่อ Microsoft ไม่ได้ |

Every attempt is written to the audit log (`login_m365`, `login_failed`, `login_noaccess`).
