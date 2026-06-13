import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send a payment receipt email to the customer.
 * Mobile-responsive using table-based layout (works on Gmail, Outlook, Apple Mail)
 */
export const sendReceiptEmail = async ({
  to,
  customerName,
  orderNumber,
  tableNumber,
  items = [],
  subtotal = 0,
  tax = 0,
  discount = 0,
  total = 0,
  paymentMethod = 'Cash',
  paidAt,
}) => {
  const transporter = createTransporter();

  const fc = (n) => `&#8377;${Number(n).toFixed(2)}`;
  const dateStr = paidAt
    ? new Date(paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  // Each item as a 3-column row (Name | Qty x Price | Total) — fits phone screen
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;font-size:13px;color:#2b2118;word-break:break-word;">${item.name}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;font-size:13px;color:#6f4e37;text-align:center;white-space:nowrap;">${item.qty} &times; ${fc(item.unitPrice)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0e8d8;font-size:13px;font-weight:700;color:#2b2118;text-align:right;white-space:nowrap;">${fc(item.qty * item.unitPrice)}</td>
    </tr>`).join('');

  // Meta info rows (stacked table cells — 2 per row)
  const metaRow1 = `
    <tr>
      <td style="padding:8px 10px;width:50%;vertical-align:top;">
        <div style="font-size:10px;font-weight:700;color:#6f4e37;text-transform:uppercase;letter-spacing:0.5px;">Order</div>
        <div style="font-size:14px;font-weight:800;color:#2b2118;margin-top:2px;">#${orderNumber}</div>
      </td>
      ${tableNumber ? `
      <td style="padding:8px 10px;width:50%;vertical-align:top;">
        <div style="font-size:10px;font-weight:700;color:#6f4e37;text-transform:uppercase;letter-spacing:0.5px;">Table</div>
        <div style="font-size:14px;font-weight:800;color:#2b2118;margin-top:2px;">Table ${tableNumber}</div>
      </td>` : '<td></td>'}
    </tr>`;

  const metaRow2 = `
    <tr>
      <td style="padding:8px 10px;width:50%;vertical-align:top;">
        <div style="font-size:10px;font-weight:700;color:#6f4e37;text-transform:uppercase;letter-spacing:0.5px;">Date</div>
        <div style="font-size:12px;font-weight:600;color:#2b2118;margin-top:2px;">${dateStr}</div>
      </td>
      <td style="padding:8px 10px;width:50%;vertical-align:top;">
        <div style="font-size:10px;font-weight:700;color:#6f4e37;text-transform:uppercase;letter-spacing:0.5px;">Payment</div>
        <div style="font-size:14px;font-weight:800;color:#2b2118;margin-top:2px;">${paymentMethod}</div>
      </td>
    </tr>`;

  const discountRow = discount > 0 ? `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:#22c55e;">Discount</td>
      <td style="padding:5px 0;font-size:13px;font-weight:600;color:#22c55e;text-align:right;">-${fc(discount)}</td>
    </tr>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Payment Receipt - Odoo Cafe</title>
  <style>
    body { margin: 0; padding: 0; background: #faf3e0; font-family: 'Segoe UI', Arial, sans-serif; -webkit-text-size-adjust: 100%; }
    .email-wrapper { width: 100%; background: #faf3e0; padding: 20px 0; }
    .email-card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    @media only screen and (max-width: 600px) {
      .email-card { border-radius: 0 !important; }
      .email-pad { padding-left: 16px !important; padding-right: 16px !important; }
      .meta-table td { display: block !important; width: 100% !important; box-sizing: border-box; }
    }
  </style>
</head>
<body>
<div class="email-wrapper">
<table class="email-card" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width:560px;">

  <!-- HEADER -->
  <tr>
    <td style="background:#6f4e37;padding:28px 20px;text-align:center;">
      <div style="font-size:32px;line-height:1;margin-bottom:8px;">&#9749;</div>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;">Odoo Cafe</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Payment Receipt</p>
    </td>
  </tr>

  <!-- GREETING -->
  <tr>
    <td class="email-pad" style="padding:22px 24px 4px;">
      <p style="margin:0;font-size:15px;color:#2b2118;line-height:1.5;">
        Hi <strong>${customerName || 'Valued Customer'}</strong>,<br/>
        Thank you for dining with us! Here is your receipt.
      </p>
    </td>
  </tr>

  <!-- ORDER META (2x2 grid) -->
  <tr>
    <td class="email-pad" style="padding:16px 24px;">
      <table class="meta-table" cellpadding="0" cellspacing="0" border="0" width="100%"
             style="background:#faf3e0;border-radius:10px;overflow:hidden;">
        ${metaRow1}
        ${metaRow2}
      </table>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr>
    <td class="email-pad" style="padding:0 24px;">
      <div style="border-top:1px solid #f0e8d8;"></div>
    </td>
  </tr>

  <!-- ITEMS TABLE (3 columns: Item | Qty x Price | Total) -->
  <tr>
    <td class="email-pad" style="padding:16px 24px 8px;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:800;color:#6f4e37;text-transform:uppercase;letter-spacing:0.5px;">Order Items</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
             style="border-collapse:collapse;border:1px solid #f0e8d8;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#faf3e0;">
            <th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:#6f4e37;text-transform:uppercase;">Item</th>
            <th style="padding:9px 8px;text-align:center;font-size:11px;font-weight:800;color:#6f4e37;text-transform:uppercase;">Qty &times; Rate</th>
            <th style="padding:9px 8px;text-align:right;font-size:11px;font-weight:800;color:#6f4e37;text-transform:uppercase;">Amt</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </td>
  </tr>

  <!-- TOTALS -->
  <tr>
    <td class="email-pad" style="padding:8px 24px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:5px 0;font-size:13px;color:#6f4e37;">Subtotal</td>
          <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2b2118;text-align:right;">${fc(subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;font-size:13px;color:#6f4e37;">Tax</td>
          <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2b2118;text-align:right;">${fc(tax)}</td>
        </tr>
        ${discountRow}
        <tr>
          <td style="padding:12px 0 0;border-top:2px solid #f0e8d8;font-size:16px;font-weight:800;color:#2b2118;">Total Paid</td>
          <td style="padding:12px 0 0;border-top:2px solid #f0e8d8;font-size:20px;font-weight:900;color:#6f4e37;text-align:right;">${fc(total)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- THANK YOU BANNER -->
  <tr>
    <td class="email-pad" style="padding:4px 24px 24px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="background:#6f4e37;border-radius:10px;padding:18px 20px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:14px;font-weight:700;">Thank you for visiting Odoo Cafe! &#128591;</p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.70);font-size:12px;">We hope to see you again soon.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER NOTE -->
  <tr>
    <td style="padding:0 24px 20px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#a08060;">This is an automatically generated receipt. Please keep it for your records.</p>
    </td>
  </tr>

</table>
</div>
</body>
</html>`;

  const info = await transporter.sendMail({
    from: `"Odoo Cafe" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your Receipt from Odoo Cafe - Order #${orderNumber}`,
    html,
  });

  return info;
};
