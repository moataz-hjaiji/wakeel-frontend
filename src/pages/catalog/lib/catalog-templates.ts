/** Preset icons + sample rows for catalog import templates */

export const PRESET_ICONS: Record<string, string> = {
  package: '📦',
  wrench: '🔧',
  utensils: '🍽️',
  'graduation-cap': '🎓',
  car: '🚗',
  folder: '📁',
};

export interface CatalogTemplateRow {
  [column: string]: string | number | boolean;
}

export interface CatalogTemplate {
  key: string;
  filename: string;
  csvFilename: string;
  bulkTestFilename?: string;
  bulkTestCsvFilename?: string;
  columns: string[];
  rows: CatalogTemplateRow[];
}

export const CATALOG_TEMPLATES: CatalogTemplate[] = [
  {
    key: 'products',
    filename: 'products-example.xlsx',
    csvFilename: 'products-example.csv',
    columns: ['Name', 'Description', 'Price', 'In stock'],
    rows: [
      {
        Name: 'Wireless earbuds',
        Description: 'Noise-cancelling, 24h battery',
        Price: 79.99,
        'In stock': 'Yes',
      },
      {
        Name: 'Phone case',
        Description: 'Shockproof silicone, fits iPhone 15',
        Price: 19.99,
        'In stock': 'Yes',
      },
      {
        Name: 'USB-C cable',
        Description: '2m braided fast-charge cable',
        Price: 12.5,
        'In stock': 'No',
      },
    ],
  },
  {
    key: 'services',
    filename: 'services-example.xlsx',
    csvFilename: 'services-example.csv',
    columns: ['Service name', 'Description', 'Price', 'Duration'],
    rows: [
      {
        'Service name': 'Home cleaning',
        Description: 'Standard apartment clean',
        Price: 120,
        Duration: '3 hours',
      },
      {
        'Service name': 'AC maintenance',
        Description: 'Filter change + inspection',
        Price: 85,
        Duration: '1 hour',
      },
      {
        'Service name': 'Plumbing visit',
        Description: 'Diagnosis + minor fixes',
        Price: 150,
        Duration: '2 hours',
      },
    ],
  },
  {
    key: 'menu',
    filename: 'menu-example.xlsx',
    csvFilename: 'menu-example.csv',
    columns: ['Item', 'Description', 'Price', 'Available'],
    rows: [
      {
        Item: 'Margherita pizza',
        Description: 'Tomato, mozzarella, basil',
        Price: 14.99,
        Available: 'Yes',
      },
      {
        Item: 'Caesar salad',
        Description: 'Romaine, parmesan, croutons',
        Price: 9.5,
        Available: 'Yes',
      },
      {
        Item: 'Chocolate cake',
        Description: 'Rich layer cake, single slice',
        Price: 6.0,
        Available: 'No',
      },
    ],
  },
  {
    key: 'cars',
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
      {
        Make: 'Toyota',
        Model: 'Camry',
        Year: 2022,
        Price: 24999,
        'Mileage (km)': 35000,
        'Fuel type': 'Hybrid',
        Transmission: 'Automatic',
        Color: 'Pearl white',
        Available: 'Yes',
      },
      {
        Make: 'BMW',
        Model: 'X3',
        Year: 2021,
        Price: 38900,
        'Mileage (km)': 42000,
        'Fuel type': 'Petrol',
        Transmission: 'Automatic',
        Color: 'Black',
        Available: 'Yes',
      },
      {
        Make: 'Tesla',
        Model: 'Model 3',
        Year: 2023,
        Price: 32900,
        'Mileage (km)': 12000,
        'Fuel type': 'Electric',
        Transmission: 'Automatic',
        Color: 'Red',
        Available: 'Yes',
      },
      {
        Make: 'Honda',
        Model: 'Civic',
        Year: 2020,
        Price: 18500,
        'Mileage (km)': 58000,
        'Fuel type': 'Petrol',
        Transmission: 'Manual',
        Color: 'Silver',
        Available: 'No',
      },
      {
        Make: 'Mercedes-Benz',
        Model: 'C-Class',
        Year: 2022,
        Price: 41500,
        'Mileage (km)': 28000,
        'Fuel type': 'Diesel',
        Transmission: 'Automatic',
        Color: 'Graphite grey',
        Available: 'Yes',
      },
    ],
  },
  {
    key: 'courses',
    filename: 'courses-example.xlsx',
    csvFilename: 'courses-example.csv',
    columns: ['Course name', 'Description', 'Price', 'Schedule'],
    rows: [
      {
        'Course name': 'Web development bootcamp',
        Description: 'HTML, CSS, JavaScript fundamentals',
        Price: 499,
        Schedule: 'Mon & Wed 6–8pm',
      },
      {
        'Course name': 'Spanish for beginners',
        Description: '8-week conversational course',
        Price: 199,
        Schedule: 'Tue & Thu 5–6pm',
      },
      {
        'Course name': 'Photography basics',
        Description: 'Camera settings, composition, editing',
        Price: 149,
        Schedule: 'Sat 10am–1pm',
      },
    ],
  },
  {
    key: 'blank',
    filename: 'blank-collection-example.xlsx',
    csvFilename: 'blank-collection-example.csv',
    columns: ['Name'],
    rows: [{ Name: 'Example item' }, { Name: 'Another item' }],
  },
];

export function templateForPreset(key: string): CatalogTemplate | undefined {
  return CATALOG_TEMPLATES.find((t) => t.key === key);
}

export function templateDownloadUrl(filename: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base}catalog-templates/${filename}`;
}
