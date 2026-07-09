# RBAC & Row Level Security

## 1. Roles (from the functional spec)

- **Admin** — manage users/roles, manage templates, view audit logs, system configuration, view all generated CV history, upload/update employee CVs, edit employee profile data, search & view profiles, upload customer requirements, search employees, select employee & template, generate/preview/edit/export CVs, view generated CV history, approve for export.
- **Employee** (future-ready, self-service) — view own profile, submit CV update requests.

Stored in `user_roles.role`, one role per user for the MVP (spec doesn't require multi-role users).

## 2. Permission matrix

| Action                             | Admin |          Employee          |
| ---------------------------------- | :---: | :------------------------: |
| View/search employee profiles      |  ✅  |          own only          |
| Upload/edit employee CV            |  ✅  | own (request only, future) |
| Delete employee profile            |  ✅  |             ❌             |
| Upload/manage opportunities        |  ✅  |             ❌             |
| Generate/edit/regenerate CV        |  ✅  |             ❌             |
| Export CV                          |  ✅  |             ❌             |
| Manage templates                   |  ✅  |             ❌             |
| Select template at generation time |  ✅  |             ❌             |
| Manage users & roles               |  ✅  |             ❌             |
| View audit logs                    |  ✅  |             ❌             |
| System/company settings            |  ✅  |             ❌             |

This matrix drives both the RLS policies below and the `proxy.ts` route guard (Phase 3) and
any in-page conditional rendering (e.g. hiding admin-only controls for the Employee role).

## 3. RLS strategy

Supabase RLS policies re-run per row on every query, so role lookups inside a policy must be
cheap and non-recursive. Use a `security definer` helper function instead of a subquery per
policy:

```sql
create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from user_roles where user_id = auth.uid()
$$;
```

Policies then read `public.current_user_role() = 'admin'` etc. — one cached lookup per query
instead of a join.

## 4. Representative policies

```sql
-- profiles: read
create policy profiles_select on profiles for select using (
  current_user_role() in ('admin')
  or user_id = auth.uid()
);

-- profiles: write (upload/edit)
create policy profiles_write on profiles for insert with check (
  current_user_role() in ('admin')
);
create policy profiles_update on profiles for update using (
  current_user_role() in ('admin')
) with check (
  current_user_role() in ('admin')
);
create policy profiles_delete on profiles for delete using (
  current_user_role() in ('admin')
);

-- experiences/projects/certifications/profile_skills: mirror the parent profile's policy
create policy experiences_select on experiences for select using (
  exists (select 1 from profiles p where p.id = experiences.profile_id)
  and current_user_role() in ('admin')
);
-- (write policies mirror profiles_write/update/delete, scoped via profile_id)

-- opportunities
create policy opportunities_all on opportunities for all using (
  current_user_role() in ('admin')
) with check (
  current_user_role() in ('admin')
);

-- templates: everyone who can generate a CV can read; only admin writes
create policy templates_select on templates for select using (
  current_user_role() in ('admin')
);
create policy templates_write on templates for insert with check (current_user_role() = 'admin');
create policy templates_update on templates for update using (current_user_role() = 'admin');
create policy templates_delete on templates for delete using (current_user_role() = 'admin');

-- generated_cvs
create policy generated_cvs_all on generated_cvs for all using (
  current_user_role() in ('admin')
) with check (
  current_user_role() in ('admin')
);

-- audit_logs: insert via service role (Route Handlers use the admin client), select admin-only
create policy audit_logs_select on audit_logs for select using (current_user_role() = 'admin');

-- user_roles: everyone can read their own row; only admin manages all
create policy user_roles_self_select on user_roles for select using (
  user_id = auth.uid() or current_user_role() = 'admin'
);
create policy user_roles_admin_write on user_roles for all using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');
```

All tables have RLS **enabled and forced** (`alter table ... enable row level security; alter table ... force row level security;`) so even the table owner role is subject to policies
inside normal request paths — only the service-role key (used server-side in Route Handlers for
things like audit log writes and AI orchestration) bypasses RLS entirely, and that key never
reaches the browser.

## 5. Storage bucket policies

```sql
-- original-cvs: readable/writable by admin only
create policy original_cvs_rw on storage.objects for all using (
  bucket_id = 'original-cvs' and current_user_role() = 'admin'
) with check (
  bucket_id = 'original-cvs' and current_user_role() = 'admin'
);

-- generated-cvs: readable/writable by admin only
create policy generated_cvs_rw on storage.objects for all using (
  bucket_id = 'generated-cvs' and current_user_role() = 'admin'
) with check (
  bucket_id = 'generated-cvs' and current_user_role() = 'admin'
);
```

## 6. Route-level protection (`proxy.ts`, Phase 3)

Even though RLS is the actual security boundary, `proxy.ts` protects `/dashboard`,
`/repository`, `/upload`, `/generate`, `/templates`, `/settings` by refreshing the Supabase
session and redirecting unauthenticated requests to `/login`. It additionally does a coarse
role check for `/settings` (admin-only sections) and `/upload` (blocks `employee` role) to avoid
flashing UI the user can't act on — the authoritative check always remains RLS + service-layer
checks, never the middleware alone.

## 7. Future OAuth (Microsoft SSO)

Supabase Auth supports adding an Azure AD OAuth provider without schema changes — a user who
signs in via SSO gets the same `auth.users` row shape, and `user_roles` is assigned the same way
(default role on first login, or pre-provisioned by an admin via email match). No changes to RLS
policies are needed when SSO is added later.
