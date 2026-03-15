import React, { useState, useMemo } from 'react';
import { Table, TableRow, TableCell } from '../components/table';
import { Banknote, Lock, Unlock, AlertCircle, History, FileText, Sparkles, CheckCircle, Clock, Download } from 'lucide-react';
import { useData } from '../DataContext';
import { SalarySummaryRecord } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const SalaryView: React.FC = () => {
  const { salaryData, salaryPayments } = useData();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');

  const BASIC_SALARY = 35000;
  const currentMonthStr = useMemo(() => {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }, []);

  const currentMonthAdvance = useMemo(() => {
    return salaryPayments
      .filter(item => {
        let m = item.month;
        if (!m && item.date) {
          const d = new Date(item.date);
          if (!isNaN(d.getTime())) {
            m = d.toLocaleString('default', { month: 'long', year: 'numeric' });
          }
        }
        return m === currentMonthStr;
      })
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [salaryPayments, currentMonthStr]);

  const currentMonthRemaining = useMemo(() => {
    const currentMonthData = salaryData.find(record => record.month === currentMonthStr);
    const basic = currentMonthData?.basicSalary || BASIC_SALARY;
    return basic - currentMonthAdvance;
  }, [salaryData, currentMonthAdvance, currentMonthStr]);

  const dynamicSalarySummary = useMemo(() => {
    const summaryMap = new Map<string, SalarySummaryRecord>();
    
    const normalizeMonth = (m: string) => {
      if (!m) return '';
      const trimmed = m.trim();
      // Try to parse as date to get consistent "Month Year" format
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
      }
      return trimmed;
    };

    const normalizedCurrentMonth = normalizeMonth(currentMonthStr);

    // First, populate from salaryData (Salary_Sheet)
    salaryData.forEach(record => {
      if (record.month) {
        const m = normalizeMonth(record.month);
        summaryMap.set(m, {
          id: record.id || m,
          month: m,
          basicSalary: record.basicSalary || BASIC_SALARY,
          advanceTaken: 0, // Will be calculated from Advance_History
          remainingSalary: record.basicSalary || BASIC_SALARY,
          status: record.status || 'Pending'
        });
      }
    });

    // Always include current month if not present
    if (!summaryMap.has(normalizedCurrentMonth)) {
      summaryMap.set(normalizedCurrentMonth, {
        id: 'current',
        month: normalizedCurrentMonth,
        basicSalary: BASIC_SALARY,
        advanceTaken: 0,
        remainingSalary: BASIC_SALARY,
        status: 'Pending'
      });
    }

    // Process all payments from Advance_History
    salaryPayments.forEach(payment => {
      let m = payment.month;
      if (!m && payment.date) {
        const d = new Date(payment.date);
        if (!isNaN(d.getTime())) {
          m = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        }
      }
      
      if (!m) return;
      const normalizedM = normalizeMonth(m);

      if (!summaryMap.has(normalizedM)) {
        summaryMap.set(normalizedM, {
          id: normalizedM,
          month: normalizedM,
          basicSalary: BASIC_SALARY,
          advanceTaken: 0,
          remainingSalary: BASIC_SALARY,
          status: 'Pending'
        });
      }
      const record = summaryMap.get(normalizedM);
      if (record) {
        record.advanceTaken += (payment.amount || 0);
        record.remainingSalary = record.basicSalary - record.advanceTaken;
      }
    });

    // Convert to array and sort by date descending
    return Array.from(summaryMap.values())
      .map((item, index) => ({ ...item, originalIndex: index }))
      .sort((a, b) => {
        const dateA = new Date(a.month).getTime();
        const dateB = new Date(b.month).getTime();
        if (dateA !== dateB) {
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        }
        return b.originalIndex - a.originalIndex;
      });
  }, [salaryData, salaryPayments, currentMonthStr]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const validPin = import.meta.env.VITE_SALARY_PIN || '7425';
    if (pin === validPin) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Incorrect PIN code');
      setPin('');
    }
  };

  const formatDate = (dateStr: string) => {
    return dateStr;
  };

  const filteredPayments = useMemo(() => {
    return [...salaryPayments]
      .map((item, index) => ({ ...item, originalIndex: index }))
      .sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        if (dateA !== dateB) {
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        }
        return b.originalIndex - a.originalIndex;
      });
  }, [salaryPayments]);

  const exportToCSV = () => {
    let headers: string[];
    let csvContent: string;

    if (activeTab === 'summary') {
      headers = ['Month', 'Basic Salary', 'Advance Taken', 'Remaining Salary', 'Status'];
      csvContent = [
        headers.join(','),
        ...dynamicSalarySummary.map(row => [
          `"${row.month}"`,
          row.basicSalary || 0,
          row.advanceTaken || 0,
          row.remainingSalary || 0,
          `"${row.status || 'Pending'}"`
        ].join(','))
      ].join('\n');
    } else {
      headers = ['Date', 'Amount', 'Description'];
      csvContent = [
        headers.join(','),
        ...filteredPayments.map(row => [
          `"${row.date || ''}"`,
          row.amount || 0,
          `"${row.description || ''}"`
        ].join(','))
      ].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab === 'summary' ? 'salary_summary' : 'advance_history'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add Header
    doc.setFontSize(20);
    doc.setTextColor(15, 118, 110); // Teal-700
    doc.text("QURESHI VILLA - SALARY REPORT", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report Type: ${activeTab === 'summary' ? 'Monthly Payroll Summary' : 'Advance History'}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);
    
    if (activeTab === 'summary') {
      const tableColumn = ["Month", "Basic Salary", "Advance Taken", "Remaining", "Status"];
      const tableRows = dynamicSalarySummary.map(row => [
        row.month,
        `Rs. ${(row.basicSalary || 0).toLocaleString()}`,
        `Rs. ${(row.advanceTaken || 0).toLocaleString()}`,
        `Rs. ${(row.remainingSalary || 0).toLocaleString()}`,
        row.status
      ]);

      // @ts-expect-error - autoTable is added to jsPDF prototype
      doc.autoTable({
        startY: 45,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 4 },
        alternateRowStyles: { fillColor: [240, 253, 250] }
      });
    } else {
      const tableColumn = ["Date", "Amount", "Description"];
      const tableRows = filteredPayments.map(row => [
        row.date || '',
        `Rs. ${(row.amount || 0).toLocaleString()}`,
        row.description || ''
      ]);

      // @ts-expect-error - autoTable is added to jsPDF prototype
      doc.autoTable({
        startY: 45,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110], textColor: 255 }, // Teal-700
        styles: { fontSize: 9, cellPadding: 4 },
        alternateRowStyles: { fillColor: [240, 253, 250] } // Teal-50
      });
    }

    doc.save(`Salary_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isUnlocked) {
    // ... (keep unlock UI)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-teal-500 max-w-sm w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-indigo-500"></div>
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-200">
            <Lock size={28} className="text-teal-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Restricted Access</h2>
          <p className="text-slate-500 mb-8 text-sm px-4">This section contains confidential salary data. Enter PIN to continue.</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-3xl tracking-[0.5em] font-bold py-4 border-b-2 border-slate-200 bg-transparent focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-400 placeholder:tracking-widest text-slate-900"
              />
            </div>
            {error && (
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-medium bg-slate-50 py-2 rounded-lg border border-slate-200">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-medium hover:bg-slate-800 hover:shadow-lg transition-all mt-4"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 text-teal-600 shadow-sm">
            <Banknote size={32} />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1">My Salary</h2>
            <p className="text-slate-500 font-medium text-sm">Confidential payroll data & history</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsUnlocked(false)}
            className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-teal-600 hover:text-teal-700 transition-colors px-3 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 hover:border-teal-300 shadow-sm"
          >
            <Unlock size={16} />
            Lock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mb-3 border border-teal-100">
            <History size={24} className="text-teal-500" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Advance Taken ({currentMonthStr})</span>
          <h3 className="text-2xl font-black text-slate-700">Rs. {(currentMonthAdvance || 0).toLocaleString()}</h3>
          <p className="mt-2 text-[10px] font-medium text-slate-400">Current month advance</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center mb-3 border border-teal-100">
            <CheckCircle size={20} className="text-teal-500" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining Salary ({currentMonthStr})</span>
          <h3 className="text-2xl font-black text-teal-600">Rs. {(currentMonthRemaining || 0).toLocaleString()}</h3>
          <p className="mt-2 text-[10px] font-medium text-slate-400">Current month remaining</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar items-center justify-between">
          <div className="flex">
            <button 
              onClick={() => setActiveTab('summary')} 
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'summary' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Monthly Summary
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'history' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Advance History
            </button>
          </div>
          
          <button 
            onClick={generatePDF}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-teal-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap"
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
        
        <button 
          onClick={generatePDF}
          className="md:hidden flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-teal-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-sm w-full"
        >
          <Download size={14} /> Download PDF
        </button>
      </div>

      {activeTab === 'summary' && (
        <Table 
          title={`Monthly Payroll Summary`} 
          headers={['Month', 'Basic Salary', 'Advance Taken', 'Remaining', 'Status']}
          borderColor="bg-teal-500"
          centerTitle={true}
        >
            {dynamicSalarySummary.length > 0 ? (
              dynamicSalarySummary.map((row, index) => (
                <TableRow key={`salary-summary-${row.id || index}`}>
                  <TableCell className="text-slate-800 font-bold">{row.month}</TableCell>
                <TableCell className="text-slate-600 font-medium">Rs. {(row.basicSalary || 0).toLocaleString()}</TableCell>
                <TableCell className="text-slate-700 font-bold">Rs. {(row.advanceTaken || 0).toLocaleString()}</TableCell>
                <TableCell className="text-teal-600 font-black">Rs. {(row.remainingSalary || 0).toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${row.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                    {row.status === 'Paid' ? <CheckCircle size={12} /> : <Clock size={12} />} {row.status}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow key="no-salary-data">
              <TableCell className="text-slate-400 text-center py-6 italic" colSpan={5}>No payroll summary available.</TableCell>
            </TableRow>
          )}
        </Table>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-teal-800 px-1">
                <History size={20} />
                <h3 className="font-bold text-lg">Advance History</h3>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button 
                  onClick={exportToCSV}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap"
                >
                  <FileText size={16} />
                  Export CSV
                </button>
            </div>
          </div>

          <Table 
            title="Advance History" 
            headers={['Date', 'Amount', 'Description']}
            borderColor="bg-teal-500"
          >
            {filteredPayments.length > 0 ? (
              filteredPayments.map((record, index) => (
                <TableRow key={`advance-history-${record.id || index}`} className={index === 0 ? "bg-teal-50 border-l-4 border-l-teal-500" : ""}>
                  <TableCell className="text-slate-800 font-bold">
                    {formatDate(record.date)}
                    {index === 0 && <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wide border border-teal-200"><Sparkles size={10} /> New</span>}
                  </TableCell>
                  <TableCell className="text-slate-700 font-bold">Rs. {(record.amount || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-slate-600 font-medium">{record.description}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow key="no-payments">
                <TableCell className="text-slate-400 text-center py-6 italic" colSpan={3}>No advance records found.</TableCell>
              </TableRow>
            )}
          </Table>
        </div>
      )}
    </div>
  );
};

