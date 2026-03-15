
import React from 'react';

interface TableProps {
  title: string;
  headers: string[];
  children: React.ReactNode;
  borderColor?: string; // e.g., 'bg-teal-500'
  centerTitle?: boolean;
}

export const Table: React.FC<TableProps> = ({ title, headers, children, borderColor = 'bg-slate-200', centerTitle = false }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6 transition-all hover:shadow-xl relative">
      {/* Colored Top Strip */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${borderColor}`}></div>
      
      <div className={`px-4 py-4 md:px-6 md:py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white pt-6 ${centerTitle ? 'text-center md:text-left' : ''}`}>
        <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{title}</h3>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[500px] md:min-w-full">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 text-[11px] md:text-xs uppercase tracking-widest font-bold border-b-2 border-slate-200">
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-4 md:px-6 md:py-4 whitespace-nowrap first:pl-6 last:pr-6">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <tr className={`hover:bg-slate-50/80 transition-colors duration-200 ${className || ''}`}>{children}</tr>;
};

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <td className={`px-4 py-4 md:px-6 md:py-4 whitespace-nowrap first:pl-6 last:pr-6 text-sm ${className || ''}`}>{children}</td>;
};
