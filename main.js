const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const mermaid = require('mermaid');

// ฟังก์ชันสำหรับสร้าง HTML จาก Mermaid Diagram
function generateHTMLFromMermaid(mmdContent) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mermaid Diagram</title>
      <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      <style>
        body {
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        #container {
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div id="container">
        <div class="mermaid">
          ${mmdContent}
        </div>
      </div>
      <script>
        mermaid.initialize({ startOnLoad: true });
      </script>
    </body>
    </html>
  `;
}

// ฟังก์ชันสำหรับแปลง HTML เป็น PDF โดยปรับขนาดตามเนื้อหา
async function convertHTMLToPDF(htmlContent, outputPDF) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // โหลด HTML
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // คำนวณขนาดของเนื้อหา
  const contentSize = await page.evaluate(() => {
    const container = document.querySelector('#container');
    const { width, height } = container.getBoundingClientRect();
    return { width, height };
  });

  // สร้าง PDF โดยใช้ขนาดของเนื้อหา
  await page.pdf({
    path: outputPDF,
    width: `${contentSize.width}px`,
    height: `${contentSize.height}px`,
    printBackground: true,
  });

  await browser.close();
}

// ฟังก์ชันหลักสำหรับแปลงไฟล์ .mmd เป็น PDF
async function convertMMDToPDF(inputPath) {
  const isDirectory = fs.lstatSync(inputPath).isDirectory();
  const files = isDirectory
    ? fs.readdirSync(inputPath).filter(file => file.endsWith('.mmd'))
    : [path.basename(inputPath)];

  const baseDir = isDirectory ? inputPath : path.dirname(inputPath);

  for (const file of files) {
    const inputFile = path.join(baseDir, file);
    const outputPDF = inputFile.replace(/\.mmd$/, '.pdf');

    try {
      console.log(`Processing: ${file}`);
      const mmdContent = fs.readFileSync(inputFile, 'utf8');
      const htmlContent = generateHTMLFromMermaid(mmdContent);
      await convertHTMLToPDF(htmlContent, outputPDF);
      console.log(`Converted: ${file} -> ${outputPDF}`);
    } catch (error) {
      console.error(`Failed to process ${file}: ${error}`);
    }
  }
}

// รับพาธจาก Command Line
const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node convertMMDToPDF.js <file-or-folder-path>');
  process.exit(1);
}

convertMMDToPDF(inputPath).then(() => {
  console.log('Conversion completed.');
});