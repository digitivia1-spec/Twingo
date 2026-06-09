-- 0018_support_demo_user — seed a ready-to-use customer-support demo login.
-- Mirrors the working demo users exactly (token columns '' not NULL, which is
-- what GoTrue requires to log in). Password: Twingo2026 (demo credential;
-- rotate before any real customer use).
do $$
declare uid uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'support@twinjo.com') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      email_change_token_current, email_change_confirm_status,
      phone_change, phone_change_token, reauthentication_token
    ) values (
      uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'support@twinjo.com', extensions.crypt('Twingo2026', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, false,
      '', '', '', '', '', 0, '', '', ''
    );
    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), 'support@twinjo.com', uid,
      jsonb_build_object('sub', uid::text, 'email', 'support@twinjo.com', 'email_verified', true),
      'email', now(), now(), now()
    );
  else
    select id into uid from auth.users where email = 'support@twinjo.com';
  end if;

  insert into public.users (id, auth_id, name, phone, email, role, branch_id, is_active, created_at, updated_at)
  values ('u_support_demo', uid, '{"ar":"دعم العملاء","en":"Customer Support"}'::jsonb,
          '+201012345006', 'support@twinjo.com', 'support', null, true, now(), now())
  on conflict (id) do update set auth_id = excluded.auth_id, role = 'support';
end $$;
