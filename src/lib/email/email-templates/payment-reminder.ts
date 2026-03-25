export const paymentReminderTemplate = {
  name: "Payment Reminder",
  documentType: "payment_reminder" as const,
  subject: "Payment Reminder: Invoice {{invoice.number}} is due",
  htmlBody: `
    <h1>Payment Reminder</h1>
    <p>Dear {{invoice.customerName}},</p>
    <p>This is a friendly reminder that payment for the following invoice is due.</p>

    <table class="summary-table">
      <tr><td>Invoice Number</td><td>{{invoice.number}}</td></tr>
      <tr><td>Due Date</td><td>{{formatDate invoice.dueDate}}</td></tr>
      <tr><td style="font-weight:700">Amount Due</td><td style="font-weight:700">{{formatCurrency invoice.amountDue}}</td></tr>
    </table>

    <p>Please arrange payment at your earliest convenience. If you have already made payment, kindly disregard this reminder.</p>
    <p>If you have any questions, please don't hesitate to contact us at {{company.email}}.</p>
    <p style="font-size:13px;color:#6b7280">Thank you,<br/>{{company.name}}</p>
  `,
};
