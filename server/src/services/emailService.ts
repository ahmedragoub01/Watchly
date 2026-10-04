const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function getSender() {
  const email = process.env.BREVO_FROM_EMAIL;
  if (!email) {
    throw new Error('BREVO_FROM_EMAIL is not set in .env — emails cannot be sent without a verified sender');
  }
  return {
    email,
    name: process.env.BREVO_FROM_NAME || 'Watchly',
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  context?: string;
}

export async function sendEmail({ to, subject, html, context = 'Email' }: SendEmailOptions): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey || apiKey.includes('placeholder') || apiKey === 'your_brevo_api_key_here') {
    console.log(`\n📧 [${context}] Email would be sent to: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   (Set BREVO_API_KEY in .env to send real emails)\n`);
    return;
  }

  const sender = getSender();

  const body = {
    sender,
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = (errorData as any)?.message || response.statusText;
      throw new Error(`Brevo API ${response.status}: ${errorMsg}`);
    }

    const data = await response.json();
    console.log(`[${context}] Email sent to ${to} (messageId: ${(data as any)?.messageId || 'n/a'})`);
  } catch (err: any) {
    console.error(`[${context}] Brevo API Error:`, err.message || err);
    throw new Error(`Failed to send email: ${err.message || 'Unknown error'}`);
  }
}
