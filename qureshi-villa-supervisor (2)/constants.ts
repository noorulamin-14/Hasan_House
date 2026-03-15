
import { MaterialInwardRecord, MaterialUsageRecord, ProgressData, SalaryRecord, ExpenseRecord, SalaryPaymentRecord } from './types';

// ==========================================
// GREY STRUCTURE DATA
// ==========================================

export const GREY_INWARD: MaterialInwardRecord[] = [
  { id: 'grey-in-1', date: '2023-10-01', material: 'Cement', quantity: 500, unit: 'Bags' },
  { id: 'grey-in-2', date: '2023-10-02', material: 'Bricks', quantity: 20000, unit: 'Pcs' },
  { id: 'grey-in-3', date: '2023-11-10', material: 'Steel', quantity: 3, unit: 'Tons' },
  { id: 'grey-in-4', date: '2023-11-12', material: 'Crush', quantity: 2, unit: 'Dumper' },
  { id: 'grey-in-5', date: '2023-12-01', material: 'Sand', quantity: 2, unit: 'Dumper', isNew: true },
];

export const GREY_USAGE: MaterialUsageRecord[] = [
  { id: 'grey-use-1', date: '2023-10-05', material: 'Cement', used: 50, balance: 450, unit: 'Bags', description: 'Foundation Pouring' },
  { id: 'grey-use-2', date: '2023-11-15', material: 'Steel', used: 1.5, balance: 1.5, unit: 'Tons', description: 'Slab Binding', isNew: true },
  { id: 'grey-use-3', date: '2023-12-02', material: 'Sand', used: 0.5, balance: 1.5, unit: 'Dumper', description: 'Masonry Work', isNew: true },
];


// ==========================================
// FINISHING DATA
// ==========================================

export const FINISHING_INWARD: MaterialInwardRecord[] = [
  { id: 'fin-in-1', date: '2023-11-01', material: 'Floor Tiles', quantity: 400, unit: 'Boxes' },
  { id: 'fin-in-2', date: '2023-11-15', material: 'Paint', quantity: 50, unit: 'Drums' },
  { id: 'fin-in-3', date: '2023-12-05', material: 'Wood', quantity: 800, unit: 'Ft', isNew: true },
];

export const FINISHING_USAGE: MaterialUsageRecord[] = [
  { id: 'fin-use-1', date: '2023-11-05', material: 'Floor Tiles', used: 100, balance: 300, unit: 'Boxes', description: 'Drawing Room' },
  { id: 'fin-use-2', date: '2023-11-20', material: 'Paint', used: 10, balance: 40, unit: 'Drums', description: 'Bedrooms Base Coat' },
  { id: 'fin-use-3', date: '2023-12-06', material: 'Wood', used: 200, balance: 600, unit: 'Ft', description: 'Door Frames', isNew: true },
];


// ==========================================
// MEP DATA
// ==========================================

export const ELECTRIC_INWARD: MaterialInwardRecord[] = [
  { id: 'elec-in-1', date: '2023-11-05', material: 'Electric Wires', quantity: 60, unit: 'Coils' },
  { id: 'elec-in-2', date: '2023-12-10', material: 'Switch Boards', quantity: 150, unit: 'Pcs', isNew: true },
];

export const ELECTRIC_USAGE: MaterialUsageRecord[] = [
  { id: 'elec-use-1', date: '2023-11-08', material: 'Electric Wires', used: 20, balance: 40, unit: 'Coils', description: 'Ceiling Drops' },
  { id: 'elec-use-2', date: '2023-12-11', material: 'Switch Boards', used: 10, balance: 140, unit: 'Pcs', description: 'Room Installation', isNew: true },
];

export const PLUMBING_INWARD: MaterialInwardRecord[] = [
  { id: 'plum-in-1', date: '2023-10-15', material: 'PPR Pipes', quantity: 200, unit: 'Lengths' },
];

export const PLUMBING_USAGE: MaterialUsageRecord[] = [
  { id: 'plum-use-1', date: '2023-10-18', material: 'PPR Pipes', used: 50, balance: 150, unit: 'Lengths', description: 'Underground Sewerage' },
];

export const MECHANICAL_INWARD: MaterialInwardRecord[] = [
  { id: 'mech-in-1', date: '2023-12-12', material: 'AC Duct', quantity: 50, unit: 'Meters' },
];

export const MECHANICAL_USAGE: MaterialUsageRecord[] = [
  { id: 'mech-use-1', date: '2023-12-15', material: 'AC Duct', used: 10, balance: 40, unit: 'Meters', description: 'Ground Floor' },
];


// ==========================================
// SHARED DATA
// ==========================================
export const SALARY_DATA: SalaryRecord[] = [
  { id: '1', month: 'October 2023', basicSalary: 100000, advanceTaken: 20000, remainingSalary: 80000, status: 'Paid' },
  { id: '2', month: 'November 2023', basicSalary: 100000, advanceTaken: 5000, remainingSalary: 95000, status: 'Pending' },
];

export const SALARY_PAYMENTS: SalaryPaymentRecord[] = [
  { id: 'sal-pay-1', date: '2023-10-05', month: 'October 2023', amount: 10000, description: 'Emergency Advance', type: 'Advance', status: 'Paid' },
  { id: 'sal-pay-2', date: '2023-10-15', month: 'October 2023', amount: 10000, description: 'Personal Advance', type: 'Advance', status: 'Paid' },
  { id: 'sal-pay-3', date: '2023-11-01', month: 'October 2023', amount: 80000, description: 'Remaining Salary', type: 'Salary', status: 'Paid' },
  { id: 'sal-pay-4', date: '2026-01-31', month: 'January 2026', amount: 35000, description: 'Full Salary Paid', type: 'Salary', status: 'Paid' },
  { id: 'sal-pay-5', date: '2026-02-28', month: 'February 2026', amount: 35000, description: 'Full Salary Paid', type: 'Salary', status: 'Paid' },
];

export const PROJECT_PROGRESS: ProgressData[] = [
  { name: 'Structure', progress: 85, color: '#5eead4' }, 
  { name: 'MEP', progress: 45, color: '#a78bfa' }, 
  { name: 'Finishing', progress: 20, color: '#fb7185' }, 
  { name: 'Handover', progress: 5, color: '#34d399' }, 
];

export const LABOR_EXPENSES: ExpenseRecord[] = [
  { id: '1', date: '2023-10-01', item: 'Excavation', category: 'Labor', amount: 50000, paidBy: 'Owner', description: 'Foundation excavation' },
];
