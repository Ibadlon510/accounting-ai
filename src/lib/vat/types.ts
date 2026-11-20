/** Tax code types stored on `tax_codes.type`. */
export type TaxCodeType =
  | "output"
  | "input"
  | "exempt"
  | "zero"
  | "reverse_charge";

export type VatLineClassification =
  | "standard"
  | "zero"
  | "exempt"
  | "reverse_charge";

/** FTA VAT 201–aligned MVP boxes (simplified emirates split). */
export type Vat201Boxes = {
  quarter: string;
  periodStart: string;
  periodEnd: string;

  /** Box 1a — standard-rated supplies (value) */
  box1a_taxable_sales: number;
  /** Box 1b — VAT due on standard-rated supplies */
  box1b_output_vat: number;
  /** Box 3 — supplies subject to reverse charge (value) */
  box3_reverse_charge_supplies: number;
  /** Box 4 — zero-rated supplies */
  box4_zero_rated_supplies: number;
  /** Box 5 — exempt supplies */
  box5_exempt_supplies: number;

  /** Box 8 — standard-rated expenses / purchases (value) */
  box8_taxable_purchases: number;
  /** Box 9 — recoverable input VAT on standard-rated purchases */
  box9_input_vat: number;
  /** Box 10a — purchases subject to reverse charge (value) */
  box10a_reverse_charge_purchases: number;
  /** Box 10b — output VAT due under reverse charge */
  box10b_reverse_charge_output_vat: number;
  /** Box 10c — input VAT reclaimable under reverse charge */
  box10c_reverse_charge_input_vat: number;

  /** Box 15 — net VAT payable / (reclaimable) */
  box15_net_vat_payable: number;

  // Convenience aliases used by /vat UI + clipboard export
  taxableSales: number;
  outputVat: number;
  taxablePurchases: number;
  inputVat: number;
  netVat: number;
  zeroRatedSales: number;
  exemptSales: number;
  reverseChargeSales: number;
  reverseChargePurchases: number;
  reverseChargeOutputVat: number;
  reverseChargeInputVat: number;
};

export type VatAmountLine = {
  amount: number;
  taxAmount: number;
  taxCode?: string | null;
  taxCodeId?: string | null;
  taxType?: TaxCodeType | string | null;
};
