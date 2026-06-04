-- 0014_auth_admin — bootstrap the super_admin login (links seeded user u_nagui
-- to auth.users). Email confirmation intentionally pre-set (demo, no friction).
-- Password is a demo credential; rotate before any real customer use.
do $$
declare uid uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'nagui@twinjo.com') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
    ) values (
      uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'nagui@twinjo.com', extensions.crypt('Twingo!Demo2026', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, false
    );
    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), 'nagui@twinjo.com', uid,
      jsonb_build_object('sub', uid::text, 'email', 'nagui@twinjo.com', 'email_verified', true),
      'email', now(), now(), now()
    );
  else
    select id into uid from auth.users where email = 'nagui@twinjo.com';
  end if;

  insert into public.users (id, auth_id, name, phone, email, role, branch_id, is_active, created_at, updated_at)
  values ('u_nagui', uid, '{"ar":"أحمد ناجي","en":"Ahmed Nagui"}'::jsonb, '+201012345001',
          'nagui@twinjo.com', 'super_admin', null, true, '2025-10-01T08:00:00Z', now())
  on conflict (id) do update set auth_id = excluded.auth_id, role = 'super_admin';
end $$;
