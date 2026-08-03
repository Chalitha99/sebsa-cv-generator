# RBAC & Row Level Security

## 0. Source and scope

Roles updated from the original 2-role MVP (Admin/Employee) to the 4-role model defined in
`SEBSA_Access_Control_Retention_Privacy_Protocol.docx` v1.1 ("Draft for Stakeholder Review").
Implemented in `supabase/migrations/0017_rbac_four_roles.sql`.

**Update (0020, demo-readiness pass)**: the maker-checker workflow originally deferred below is
now built — see §10/§11. **Update (post-demo polish)**: "Update My Profile" now covers every
field except name/work email (was role/department/skills only) — see §11's revised table; and
`/onboarding` gained a "Create manually" path for employees with no CV to upload, plus profile
picture capture (CV parsing never extracts a photo). What's still explicitly out of scope:

- Retention holds and automated disposal (doc §5) — no retention/hold columns or disposal job.
- Expanded audit logging for access-control and lifecycle events (doc §7) — `audit_logs` exists
  (Phase 11 in [06-phase-plan.md](./06-phase-plan.md)) but role-grant/lifecycle/approval events
  aren't written to it yet — `/review` approvals aren't currently logged anywhere but the
  `updated_at` timestamp on the affected profile.
- Auth account **creation** for internal roles (Admin, CV Reviewer) is still manual (Supabase
  Dashboard); only the Employee self-service **profile** path (below) is built.
- Email confirmation on `/signup` is a Supabase project setting, not app code — left as-is
  pending a decision on when to turn it off (relevant once Microsoft SSO replaces it as the
  identity proof).

### Employee self-service profile linking (migration 0018)

After landing the 4-role model, testing surfaced a real gap: no code path ever set
`profiles.user_id`, so a logged-in `employee`-role account had nothing to see — an empty
repository and no "own profile," because nothing was ever linked to them. `0018_employee_self_service_profile.sql`
+ `app/onboarding/` close this:

- `(authenticated)/layout.tsx` redirects any `employee`-role user with no linked profile to
  `/onboarding` (outside the `(authenticated)` route group, so no redirect loop).
- `/onboarding` reuses the same client-side PDF/DOCX/TXT extraction (`lib/parsing/extractClientText.ts`,
  shared with `/upload`) and `/api/parse-cv` Gemini extraction, then lets the employee review/
  correct the top-level fields before submitting.
- `createOwnProfileAction` (`app/onboarding/actions.ts`) uses the **RLS-bound** server client, not
  the admin client — the new `profiles_self_insert` policy (role='employee', `user_id = auth.uid()`,
  `status = 'draft'` only) is the actual enforcement boundary.
- The resulting profile is `status='draft'`: invisible to the general repository list
  (`listEmployeeRows` filters `status='published'`) until an Admin/Super Admin publishes it, but
  visible to the employee themselves via the existing `profiles_select` own-row policy — so they
  land on `/repository/<their-code>` after submitting, not an empty dashboard.
- Employees may keep editing their own submission while still `draft` (`profiles_self_update_draft`);
  once published, further self-edits are blocked (that's the doc's "Pending Change" flow, not built).

**Also fixed while investigating**: `createEmployeeAction` (admin Upload) and `updateEmployeeAction`
(`update-profile`) both use the service-role admin client (bypasses RLS) but previously checked
only `if (!user) throw` — no role check — meaning any authenticated user, including `employee`,
could call them directly and create or edit an arbitrary profile. Both now require
`isAdminOrAbove(user.role)` before touching the admin client.

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

`proxy.ts` protects `/dashboard`, `/repository`, `/upload`, `/generate`, `/templates`,
`/settings`, `/onboarding`, `/update-profile` by refreshing the Supabase session and redirecting
unauthenticated requests to `/login`. It only checks *authentication*, not role — per-role gating
happens at the page/nav level (§9) and in Server Actions. RLS is still the authoritative
boundary, never the route guard or page-level redirect alone.

## 9. Full role-gating pass (nav + page-level, all 4 roles)

Beyond RLS, the UI itself now reflects the permission matrix (§2) so nobody is shown a page or
button they can't act on:

- **`app/components/Sidebar.tsx`**: nav items are filtered by role. Employee sees a single "My
  Profile" link (`/repository/<their code>`). CV Reviewer sees Employee Profiles + CV Templates
  only. Admin/Super Admin keep the full set (Dashboard, Employee Profiles, Create/Update Profile,
  Customize CVs, CV Templates, Settings).
- **Server Component pages** (`dashboard`, `repository`, `repository/[id]`, `generate`,
  `update-profile`) call `getCurrentUser()` and `redirect()` before rendering: Employee always
  lands on their own profile; CV Reviewer is redirected away from pages with no reviewer
  permission (Upload, Generate, Update Profile, Settings) to `/repository`.
- **Client-only pages with no Server wrapper** (`upload`, `templates`, `settings`) use
  `lib/useRoleGate.ts` (new shared hook) or an inline equivalent to fetch the viewer's role
  client-side and `router.replace()` away if not permitted. This is a UX guard only — RLS and
  each Server Action's own role check are the real boundary, exactly as elsewhere in this doc.
- `repository/[id]`'s "Verify Talent Match" button (routes to `/generate`) and `repository`'s
  "Add Employee"/delete controls are hidden for viewers who can't use them, not just for Employee.

## 10. Employee self-service: claim vs. create (migration 0019)

0018 covered "create a new profile from scratch." 0019 adds the other half: an Admin may have
already bulk-added a CV for someone before they ever logged in. On landing at `/onboarding`, the
system first checks for an *unclaimed* profile (`user_id is null`) whose `email` exactly matches
the caller's own verified login email (`auth.email()`, read from their JWT — never client input):

- **Match found** → show a confirmation card (name/role/department preview) with "Yes, that's
  me" / "Not me". Confirming links `profiles.user_id` immediately (`profiles_self_claim` RLS
  policy) — no extra approval step, since the match is on their own verified email. "Not me"
  falls through to the normal CV-upload creation flow (0018).
- **No match** → straight to CV upload, as before.

**Admin-side duplicate prevention**: `createEmployeeAction` (admin Upload path) now checks for an
existing profile with the same email *before* creating a new one (any status), and refuses with a
pointer to the existing record instead of silently creating a duplicate.

**Active/Inactive display**: `Employee.isAccountLinked` (derived from `profiles.user_id != null`,
not a new column) drives an "Active"/"Inactive" badge in the Repository list and detail page —
distinct from `availability_status` (staffing availability), which is a different, pre-existing
concept. "Active" means someone has actually logged in and claimed/created this profile;
"Inactive" means it's still purely an Admin-maintained repository record.

## 8. Future OAuth (Microsoft SSO)

Unchanged from the original design — Supabase Auth supports adding an Azure AD OAuth provider
without schema changes. The source doc's §3 states internal roles (Admin, CV Reviewer) should be
linked to corporate SSO identity with no local passwords once SSO exists; today all roles
authenticate via Supabase email/password, consistent with [01-spec-alignment.md](./01-spec-alignment.md) §2.

## 11. Self-service signup (`/signup`)

New: `app/signup/page.tsx` calls `supabase.auth.signUp()` directly (no admin action involved —
anyone can create an account, same as any consumer SaaS signup). Every new account gets
`role='employee'` via the existing `handle_new_user()` trigger (0002) — there is no way to
self-register as Admin/Super Admin/CV Reviewer, matching the source doc's provisioning model
(§3: privileged roles are always provisioned by an existing Super Admin/Admin). If the Supabase
project has email confirmation enabled, the signup page shows a "check your email" screen instead
of a session; login proceeds normally once confirmed. This is deliberately provider-agnostic — an
Azure AD button can be added to both `/login` and `/signup` later without touching this flow.

## 12. Full maker-checker workflow (migration 0020)

Three independent approval gates, all reviewed from one page (`/review`, Super Admin/Admin/CV
Reviewer only — `app/(authenticated)/review/`):

| Gate | Employee action | Storage | Approve | Reject |
|---|---|---|---|---|
| New profile | Create from scratch at `/onboarding` (0018) | `profiles.status = 'draft'` | `status → 'published'` | delete the draft row |
| Account claim | "Yes, that's me" at `/onboarding` on an Admin-bulk-added profile (0019/0020) | `profiles.pending_claim_user_id` | `user_id ← pending_claim_user_id`, clear pending | clear `pending_claim_user_id` |
| Profile edit | "Update My Profile" at `/my-profile`, published profiles only — every field except name/work email | `profiles.pending_change` (jsonb: a full `CreateEmployeeInput`, with name/email filled in server-side from the current row so they can never be tampered with) | merge into live columns + full replace of experiences/projects/certifications/skills via `updateEmployee()`, clear pending | clear `pending_change`/`pending_change_submitted_at` |

Approve/reject actions (`app/(authenticated)/review/actions.ts`) use the service-role admin
client with a `isReviewerOrAbove()` check as the enforcement boundary — the same established
pattern as `createEmployeeAction`/`updateEmployeeAction`/`listUsersAction`, chosen because the
approval logic (merging a partial JSON patch into specific columns without touching unrelated
child tables — see `applyProfileChange()`'s doc comment on why it can't reuse
`updateEmployeeRow`) isn't expressible as a simple RLS row policy the way the *staging* writes
(`profiles_self_claim_request`, `profiles_self_propose_change`) are.

**Onboarding state machine** (`app/onboarding/page.tsx` computes all three checks server-side on
every load): pending claim request already submitted → waiting screen; else an unclaimed profile
matches their email → confirm card ("yes"/"not me"); else → CV upload create-from-scratch form.
This ordering prevents an infinite bounce between `/onboarding` and the confirm card after
requesting a claim — `hasLinkedProfile` stays false until approval, but the pending-claim check
takes priority over re-showing the claim card.

## 13. CV Reviewer can now create profiles

Per explicit product direction (this demo-readiness pass), CV Reviewer gained profile-creation
rights — `createEmployeeAction`'s gate changed from `isAdminOrAbove` to `isReviewerOrAbove`, and
`profiles_admin_insert` (0017) was replaced by `profiles_reviewer_insert` (0020). This is a
deliberate widening beyond the source document's literal matrix (which gives CV Reviewer no
profile-creation permission, only "Approve") — CV Reviewer editing/deleting other people's
existing profiles is still Admin/Super-Admin-only, unchanged.
