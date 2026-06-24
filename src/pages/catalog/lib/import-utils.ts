/** Validate catalog import file extension before upload */
const ALLOWED_IMPORT_EXT = ['.csv', '.xlsx', '.xls'];

export function isAllowedImportFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ALLOWED_IMPORT_EXT.some((ext) => name.endsWith(ext));
}

export function importFileTypeLabel(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return 'CSV';
  if (name.endsWith('.xlsx')) return 'Excel';
  if (name.endsWith('.xls')) return 'Excel';
  return 'file';
}

export const IMPORT_ACCEPT = '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
