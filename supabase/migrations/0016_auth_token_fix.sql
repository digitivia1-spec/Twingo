-- 0016_auth_token_fix — GoTrue scans auth.users token columns into NON-nullable
-- Go strings; rows created via SQL (0014/0015) left them NULL, causing
-- "Scan error on column 'confirmation_token': converting NULL to string is
-- unsupported" → HTTP 500 on every /token (password) request. Backfill to ''.
update auth.users
set confirmation_token         = coalesce(confirmation_token, ''),
    recovery_token             = coalesce(recovery_token, ''),
    email_change_token_new     = coalesce(email_change_token_new, ''),
    email_change               = coalesce(email_change, ''),
    email_change_token_current = coalesce(email_change_token_current, ''),
    phone_change               = coalesce(phone_change, ''),
    phone_change_token         = coalesce(phone_change_token, ''),
    reauthentication_token     = coalesce(reauthentication_token, '');
