# RBAC & Row Level Security

## 0. Source and scope

Roles updated from the original 2-role MVP (Admin/Employee) to the 4-role model defined in
`SEBSA_Access_Control_Retention_Privacy_Protocol.docx` v1.1 ("Draft for Stakeholder Review").
Implemented in `supabase/migrations/0017_rbac_four_roles.sql`.

**Explicitly out of scope for this change** (the source doc also specifies these; they're
substantial features tracked as future phases, not part of this "user access" update):

- Pending Profile / Pending Change maker-checker workflow (doc §2, §3) — there is no
  `pending_profiles` table or approve/reject action yet. CV Reviewer's "Approve" permission in
  the matrix has no concrete implementation to attach to.
- Retention holds and automated disposal (doc §5) — no retention/hold columns or disposal job.
- Expanded audit logging for access-control and lifecycle events (doc §7) — `audit_logs` exists
  (Phase 11 in [06-phase-plan.md](./06-phase-plan.md)) but role-grant/lifecycle events aren't
  written to it yet.
- Self-service employee registration/upload (doc §3 "Provisioning — Employee Self-Service") —
  accounts are still admin-provisioned only; no signup flow exists.

### Two flagged inconsistencies in the source document

The source doc is an explicit draft, and two cells contradict other parts of the same document.
Rather than guess, this implementation picks the more specific/detailed text and flags both for
confirmation with the doc author:

1. **User accounts/roles matrix cell vs. §3 "Role Changes".** The Access Control Matrix (doc §2)
   lists CV Reviewer as having "View, Edit, Delete (non-admin roles)" on user accounts — more
   power than Admin's "View, Edit (non-admin roles)" (no delete). But §3 "Role Changes" states
   plainly: *"Only a Super Admin may grant or revoke the Admin or Super Admin role. A Super Admin
   or Admin may grant or revoke the CV Reviewer role"* — no mention of CV Reviewer granting
   anything. **Implemented per §3**: CV Reviewer has no role-write access at all (see §6 below).
2. **Admin's profile matrix cell vs. existing app behavior.** The matrix gives Admin only "View"
   on Employee profile/CV, with editing implied to route through CV Reviewer approval. Since the
   maker-checker workflow isn't built, implementing this literally would leave **no role able to
   create or edit employee profiles** — breaking the Upload/Repository pages, which are the only
   working data-entry path today. **Implemented conservatively**: Admin keeps full profile CRUD
   (as before), Super Admin has the same, and CV Reviewer gets the matrix's read access. This
   Admin restriction should be revisited once the Pending Profile workflow exists.

## 1. Roles

| Role | Description | Granted by |
|---|---|---|
| **Super Admin** | Full system privileges. Only role that can grant/revoke Admin or Super Admin. Unrestricted view access. | Provisioned at setup; subsequent Super Admins appointed only by an existing Super Admin. |
| **Admin** | Manages non-privileged user accounts, CV templates, employee profiles, opportunities, generated CVs, audit logs. Cannot grant Admin/Super Admin. | Super Admin |
| **CV Reviewer** | Read access to profiles/original CVs/generated CVs for review purposes; full manage access on CV templates. No maker-checker "Approve" action implemented yet (see §0). | Super Admin or Admin |
| **Employee** | Self-service, future-ready. Views own profile only via `profiles.user_id = auth.uid()`. | Self-registration (not yet built); every new `auth.users` row defaults to `employee` via the `handle_new_user()` trigger. |

Stored in `user_roles.role`, one role per user. `public.current_user_role()` (0002) is the raw
lookup; `public.is_admin_or_above()` and `public.is_reviewer_or_above()` (0017) are the tier
helpers policies actually call.

## 2. Permission matrix (as implemented — see §0 for where this diverges from the source doc)

| Action | Super Admin | Admin | CV Reviewer | Employee |
|---|:---:|:---:|:---:|:---:|
| View employee profiles | ✅ all | ✅ all | ✅ all | own only |
| Create/edit/delete employee profile | ✅ | ✅ | ❌ | ❌ |
| View/download original CV file | ✅ | ✅ | ✅ | own only |
| Manage opportunities (customer requirements) | ✅ | ✅ | ❌ | ❌ |
| View generated CVs | ✅ | ✅ | ✅ | ❌ |
| Create/edit/delete generated CVs | ✅ | ✅ | ❌ | ❌ |
| Manage CV templates (upload/edit/delete) | ✅ | ✅ | ✅ | ❌ |
| View audit logs | ✅ | ✅ | ✅ | ❌ |
| View user accounts/roles | ✅ | ✅ | ✅ | own only |
| Grant/revoke Admin or Super Admin role | ✅ | ❌ | ❌ | ❌ |
| Grant/revoke CV Reviewer or Employee role | ✅ | ✅ | ❌ | ❌ |

This matrix drives the RLS policies below, `app/(authenticated)/settings/actions.ts`'s in-app
checks, and in-page conditional rendering (e.g. `templates/page.tsx`'s `canManageTemplates`,
`settings/page.tsx`'s User Access card).

## 3. RLS strategy

Unchanged from the original approach — `security definer` helper functions avoid a per-row
subquery:

```sql
create or replace function public.current_user_role() ... -- 0002_user_roles.sql, unchanged

create or replace function public.is_admin_or_above()
returns boolean language sql security definer stable set search_path = public as $$
  select current_user_role() in ('admin', 'super_admin')
$$;

create or replace function public.is_reviewer_or_above()
returns boolean language sql security definer stable set search_path = public as $$
  select current_user_role() in ('admin', 'super_admin', 'cv_reviewer')
$$;
```

## 4. Representative policies (full set in `0017_rbac_four_roles.sql`)

```sql
-- profiles: read widens to reviewer_or_above; writes stay admin_or_above (see §0.2)
create policy profiles_select on profiles for select using (
  is_reviewer_or_above() or user_id = auth.uid()
);
create policy profiles_admin_update on profiles for update using (is_admin_or_above())
  with check (is_admin_or_above());

-- templates: matrix gives CV Reviewer full manage access, same as Admin/Super Admin
create policy templates_reviewer_all on templates for all using (is_reviewer_or_above())
  with check (is_reviewer_or_above());

-- generated_cvs: CV Reviewer gets read-only; write stays admin_or_above
create policy generated_cvs_select on generated_cvs for select using (is_reviewer_or_above());
create policy generated_cvs_admin_write on generated_cvs for insert with check (is_admin_or_above());

-- opportunities: matrix shows no CV Reviewer access at all — unchanged from admin-only
create policy opportunities_admin_all on opportunities for all using (is_admin_or_above())
  with check (is_admin_or_above());
```

## 5. Storage bucket policies

`original-cvs` and `generated-cvs` widen to reviewer-or-above for **read**; write stays
admin-or-above. `profile-pictures` (0016) widens its existing admin-only write policy to
admin-or-above. Full policies in `0017_rbac_four_roles.sql` §11–12.

## 6. `user_roles` — the grant hierarchy

Per §0's flagged inconsistency #1, implemented per doc §3 ("Role Changes"), not the matrix cell:

```sql
create policy user_roles_write on user_roles for all using (
  current_user_role() = 'super_admin'
  or (current_user_role() = 'admin' and role in ('cv_reviewer', 'employee'))
) with check (
  current_user_role() = 'super_admin'
  or (current_user_role() = 'admin' and role in ('cv_reviewer', 'employee'))
);
```

Both the `using` (old row) and `with check` (new row) clauses apply the same condition, so an
Admin can only touch a `user_roles` row whose **current** role is `cv_reviewer`/`employee`, and
can only set it to `cv_reviewer`/`employee` — they can neither promote someone to `admin`/
`super_admin` nor modify an existing `admin`/`super_admin` row at all. CV Reviewer and Employee
get no write access to `user_roles` (read-only via `user_roles_select`, own row or
reviewer-or-above).

`app/(authenticated)/settings/actions.ts`'s `updateUserRoleAction` mirrors this exact logic via
`canAssignRole()` (`lib/roles.ts`) before hitting the database — a friendlier error message, not
the real enforcement boundary. The RLS policy above is what actually blocks a bad request.

## 7. Route-level protection (`proxy.ts`, Phase 3)

Unchanged: `proxy.ts` protects `/dashboard`, `/repository`, `/upload`, `/generate`, `/templates`,
`/settings` by refreshing the Supabase session and redirecting unauthenticated requests to
`/login`. Role-specific gating happens in-page (Settings' User Access card, Templates' upload/
delete controls) and in Server Actions — RLS is still the authoritative boundary, never the route
guard alone.

## 8. Future OAuth (Microsoft SSO)

Unchanged from the original design — Supabase Auth supports adding an Azure AD OAuth provider
without schema changes. The source doc's §3 states internal roles (Admin, CV Reviewer) should be
linked to corporate SSO identity with no local passwords once SSO exists; today all roles
authenticate via Supabase email/password, consistent with [01-spec-alignment.md](./01-spec-alignment.md) §2.
