import { Resend } from "resend";

interface ApprovalEmailParams {
  toName: string;
  toEmail: string;
  retreatName: string;
  accessCode: string;
  expiresAt: Date;
  paymentUrl: string;
}

export async function sendApprovalEmail(
  params: ApprovalEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { toName, toEmail, retreatName, accessCode, expiresAt, paymentUrl } =
    params;

  const expiresFormatted = expiresAt.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const firstName = toName.split(" ")[0];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#faf8f4;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f4;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="text-align:center;padding-bottom:40px;">
              <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#abaa70;">
                ÚNA · A Thread Between Worlds
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:40px;">
              <div style="height:1px;background:rgba(171,170,112,0.35);"></div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding-bottom:28px;">
              <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:400;color:#473e0f;line-height:1.15;">
                ${firstName},<br/>you've been selected.
              </h1>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:19px;color:#2a2a2a;line-height:1.55;">
                We're delighted to let you know that your application for
                <em>${retreatName}</em> has been reviewed and approved.
                We would love to have you join us for this gathering.
              </p>
            </td>
          </tr>

          <!-- Access Code Block -->
          <tr>
            <td style="padding-bottom:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#efecdf;border:1px solid rgba(171,170,112,0.4);padding:28px 32px;">
                    <p style="margin:0 0 10px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#abaa70;">
                      Your access code
                    </p>
                    <p style="margin:0 0 6px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:28px;font-weight:500;letter-spacing:0.18em;color:#473e0f;">
                      ${accessCode}
                    </p>
                    <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10px;color:#6b6730;letter-spacing:0.05em;">
                      Valid until ${expiresFormatted}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#2a2a2a;line-height:1.55;">
                To confirm your spot, enter the code on our payment page.
                Your code will already be pre-filled at the link below:
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#473e0f;">
                    <a href="${paymentUrl}"
                      style="display:inline-block;padding:14px 36px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:0.28em;text-transform:uppercase;color:#efecdf;text-decoration:none;">
                      Confirm my spot
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td style="padding-bottom:40px;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#6b6730;line-height:1.6;">
                If you have any questions, just reply to this email and we'll be happy to help.
                We're so glad you've chosen to share this space with us.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:28px;">
              <div style="height:1px;background:rgba(171,170,112,0.35);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align:center;">
              <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#abaa70;">
                ÚNA · una.eco
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS!,
      to: toEmail,
      subject: `Your spot in ${retreatName} — ÚNA`,
      html,
    });
    if (error) {
      console.error("[send-approval-email]", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-approval-email]", message);
    return { success: false, error: message };
  }
}
