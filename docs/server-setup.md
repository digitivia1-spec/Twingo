# Server setup — fresh Hostinger VPS (Debian 12)

Runbook to rebuild the production box from scratch and make the GitHub Actions
deploy (`.github/workflows/deploy.yml`) work end to end. Run as `root` via the
Hostinger **web terminal** (so you can't lock yourself out).

> Host: `srv1611023.hstgr.cloud` (`72.62.238.207`) · KVM 1 · Debian 12 · France-Paris.
> The deploy triggers on push to `main`. It rsyncs the build to
> `/var/www/twingo-erp` and `pm2 reload`s the app on port 3000; Nginx reverse-
> proxies `twingo-demo.digitivia.com` → `127.0.0.1:3000`.

## 1 · System + swap (prevents OOM/SIGKILL during apt & builds)

```bash
apt-get update && apt-get -y upgrade   # keep local sshd_config if prompted
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h   # expect a "Swap: 2.0Gi" line
```

## 2 · Node 20 + pm2 + Nginx + app dirs

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx certbot python3-certbot-nginx rsync
npm install -g pm2
mkdir -p /var/www/twingo-erp /var/log/twingo-erp
node -v && pm2 -v   # expect v20.x + a pm2 version, both from /usr/bin
```

## 3 · Deploy SSH key → GitHub secret

```bash
install -d -m 700 /root/.ssh
ssh-keygen -t ed25519 -f /root/deploy_key -N "" -C "github-deploy"
cat /root/deploy_key.pub >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
cat /root/deploy_key   # copy the WHOLE private key
```

In **GitHub → Settings → Secrets and variables → Actions**:
- `VPS_SSH_KEY` = the private key above (incl. `-----BEGIN/END-----`)
- `VPS_USER` = `root`
- `VPS_HOST` = `72.62.238.207`

## 4 · Nginx reverse proxy + SSL

```bash
cat > /etc/nginx/sites-available/twingo <<'NGINX'
server {
    listen 80;
    server_name twingo-demo.digitivia.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX
ln -sf /etc/nginx/sites-available/twingo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
certbot --nginx -d twingo-demo.digitivia.com --non-interactive --agree-tos \
  -m a.nagui@digitivia.com --redirect
```

DNS for `twingo-demo.digitivia.com` must point to `72.62.238.207`. Confirm the
Hostinger **Security → Firewall** either has no firewall attached, or has
`Accept TCP` rules for **22 / 80 / 443** (Source `0.0.0.0/0`) — a firewall
attached with **0 rules drops everything**.

## 5 · Harden SSH — key-only (closes the root-password vector that got the box compromised)

```bash
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
grep -rl -E 'PermitRootLogin|PasswordAuthentication' /etc/ssh/sshd_config.d/ 2>/dev/null \
  | xargs -r sed -i -e 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' \
                    -e 's/^#*PasswordAuthentication.*/PasswordAuthentication no/'
systemctl restart ssh 2>/dev/null || systemctl restart sshd
```

## 6 · Deploy

Push to `main` (or re-run the latest **Deploy to VPS** run). The workflow builds,
SSHes in, rsyncs, and `pm2 start`s the app. Verify:

```bash
curl -sI http://127.0.0.1:3000 | head -1   # on the VPS → HTTP 200/redirect
pm2 status                                 # twingo-erp = online
```

`pm2 startup systemd -u root --hp /root` (run the line it prints) makes pm2
resurrect the app on reboot.

## Troubleshooting (deploy preflight messages)
- **Connection timed out** → firewall/host: open `:22` (Hostinger firewall) / VPS down.
- **Permission denied (publickey)** → `VPS_SSH_KEY` doesn't match `authorized_keys`, or `VPS_USER` wrong.
- **`node`/`pm2: command not found` or `Permission denied` (126/127)** → Node not installed for `root` (re-run §2).
- **`Method https ... signal 9`** during apt → OOM; add swap (§1).
