export const paymentReceiptTemplate = {
  name: "Payment Receipt",
  documentType: "payment_receipt" as const,
  subject: "Payment Confirmation - {{company.name}}",
  htmlBody: `
    <h1>Payment Received</h1>
    <p>Dear {{invoice.customerName}},</p>
    <p>We confirm receipt of your payment. Thank you!</p>

    <table class="summary-table">
      <tr><td>Payment Date</td><td>{{currentDate}}</td></tr>
      <tr><td>Invoice Reference</td><td>{{invoice.number}}</td></tr>
      <tr><td>Amount Received</td><td>{{formatCurrency invoice.amountPaid}}</td></tr>
      <tr><td>Remaining Balance</td><td>{{formatCurrency invoice.amountDue}}</td></tr>
    </table>

    <p style="font-size:13px;color:#6b7280">This is an automated payment confirmation from {{company.name}}.</p>
  `,
};
