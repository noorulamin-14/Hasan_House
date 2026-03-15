
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MaterialInwardRecord, 
  MaterialUsageRecord, 
  SalarySummaryRecord,
  AdvanceHistoryRecord,
  ExpenseRecord,
  MilestoneRecord
} from './types';
import { 
  GREY_INWARD, GREY_USAGE, 
  FINISHING_INWARD, FINISHING_USAGE, 
  ELECTRIC_INWARD, ELECTRIC_USAGE, 
  PLUMBING_INWARD, PLUMBING_USAGE, 
  MECHANICAL_INWARD, MECHANICAL_USAGE, 
  SALARY_DATA,
  LABOR_EXPENSES,
  SALARY_PAYMENTS
} from './constants';
import { 
  getGreyInward, getGreyUsage, 
  getFinishingInward, getFinishingUsage, 
  getElectricInward, getElectricUsage, 
  getPlumbingInward, getPlumbingUsage, 
  getMechanicalInward, getMechanicalUsage, 
  getSalaryData,
  getSalaryPayments,
  getLaborExpenses,
  getMilestones,
  clearSheetNamesCache,
  fetchAllProjectData
} from './services/sheets';

interface DataContextType {
  greyInward: MaterialInwardRecord[];
  greyUsage: MaterialUsageRecord[];
  finishingInward: MaterialInwardRecord[];
  finishingUsage: MaterialUsageRecord[];
  electricInward: MaterialInwardRecord[];
  electricUsage: MaterialUsageRecord[];
  plumbingInward: MaterialInwardRecord[];
  plumbingUsage: MaterialUsageRecord[];
  mechanicalInward: MaterialInwardRecord[];
  mechanicalUsage: MaterialUsageRecord[];
  salaryData: SalarySummaryRecord[];
  salaryPayments: AdvanceHistoryRecord[];
  expenses: ExpenseRecord[];
  milestones: MilestoneRecord[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addSalaryPayment: (payment: AdvanceHistoryRecord) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState({
    greyInward: GREY_INWARD,
    greyUsage: GREY_USAGE,
    finishingInward: FINISHING_INWARD,
    finishingUsage: FINISHING_USAGE,
    electricInward: ELECTRIC_INWARD,
    electricUsage: ELECTRIC_USAGE,
    plumbingInward: PLUMBING_INWARD,
    plumbingUsage: PLUMBING_USAGE,
    mechanicalInward: MECHANICAL_INWARD,
    mechanicalUsage: MECHANICAL_USAGE,
    salaryData: SALARY_DATA,
    salaryPayments: SALARY_PAYMENTS,
    expenses: LABOR_EXPENSES,
    milestones: [] as MilestoneRecord[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSalaryPayment = (payment: AdvanceHistoryRecord) => {
    setData(prev => {
      const updatedSalaryData = [...prev.salaryData];
      const monthIndex = updatedSalaryData.findIndex(s => s.month === payment.month);
      
      let basicSalary = 0;
      let advanceTaken = payment.amount || 0;
      let remainingSalary = -advanceTaken;
      let status = 'Pending';

      if (monthIndex >= 0) {
        const current = updatedSalaryData[monthIndex];
        basicSalary = current.basicSalary || 0;
        advanceTaken = (current.advanceTaken || 0) + (payment.amount || 0);
        remainingSalary = basicSalary - advanceTaken;
        status = remainingSalary <= 0 ? 'Paid' : 'Pending';
        
        updatedSalaryData[monthIndex] = {
          ...current,
          advanceTaken,
          remainingSalary,
          status
        };
      } else {
        updatedSalaryData.unshift({
          id: Math.random().toString(36).substr(2, 9),
          month: payment.month,
          basicSalary,
          advanceTaken,
          remainingSalary,
          status
        });
      }

      const newPaymentRecord: AdvanceHistoryRecord = {
        ...payment,
        basicSalary,
        advanceTaken,
        remainingSalary,
        status
      };

      return {
        ...prev,
        salaryPayments: [newPaymentRecord, ...prev.salaryPayments],
        salaryData: updatedSalaryData
      };
    });
  };

  const refreshData = async () => {
    // Only fetch if API keys are present, otherwise stick to constants (Demo Mode)
    if (!import.meta.env.VITE_GOOGLE_API_KEY) {
        console.log("No API Key found, using local constants.");
        return;
    }

    setIsLoading(true);
    setError(null);
    clearSheetNamesCache();
    try {
      const allData = await fetchAllProjectData();
      
      if (allData) {
        setData(prev => ({
          ...prev,
          greyInward: allData.greyInward || prev.greyInward,
          greyUsage: allData.greyUsage || prev.greyUsage,
          finishingInward: allData.finishingInward || prev.finishingInward,
          finishingUsage: allData.finishingUsage || prev.finishingUsage,
          electricInward: allData.electricInward || prev.electricInward,
          electricUsage: allData.electricUsage || prev.electricUsage,
          plumbingInward: allData.plumbingInward || prev.plumbingInward,
          plumbingUsage: allData.plumbingUsage || prev.plumbingUsage,
          mechanicalInward: allData.mechanicalInward || prev.mechanicalInward,
          mechanicalUsage: allData.mechanicalUsage || prev.mechanicalUsage,
          salaryData: allData.salaryData || prev.salaryData,
          salaryPayments: allData.salaryPayments || prev.salaryPayments,
          expenses: allData.laborExpenses || prev.expenses,
          milestones: allData.milestones || prev.milestones,
        }));
      } else {
        // Fallback to individual fetches if batch fails
        const gIn = await getGreyInward();
        const gUse = await getGreyUsage();
        const fIn = await getFinishingInward();
        const fUse = await getFinishingUsage();
        const eIn = await getElectricInward();
        const eUse = await getElectricUsage();
        const pIn = await getPlumbingInward();
        const pUse = await getPlumbingUsage();
        const mIn = await getMechanicalInward();
        const mUse = await getMechanicalUsage();
        const sal = await getSalaryData();
        const salPay = await getSalaryPayments();
        const exp = await getLaborExpenses();
        const mls = await getMilestones();

        setData(prev => ({
          ...prev,
          greyInward: gIn || prev.greyInward,
          greyUsage: gUse || prev.greyUsage,
          finishingInward: fIn || prev.finishingInward,
          finishingUsage: fUse || prev.finishingUsage,
          electricInward: eIn || prev.electricInward,
          electricUsage: eUse || prev.electricUsage,
          plumbingInward: pIn || prev.plumbingInward,
          plumbingUsage: pUse || prev.plumbingUsage,
          mechanicalInward: mIn || prev.mechanicalInward,
          mechanicalUsage: mUse || prev.mechanicalUsage,
          salaryData: sal || prev.salaryData,
          salaryPayments: salPay || prev.salaryPayments,
          expenses: exp || prev.expenses,
          milestones: mls || prev.milestones,
        }));
      }

    } catch (err) {
      console.error("Failed to refresh data", err);
      setError("Failed to load data from Google Sheets");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    refreshData();
  }, []);

  return (
    <DataContext.Provider value={{ ...data, isLoading, error, refreshData, addSalaryPayment }}>
      {children}
    </DataContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
