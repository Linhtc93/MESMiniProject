import * as XLSX from 'xlsx';

export function exportToExcel({ data, fileName = 'export.xlsx', sheetName = 'Sheet1' }) {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  } catch (e) {
    console.error('Export Excel error:', e);
    throw e;
  }
}
