const crypto = require('node:crypto');

function verifyWebhook(signature, rawBody, secret) {
  if (!signature || !secret || typeof signature !== 'string') return false;
  const parts = signature.split('.');
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (header.alg !== 'HS256') return false;
    const actual = Buffer.from(parts[2], 'base64url');
    const expected = crypto.createHmac('sha256', secret).update(parts[0] + '.' + parts[1]).digest();
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const digest = crypto.createHash('sha256').update(rawBody).digest('hex');
    return claims.iss === 'netlify' && claims.sha256 === digest;
  } catch { return false; }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const secret = process.env.NETLIFY_WEBHOOK_SECRET;
  if (!token || !chatId || !secret) return { statusCode: 500, body: 'Missing server configuration' };
  const body = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : Buffer.from(event.body || '', 'utf8');
  const signature = event.headers?.['x-webhook-signature'] || event.headers?.['X-Webhook-Signature'];
  if (!verifyWebhook(signature, body, secret)) return { statusCode: 403, body: 'Invalid webhook signature' };
  let payload;
  try { payload = JSON.parse(body.toString('utf8')); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }
  const formName = payload.form_name || payload.formName || payload.form?.name || payload.name;
  if (formName && formName !== 'visit-request') return { statusCode: 200, body: 'Ignored other form' };
  const data = payload.data || payload.payload?.data || {};
  const contact = String(data.contact || '미입력').slice(0, 200);
  const message = String(data.message || '내용 없음').slice(0, 1500);
  const text = `📩 가토통신 새 콜백 접수\n\n연락처: ${contact}\n요청 내용: ${message}\n\nNetlify Forms에서 원본 접수를 확인하세요.`;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    if (!response.ok) {
      console.error('Telegram delivery failed', response.status);
      return { statusCode: 502, body: 'Telegram delivery failed' };
    }
    return { statusCode: 200, body: 'Sent' };
  } catch (error) {
    console.error('Telegram request error', error?.message);
    return { statusCode: 502, body: 'Telegram request failed' };
  }
};
