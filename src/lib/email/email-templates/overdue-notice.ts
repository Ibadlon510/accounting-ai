export const overdueNoticeTemplate = {
  name: "Overdue Notice",
  documentType: "overdue_notice" as const,
  subject: "Overdue: Invoice {{invoice.number}} — Past Due",
  htmlBody: `
    <h1 style="color:#dc2626">Overdue Notice</h1>
    <p>Dear {{invoice.customerName}},</p>
    <p>Our records indicate that the following invoice is now past due. Please arrange payment immediately to avoid further action.</p>

    <table class="summary-table">
      <tr><td>Invoice Number</td><td>{{invoice.number}}</td></tr>
      <tr><td>Original Due Date</td><td>{{formatDate invoice.dueDate}}</td></tr>
      <tr><td style="font-weight:700;color:#dc2626">Amount Overdue</td><td style="font-weight:700;color:#dc2626">{{formatCurrency invoice.amountDue}}</td></tr>
    </table>

    <p>If payment has already been made, please disregard this notice and accept our apologies.</p>
    <p>For any queries, contact us at {{company.email}} or {{company.phone}}.</p>
    <p style="font-size:13px;color:#6b7280">Regards,<br/>{{company.name}}</p>
  `,
};
