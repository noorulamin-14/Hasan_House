
import React, { useMemo } from 'react';
import { Table, TableRow, TableCell } from '../components/table';
import { BrickWall, ArrowDownCircle, ArrowUpCircle, Sparkles, Package, Download, Filter } from 'lucide-react';
import { useData } from '../DataContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const GreyStructureView: React.FC = () => {
  const { greyInward, greyUsage } = useData();

  const formatDate = (dateStr: string) => {
    return dateStr;
  };

  const formatUnit = (quantity: number, unit: string) => {
    if (!unit) return '';
    const lowerUnit = unit.toLowerCase().trim();
    if (lowerUnit === 'dumper' && quantity > 1) return 'Dumpers';
    if (lowerUnit === 'truck' && quantity > 1) return 'Trucks';
    if (lowerUnit === 'bag' && quantity > 1) return 'Bags';
    if (lowerUnit === 'ton' && quantity > 1) return 'Tons';
    if (lowerUnit === 'pc' && quantity > 1) return 'Pcs';
    return unit;
  };

  const filteredInward = useMemo(() => {
    return greyInward;
  }, [greyInward]);

  const filteredUsage = useMemo(() => {
    return greyUsage;
  }, [greyUsage]);

  const sortedInwardData = useMemo(() => {
    return [...filteredInward]
      .map((item, index) => ({ ...item, originalIndex: index }))
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        }
        return b.originalIndex - a.originalIndex;
      });
  }, [filteredInward]);

  const sortedUsageData = useMemo(() => {
    return [...filteredUsage]
      .map((item, index) => ({ ...item, originalIndex: index }))
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        }
        return b.originalIndex - a.originalIndex;
      });
  }, [filteredUsage]);

  const materialTotals = useMemo(() => {
    const totals = filteredInward.reduce((acc, curr) => {
      const matName = (curr.material || '').trim().toUpperCase();
      if (!acc[matName]) {
        acc[matName] = { qty: 0, unit: curr.unit, amount: 0, used: 0, latestBalance: 0 };
      }
      acc[matName].qty += curr.quantity;
      acc[matName].amount += (curr.amount || 0);
      return acc;
    }, {} as Record<string, { qty: number; unit: string; amount: number; used: number; latestBalance: number }>);

    filteredUsage.forEach(curr => {
      const matName = (curr.material || '').trim().toUpperCase();
      if (totals[matName]) {
        totals[matName].used += curr.used;
      } else {
        totals[matName] = { qty: 0, unit: curr.unit, amount: 0, used: curr.used, latestBalance: 0 };
      }
    });

    // Find latest balance
    const sortedUsage = [...filteredUsage]
      .map((item, index) => ({ ...item, originalIndex: index }))
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        }
        return b.originalIndex - a.originalIndex;
      });
    Object.keys(totals).forEach(matName => {
      const latestEntry = sortedUsage.find(u => (u.material || '').trim().toUpperCase() === matName);
      if (latestEntry && latestEntry.balance !== undefined) {
        totals[matName].latestBalance = latestEntry.balance;
      } else {
        totals[matName].latestBalance = totals[matName].qty - totals[matName].used;
      }
    });

    return totals;
  }, [filteredInward, filteredUsage]);


  const generatePDF = (type: 'arrival' | 'consumption') => {
    const doc = new jsPDF();
    const isArrival = type === 'arrival';
    const title = isArrival ? "Grey Structure - Arrival Log" : "Grey Structure - Consumption Log";
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

    const tableColumn = isArrival
      ? ["Date", "Floor", "Material", "Quantity", "Amount (Rs)"]
      : ["Date", "Floor", "Material", "Used Quantity", "Description"];

    const data = isArrival ? sortedInwardData : sortedUsageData;

    const tableRows = data.map(row => {
        if (isArrival) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const r = row as any;
             return [formatDate(r.date), r.floor || 'Ground Floor', r.material, `${r.quantity} ${formatUnit(r.quantity, r.unit)}`, r.amount ? (r.amount || 0).toLocaleString() : '-'];
        } else {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const r = row as any;
             return [formatDate(r.date), r.floor || 'Ground Floor', r.material, `${r.used} ${formatUnit(r.used, r.unit)}`, r.description];
        }
    });

    autoTable(doc, {
      startY: yPos + 5,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: color, textColor: 255, fontStyle: 'bold' },
      // Highlight top 3 rows logic
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index < 3) {
            data.cell.styles.fillColor = isArrival ? [230, 255, 250] : [255, 235, 235]; // Light Teal or Light Rose
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [30, 41, 59];
        }
      }
    });

    doc.save(`grey_structure_${type}_report.pdf`);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 md:bg-transparent md:p-0 md:border-0 md:shadow-none">
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-teal-600 shadow-sm shrink-0">
            <BrickWall size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Grey Structure</h2>
            <p className="text-sm text-slate-500 font-medium">Manage raw materials & usage</p>
          </div>
        </div>
      </div>

      {(sortedInwardData.length === 0 && sortedUsageData.length === 0) && (
         <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm flex items-center gap-2">
            <Filter size={16} />
            No records found for the selected filters. Showing empty tables.
         </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-8">
          
          <div className="space-y-3">
             <div className="flex flex-wrap items-center justify-between gap-4 mb-2 px-1">
                <div className="flex items-center gap-2 text-teal-700">
                    <ArrowDownCircle size={20} />
                    <h3 className="text-base md:text-lg font-bold">Received Stock</h3>
                </div>
                <button onClick={() => generatePDF('arrival')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-teal-200 text-teal-700 rounded-lg text-xs md:text-sm font-medium hover:bg-teal-50 transition-colors shadow-sm whitespace-nowrap">
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
                              <div className="p-1.5 bg-teal-500/10 rounded-lg text-teal-600 shrink-0">
                                <Package size={12} />
                              </div>
                              <span className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-wider break-words line-clamp-2 mt-0.5">{name}</span>
                            </div>
                            <div className="text-[11px] md:text-xs font-black text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg border border-emerald-500/20 shrink-0 whitespace-nowrap">
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
                            <span className="font-black text-teal-600">{(data.latestBalance || 0).toLocaleString()} <span className="text-[10px] md:text-[11px] font-bold ml-0.5">{formatUnit(data.qty, data.unit)}</span></span>
                          </div>
                        </div>
                    </div>
                    ))}
                </div>
             )}

              <Table title="Arrival Log" headers={['Date', 'Floor', 'Material', 'Quantity', 'Amount (Rs)']} borderColor="bg-teal-500">
              {sortedInwardData.length > 0 ? (
                sortedInwardData.map((row, index) => (
                  <TableRow key={`grey-inward-${row.id || index}`} className={row.isNew ? "bg-teal-50 border-l-4 border-l-teal-500" : ""}>
                    <TableCell className="text-slate-500 whitespace-nowrap text-xs md:text-sm">
                      {formatDate(row.date)}
                      {row.isNew && <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wide border border-teal-200"><Sparkles size={10} /> New</span>}
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{row.floor || 'Ground Floor'}</TableCell>
                    <TableCell className="font-semibold text-slate-800 text-xs md:text-sm">{row.material}</TableCell>
                    <TableCell className="text-teal-700 font-bold text-xs md:text-sm">+{row.quantity} <span className="text-[10px] md:text-xs text-slate-500 font-normal ml-1">{formatUnit(row.quantity, row.unit)}</span></TableCell>
                    <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{row.amount ? `Rs. ${(row.amount || 0).toLocaleString()}` : '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow key="no-inward-records"><TableCell className="text-slate-500 text-center py-8" colSpan={5}>No Inward records found.</TableCell></TableRow>
              )}
            </Table>
          </div>

          <div className="space-y-3">
             <div className="flex flex-wrap items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-2 text-rose-700">
                    <ArrowUpCircle size={20} />
                    <h3 className="text-base md:text-lg font-bold">Material Consumption</h3>
                </div>
                <button onClick={() => generatePDF('consumption')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs md:text-sm font-medium hover:bg-rose-50 transition-colors shadow-sm whitespace-nowrap">
                  <Download size={14} /> Download PDF
                </button>
             </div>
            <Table title="Usage Log" headers={['Date', 'Floor', 'Material', 'Used Quantity', 'Description']} borderColor="bg-rose-500">
              {sortedUsageData.length > 0 ? (
                sortedUsageData.map((row, index) => (
                  <TableRow key={`grey-usage-${row.id || index}`} className={row.isNew ? "bg-teal-50 border-l-4 border-l-teal-500" : ""}>
                    <TableCell className="text-slate-500 whitespace-nowrap text-xs md:text-sm">
                      {formatDate(row.date)}
                      {row.isNew && <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wide border border-teal-200"><Sparkles size={10} /> New</span>}
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium text-xs md:text-sm">{row.floor || 'Ground Floor'}</TableCell>
                    <TableCell className="font-semibold text-slate-800 text-xs md:text-sm">{row.material}</TableCell>
                    <TableCell className="text-rose-700 font-medium text-xs md:text-sm">-{row.used} <span className="text-[10px] md:text-xs text-slate-500 font-normal">{formatUnit(row.used, row.unit)}</span></TableCell>
                     <TableCell className="text-slate-500 text-xs md:text-sm italic">{row.description}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow key="no-usage-records"><TableCell className="text-slate-500 text-center py-8" colSpan={5}>No Usage records found.</TableCell></TableRow>
              )}
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};
