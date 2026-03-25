import type { PdfGenerateOptions } from "./types";

type Browser = import("puppeteer-core").Browser;
type Page = import("puppeteer-core").Page;

let browser: Browser | null = null;
let launching = false;
let launchError: Error | null = null;
let activeRenders = 0;
const MAX_CONCURRENT = 3;
const RENDER_TIMEOUT_MS = 30_000;
const QUEUE_TIMEOUT_MS = 60_000;
const queue: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];

async function getBrowser(): Promise<Browser> {
  if (browser?.connected) return browser;
  if (launching) {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        clearInterval(check);
        reject(new Error("Browser launch timed out"));
      }, 30_000);
      const check = setInterval(() => {
        if (browser?.connected) {
          clearInterval(check);
          clearTimeout(timeout);
          resolve();
        } else if (!launching && !browser) {
          clearInterval(check);
          clearTimeout(timeout);
          reject(launchError ?? new Error("Browser launch failed"));
        }
      }, 100);
    });
    return browser!;
  }

  launching = true;
  launchError = null;
  try {
    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    if (executablePath) {
      const puppeteerCore = await import("puppeteer-core");
      browser = await puppeteerCore.default.launch({
        executablePath,
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-web-security", "--font-render-hinting=none"],
      });
    } else {
      // Try full puppeteer first (bundles its own Chromium - works on dev/local)
      try {
        const puppeteer = await import("puppeteer");
        browser = await puppeteer.default.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-web-security", "--font-render-hinting=none"],
        });
      } catch {
        // Fall back to puppeteer-core + @sparticuz/chromium (serverless/production)
        const puppeteerCore = await import("puppeteer-core");
        try {
          const chromium = await import("@sparticuz/chromium");
          executablePath = await chromium.default.executablePath();
        } catch {
          throw new Error(
            "No Chromium found. Install 'puppeteer' for local dev or '@sparticuz/chromium' for serverless, or set PUPPETEER_EXECUTABLE_PATH."
          );
        }
        browser = await puppeteerCore.default.launch({
          executablePath,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-web-security", "--font-render-hinting=none"],
        });
      }
    }

    browser!.on("disconnected", () => {
      browser = null;
    });
  } catch (err) {
    launchError = err instanceof Error ? err : new Error(String(err));
    throw launchError;
  } finally {
    launching = false;
  }

  return browser!;
}

async function acquireSlot(): Promise<void> {
  if (activeRenders < MAX_CONCURRENT) {
    activeRenders++;
    return;
  }
  return new Promise<void>((resolve, reject) => {
    const entry = { resolve, reject };
    queue.push(entry);
    const timer = setTimeout(() => {
      const idx = queue.findIndex((q) => q === entry);
      if (idx !== -1) {
        queue.splice(idx, 1);
        reject(new Error("PDF render queue timeout — server is busy, please try again"));
      }
    }, QUEUE_TIMEOUT_MS);
    const origResolve = entry.resolve;
    entry.resolve = () => {
      clearTimeout(timer);
      origResolve();
    };
  });
}

function releaseSlot(): void {
  const next = queue.shift();
  if (next) {
    next.resolve();
  } else {
    activeRenders = Math.max(0, activeRenders - 1);
  }
}

const AGARWOOD_FOOTER_TEMPLATE = `
<div style="width:100%;text-align:center;font-family:'Plus Jakarta Sans',sans-serif;font-size:8px;color:#9ca3af;padding:4px 0">
  <span style="color:#6b7280;font-weight:600">AgarWood Smart Accounting</span>
  <span style="margin:0 6px">|</span>
  <span>www.agaraccounting.com</span>
  <span style="margin:0 6px">|</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`;

export async function generatePdf(
  html: string,
  options: PdfGenerateOptions = {}
): Promise<Buffer> {
  await acquireSlot();
  let page: Page | null = null;

  try {
    const b = await getBrowser();
    page = await b.newPage();

    const timeout = setTimeout(() => {
      page?.close().catch(() => {});
    }, RENDER_TIMEOUT_MS);

    try {
      await page.setContent(html, { waitUntil: "networkidle0", timeout: RENDER_TIMEOUT_MS });

      const format = options.pageSize ?? "A4";
      const landscape = options.orientation === "landscape";
      const margins = options.margins ?? {
        top: "15mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      };

      const pdfBuffer = await page.pdf({
        format: format as "A4" | "Letter" | "Legal",
        landscape,
        margin: margins,
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate: AGARWOOD_FOOTER_TEMPLATE,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      clearTimeout(timeout);
    }
  } finally {
    await page?.close().catch(() => {});
    releaseSlot();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser?.connected) {
    await browser.close().catch(() => {});
    browser = null;
  }
}
