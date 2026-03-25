export const invoiceDeliveryTemplate = {
  name: "Invoice Delivery",
  documentType: "invoice" as const,
  subject: "Invoice {{invoice.number}} from {{company.name}}",
  htmlBody: `
    <h1>Invoice {{invoice.number}}</h1>
    <p>Dear {{invoice.customerName}},</p>
    <p>Please find attached your invoice from {{company.name}}.</p>

    <table class="summary-table">
      <tr><td>Invoice Number</td><td>{{invoice.number}}</td></tr>
      <tr><td>Issue Date</td><td>{{formatDate invoice.issueDate}}</td></tr>
      <tr><td>Due Date</td><td>{{formatDate invoice.dueDate}}</td></tr>
      <tr><td>Amount Due</td><td>{{formatCurrency invoice.amountDue}}</td></tr>
    </table>

    <p style="text-align:center;margin-top:24px">
      <span class="highlight">{{formatCurrency invoice.total}}</span>
    </p>

    {{#if invoice.notes}}
    <p style="font-size:13px;color:#6b7280;margin-top:16px;padding-top:16px;border-top:1px solid #f3f4f6">{{invoice.notes}}</p>
    {{/if}}

    <p>If you have any questions, please don't hesitate to contact us.</p>
    <p style="font-size:13px;color:#6b7280">Thank you for your business.</p>
  `,
};
