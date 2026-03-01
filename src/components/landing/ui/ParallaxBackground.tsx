'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxBackgroundProps {
  variant: 'balance-sheet' | 'income-statement' | 'cash-flow' | 'ledger' | 'tax-forms' | 'audit-papers';
  intensity?: number;
  className?: string;
}

const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({
  variant,
  intensity = 0.5,
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], [50 * intensity, -50 * intensity]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.04, 0.1, 0.1, 0.04]);

  const getFinancialContent = () => {
    switch (variant) {
      case 'balance-sheet':
        return (
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] text-agarwood/20 dark:text-beige/20 font-mono text-xs leading-relaxed">
            <div className="p-8 space-y-4">
              <div className="text-center font-bold text-lg mb-8">BALANCE SHEET</div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="font-bold mb-4 border-b border-agarwood/10 pb-2">ASSETS</div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Current Assets:</span></div>
                    <div className="flex justify-between pl-4"><span>Cash & Cash Equivalents</span><span>AED 125,450</span></div>
                    <div className="flex justify-between pl-4"><span>Accounts Receivable</span><span>AED 87,230</span></div>
                    <div className="flex justify-between pl-4"><span>Inventory</span><span>AED 45,780</span></div>
                    <div className="flex justify-between pl-4"><span>Prepaid Expenses</span><span>AED 12,340</span></div>
                    <div className="flex justify-between font-semibold border-t border-agarwood/10 pt-1">
                      <span>Total Current Assets</span><span>AED 270,800</span>
                    </div>
                    
                    <div className="flex justify-between mt-4"><span>Non-Current Assets:</span></div>
                    <div className="flex justify-between pl-4"><span>Property, Plant & Equipment</span><span>AED 450,200</span></div>
                    <div className="flex justify-between pl-4"><span>Intangible Assets</span><span>AED 25,000</span></div>
                    <div className="flex justify-between pl-4"><span>Long-term Investments</span><span>AED 85,500</span></div>
                  </div>
                </div>
                
                <div>
                  <div className="font-bold mb-4 border-b border-agarwood/10 pb-2">LIABILITIES & EQUITY</div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Current Liabilities:</span></div>
                    <div className="flex justify-between pl-4"><span>Accounts Payable</span><span>AED 35,670</span></div>
                    <div className="flex justify-between pl-4"><span>VAT Payable</span><span>AED 18,450</span></div>
                    <div className="flex justify-between pl-4"><span>Accrued Expenses</span><span>AED 22,180</span></div>
                    <div className="flex justify-between pl-4"><span>Short-term Loans</span><span>AED 50,000</span></div>
                    
                    <div className="flex justify-between mt-4"><span>Equity:</span></div>
                    <div className="flex justify-between pl-4"><span>Share Capital</span><span>AED 500,000</span></div>
                    <div className="flex justify-between pl-4"><span>Retained Earnings</span><span>AED 205,680</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'income-statement':
        return (
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] text-agarwood/20 dark:text-beige/20 font-mono text-xs leading-relaxed">
            <div className="p-8 space-y-4">
              <div className="text-center font-bold text-lg mb-8">INCOME STATEMENT</div>
              <div className="space-y-3">
                <div className="font-bold mb-4 border-b border-agarwood/10 pb-2">REVENUE</div>
                <div className="flex justify-between pl-4"><span>Service Revenue</span><span>AED 485,200</span></div>
                <div className="flex justify-between pl-4"><span>Consultation Fees</span><span>AED 125,800</span></div>
                <div className="flex justify-between pl-4"><span>Other Income</span><span>AED 15,450</span></div>
                <div className="flex justify-between font-semibold border-t border-agarwood/10 pt-2">
                  <span>Total Revenue</span><span>AED 626,450</span>
                </div>
                
                <div className="font-bold mt-6 mb-4 border-b border-agarwood/10 pb-2">EXPENSES</div>
                <div className="flex justify-between pl-4"><span>Employee Salaries</span><span>AED 285,600</span></div>
                <div className="flex justify-between pl-4"><span>Rent Expense</span><span>AED 84,000</span></div>
                <div className="flex justify-between pl-4"><span>Professional Fees</span><span>AED 45,200</span></div>
                <div className="flex justify-between pl-4"><span>Utilities</span><span>AED 18,750</span></div>
                <div className="flex justify-between pl-4"><span>Marketing & Advertising</span><span>AED 25,400</span></div>
                <div className="flex justify-between pl-4"><span>Depreciation</span><span>AED 32,150</span></div>
                <div className="flex justify-between font-semibold border-t border-agarwood/10 pt-2">
                  <span>Total Expenses</span><span>AED 491,100</span>
                </div>
                
                <div className="flex justify-between font-bold text-gold mt-6 pt-4 border-t-2 border-gold/20">
                  <span>NET INCOME</span><span>AED 135,350</span>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'cash-flow':
        return (
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] text-agarwood/20 dark:text-beige/20 font-mono text-xs leading-relaxed">
            <div className="p-8 space-y-4">
              <div className="text-center font-bold text-lg mb-8">CASH FLOW STATEMENT</div>
              <div className="space-y-4">
                <div>
                  <div className="font-bold mb-3 border-b border-agarwood/10 pb-2">OPERATING ACTIVITIES</div>
                  <div className="space-y-1 pl-4">
                    <div className="flex justify-between"><span>Net Income</span><span>AED 135,350</span></div>
                    <div className="flex justify-between"><span>Depreciation & Amortization</span><span>AED 32,150</span></div>
                    <div className="flex justify-between"><span>Changes in Working Capital:</span></div>
                    <div className="flex justify-between pl-4"><span>- Accounts Receivable</span><span>(AED 15,200)</span></div>
                    <div className="flex justify-between pl-4"><span>- Inventory</span><span>(AED 8,450)</span></div>
                    <div className="flex justify-between pl-4"><span>+ Accounts Payable</span><span>AED 12,850</span></div>
                    <div className="flex justify-between font-semibold border-t border-agarwood/10 pt-2">
                      <span>Net Cash from Operations</span><span>AED 156,700</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="font-bold mb-3 border-b border-agarwood/10 pb-2">INVESTING ACTIVITIES</div>
                  <div className="space-y-1 pl-4">
                    <div className="flex justify-between"><span>Equipment Purchases</span><span>(AED 45,000)</span></div>
                    <div className="flex justify-between"><span>Software Investment</span><span>(AED 15,500)</span></div>
                    <div className="flex justify-between font-semibold border-t border-agarwood/10 pt-2">
                      <span>Net Cash from Investing</span><span>(AED 60,500)</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="font-bold mb-3 border-b border-agarwood/10 pb-2">FINANCING ACTIVITIES</div>
                  <div className="space-y-1 pl-4">
                    <div className="flex justify-between"><span>Loan Repayment</span><span>(AED 25,000)</span></div>
                    <div className="flex justify-between"><span>Owner Drawings</span><span>(AED 35,000)</span></div>
                    <div className="flex justify-between font-semibold border-t border-agarwood/10 pt-2">
                      <span>Net Cash from Financing</span><span>(AED 60,000)</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between font-bold text-gold mt-6 pt-4 border-t-2 border-gold/20">
                  <span>NET CHANGE IN CASH</span><span>AED 36,200</span>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'ledger':
        return (
          <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] text-agarwood/25 dark:text-beige/20 font-mono text-xs leading-relaxed">
            <div className="p-8">
              <div className="text-center font-bold text-lg mb-8">GENERAL LEDGER</div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <div className="font-bold border-b border-agarwood/10 pb-2 mb-3">CASH ACCOUNT - 1001</div>
                    <div className="space-y-1">
                      <div className="grid grid-cols-4 text-xs font-semibold border-b border-agarwood/5 pb-1">
                        <span>Date</span><span>Description</span><span>Dr</span><span>Cr</span>
                      </div>
                      <div className="grid grid-cols-4 text-xs"><span>01/Jan</span><span>Opening Balance</span><span>89,250</span><span>-</span></div>
                      <div className="grid grid-cols-4 text-xs"><span>05/Jan</span><span>Client Payment</span><span>25,400</span><span>-</span></div>
                      <div className="grid grid-cols-4 text-xs"><span>08/Jan</span><span>Office Rent</span><span>-</span><span>7,000</span></div>
                      <div className="grid grid-cols-4 text-xs"><span>12/Jan</span><span>Service Revenue</span><span>15,200</span><span>-</span></div>
                      <div className="grid grid-cols-4 text-xs"><span>15/Jan</span><span>Utility Bill</span><span>-</span><span>1,850</span></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-bold border-b border-agarwood/10 pb-2 mb-3">ACCOUNTS RECEIVABLE - 1200</div>
                    <div className="space-y-1">
                      <div className="grid grid-cols-4 text-xs font-semibold border-b border-agarwood/5 pb-1">
                        <span>Date</span><span>Client</span><span>Dr</span><span>Cr</span>
                      </div>
                      <div className="grid grid-cols-4 text-xs"><span>03/Jan</span><span>ABC Corp</span><span>45,600</span><span>-</span></div>
                      <div className="grid grid-cols-4 text-xs"><span>07/Jan</span><span>XYZ Ltd</span><span>22,800</span><span>-</span></div>
                      <div className="grid grid-cols-4 text-xs"><span>10/Jan</span><span>DEF Trading</span><span>18,950</span><span>-</span></div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="font-bold border-b border-agarwood/10 pb-2 mb-3">SERVICE REVENUE - 4001</div>
                    <div className="space-y-1">
                      <div className="grid grid-cols-4 text-xs font-semibold border-b border-agarwood/5 pb-1">
                        <span>Date</span><span>Service</span><span>Dr</span><span>Cr</span>
                      </div>
                      <div className="grid grid-cols-4 text-xs"><span>02/Jan</span><span>VAT Consultation</span><span>-</span><span>8,500</span></div>
                      <div className="grid grid-cols-4 text-xs"><span>06/Jan</span><span>Bookkeeping</span><span>-</span><span>12,000</span></div>
                      <div className="grid grid-cols-4 text-xs"><span>09/Jan</span><span>Tax Filing</span><span>-</span><span>6,750</span></div>
                      <div className="grid grid-cols-4 text-xs"><span>14/Jan</span><span>Audit Support</span><span>-</span><span>15,200</span></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-bold border-b border-agarwood/10 pb-2 mb-3">OPERATING EXPENSES - 5001</div>
                    <div className="space-y-1">
                      <div className="grid grid-cols-4 text-xs font-semibold border-b border-agarwood/5 pb-1">
                        <span>Date</span><span>Expense</span><span>Dr</span><span>Cr</span>
                      </div>
                      <div className="grid grid-cols-4 text-xs"><span>01/Jan</span><span>Salaries</span><span>23,800</span><span>-</span></div>
                      <div className="grid grid-cols-4 text-xs"><span>08/Jan</span><span>Office Rent</span><span>7,000</span><span>-</span></div>
                      <div className="grid grid-cols-4 text-xs"><span>15/Jan</span><span>Professional Fees</span><span>3,750</span><span>-</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'tax-forms':
        return (
          <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] text-agarwood/25 dark:text-beige/20 font-mono text-xs leading-relaxed">
            <div className="p-8 space-y-6">
              <div className="text-center font-bold text-lg mb-8">VAT RETURN - UAE</div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="font-bold border-b border-agarwood/10 pb-2">TAX PERIOD INFORMATION</div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Tax Period:</span><span>Q1 2024</span></div>
                    <div className="flex justify-between"><span>From Date:</span><span>01/01/2024</span></div>
                    <div className="flex justify-between"><span>To Date:</span><span>31/03/2024</span></div>
                    <div className="flex justify-between"><span>Filing Date:</span><span>28/04/2024</span></div>
                    <div className="flex justify-between"><span>TRN:</span><span>100123456789003</span></div>
                  </div>
                  
                  <div className="font-bold border-b border-agarwood/10 pb-2 mt-6">STANDARD RATED SUPPLIES</div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Accounting Services</span><span>AED 125,400</span></div>
                    <div className="flex justify-between"><span>Tax Consultancy</span><span>AED 89,600</span></div>
                    <div className="flex justify-between"><span>Audit Support</span><span>AED 45,200</span></div>
                    <div className="flex justify-between font-semibold border-t border-agarwood/10 pt-2">
                      <span>Total Standard Rated</span><span>AED 260,200</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>VAT @ 5%</span><span>AED 13,010</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="font-bold border-b border-agarwood/10 pb-2">INPUT VAT DETAILS</div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Office Supplies</span><span>AED 425</span></div>
                    <div className="flex justify-between"><span>Professional Services</span><span>AED 1,200</span></div>
                    <div className="flex justify-between"><span>Equipment Purchase</span><span>AED 2,150</span></div>
                    <div className="flex justify-between"><span>Marketing Expenses</span><span>AED 650</span></div>
                    <div className="flex justify-between font-semibold border-t border-agarwood/10 pt-2">
                      <span>Total Input VAT</span><span>AED 4,425</span>
                    </div>
                  </div>
                  
                  <div className="font-bold border-b border-agarwood/10 pb-2 mt-6">VAT SUMMARY</div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Output VAT</span><span>AED 13,010</span></div>
                    <div className="flex justify-between"><span>Input VAT</span><span>(AED 4,425)</span></div>
                    <div className="flex justify-between font-bold text-gold border-t border-gold/20 pt-2">
                      <span>VAT PAYABLE</span><span>AED 8,585</span>
                    </div>
                  </div>
                  
                  <div className="font-bold border-b border-agarwood/10 pb-2 mt-6">DECLARATION</div>
                  <div className="text-xs">
                    <p>I declare that the information given in this return is true, complete and accurate.</p>
                    <div className="mt-3">
                      <div>Authorized Signatory: ________________</div>
                      <div>Date: 28/04/2024</div>
                      <div>Capacity: Managing Partner</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'audit-papers':
        return (
          <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] text-agarwood/25 dark:text-beige/20 font-mono text-xs leading-relaxed">
            <div className="p-8 space-y-6">
              <div className="text-center font-bold text-lg mb-8">AUDIT WORKING PAPERS</div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="font-bold border-b border-agarwood/10 pb-2">MATERIALITY CALCULATIONS</div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Total Assets:</span><span>AED 831,500</span></div>
                    <div className="flex justify-between"><span>Total Revenue:</span><span>AED 626,450</span></div>
                    <div className="flex justify-between"><span>Net Income:</span><span>AED 135,350</span></div>
                    <div className="flex justify-between font-semibold border-t border-agarwood/10 pt-2">
                      <span>Planning Materiality (5%):</span><span>AED 31,323</span>
                    </div>
                    <div className="flex justify-between"><span>Performance Materiality (75%):</span><span>AED 23,492</span></div>
                  </div>
                  
                  <div className="font-bold border-b border-agarwood/10 pb-2 mt-6">RISK ASSESSMENT</div>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 font-semibold border-b border-agarwood/5 pb-1">
                      <span>Account</span><span>Risk</span><span>Response</span>
                    </div>
                    <div className="grid grid-cols-3"><span>Revenue Recognition</span><span>Medium</span><span>Substantive</span></div>
                    <div className="grid grid-cols-3"><span>Cash & Equivalents</span><span>Low</span><span>Analytical</span></div>
                    <div className="grid grid-cols-3"><span>Accounts Receivable</span><span>Medium</span><span>Mixed</span></div>
                    <div className="grid grid-cols-3"><span>Fixed Assets</span><span>Low</span><span>Analytical</span></div>
                    <div className="grid grid-cols-3"><span>Payroll Expenses</span><span>High</span><span>Substantive</span></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="font-bold border-b border-agarwood/10 pb-2">TESTING PROCEDURES</div>
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold">Revenue Testing:</div>
                    <div className="pl-2 space-y-1">
                      <div>✓ Sample 25 sales invoices</div>
                      <div>✓ Verify client contracts</div>
                      <div>✓ Test cut-off procedures</div>
                      <div>✓ Analytical review of margins</div>
                    </div>
                    
                    <div className="font-semibold mt-4">Cash Testing:</div>
                    <div className="pl-2 space-y-1">
                      <div>✓ Bank confirmation letters</div>
                      <div>✓ Bank reconciliation review</div>
                      <div>✓ Cash count procedures</div>
                      <div>✓ Subsequent receipts testing</div>
                    </div>
                    
                    <div className="font-semibold mt-4">Expense Testing:</div>
                    <div className="pl-2 space-y-1">
                      <div>✓ Sample 20 expense transactions</div>
                      <div>✓ Review supporting documentation</div>
                      <div>✓ Test accruals completeness</div>
                      <div>✓ Analytical procedures</div>
                    </div>
                  </div>
                  
                  <div className="font-bold border-b border-agarwood/10 pb-2 mt-6">FINDINGS & CONCLUSIONS</div>
                  <div className="space-y-1 text-xs">
                    <div>• No material misstatements identified</div>
                    <div>• Internal controls operating effectively</div>
                    <div>• Minor adjustment: AED 2,450 expense accrual</div>
                    <div>• Management letter points: 3 minor items</div>
                    <div>• Opinion: Unqualified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div />;
    }
  };

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity }}
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden parallax-layer ${className}`}
    >
      {/* Financial Statement Watermark */}
      <div className="absolute inset-0 border border-agarwood/5 dark:border-beige/5 bg-gradient-to-br from-white/5 via-transparent to-beige/5 dark:from-beige/3 dark:to-transparent">
        {getFinancialContent()}
      </div>
      
      {/* Additional decorative elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-transparent via-gold/5 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-l from-transparent via-agarwood/5 to-transparent rounded-full blur-2xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />
      </div>
    </motion.div>
  );
};

export default ParallaxBackground;
