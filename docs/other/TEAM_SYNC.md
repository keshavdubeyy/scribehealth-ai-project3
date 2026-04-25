# Team Sync: Supabase & Admin Portal Migration (Spring 2026)

## 🏁 Current Status
We have successfully migrated the entire infrastructure to a **Supabase Serverless** stack. All functional requirements (FR-01 to FR-12) are now fully satisfied (100%).

### 🛠️ Key Changes in `main`
1.  **Database Migration**: MongoDB has been deprecated. The system now uses **PostgreSQL**.
2.  **Backend Modernization**: The Java/Spring Boot backend has been refactored to use **JPA/Hibernate** for Postgres compatibility.
3.  **Admin Hub (FR-02)**:
    - **Real-Time Dashboard**: Uses Supabase WebSockets (Realtime) to update prescription counts instantly.
    - **User Management**: Admins can now manually create doctor accounts or generate **Invite Codes**.
    - **Audit Log**: A new append-only logging system is active for all clinical actions.
4.  **Automatic Scoping**: Every patient and session is now automatically linked to the doctor's `organization_id` via the API layer.

## ⚠️ Required Actions for All Developers
If you are working on a secondary branch, you **MUST** perform these steps to stay in sync:

1.  **Rebase your branch**:
    ```bash
    git checkout main
    git pull
    git checkout your-branch
    git rebase main
    ```
2.  **Update Supabase Schema**:
    Log into Supabase and run the content of `frontend/supabase/schema.sql`. Make sure to **Disable RLS** for the `patients` and `sessions` tables as per the latest configuration.
3.  **Sync ENV Variables**:
    Ensure your `.env.local` matches the keys in `CREDENTIALS.md`.

## 🚀 The Road to 100% (Next Tasks)
Our overall project score is **88%**. To hit 100%, we need to formalize 2 more design patterns:

1.  **AdminFacade (Facade Pattern)**:
    - **Goal**: Wrap the `UserService`, `InviteService`, and `AuditService` behind a single class.
    - **Status**: Logic exists in routes, but needs a formal class implementation.
2.  **PatientProfileBuilder (Builder Pattern)**:
    - **Goal**: Refactor the patient creation flow to use a fluent `.setName().setAge().build()` pattern with validation logic.
3.  **NoteGenerator (Template Method)**:
    - **Goal**: Ensure all 6 specialty generators inherit from a strict `abstract class` to satisfy the Template Method requirement formally.

---
*Maintained by the Lead Architect.*
