const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Function to recursively get all .mmd files in a directory and its subdirectories
function getAllMMDFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMMDFiles(filePath));
    } else if (file.endsWith('.mmd')) {
      results.push(filePath);
    }
  });
  return results;
}

// Function to generate HTML from a Mermaid Diagram
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
          transform-origin: bottom right; 
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

// Function to convert HTML to PDF by scaling the content and centering it
async function convertHTMLToPDF(htmlContent, outputPDF, scalePercentage = 100) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Load the HTML content
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Calculate the size of the content
  const contentSize = await page.evaluate(() => {
    const container = document.querySelector('#container');
    const { width, height } = container.getBoundingClientRect();
    return { width, height };
  });

  // Adjust the PDF dimensions based on the scaled content
  const scaleFactor = scalePercentage / 100;
  const scaledWidth = contentSize.width * scaleFactor;
  const scaledHeight = contentSize.height * scaleFactor;

  // Add margins to center the content
  const margin = 20; // 20px margin on all sides
  const pdfWidth = scaledWidth + margin * 2;
  const pdfHeight = scaledHeight + margin * 2;

  // Set the viewport size to match the PDF dimensions
  await page.setViewport({
    width: Math.ceil(pdfWidth),
    height: Math.ceil(pdfHeight),
  });

  // Generate the PDF with the adjusted dimensions
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

// Main function to convert .mmd files to PDF
async function convertMMDToPDF(inputDir, outputDir, scalePercentage = 100) {
  const files = getAllMMDFiles(inputDir);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const file of files) {
    const relativePath = path.relative(inputDir, file);
    const outputPDF = path.join(outputDir, relativePath.replace(/\.mmd$/, '.pdf'));

    // Ensure the output directory structure exists
    const outputPDFDir = path.dirname(outputPDF);
    if (!fs.existsSync(outputPDFDir)) {
      fs.mkdirSync(outputPDFDir, { recursive: true });
    }

    try {
      console.log(`Processing: ${file}`);
      const mmdContent = fs.readFileSync(file, 'utf8');
      const htmlContent = generateHTMLFromMermaid(mmdContent, scalePercentage);
      await convertHTMLToPDF(htmlContent, outputPDF, scalePercentage);
      console.log(`Converted: ${file} -> ${outputPDF}`);
    } catch (error) {
      console.error(`Failed to process ${file}: ${error}`);
    }
  }
}

// Get the input and output paths and scale percentage from the command line
const inputDir = path.resolve('mmd-file');
const outputDir = path.resolve('output');
const scalePercentage = parseFloat(process.argv[2]) || 100;

convertMMDToPDF(inputDir, outputDir, scalePercentage).then(() => {
  console.log('Conversion completed.');
});