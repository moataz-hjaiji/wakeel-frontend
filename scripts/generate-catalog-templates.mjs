/**
 * Generates example Excel + CSV templates for each catalog preset.
 * Run: npm run generate:catalog-templates
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('../../backend-nestjs/node_modules/xlsx');

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'catalog-templates');

function escapeCsvCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(columns, rows) {
  const lines = [columns.map(escapeCsvCell).join(',')];
  for (const row of rows) {
    lines.push(columns.map((col) => escapeCsvCell(row[col] ?? row[columns.indexOf(col)])).join(','));
  }
  // rows are arrays in our template definition
  return lines.join('\n');
}

function toCsvFromArrays(columns, rows) {
  const lines = [columns.map(escapeCsvCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(','));
  }
  return lines.join('\n');
}

const templates = [
  {
    filename: 'products-example.xlsx',
    csvFilename: 'products-example.csv',
    columns: ['Name', 'Description', 'Price', 'In stock'],
    rows: [
      ['Wireless earbuds', 'Noise-cancelling, 24h battery', 79.99, 'Yes'],
      ['Phone case', 'Shockproof silicone, fits iPhone 15', 19.99, 'Yes'],
      ['USB-C cable', '2m braided fast-charge cable', 12.5, 'No'],
    ],
  },
  {
    filename: 'services-example.xlsx',
    csvFilename: 'services-example.csv',
    columns: ['Service name', 'Description', 'Price', 'Duration'],
    rows: [
      ['Home cleaning', 'Standard apartment clean', 120, '3 hours'],
      ['AC maintenance', 'Filter change + inspection', 85, '1 hour'],
      ['Plumbing visit', 'Diagnosis + minor fixes', 150, '2 hours'],
    ],
  },
  {
    filename: 'menu-example.xlsx',
    csvFilename: 'menu-example.csv',
    columns: ['Item', 'Description', 'Price', 'Available'],
    rows: [
      ['Margherita pizza', 'Tomato, mozzarella, basil', 14.99, 'Yes'],
      ['Caesar salad', 'Romaine, parmesan, croutons', 9.5, 'Yes'],
      ['Chocolate cake', 'Rich layer cake, single slice', 6.0, 'No'],
    ],
  },
  {
    filename: 'cars-example.xlsx',
    csvFilename: 'cars-example.csv',
    bulkTestFilename: 'vehicles-bulk-test.xlsx',
    bulkTestCsvFilename: 'vehicles-bulk-test.csv',
    columns: [
      'Make',
      'Model',
      'Year',
      'Price',
      'Mileage (km)',
      'Fuel type',
      'Transmission',
      'Color',
      'Available',
    ],
    rows: [
      ['Toyota', 'Camry', 2022, 24999, 35000, 'Hybrid', 'Automatic', 'Pearl white', 'Yes'],
      ['BMW', 'X3', 2021, 38900, 42000, 'Petrol', 'Automatic', 'Black', 'Yes'],
      ['Tesla', 'Model 3', 2023, 32900, 12000, 'Electric', 'Automatic', 'Red', 'Yes'],
      ['Honda', 'Civic', 2020, 18500, 58000, 'Petrol', 'Manual', 'Silver', 'No'],
      ['Mercedes-Benz', 'C-Class', 2022, 41500, 28000, 'Diesel', 'Automatic', 'Graphite grey', 'Yes'],
    ],
    bulkTestRows: [
      ['Ford', 'F-150', 2021, 34500, 41000, 'Petrol', 'Automatic', 'Blue', 'Yes'],
      ['Chevrolet', 'Malibu', 2019, 16900, 62000, 'Petrol', 'Automatic', 'White', 'Yes'],
      ['Nissan', 'Altima', 2022, 22300, 29000, 'Petrol', 'Automatic', 'Grey', 'Yes'],
      ['Hyundai', 'Tucson', 2023, 27900, 15000, 'Hybrid', 'Automatic', 'Green', 'Yes'],
      ['Kia', 'Sportage', 2022, 26400, 33000, 'Petrol', 'Automatic', 'Black', 'Yes'],
      ['Audi', 'A4', 2020, 29900, 48000, 'Petrol', 'Automatic', 'Silver', 'Yes'],
      ['Volkswagen', 'Golf', 2021, 19900, 37000, 'Petrol', 'Manual', 'Red', 'Yes'],
      ['Mazda', 'CX-5', 2022, 28750, 26000, 'Petrol', 'Automatic', 'Soul red', 'Yes'],
      ['Subaru', 'Outback', 2021, 31200, 39000, 'Petrol', 'Automatic', 'Green', 'No'],
      ['Lexus', 'RX 350', 2022, 45900, 22000, 'Hybrid', 'Automatic', 'White', 'Yes'],
      ['Jeep', 'Wrangler', 2020, 33500, 51000, 'Petrol', 'Manual', 'Yellow', 'Yes'],
      ['Porsche', 'Macan', 2021, 52900, 34000, 'Petrol', 'Automatic', 'Black', 'Yes'],
    ],
  },
  {
    filename: 'courses-example.xlsx',
    csvFilename: 'courses-example.csv',
    columns: ['Course name', 'Description', 'Price', 'Schedule'],
    rows: [
      ['Web development bootcamp', 'HTML, CSS, JavaScript fundamentals', 499, 'Mon & Wed 6–8pm'],
      ['Spanish for beginners', '8-week conversational course', 199, 'Tue & Thu 5–6pm'],
      ['Photography basics', 'Camera settings, composition, editing', 149, 'Sat 10am–1pm'],
    ],
  },
  {
    filename: 'blank-collection-example.xlsx',
    csvFilename: 'blank-collection-example.csv',
    columns: ['Name'],
    rows: [['Example item'], ['Another item']],
  },
];

await mkdir(outDir, { recursive: true });

for (const tpl of templates) {
  const writeTemplate = async (filename, columns, rows) => {
    const sheetData = [columns, ...rows];
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    sheet['!cols'] = columns.map((col) => ({ wch: Math.max(col.length, 18) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Items');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    await writeFile(join(outDir, filename), buffer);
    console.log(`Wrote ${filename}`);
  };

  const writeCsv = async (filename, columns, rows) => {
    const csv = toCsvFromArrays(columns, rows);
    await writeFile(join(outDir, filename), `\uFEFF${csv}`, 'utf-8');
    console.log(`Wrote ${filename}`);
  };

  await writeTemplate(tpl.filename, tpl.columns, tpl.rows);
  await writeCsv(tpl.csvFilename, tpl.columns, tpl.rows);

  if (tpl.bulkTestFilename && tpl.bulkTestRows) {
    await writeTemplate(tpl.bulkTestFilename, tpl.columns, tpl.bulkTestRows);
    if (tpl.bulkTestCsvFilename) {
      await writeCsv(tpl.bulkTestCsvFilename, tpl.columns, tpl.bulkTestRows);
    }
  }
}

console.log(`Done — templates in public/catalog-templates/`);
