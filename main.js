const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// ฟังก์ชันสำหรับสร้าง HTML จาก Mermaid Diagram
function generateHTMLFromMermaid(mmdContent, scalePercentage = 100) {
  const scaleFactor = scalePercentage / 100;
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
          width: 100vw;
        }
        #container {
          display: inline-block;
          transform: scale(${scaleFactor});
          transform-origin:  buttom right; 
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

// ฟังก์ชันสำหรับแปลง HTML เป็น PDF โดยปรับขนาดเนื้อหาและจัดให้อยู่ตรงกลาง
async function convertHTMLToPDF(htmlContent, outputPDF, scalePercentage = 100) {
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

  // ปรับขนาดพื้นที่ PDF ตามเนื้อหาที่ถูกขยาย/ย่อ
  const scaleFactor = scalePercentage / 100;
  const scaledWidth = contentSize.width * scaleFactor;
  const scaledHeight = contentSize.height * scaleFactor;

  // เพิ่มขอบเขต (Margin) เพื่อให้ Content อยู่ตรงกลาง
  const margin = 20; // ขอบเขต 20px รอบด้าน
  const pdfWidth = scaledWidth + margin * 2;
  const pdfHeight = scaledHeight + margin * 2;

  // ตั้งค่าขนาดของ Viewport ให้ตรงกับขนาด PDF
  await page.setViewport({
    width: Math.ceil(pdfWidth),
    height: Math.ceil(pdfHeight),
  });

  // สร้าง PDF โดยใช้ขนาดที่ปรับแล้ว
  await page.pdf({
    path: outputPDF,
    width: `${pdfWidth}px`,
    height: `${pdfHeight}px`,
    printBackground: true,
    margin: {
      top: `${margin}px`,
      bottom: `${margin}px`,
      left: `${margin}px`,
      right: `${margin}px`,
    },
  });

  await browser.close();
}

// ฟังก์ชันหลักสำหรับแปลงไฟล์ .mmd เป็น PDF
async function convertMMDToPDF(inputPath, scalePercentage = 100) {
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
      const htmlContent = generateHTMLFromMermaid(mmdContent, scalePercentage);
      await convertHTMLToPDF(htmlContent, outputPDF, scalePercentage);
      console.log(`Converted: ${file} -> ${outputPDF}`);
    } catch (error) {
      console.error(`Failed to process ${file}: ${error}`);
    }
  }
}

// รับพาธและเปอร์เซ็นต์การขยายจาก Command Line
const inputPath = process.argv[2];
const scalePercentage = parseFloat(process.argv[3]) || 100;

if (!inputPath) {
  console.error('Usage: node convertMMDToPDF.js <file-or-folder-path> [scale-percentage]');
  process.exit(1);
}

convertMMDToPDF(inputPath, scalePercentage).then(() => {
  console.log('Conversion completed.');
});