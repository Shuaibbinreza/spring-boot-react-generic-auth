# System Integration & JWT Architecture Guide

This guide explains in detail **how JWT (JSON Web Tokens) work**, how the authentication lifecycle operates end-to-end, and **how to integrate or share this authentication system with other projects, microservices, or frontend applications**.

---

## 1. How JWT (JSON Web Token) Works Under the Hood

### 1.1 What is a JWT?
A **JSON Web Token (JWT)** is an open standard ([RFC 7519](https://tools.ietf.org/html/rfc7519)) for securely transmitting information between parties as a JSON object. This information is **digitally signed**, meaning it can be verified and trusted because it is signed using a secret key (HMAC SHA-256).

A JWT is a single string separated by two dots (`.`):
$$\text{JWT} = \underbrace{\text{Header}}_{\text{Base64Url}} \, . \, \underbrace{\text{Payload}}_{\text{Base64Url}} \, . \, \underbrace{\text{Signature}}_{\text{HMAC-SHA256}}$$

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huZG9lIiwicm9sZXMiOlsiUk9MRV9VU0VSIl0sImlhdCI6MTcyMjMzMDAwMCwiZXhwIjoxNzIyNDE2NDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

### 1.2 Anatomy of a JWT

```mermaid
graph TD
    A[JWT Token String] --> B[Part 1: Header]
    A --> C[Part 2: Payload / Claims]
    A --> D[Part 3: Signature]
    
    B --> B1["Algorithm & Token Type<br/><code>{'alg': 'HS256', 'typ': 'JWT'}</code>"]
    C --> C1["User Data & Timestamps<br/><code>{'sub': 'johndoe', 'roles': ['ROLE_USER'], 'exp': 1722416400}</code>"]
    D --> D1["HMAC-SHA256 Header + Payload + Secret Key<br/>Ensures token has NOT been tampered with!"]
```

#### 1. Header (Metadata)
Contains the signing algorithm and token type:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

#### 2. Payload (Claims)
Contains statements about the user (subject, roles, issuance time `iat`, expiration time `exp`):
```json
{
  "sub": "johndoe",
  "roles": [
    "ROLE_USER"
  ],
  "iat": 1722330000,
  "exp": 1722416400
}
```

#### 3. Signature (Cryptographic Integrity)
Created by taking the Base64Url-encoded header, Base64Url-encoded payload, and signing them using your server's secret key (`app.jwt.secret`):
```crypto
Signature = HMACSHA256(
    base64UrlEncode(Header) + "." + base64UrlEncode(Payload),
    secretKey
)
```

---

### 1.3 Why JWT is "Stateless" & Scalable

Unlike traditional session-based authentication (where the server must query a database or Redis session store on **every single request**), JWT validation is **purely cryptographic**:

```mermaid
flowchart LR
    A[Incoming Request with JWT Cookie] --> B[JwtAuthenticationFilter]
    B --> C{Verify Signature using app.jwt.secret}
    C -- Valid Signature & Not Expired --> D[Extract username & roles directly from Token]
    D --> E[Grant Access to API Controller]
    C -- Invalid / Modified Token --> F[Reject Request: 401 Unauthorized]

    style C fill:#d4edda,stroke:#28a745
    style E fill:#d1ecf1,stroke:#17a2b8
    style F fill:#f8d7da,stroke:#dc3545
```

> [!NOTE]
> **Zero Database Overhead**: When a user hits `/api/test/user`, the server does **NOT** query the `users` table to verify if the token is valid. It verifies the signature using `app.jwt.secret`. If the signature matches, the server trusts the token contents implicitly.

---

## 2. Complete Step-by-Step Authentication Process

Here is how the frontend and backend interact during the whole user lifecycle:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant FE as Next.js Frontend (AuthContext)
    participant BE as Spring Boot Backend (Security)
    participant DB as H2 Database

    %% 1. LOGIN
    User->>FE: 1. Fill Login Form (username, password)
    FE->>BE: 2. POST /api/auth/login (credentials: include)
    BE->>DB: 3. Verify BCrypt Password in DB
    BE->>BE: 4. Generate JWT Access Token + UUID Refresh Token
    BE->>DB: 5. Save Refresh Token in DB
    BE-->>FE: 6. Return 200 OK + Set-Cookie headers (HttpOnly)
    FE->>FE: 7. Store user metadata in React state

    %% 2. PROTECTED REQUEST
    User->>FE: 8. Navigate to Dashboard
    FE->>BE: 9. GET /api/auth/me (Browser auto-attaches accessToken cookie)
    BE->>BE: 10. JwtAuthenticationFilter verifies JWT Signature
    BE-->>FE: 11. Return 200 OK (User Profile JSON)

    %% 3. AUTO TOKEN REFRESH
    note over BE,FE: 12. Access Token Expire after 24 hours
    FE->>BE: 13. GET /api/test/user (Expired Token)
    BE-->>FE: 14. Return 401 Unauthorized
    FE->>BE: 15. POST /api/auth/refresh (Auto-sends refreshToken cookie)
    BE->>DB: 16. Validate Refresh Token in DB
    BE-->>FE: 17. Return 200 OK + Set-Cookie: new accessToken
    FE->>BE: 18. Auto Retry GET /api/test/user
    BE-->>FE: 19. Return 200 OK (Protected Content)

    %% 4. LOGOUT
    User->>FE: 20. Click Logout
    FE->>BE: 21. POST /api/auth/logout
    BE->>DB: 22. Delete Refresh Token from DB
    BE-->>FE: 23. Return Set-Cookie: Max-Age=0 (Clears Cookies)
    FE->>FE: 24. Reset React User State to null
```

---

## 3. How to Interact with Other Projects & Systems

When using this application alongside **other frontend projects**, **microservices**, or **third-party systems**, there are four primary integration patterns:

```mermaid
graph TD
    AuthService["Central Attendance Auth Backend<br/>(Spring Boot - Port 8080)"]
    
    Sub1["Next.js Web App 1<br/>(Attendance UI - Port 3000)"]
    Sub2["Next.js Web App 2<br/>(Payroll UI - Port 3001)"]
    Micro1["Microservice A<br/>(HR Service - Java/Python)"]
    Mobile["Mobile App<br/>(iOS / Android)"]
    
    AuthService -- "Issues HttpOnly Cookie (Domain=.mydomain.com)" --> Sub1
    AuthService -- "Shares Cookie via SSO" --> Sub2
    AuthService -- "Shares app.jwt.secret for offline verification" --> Micro1
    AuthService -- "Issues Authorization: Bearer JWT" --> Mobile
```

---

### Pattern 1: Multiple Frontend Apps Sharing the Same Auth Backend (SSO - Single Sign-On)

Suppose you build a second frontend project (e.g., a **Payroll Portal** or **HR Management Dashboard** on Next.js or React):

1. **Shared Cookie Domain**:
   - In production (e.g., domain `mydomain.com`), configure `ResponseCookie` domain to `.mydomain.com`:
     ```java
     ResponseCookie.from("accessToken", token)
             .domain(".mydomain.com")
             .path("/")
             .httpOnly(true)
             .sameSite("Lax")
             .build();
     ```
   - When a user logs in at `auth.mydomain.com` or `attendance.mydomain.com`, the browser automatically transmits the `accessToken` cookie to `payroll.mydomain.com` and `hr.mydomain.com`.

2. **Cross-Origin Configuration (CORS)**:
   - Add all frontend origins to `SecurityConfig.java`:
     ```java
     configuration.setAllowedOriginPatterns(List.of(
         "http://localhost:3000",
         "http://localhost:3001",
         "https://*.mydomain.com"
     ));
     configuration.setAllowCredentials(true);
     ```

---

### Pattern 2: Multiple Backend Microservices (Decentralized JWT Verification)

Suppose you have another backend project (e.g., `payroll-service` or `reporting-service` written in Spring Boot, Node.js, Python, or Go):

#### How It Works:
- Microservices do **NOT** need to send HTTP requests to the `attendance` Auth service every time an API is hit.
- Instead, share the exact same `app.jwt.secret` (or public RSA key) across microservices!

```
                    ┌─────────────────────────┐
                    │ Next.js Frontend Client │
                    └────────────┬────────────┘
                                 │ (Cookie or Bearer JWT)
         ┌───────────────────────┴───────────────────────┐
         │                                               │
         ▼                                               ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│ Attendance Auth Service   │               │ Payroll Microservice      │
│ (Port 8080)               │               │ (Port 8081)               │
│ - Issues JWT tokens       │               │ - Verifies JWT using      │
│ - Secret: 'MySecretKey'   │               │   SAME 'MySecretKey'      │
└───────────────────────────┘               └───────────────────────────┘
```

#### Steps to implement in Microservice B:
1. Copy the `JwtTokenProvider` / JWT validation filter into Microservice B.
2. Configure the same secret key in `application.properties`:
   ```properties
   app.jwt.secret=9a4f2c8d7e1b5a3f6c8d0e2b4a6f8c1d3e5b7a9f0c2d4e6b8a0c2d4e6b8a0c2d
   ```
3. Microservice B parses incoming requests, validates the signature, extracts the user `username` and `roles`, and enforces permission checks locally without touching the `attendance` database.

---

### Pattern 3: Mobile Apps & External API Clients (Header Fallback)

Mobile apps (iOS / Android) or server-to-server API clients do not manage browser cookies automatically.

- **Dual Support Architecture**:
  `JwtAuthenticationFilter.java` supports **both** token transport mechanisms out-of-the-box:
  1. Checks for HTTP Cookie `accessToken`.
  2. Falls back to `Authorization: Bearer <JWT>` header if no cookie is present.

- Mobile clients store the returned `accessToken` string in secure device storage (e.g., iOS Keychain / Android EncryptedSharedPreferences) and attach it to API requests:
  ```http
  GET /api/test/user HTTP/1.1
  Host: api.attendance.com
  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
  ```

---

## 4. Multi-Project Integration Security Checklist

| Concern | Solution / Recommendation |
| :--- | :--- |
| **XSS Protection** | Store tokens in `HttpOnly` cookies so malicious JavaScript scripts cannot steal tokens. |
| **CSRF Protection** | Set `SameSite=Lax` or `SameSite=Strict` on cookies. For `POST` actions across cross-site domains, use CSRF anti-forgery tokens. |
| **CORS Access Control** | Always specify explicit origins (`allowedOriginPatterns`) and set `allowCredentials(true)`. Never use wildcard `*` with credentials. |
| **Secret Key Rotation** | Store `app.jwt.secret` in environment variables or cloud secrets management (AWS Secrets Manager, HashiCorp Vault), not hardcoded in source control. |
| **HTTPS Enforcement** | Set `.secure(true)` on `ResponseCookie` in production environments so cookies are sent exclusively over encrypted HTTPS connections. |

---

## 5. Summary Matrix of Token Behavior

| Scenario | Cookie Sent? | Header Sent? | How Backend Validates |
| :--- | :--- | :--- | :--- |
| **Same-domain Web App** | Yes (`accessToken`) | Optional | `JwtAuthenticationFilter` reads `accessToken` cookie. |
| **Cross-domain SSO Web App** | Yes (with `domain=.mydomain.com`) | Optional | Browser attaches cookie automatically via `credentials: 'include'`. |
| **Microservice-to-Microservice** | No | Yes (`Authorization: Bearer`) | Microservice verifies signature locally using shared secret. |
| **Mobile App (iOS/Android)** | No | Yes (`Authorization: Bearer`) | Filter extracts token from `Authorization` header fallback. |
