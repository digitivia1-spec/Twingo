import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

/**
 * Sentry → Resend email relay for client feedback events.
 *
 * Sentry project webhook posts here whenever a feedback event lands. We:
 *  1. Verify the HMAC signature (if a secret is configured).
 *  2. Parse the Sentry payload.
 *  3. Format a bilingual HTML email.
 *  4. Post to Resend — gracefully no-op if RESEND_API_KEY is missing
 *     (Sentry's built-in email alert is then the sole notification path).
 *
 * Configure in Sentry: Settings → Integrations → Webhooks →
 *   URL: https://twingo-demo.digitivia.com/api/feedback
 *   Events: "issue.created" with tag filter feedback:true
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SentryWebhook {
  action?: string;
  data?: {
    event?: {
      tags?: Array<[string, string]>;
      user?: { name?: string; email?: string };
      contexts?: {
        feedback?: {
          message?: string;
          contact_email?: string;
          name?: string;
          url?: string;
        };
      };
      url?: string;
    };
    issue?: {
      title?: string;
      permalink?: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // 1. Verify signature (optional)
    const secret = process.env.SENTRY_WEBHOOK_SECRET;
    if (secret) {
      const sig = req.headers.get('sentry-hook-signature');
      const computed = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
      if (!sig || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(computed))) {
        return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
      }
    }

    const payload: SentryWebhook = JSON.parse(rawBody);
    const event = payload.data?.event;
    const issue = payload.data?.issue;
    const tags = Object.fromEntries(event?.tags ?? []);

    // Only act on feedback events.
    if (tags.feedback !== 'true') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const subject = `💬 Twinjo feedback — ${tags.elementId ?? 'unknown element'}`;
    const html = formatFeedbackHtml({
      elementId: tags.elementId,
      page: tags.page,
      locale: tags.locale,
      comment: event?.contexts?.feedback?.message,
      contact: event?.contexts?.feedback?.contact_email,
      name: event?.contexts?.feedback?.name,
      url: event?.url,
      issueTitle: issue?.title,
      issueLink: issue?.permalink,
    });

    // 3. Send via Resend (optional)
    const resendKey = process.env.RESEND_API_KEY;
    const emailTo = (process.env.FEEDBACK_EMAIL_TO ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const emailFrom =
      process.env.FEEDBACK_EMAIL_FROM ??
      'Twinjo Feedback <feedback@digitivia.com>';

    if (resendKey && emailTo.length > 0) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: emailFrom,
          to: emailTo,
          subject,
          html,
        }),
      });
      if (!r.ok) {
        const text = await r.text();
        console.error('[feedback] resend failed', r.status, text);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[feedback] relay error', err);
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 },
    );
  }
}

function formatFeedbackHtml(data: {
  elementId?: string;
  page?: string;
  locale?: string;
  comment?: string;
  contact?: string;
  name?: string;
  url?: string;
  issueTitle?: string;
  issueLink?: string;
}): string {
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:6px 12px;color:#64748b;font-size:12px;border-bottom:1px solid #e2e8f0;">${label}</td><td style="padding:6px 12px;font-size:13px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${escape(value)}</td></tr>`
      : '';
  return `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <h1 style="margin:0 0 4px;font-size:18px;font-weight:800;color:#1d4ed8;">💬 Twinjo ERP — Client feedback</h1>
      <p style="margin:0 0 16px;font-size:12px;color:#64748b;">A new comment was left on the demo.</p>

      <div style="background:#eff6ff;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0;font-size:14px;color:#0f172a;white-space:pre-wrap;">${escape(data.comment ?? '—')}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        ${row('Element ID', data.elementId)}
        ${row('Page', data.page)}
        ${row('Locale', data.locale)}
        ${row('URL', data.url)}
        ${row('From', data.name)}
        ${row('Contact', data.contact)}
        ${row('Sentry issue', data.issueTitle)}
      </table>

      ${data.issueLink ? `<p style="margin:16px 0 0;"><a href="${escape(data.issueLink)}" style="color:#1d4ed8;text-decoration:none;font-weight:600;font-size:12px;">→ Open in Sentry</a></p>` : ''}
    </div>
    <p style="margin:12px 0 0;font-size:10px;color:#94a3b8;text-align:center;">Digitivia · Twinjo ERP relay · automated</p>
  </div>
</body>
</html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'twinjo-feedback-relay' });
}
