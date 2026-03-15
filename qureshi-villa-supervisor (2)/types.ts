
export interface MaterialInwardRecord {
  id: string;
  date: string;
  material: string;
  quantity: number;
  unit: string;
  isNew?: boolean; // Added to flag new records
  floor?: string;
  amount?: number; // Added for material costing
  brandName?: string;
  itemName?: string;
  size?: string;
  rate?: number;
  category?: string;
}

export interface MaterialUsageRecord {
  id: string;
  date: string;
  material: string;
  used: number;
  balance: number;
  unit: string;
  description: string;
  isNew?: boolean; // Added to flag new records
  floor?: string;
  itemName?: string;
  size?: string;
  category?: string;
}

export interface SalarySummaryRecord {
  id: string;
  month: string;
  basicSalary: number;
  advanceTaken: number;
  remainingSalary: number;
  status: 'Paid' | 'Pending';
}

export interface AdvanceHistoryRecord {
  id: string;
  date?: string;
  amount?: number;
  description?: string;
  month: string;
  basicSalary?: number;
  advanceTaken?: number;
  remainingSalary?: number;
  status?: 'Paid' | 'Pending' | string;
}

export interface SalaryRecord {
  id: string;
  month: string;
  basicSalary: number;
  advanceTaken: number;
  remainingSalary: number;
  status: 'Paid' | 'Pending';
}

export interface SalaryPaymentRecord {
  id: string;
  date: string;
  month: string;
  amount: number;
  description: string;
  type: 'Salary' | 'Advance';
  status?: 'Paid' | 'Pending';
}

export interface ExpenseRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  isNew?: boolean;
}

export interface MilestoneRecord {
  id: string;
  date: string;
  milestone: string;
  status: string;
  progress: number;
  notes: string;
}

export interface ProgressData {
  name: string;
  progress: number; // 0-100
  color: string;
}

export type TabId = 'dashboard' | 'grey' | 'finishing' | 'mep' | 'salary' | 'labor';
