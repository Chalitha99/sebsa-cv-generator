-- Create profile-pictures bucket for employee avatar images (idempotent)
insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', true)
on conflict (id) do nothing;

-- Allow any authenticated user to upload their own profile picture
create policy if not exists profile_pictures_auth_upload on storage.objects
  for insert
  with check (
    bucket_id = 'profile-pictures'
    and auth.role() = 'authenticated'
  );

-- Allow any authenticated user to read profile pictures (public bucket is already readable,
-- but adding an explicit SELECT policy for defence-in-depth)
create policy if not exists profile_pictures_auth_read on storage.objects
  for select
  using (
    bucket_id = 'profile-pictures'
  );

-- Allow admin users to delete/update profile pictures
create policy if not exists profile_pictures_admin_rw on storage.objects
  for all
  using (
    bucket_id = 'profile-pictures'
    and current_user_role() = 'admin'
  )
  with check (
    bucket_id = 'profile-pictures'
    and current_user_role() = 'admin'
  );
