import React, { useState, useMemo } from 'react';
import { Table, TableRow, TableCell } from '../components/table';
import { Pickaxe, Download, Search, Sparkles } from 'lucide-react';
import { useData } from '../DataContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const LaborView: React.FC = () => {
  const { expenses: laborData } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return laborData.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (item.description || '').toLowerCase().includes(searchLower);
      
      return matchesSearch;
    })
    .map((item, index) => ({ ...item, originalIndex: index }))
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
      }
      return b.originalIndex - a.originalIndex;
    });
  }, [laborData, searchTerm]);

  const totalAmount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredData]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    if (dateStr.toLowerCase() === '8-mar') return '8-Mar-26';
    return dateStr;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(15, 118, 110); // Teal
    doc.text('QURESHI VILLA', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text('Other Expenses Report', 14, 30);
    
    let yPos = 40;
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, yPos);
    yPos += 5;
    doc.text(`Total Amount: Rs. ${(totalAmount || 0).toLocaleString()}`, 14, yPos);
    yPos += 5;

    const tableColumn = ["Date", "Description", "Amount (Rs)"];
    const tableRows = filteredData.map(row => [
        formatDate(row.date),
        row.description || '-',
        (row.amount || 0).toLocaleString()
    ]);

    // @ts-expect-error - autoTable is added to jsPDF prototype
    doc.autoTable({
      startY: yPos + 5,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 118, 110], textColor: 255 }, // Teal color
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [254, 252, 232] }
    });

    doc.save(`Other_Expenses_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-teal-600 shadow-sm shrink-0">
            <Pickaxe size={28} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Other Expenses</h2>
            <p className="text-slate-500 font-medium text-sm">Miscellaneous expenses and costs</p>
          </div>
        </div>
        <div className="w-full md:w-80">
            <div className="glass-card px-6 py-4 rounded-2xl border border-white/50 shadow-sm flex flex-row items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Cost</span>
                <span className="text-2xl font-black text-teal-600">Rs. {(totalAmount || 0).toLocaleString()}</span>
            </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={generatePDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-teal-700 border border-teal-500 rounded-xl text-sm font-medium hover:bg-teal-50 transition-colors shadow-sm whitespace-nowrap"
          >
            <Download size={16} /> <span>Export PDF</span>
          </button>
        </div>
      </div>

      <Table title="Other Expenses Log" headers={['Date', 'Description', 'Amount (Rs)']} borderColor="bg-teal-500">
        {filteredData.length > 0 ? (
          filteredData.map((row, index) => (
            <TableRow key={`labor-expense-${row.id || index}`} className={row.isNew ? "bg-teal-50 border-l-4 border-l-teal-500" : ""}>
              <TableCell className="text-slate-500 whitespace-nowrap text-xs md:text-sm">
                {formatDate(row.date)}
                {row.isNew && <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wide border border-teal-200"><Sparkles size={10} /> New</span>}
              </TableCell>
              <TableCell className="text-slate-600 text-xs md:text-sm italic">{row.description || '-'}</TableCell>
              <TableCell className="text-teal-700 font-bold text-xs md:text-sm">Rs. {(row.amount || 0).toLocaleString()}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow key="no-labor-records">
            <TableCell className="text-center py-8 text-slate-400 italic" colSpan={3}>No expenses found matching your criteria.</TableCell>
          </TableRow>
        )}
      </Table>
    </div>
  );
};
