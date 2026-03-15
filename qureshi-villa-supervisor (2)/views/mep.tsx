import React, { useMemo, useState } from 'react';
import { Table, TableRow, TableCell } from '../components/table';
import { Wrench, ArrowDownCircle, ArrowUpCircle, Sparkles, Package, Download, Filter, Zap, Droplet, Settings } from 'lucide-react';
import { useData } from '../DataContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaterialInwardRecord, MaterialUsageRecord } from '../types';

export const MEPView: React.FC = () => {
  const { 
    electricInward, electricUsage, 
    plumbingInward, plumbingUsage, 
    mechanicalInward, mechanicalUsage
  } = useData();

  const [activeTab, setActiveTab] = useState<'Electric' | 'Plumbing' | 'Mechanical'>('Electric');

  const formatDate = (dateStr: string) => {
    if (dateStr.toLowerCase() === '8-mar') return '8-Mar-26';
    return dateStr;
  };

  const formatUnit = (quantity: number, unit: string) => {
    if (!unit) return '';
    const lowerUnit = unit.toLowerCase().trim();
    if (lowerUnit === 'pc' && quantity > 1) return 'Pcs';
    if (lowerUnit === 'coil' && quantity > 1) return 'Coils';
    if (lowerUnit === 'length' && quantity > 1) return 'Lengths';
    if (lowerUnit === 'meter' && quantity > 1) return 'Meters';
    return unit;
  };

  const getMaterialTotals = (inward: MaterialInwardRecord[], usage: MaterialUsageRecord[]) => {
    const totals = inward.reduce((acc, curr) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = curr as any;
      const baseName = (r.itemName || r.material || r.item || '').trim().toUpperCase();
      const size = (r.size || '').trim();
      const matName = size ? `${baseName} (${size})` : baseName;
      
      if (!acc[matName]) {
        acc[matName] = { qty: 0, unit: curr.unit, amount: 0, used: 0, latestBalance: 0 };
      }
      acc[matName].qty += curr.quantity;
      acc[matName].amount += (curr.amount || 0);
      return acc;
    }, {} as Record<string, { qty: number; unit: string; amount: number; used: number; latestBalance: number }>);

    // Sort usage by date descending to find the latest balance
    const sortedUsage = [...usage]
      .map((item, index) => ({ ...item, originalIndex: index }))
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        }
        return b.originalIndex - a.originalIndex;
      });

    usage.forEach(curr => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = curr as any;
      const baseName = (r.itemName || r.material || r.item || '').trim().toUpperCase();
      const size = (r.size || '').trim();
      const matName = size ? `${baseName} (${size})` : baseName;
      
      if (totals[matName]) {
        totals[matName].used += curr.used;
      } else {
        totals[matName] = { qty: 0, unit: curr.unit, amount: 0, used: curr.used, latestBalance: 0 };
      }
    });

    // Find latest balance for each material
    Object.keys(totals).forEach(matName => {
      const latestEntry = sortedUsage.find(u => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ur = u as any;
        const uBaseName = (ur.itemName || ur.material || ur.item || '').trim().toUpperCase();
        const uSize = (ur.size || '').trim();
        const uMatName = uSize ? `${uBaseName} (${uSize})` : uBaseName;
        return uMatName === matName;
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = latestEntry as any;
      if (r && r.balance !== undefined) {
        totals[matName].latestBalance = r.balance;
      } else {
        totals[matName].latestBalance = totals[matName].qty - totals[matName].used;
      }
    });

    return totals;
  };

  const generatePDF = (type: 'arrival' | 'consumption', category: string, inwardData: MaterialInwardRecord[], usageData: MaterialUsageRecord[]) => {
    const doc = new jsPDF();
    const isArrival = type === 'arrival';
    const title = isArrival ? `MEP (${category}) - Arrival Log` : `MEP (${category}) - Consumption Log`;
    const color = isArrival ? [13, 148, 136] : [225, 29, 72];

    doc.setFontSize(22);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`QURESHI VILLA`, 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.text(title, 14, 28);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);
    doc.text(`Supervisor: Noor Ul Amin`, 14, 41);
    const yPos = 46;

    const tableColumn = isArrival ? ["Date", "Phase/Location", "Brand Name", "Item Name", "Size", "Unit", "Qty", "Amount"] : ["S. N", "Item Name", "Size", "Usage", "Used Qty", "Remaining Qty"];
    
    if (isArrival) {
      if (category === 'Plumbing') tableColumn.splice(0, tableColumn.length, "S. N", "Date", "Brand Name", "Item Name", "Size", "Unit", "Qty", "Per Item Rate", "Amount");
      else if (category === 'Electric') tableColumn.splice(0, tableColumn.length, "S. N", "Date", "Item Name", "Size", "Qty", "Unit", "Per Item Rate", "Total Amount");
    } else {
      if (category === 'Plumbing') tableColumn.splice(0, tableColumn.length, "S. N", "Date", "Item Name", "Size", "Total Quantity", "Used Quantity", "Remaining Quantity", "Floor");
      else if (category === 'Electric') tableColumn.splice(0, tableColumn.length, "S. N", "Date", "Item Name", "Size", "Total Combined Qty", "Floor", "Used Qty", "Remaining Qty");
    }

    const data = isArrival ? inwardData : usageData;
    const totals = getMaterialTotals(inwardData, usageData);
    
    const tableRows = data.map((row, index) => {
        if (isArrival) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const r = row as any;
             if (category === 'Plumbing') {
               return [index + 1, r.date || '-', r.brandName || '-', r.itemName || r.material || '-', r.size || '-', r.unit || '-', r.quantity || 0, r.rate ? (r.rate || 0).toLocaleString() : '-', r.amount ? (r.amount || 0).toLocaleString() : '-'];
             } else if (category === 'Electric') {
               return [index + 1, r.date || '-', r.itemName || r.material || '-', r.size || '-', r.quantity || 0, r.unit || '-', r.rate ? (r.rate || 0).toLocaleString() : '-', r.amount ? (r.amount || 0).toLocaleString() : '-'];
             } else {
               return [r.date || '-', r.floor || '-', r.brandName || '-', r.itemName || r.material || '-', r.size || '-', r.unit || '-', r.quantity || 0, r.amount ? (r.amount || 0).toLocaleString() : '-'];
             }
        } else {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const r = row as any;
             const baseName = (r.itemName || r.material || '').trim().toUpperCase();
             const size = (r.size || '').trim();
             const matName = size ? `${baseName} (${size})` : baseName;
             const totalQty = totals[matName]?.qty || 0;
             
             if (category === 'Plumbing') {
               return [index + 1, formatDate(r.date), r.itemName || r.material || '-', r.size || '-', `${totalQty} ${r.unit || ''}`, `${r.used} ${r.unit || ''}`, `${r.balance} ${r.unit || ''}`, r.floor || '-'];
             } else if (category === 'Electric') {
               return [index + 1, formatDate(r.date), r.itemName || r.material || '-', r.size || '-', `${totalQty} ${r.unit || ''}`, r.floor || '-', `${r.used} ${r.unit || ''}`, `${r.balance} ${r.unit || ''}`];
             } else {
               return [index + 1, formatDate(r.date), r.itemName || r.material || '-', r.size || '-', r.description || '-', `${r.used} ${r.unit}`, `${r.balance} ${r.unit}`];
             }
        }
    });

    autoTable(doc, {
      startY: yPos + 5,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: color, textColor: 255, fontStyle: 'bold' },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index < 3) {
            data.cell.styles.fillColor = isArrival ? [230, 255, 250] : [255, 235, 235]; 
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [30, 41, 59];
        }
      }
    });
    doc.save(`mep_${category.toLowerCase()}_${type}_report.pdf`);
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'Electric':
        return { inward: electricInward, usage: electricUsage };
      case 'Plumbing':
        return { inward: plumbingInward, usage: plumbingUsage };
      case 'Mechanical':
        return { inward: mechanicalInward, usage: mechanicalUsage };
    }
  };

  const activeData = getActiveData();
  
  const sortedInwardData = useMemo(() => {
    return [...activeData.inward]
      .map((item, index) => ({ ...item, originalIndex: index }))
      .sort((a, b) => {
        return a.originalIndex - b.originalIndex;
      });
  }, [activeData.inward]);

  const sortedUsageData = useMemo(() => {
    return [...activeData.usage]
      .map((item, index) => ({ ...item, originalIndex: index }))
      .sort((a, b) => {
        return a.originalIndex - b.originalIndex;
      });
  }, [activeData.usage]);

  const materialTotals = getMaterialTotals(sortedInwardData, sortedUsageData);

  const renderInwardHeaders = () => {
    if (activeTab === 'Plumbing') {
      return ['Date', 'Brand Name', 'Item Name', 'Size', 'Unit', 'Qty', 'Per Item Rate', 'Amount'];
    } else if (activeTab === 'Electric' || activeTab === 'Mechanical') {
      return ['Date', 'Item Name', 'Size', 'Qty', 'Unit', 'Per Item Rate', 'Total Amount'];
    }
    return ['Date', 'Phase/Location', 'Brand Name', 'Item Name', 'Size', 'Unit', 'Qty', 'Amount'];
  };

  const renderUsageHeaders = () => {
    if (activeTab === 'Plumbing') {
      return ['Date', 'Item Name', 'Size', 'Total Quantity', 'Used Quantity', 'Remaining Quantity', 'Floor'];
    } else if (activeTab === 'Electric' || activeTab === 'Mechanical') {
      return ['Date', 'Item Name', 'Size', 'Total Combined Qty', 'Floor', 'Used Qty', 'Remaining Qty'];
    }
    return ['Date', 'Item Name', 'Size', 'Usage', 'Used Qty', 'Remaining Qty'];
  };

  const getActiveTabColors = () => {
    // All tabs now match the Electric (Teal) theme as requested
    return {
      text: 'text-teal-600', 
      bg: 'bg-teal-50', 
      border: 'border-teal-200',
      icon: 'text-teal-500', 
      amountText: 'text-teal-700', 
      amountBg: 'bg-teal-50', 
      amountBorder: 'border-teal-100',
      remainingText: 'text-teal-700', 
      tableBorder: 'bg-teal-500', 
      newBg: 'bg-teal-100', 
      newText: 'text-teal-800', 
      newBorder: 'border-teal-200', 
      newRowBg: 'bg-teal-50', 
      newRowBorder: 'border-l-teal-500'
    };
  };

  const tabColors = getActiveTabColors();

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 md:bg-transparent md:p-0 md:border-0 md:shadow-none">
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-teal-600 shadow-sm shrink-0">
            <Wrench size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">MEP Works</h2>
            <p className="text-sm text-slate-500 font-medium">Mechanical, Electrical, and Plumbing</p>
          </div>
        </div>
      </div>

      {/* Mobile-Responsive Tabs */}
      <div className="grid grid-cols-3 gap-1.5 md:gap-3 mb-6">
        <button
          onClick={() => setActiveTab('Electric')}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 py-2.5 md:px-5 md:py-3 rounded-xl font-bold text-[10px] md:text-sm transition-all ${
            activeTab === 'Electric' 
              ? 'bg-teal-600 text-white shadow-md shadow-teal-200' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
          }`}
        >
          <Zap size={16} className={activeTab === 'Electric' ? 'text-white' : 'text-teal-600'} />
          Electric
        </button>
        <button
          onClick={() => setActiveTab('Plumbing')}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 py-2.5 md:px-5 md:py-3 rounded-xl font-bold text-[10px] md:text-sm transition-all ${
            activeTab === 'Plumbing' 
              ? 'bg-teal-600 text-white shadow-md shadow-teal-200' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
          }`}
        >
          <Droplet size={16} className={activeTab === 'Plumbing' ? 'text-white' : 'text-teal-600'} />
          Plumbing
        </button>
        <button
          onClick={() => setActiveTab('Mechanical')}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 py-2.5 md:px-5 md:py-3 rounded-xl font-bold text-[10px] md:text-sm transition-all ${
            activeTab === 'Mechanical' 
              ? 'bg-teal-600 text-white shadow-md shadow-teal-200' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
          }`}
        >
          <Settings size={16} className={activeTab === 'Mechanical' ? 'text-white' : 'text-teal-600'} />
          Mechanical
        </button>
      </div>

      {(sortedInwardData.length === 0 && sortedUsageData.length === 0) && (
         <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm flex items-center gap-2">
            <Filter size={16} />
            No records found for {activeTab}. Showing empty tables.
         </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-8">
              <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-2 px-1">
                    <div className={`flex items-center gap-2 ${tabColors.text}`}>
                      <ArrowDownCircle size={20} />
                      <h3 className="text-lg font-bold">Received Stock</h3>
                    </div>
                    <button onClick={() => generatePDF('arrival', activeTab, sortedInwardData, sortedUsageData)} className={`flex items-center gap-2 px-3 py-1.5 bg-white border ${tabColors.border} ${tabColors.text} rounded-lg text-xs md:text-sm font-medium hover:${tabColors.bg} transition-colors shadow-sm whitespace-nowrap`}>
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                  
                  {sortedInwardData.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {Object.entries(materialTotals).map(([name, data]: [string, { qty: number; unit: string; amount: number; used: number; latestBalance: number }]) => (
                        <div key={name} className="bento-card bg-slate-50/60 border border-slate-200/60 p-3 md:p-4 rounded-2xl shadow-sm flex flex-col justify-start backdrop-blur-sm">
                            <div className="flex flex-col mb-2 gap-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-1.5 overflow-hidden">
                                  <div className={`p-1.5 ${tabColors.amountBg} rounded-lg ${tabColors.icon} shrink-0`}>
                                    <Package size={12} />
                                  </div>
                                  <span className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-wider break-words line-clamp-2 mt-0.5">{name}</span>
                                </div>
                                <div className={`text-[11px] md:text-xs font-black ${tabColors.amountText} ${tabColors.amountBg} px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg border ${tabColors.amountBorder} shrink-0 whitespace-nowrap`}>
                                  Rs. {(data.amount || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between text-xs md:text-sm text-slate-500">
                                <span className="font-medium">Received:</span>
                                <span className="font-bold text-slate-900">{(data.qty || 0).toLocaleString()} <span className="text-[10px] md:text-[11px] font-medium ml-0.5">{formatUnit(data.qty, data.unit)}</span></span>
                              </div>
                              <div className="flex items-center justify-between text-xs md:text-sm text-slate-500">
                                <span className="font-medium">Available:</span>
                                <span className={`font-black ${tabColors.remainingText}`}>{(data.latestBalance || 0).toLocaleString()} <span className="text-[10px] md:text-[11px] font-bold ml-0.5">{formatUnit(data.qty, data.unit)}</span></span>
                              </div>
                            </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Table title="Arrival Log" headers={renderInwardHeaders()} borderColor={tabColors.tableBorder}>
                    {sortedInwardData.length > 0 ? (
                      sortedInwardData.map((row, index) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const r = row as any;
                        return (
                        <TableRow key={`inward-${row.id || index}`} className={row.isNew ? `${tabColors.newRowBg} border-l-4 ${tabColors.newRowBorder}` : ""}>
                          {activeTab === 'Plumbing' ? (
                            <>
                              <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{formatDate(r.date)}</TableCell>
                              <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{r.brandName || '-'}</TableCell>
                              <TableCell className="font-semibold text-slate-800 text-xs md:text-sm">{r.itemName || r.material || '-'}</TableCell>
                              <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{r.size || '-'}</TableCell>
                              <TableCell className="text-slate-500 text-xs md:text-sm">{r.unit || '-'}</TableCell>
                              <TableCell className={`${tabColors.text} font-bold text-xs md:text-sm`}>+{r.quantity || 0}</TableCell>
                              <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{r.rate ? `Rs. ${(r.rate || 0).toLocaleString()}` : '-'}</TableCell>
                              <TableCell className="text-slate-800 font-bold text-xs md:text-sm">{r.amount ? `Rs. ${(r.amount || 0).toLocaleString()}` : '-'}</TableCell>
                            </>
                          ) : (activeTab === 'Electric' || activeTab === 'Mechanical') ? (
                            <>
                              <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{formatDate(r.date)}</TableCell>
                              <TableCell className="font-semibold text-slate-800 text-xs md:text-sm">{r.itemName || r.material || r.item || '-'}</TableCell>
                              <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{r.size || '-'}</TableCell>
                              <TableCell className={`${tabColors.text} font-bold text-xs md:text-sm`}>+{r.quantity || 0}</TableCell>
                              <TableCell className="text-slate-500 text-xs md:text-sm">{r.unit || '-'}</TableCell>
                              <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{r.rate ? `Rs. ${(r.rate || 0).toLocaleString()}` : '-'}</TableCell>
                              <TableCell className="text-slate-800 font-bold text-xs md:text-sm">{r.amount ? `Rs. ${(r.amount || 0).toLocaleString()}` : '-'}</TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="text-slate-500 whitespace-nowrap text-xs md:text-sm">
                                {formatDate(r.date)}
                                {row.isNew && <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${tabColors.newBg} ${tabColors.newText} uppercase tracking-wide border ${tabColors.newBorder}`}><Sparkles size={10} /> New</span>}
                              </TableCell>
                              <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{r.floor || '-'}</TableCell>
                              <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{r.brandName || '-'}</TableCell>
                              <TableCell className="font-semibold text-slate-800 text-xs md:text-sm">
                                {r.itemName || r.material || r.item || '-'}
                              </TableCell>
                              <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{r.size || '-'}</TableCell>
                              <TableCell className="text-slate-500 text-xs md:text-sm">{r.unit || '-'}</TableCell>
                              <TableCell className={`${tabColors.text} font-bold text-xs md:text-sm`}>+{r.quantity || 0}</TableCell>
                              <TableCell className="text-slate-800 font-bold text-xs md:text-sm">{r.amount ? `Rs. ${(r.amount || 0).toLocaleString()}` : '-'}</TableCell>
                            </>
                          )}
                        </TableRow>
                      )})
                    ) : (
                      <TableRow key="no-inward-records"><TableCell className="text-slate-500 text-center py-8" colSpan={8}>No Inward records found.</TableCell></TableRow>
                    )}
                  </Table>
              </div>
              <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4 px-1">
                    <div className="flex items-center gap-2 text-rose-700">
                      <ArrowUpCircle size={20} />
                      <h3 className="text-lg font-bold">Material Consumption</h3>
                    </div>
                    <button onClick={() => generatePDF('consumption', activeTab, sortedInwardData, sortedUsageData)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs md:text-sm font-medium hover:bg-rose-50 transition-colors shadow-sm whitespace-nowrap">
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                  <Table title="Usage Log" headers={renderUsageHeaders()} borderColor="bg-rose-500">
                    {sortedUsageData.length > 0 ? (
                      sortedUsageData.map((row, index) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const r = row as any;
                        const baseName = (r.itemName || r.material || '').trim().toUpperCase();
                        const size = (r.size || '').trim();
                        const matName = size ? `${baseName} (${size})` : baseName;
                        const totalQty = r.quantity || materialTotals[matName]?.qty || 0;

                        return (
                        <TableRow key={`usage-${row.id || index}`} className={row.isNew ? `${tabColors.newRowBg} border-l-4 ${tabColors.newRowBorder}` : ""}>
                          <TableCell className="text-slate-600 font-medium">{formatDate(r.date)}
                            {row.isNew && <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${tabColors.newBg} ${tabColors.newText} uppercase tracking-wide border ${tabColors.newBorder}`}><Sparkles size={10} /> New</span>}
                          </TableCell>
                          
                          {activeTab === 'Plumbing' ? (
                            <>
                              {/* Date removed from here as it's now in the first cell */}
                              <TableCell className="font-semibold text-slate-800">{r.itemName || r.material || r.item || '-'}</TableCell>
                              <TableCell className="text-slate-600 font-medium">{r.size || '-'}</TableCell>
                              <TableCell className="text-slate-600 font-medium">{totalQty} <span className="text-xs text-slate-500 font-normal">{formatUnit(totalQty, r.unit)}</span></TableCell>
                              <TableCell className="text-rose-700 font-medium">-{r.used} <span className="text-xs text-slate-500 font-normal">{formatUnit(r.used, r.unit)}</span></TableCell>
                              <TableCell className="font-bold text-slate-800">{r.balance} <span className="text-xs text-slate-600 font-normal ml-1">{formatUnit(r.balance, r.unit)}</span></TableCell>
                              <TableCell className="text-slate-500 text-sm">{r.floor || '-'}</TableCell>
                            </>
                          ) : (activeTab === 'Electric' || activeTab === 'Mechanical') ? (
                            <>
                              <TableCell className="font-semibold text-slate-800">{r.itemName || r.material || r.item || '-'}</TableCell>
                              <TableCell className="text-slate-600 font-medium">{r.size || '-'}</TableCell>
                              <TableCell className="text-slate-600 font-medium">{totalQty} <span className="text-xs text-slate-500 font-normal">{formatUnit(totalQty, r.unit)}</span></TableCell>
                              <TableCell className="text-slate-500 text-sm">{r.floor || '-'}</TableCell>
                              <TableCell className="text-rose-700 font-medium">-{r.used} <span className="text-xs text-slate-500 font-normal">{formatUnit(r.used, r.unit)}</span></TableCell>
                              <TableCell className="font-bold text-slate-800">{r.balance} <span className="text-xs text-slate-600 font-normal ml-1">{formatUnit(r.balance, r.unit)}</span></TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="font-semibold text-slate-800">{r.itemName || r.material || r.item || '-'}</TableCell>
                              <TableCell className="text-slate-600 font-medium">{r.size || '-'}</TableCell>
                              <TableCell className="text-slate-500 text-sm italic">{r.description || '-'}</TableCell>
                              <TableCell className="text-rose-700 font-medium">-{r.used} <span className="text-xs text-slate-500 font-normal">{formatUnit(r.used, r.unit)}</span></TableCell>
                              <TableCell className="font-bold text-slate-800">{r.balance} <span className="text-xs text-slate-600 font-normal ml-1">{formatUnit(r.balance, r.unit)}</span></TableCell>
                            </>
                          )}
                        </TableRow>
                      )})
                    ) : (
                      <TableRow key="no-usage-records"><TableCell className="text-slate-500 text-center py-8" colSpan={6}>No Usage records found.</TableCell></TableRow>
                    )}
                  </Table>
              </div>
          </div>
        </div>
    </div>
  );
};
