import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });
  const page = await browser.newPage();
  
  const downloadPath = path.resolve(__dirname, 'downloads');
  fs.mkdirSync(downloadPath, { recursive: true });

  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  console.log("Waiting for app to load...");
  await page.waitForSelector('.control-export-btn', { visible: true });

  // Let's type something or configure if needed, but default is fine.
  console.log("Clicking export button...");
  await page.click('.control-export-btn');

  console.log("Export started! Waiting for download to finish...");
  
  // Wait for the modal indicating export is done
  await page.waitForSelector('.export-modal', { visible: true, timeout: 60000 });
  console.log("Export completed on UI. Downloading...");

  // The UI creates a download automatically (document.body.appendChild(a); a.click();)
  // Let's wait for a file to appear in the downloadPath
  let downloadedFile = null;
  for (let i = 0; i < 30; i++) {
    const files = fs.readdirSync(downloadPath);
    const completedFile = files.find(f => !f.endsWith('.crdownload') && (f.endsWith('.webm') || f.endsWith('.mp4')));
    if (completedFile) {
      downloadedFile = path.join(downloadPath, completedFile);
      break;
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  if (downloadedFile) {
    console.log("Successfully downloaded:", downloadedFile);
    const stats = fs.statSync(downloadedFile);
    console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log("Failed to find downloaded file.");
  }

  await browser.close();
})();
