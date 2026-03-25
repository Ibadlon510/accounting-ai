export const statementDeliveryTemplate = {
  name: "Statement Delivery",
  documentType: "statement" as const,
  subject: "Account Statement - {{company.name}}",
  htmlBody: `
    <h1>Account Statement</h1>
    <p>Dear {{statement.customerName}},</p>
    <p>Please find attached your account statement from {{company.name}}.</p>

    <table class="summary-table">
      <tr><td>Total Invoiced</td><td>{{formatCurrency statement.totalInvoiced}}</td></tr>
      <tr><td>Total Paid</td><td>{{formatCurrency statement.totalPaid}}</td></tr>
      <tr><td>Credit Notes</td><td>{{formatCurrency statement.totalCreditNotes}}</td></tr>
      <tr><td style="font-weight:700">Balance Due</td><td style="font-weight:700">{{formatCurrency statement.balance}}</td></tr>
    </table>

    <p>If you have any queries regarding this statement, please contact us at {{company.email}}.</p>
    <p style="font-size:13px;color:#6b7280">Thank you for your business.</p>
  `,
};
