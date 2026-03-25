export const billDeliveryTemplate = {
  name: "Bill Delivery",
  documentType: "bill" as const,
  subject: "Bill {{bill.number}} from {{company.name}}",
  htmlBody: `
    <h1>Bill {{bill.number}}</h1>
    <p>Dear {{bill.supplierName}},</p>
    <p>Please find attached the bill details from {{company.name}}.</p>

    <table class="summary-table">
      <tr><td>Bill Number</td><td>{{bill.number}}</td></tr>
      <tr><td>Issue Date</td><td>{{formatDate bill.issueDate}}</td></tr>
      <tr><td>Due Date</td><td>{{formatDate bill.dueDate}}</td></tr>
      <tr><td>Total</td><td>{{formatCurrency bill.total}}</td></tr>
    </table>

    <p>If you have any questions, please contact us.</p>
  `,
};
