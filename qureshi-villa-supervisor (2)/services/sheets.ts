
import axios from 'axios';
import { 
  MaterialInwardRecord, 
  MaterialUsageRecord, 
  SalarySummaryRecord,
  AdvanceHistoryRecord,
  ExpenseRecord,
  MilestoneRecord
} from '../types';

// Environment Variables
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseNumeric = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Remove commas used as thousand separators
  const str = String(val).replace(/,/g, '');
  
  if (!isNaN(Number(str)) && str.trim() !== '') return Number(str);

  const parts = str.split('+');
  let sum = 0;
  for (const part of parts) {
    const num = parseFloat(part.trim());
    if (!isNaN(num)) {
      sum += num;
    }
  }
  return sum;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseDate = (val: any): string => {
  if (!val) return '';
  return String(val).trim();
};

// Helper to map raw rows to objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRowsToObjects = (rows: any[], headers: string[]): any[] => {
  const dataRows = rows.slice(1);
  if (dataRows.length === 0) return [];
  
  // Find the date of the last row
  const lastRow = dataRows[dataRows.length - 1];
  const dateIndex = headers.findIndex(h => (h || '').toLowerCase().includes('date'));
  const lastDate = dateIndex !== -1 ? parseDate(lastRow[dateIndex]) : null;

  return dataRows.map((row, rowIndex) => {
    const obj: Record<string, string | number | boolean> = {};
    headers.forEach((header, index) => {
      const headerStr = header || '';
      // Simple type conversion logic
      let value = row[index];
      if (typeof value === 'string' && value !== '' && !headerStr.toLowerCase().includes('date') && !headerStr.toLowerCase().includes('id')) {
        const valWithoutComma = value.replace(/,/g, '');
        if (!isNaN(Number(valWithoutComma)) && valWithoutComma.trim() !== '') {
          value = Number(valWithoutComma);
        }
      }
      if (value === 'TRUE') value = true;
      if (value === 'FALSE') value = false;
      
      // Clean key name (lowercase, remove non-alphanumeric)
      const key = headerStr.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Map specific keys to our interface keys if needed
      if (key === 'quantity' || key === 'qty' || key === 'totalquantity' || key === 'totalcombinedqty' || key === 'totalqty' || key === 'inwardqty') obj['quantity'] = parseNumeric(value);
      else if (key === 'used' || key === 'usedquantity' || key === 'usedqty' || key === 'totalused' || key === 'consumption' || key === 'outward') obj['used'] = parseNumeric(value);
      else if (key === 'balance' || key === 'remainingqty' || key === 'remainingquantity' || key === 'remaining' || key === 'stock' || key === 'remainingstock' || key === 'currentbalance') obj['balance'] = parseNumeric(value);
      else if (key.includes('amount')) obj['amount'] = parseNumeric(value);
      else if (key === 'basicpay' || key === 'basicsalary') obj['basicSalary'] = parseNumeric(value);
      else if (key === 'advance' || key === 'advancetaken') obj['advanceTaken'] = parseNumeric(value);
      else if (key === 'balance' || key === 'remainingsalary') obj['remainingSalary'] = parseNumeric(value);
      else if (key === 'material') obj['material'] = value;
      else if (key === 'unit') obj['unit'] = value;
      else if (key === 'date') obj['date'] = parseDate(value);
      else if (key === 'id') obj['id'] = value;
      else if (key === 'description' || key === 'usage' || key === 'notes') obj['description'] = value;
      else if (key === 'month') obj['month'] = value;
      else if (key === 'type') obj['type'] = value;
      else if (key === 'isnew') obj['isNew'] = value === true || value === 'TRUE';
      else if (key === 'supplier') obj['supplier'] = value;
      else if (key === 'floor') obj['floor'] = value;
      else if (key === 'name') obj['name'] = value;
      else if (key === 'role') obj['role'] = value;
      else if (key === 'category') obj['category'] = value;
      else if (key === 'item') obj['item'] = value;
      else if (key === 'paidby') obj['paidBy'] = value;
      else if (key === 'milestone') obj['milestone'] = value;
      else if (key === 'status') obj['status'] = value;
      else if (key === 'progress') obj['progress'] = parseNumeric(value);
      else if (key === 'brandname') obj['brandName'] = value;
      else if (key === 'itemname') {
        obj['itemName'] = value;
        if (!obj['material']) obj['material'] = value; // Fallback for material
      }
      else if (key === 'size') obj['size'] = value;
      else if (key.includes('rate') || key.includes('price')) obj['rate'] = parseNumeric(value);
      
    });

    // Auto-flag as new if it matches the last row's date, or if it's the absolute last row
    if (lastDate && obj['date'] === lastDate) {
      obj['isNew'] = true;
    } else if (rowIndex === dataRows.length - 1) {
      obj['isNew'] = true;
    }

    return obj;
  });
};

let sheetNamesPromise: Promise<string[]> | null = null;

export const clearSheetNamesCache = () => {
  sheetNamesPromise = null;
};

const getSheetNames = async (): Promise<string[]> => {
  if (sheetNamesPromise) return sheetNamesPromise;
  
  sheetNamesPromise = axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then(response => response.data.sheets.map((s: any) => s.properties.title))
    .catch(error => {
      console.error("Failed to fetch sheet names", error.message);
      sheetNamesPromise = null; // Reset on failure
      return [];
    });
    
  return sheetNamesPromise;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchSheetData = async (ranges: string | string[], retries = 5): Promise<any[]> => {
  if (!API_KEY || !SHEET_ID) {
    console.warn('Google Sheets API Key or Sheet ID is missing.');
    return [];
  }

  const rangeArray = Array.isArray(ranges) ? ranges : [ranges];
  const sheetNames = await getSheetNames();

  let matchedRange = rangeArray[0]; // fallback
  if (sheetNames && sheetNames.length > 0) {
    const lowerSheetNames = sheetNames.map(s => s.toLowerCase().trim());
    for (const range of rangeArray) {
      let sheetName = range.split('!')[0];
      if (sheetName.startsWith("'") && sheetName.endsWith("'")) {
        sheetName = sheetName.slice(1, -1);
      }
      
      const searchName = sheetName.toLowerCase().trim();
      const matchIndex = lowerSheetNames.indexOf(searchName);
      
      if (matchIndex !== -1) {
        const actualSheetName = sheetNames[matchIndex];
        const rangeSuffix = range.split('!')[1] || '';
        matchedRange = `'${actualSheetName}'!${rangeSuffix}`;
        break;
      }
    }
  }

  try {
    const url = `${BASE_URL}/${encodeURIComponent(matchedRange)}?key=${API_KEY}`;
    const response = await axios.get(url);
    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];
    
    const headers = rows[0];
    return mapRowsToObjects(rows, headers);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response && error.response.status === 429 && retries > 0) {
      const delay = (6 - retries) * 2000 + Math.random() * 1000;
      console.warn(`Rate limit hit for ${matchedRange}. Retrying in ${Math.round(delay/1000)}s...`);
      await new Promise(res => setTimeout(res, delay));
      return fetchSheetData(ranges, retries - 1);
    }
    // Suppress 400 errors (e.g. missing sheet/tab) to avoid console spam
    if (error.response && error.response.status === 400) {
      console.warn(`Sheet/Range not found: ${matchedRange}. Returning empty data.`);
    } else {
      console.error(`Error fetching data from ${matchedRange}:`, error.message);
    }
  }
  return [];
};

const resolveRange = async (ranges: string | string[]): Promise<string | null> => {
  const rangeArray = Array.isArray(ranges) ? ranges : [ranges];
  const sheetNames = await getSheetNames();
  
  if (!sheetNames || sheetNames.length === 0) return null;

  const lowerSheetNames = sheetNames.map(s => s.toLowerCase().trim());
  for (const range of rangeArray) {
    let sheetName = range.split('!')[0];
    if (sheetName.startsWith("'") && sheetName.endsWith("'")) {
      sheetName = sheetName.slice(1, -1);
    }
    
    const searchName = sheetName.toLowerCase().trim();
    const matchIndex = lowerSheetNames.indexOf(searchName);
    
    if (matchIndex !== -1) {
      const actualSheetName = sheetNames[matchIndex];
      const rangeSuffix = range.split('!')[1] || '';
      return `'${actualSheetName}'!${rangeSuffix}`;
    }
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchAllProjectData = async (retries = 3): Promise<any> => {
  if (!API_KEY || !SHEET_ID) return null;

  const configs = [
    { key: 'greyInward', ranges: ['Grey_Inward!A:J', "'Grey Inward'!A:J"] },
    { key: 'greyUsage', ranges: ['Grey_Usage!A:I', "'Grey Usage'!A:I"] },
    { key: 'finishingInward', ranges: ["' Finishing_Inward'!A:J", "'Finishing_Inward'!A:J", "'Finishing Inward'!A:J"] },
    { key: 'finishingUsage', ranges: ['Finishing_Usage!A:I', "'Finishing Usage'!A:I"] },
    { key: 'electricInward', ranges: ["' MEP_Inward_Electric'!A:J", "'MEP_Inward_Electric'!A:J", 'Electric_Inward!A:J', "'Electric Inward'!A:J", "'mep electric ki inward'!A:J", "'MEP Electric Inward'!A:J", "'mep electric inward'!A:J", "'mep_electric-inward'!A:J", "'Electric'!A:J"] },
    { key: 'electricUsage', ranges: ["'MEP_Usage_Electric'!A:I", 'Electric_Usage!A:I', "'Electric Usage'!A:I", "'mep electric usage'!A:I", "'MEP Electric Usage'!A:I", "'mep electric ki usage'!A:I", "'mep_electric-usage'!A:I"] },
    { key: 'plumbingInward', ranges: ["'MEP_Inward_Plumbing'!A:J", 'Plumbing_Inward!A:J', "'Plumbing Inward'!A:J", "'mep plumbing ki inward'!A:J", "'MEP Plumbing Inward'!A:J", "'mep plumbing inward'!A:J", "'Plumbing'!A:J"] },
    { key: 'plumbingUsage', ranges: ["'MEP_Usage_Pluming'!A:I", "'MEP_Usage_Plumbing'!A:I", 'Plumbing_Usage!A:I', "'Plumbing Usage'!A:I", "'mep plumbing usage'!A:I", "'MEP Plumbing Usage'!A:I", "'mep plumbing ki usage'!A:I"] },
    { key: 'mechanicalInward', ranges: ['Mechanical_Inward!A:J', "'Mechanical Inward'!A:J", "'MEP Mechanical Inward'!A:J", "'Mechanical'!A:J"] },
    { key: 'mechanicalUsage', ranges: ['Mechanical_Usage!A:I', "'Mechanical Usage'!A:I", "'MEP Mechanical Usage'!A:I"] },
    { key: 'salaryData', ranges: ['Salary_Sheet!A:F', 'Salary_Summary!A:F', 'My_Salary!A:F'] },
    { key: 'salaryPayments', ranges: ['Advance_History!A:F', 'Salary_History!A:F'] },
    { key: 'laborExpenses', ranges: 'Other_Expenses!A:C' },
    { key: 'milestones', ranges: 'Milestones!A:F' }
  ];

  try {
    const resolvedConfigs = await Promise.all(configs.map(async c => ({
      ...c,
      resolvedRange: await resolveRange(c.ranges)
    })));

    const validConfigs = resolvedConfigs.filter(c => c.resolvedRange !== null);
    
    if (validConfigs.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = {};
      configs.forEach(c => result[c.key] = []);
      return result;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchGet?${validConfigs.map(c => `ranges=${encodeURIComponent(c.resolvedRange!)}`).join('&')}&key=${API_KEY}`;
    
    const response = await axios.get(url);
    const valueRanges = response.data.valueRanges;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    
    // Initialize all keys with empty arrays
    configs.forEach(c => result[c.key] = []);

    // Fill in data for valid configs
    validConfigs.forEach((config, index) => {
      const rows = valueRanges[index]?.values;
      if (rows && rows.length > 0) {
        const headers = rows[0];
        result[config.key] = mapRowsToObjects(rows, headers);
      }
    });
    
    return result;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response && error.response.status === 429 && retries > 0) {
      const delay = (4 - retries) * 3000 + Math.random() * 1000;
      console.warn(`Rate limit hit for batch fetch. Retrying in ${Math.round(delay/1000)}s...`);
      await new Promise(res => setTimeout(res, delay));
      return fetchAllProjectData(retries - 1);
    }
    console.error("Batch fetch failed:", error.response?.data?.error?.message || error.message);
    return null;
  }
};

// Typed Fetch Functions
export const getGreyInward = async (): Promise<MaterialInwardRecord[]> => {
  const data = await fetchSheetData(['Grey_Inward!A:J', "'Grey Inward'!A:J"]);
  return data as MaterialInwardRecord[];
};

export const getGreyUsage = async (): Promise<MaterialUsageRecord[]> => {
  const data = await fetchSheetData(['Grey_Usage!A:I', "'Grey Usage'!A:I"]);
  return data as MaterialUsageRecord[];
};

export const getFinishingInward = async (): Promise<MaterialInwardRecord[]> => {
  const data = await fetchSheetData(["' Finishing_Inward'!A:J", "'Finishing_Inward'!A:J", "'Finishing Inward'!A:J"]);
  return data as MaterialInwardRecord[];
};

export const getFinishingUsage = async (): Promise<MaterialUsageRecord[]> => {
  const data = await fetchSheetData(['Finishing_Usage!A:I', "'Finishing Usage'!A:I"]);
  return data as MaterialUsageRecord[];
};

export const getElectricInward = async (): Promise<MaterialInwardRecord[]> => {
  const data = await fetchSheetData([
    "' MEP_Inward_Electric'!A:J",
    "'MEP_Inward_Electric'!A:J",
    'Electric_Inward!A:J', 
    "'Electric Inward'!A:J", 
    "'mep electric ki inward'!A:J", 
    "'MEP Electric Inward'!A:J",
    "'mep electric inward'!A:J",
    "'Electric'!A:J"
  ]);
  return data as MaterialInwardRecord[];
};

export const getElectricUsage = async (): Promise<MaterialUsageRecord[]> => {
  const data = await fetchSheetData([
    "'MEP_Usage_Electric'!A:I",
    'Electric_Usage!A:I', 
    "'Electric Usage'!A:I", 
    "'mep electric usage'!A:I", 
    "'MEP Electric Usage'!A:I",
    "'mep electric ki usage'!A:I"
  ]);
  return data as MaterialUsageRecord[];
};

export const getPlumbingInward = async (): Promise<MaterialInwardRecord[]> => {
  const data = await fetchSheetData([
    "'MEP_Inward_Plumbing'!A:J",
    'Plumbing_Inward!A:J', 
    "'Plumbing Inward'!A:J", 
    "'mep plumbing ki inward'!A:J", 
    "'MEP Plumbing Inward'!A:J",
    "'mep plumbing inward'!A:J",
    "'Plumbing'!A:J"
  ]);
  return data as MaterialInwardRecord[];
};

export const getPlumbingUsage = async (): Promise<MaterialUsageRecord[]> => {
  const data = await fetchSheetData([
    "'MEP_Usage_Pluming'!A:I",
    "'MEP_Usage_Plumbing'!A:I",
    'Plumbing_Usage!A:I', 
    "'Plumbing Usage'!A:I", 
    "'mep plumbing usage'!A:I", 
    "'MEP Plumbing Usage'!A:I",
    "'mep plumbing ki usage'!A:I"
  ]);
  return data as MaterialUsageRecord[];
};

export const getMechanicalInward = async (): Promise<MaterialInwardRecord[]> => {
  const data = await fetchSheetData([
    'Mechanical_Inward!A:J', 
    "'Mechanical Inward'!A:J", 
    "'MEP Mechanical Inward'!A:J",
    "'Mechanical'!A:J"
  ]);
  return data as MaterialInwardRecord[];
};

export const getMechanicalUsage = async (): Promise<MaterialUsageRecord[]> => {
  const data = await fetchSheetData([
    'Mechanical_Usage!A:I', 
    "'Mechanical Usage'!A:I", 
    "'MEP Mechanical Usage'!A:I"
  ]);
  return data as MaterialUsageRecord[];
};

export const getSalaryData = async (): Promise<SalarySummaryRecord[]> => {
  const data = await fetchSheetData(['Salary_Sheet!A:F', 'Salary_Summary!A:F', 'My_Salary!A:F']);
  return data as SalarySummaryRecord[];
};

export const getSalaryPayments = async (): Promise<AdvanceHistoryRecord[]> => {
  const data = await fetchSheetData(['Advance_History!A:F', 'Salary_History!A:F']);
  return data as AdvanceHistoryRecord[];
};

export const getLaborExpenses = async (): Promise<ExpenseRecord[]> => {
  const data = await fetchSheetData('Other_Expenses!A:C');
  return data as ExpenseRecord[];
};

export const getMilestones = async (): Promise<MilestoneRecord[]> => {
  const data = await fetchSheetData('Milestones!A:F');
  return data as MilestoneRecord[];
};
