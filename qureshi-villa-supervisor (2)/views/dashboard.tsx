
import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Wallet,
  TrendingUp,
  PieChart as PieChartIcon,
  Activity,
  BarChart3,
  Clock,
  CheckCircle,
  Circle,
  History,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { useData } from '../DataContext';
import { SyncButton } from '../components/sync-button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const useWindowWidth = () => {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, grandTotal }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl shadow-2xl ring-1 ring-black/5">
        <p className="font-black text-slate-900 mb-1 text-base">{payload[0].name}</p>
        <div className="h-px bg-slate-100 my-2 w-full"></div>
        <p className="text-lg font-black text-teal-700">
          Rs. {(payload[0].value || 0).toLocaleString()}
        </p>
        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
          {(((payload[0].value || 0) / grandTotal) * 100).toFixed(1)}% of total budget
        </p>
      </div>
    );
  }
  return null;
};

export const DashboardView: React.FC = () => {
  const windowWidth = useWindowWidth();
  const { 
    greyInward, greyUsage, 
    finishingInward, finishingUsage, 
    electricInward, electricUsage, 
    plumbingInward, plumbingUsage, 
    mechanicalInward, mechanicalUsage, 
    salaryData, salaryPayments, expenses,
    isLoading, refreshData
  } = useData();
  
  // 1. MODULE-WISE SUMMARIES
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getModuleSummary = (inward: any[], usage: any[]) => {
    const stats: Record<string, { in: number, out: number, amount: number, unit: string }> = {};
    
    inward.forEach(r => {
      if (!stats[r.material]) stats[r.material] = { in: 0, out: 0, amount: 0, unit: r.unit };
      stats[r.material].in += r.quantity || 0;
      stats[r.material].amount += r.amount || 0;
    });

    usage.forEach(r => {
      if (!stats[r.material]) stats[r.material] = { in: 0, out: 0, amount: 0, unit: r.unit };
      stats[r.material].out += r.used || 0;
    });

    return Object.entries(stats).map(([material, data]) => ({
      material,
      inward: data.in,
      used: data.out,
      remaining: data.in - data.out,
      amount: data.amount,
      unit: data.unit,
      usagePercent: data.in > 0 ? (data.out / data.in) * 100 : 0
    }));
  };

  const greySummary = useMemo(() => getModuleSummary(greyInward, greyUsage), [greyInward, greyUsage]);
  const finishingSummary = useMemo(() => getModuleSummary(finishingInward, finishingUsage), [finishingInward, finishingUsage]);
  
  const mepSummary = useMemo(() => {
    const combinedInward = [...electricInward, ...plumbingInward, ...mechanicalInward];
    const combinedUsage = [...electricUsage, ...plumbingUsage, ...mechanicalUsage];
    return getModuleSummary(combinedInward, combinedUsage);
  }, [electricInward, plumbingInward, mechanicalInward, electricUsage, plumbingUsage, mechanicalUsage]);

  // 2. GRAND TOTAL CALCULATION
  const totalGreyAmount = useMemo(() => greySummary.reduce((sum, item) => sum + item.amount, 0), [greySummary]);
  const totalFinishingAmount = useMemo(() => finishingSummary.reduce((sum, item) => sum + item.amount, 0), [finishingSummary]);
  const totalMepAmount = useMemo(() => mepSummary.reduce((sum, item) => sum + item.amount, 0), [mepSummary]);

  const totalSalaryAmount = useMemo(() => {
    const normalizeMonth = (m: string) => {
      if (!m) return '';
      const trimmed = m.trim();
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
      }
      return trimmed;
    };

    // 1. All advances are expenditure
    const totalAdvances = salaryPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // 2. For months marked as 'Paid', add the remaining balance
    const totalRemainingPaid = salaryData
      .filter(s => s.status === 'Paid')
      .reduce((sum, s) => {
        const normalizedSMonth = normalizeMonth(s.month);
        
        // Find advances for this specific month to calculate remaining
        const monthAdvances = salaryPayments
          .filter(p => {
            let pm = p.month;
            if (!pm && p.date) {
              const d = new Date(p.date);
              if (!isNaN(d.getTime())) {
                pm = d.toLocaleString('default', { month: 'long', year: 'numeric' });
              }
            }
            return normalizeMonth(pm || '') === normalizedSMonth;
          })
          .reduce((s2, p) => s2 + (p.amount || 0), 0);
        
        const remaining = (s.basicSalary || 35000) - monthAdvances;
        return sum + Math.max(0, remaining);
      }, 0);
      
    return totalAdvances + totalRemainingPaid;
  }, [salaryData, salaryPayments]);

  const totalOtherExpenses = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [expenses]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    if (dateStr.toLowerCase() === '8-mar') return '8-Mar-26';
    return dateStr;
  };

  const recentActivity = useMemo(() => {
    const allActivities = [
      ...greyInward.map(item => ({ type: 'inward', module: 'Grey Structure', date: item.date, desc: `Received ${item.quantity} ${item.unit} of ${item.material}` })),
      ...greyUsage.map(item => ({ type: 'usage', module: 'Grey Structure', date: item.date, desc: `Used ${item.used} ${item.unit} of ${item.material}` })),
      ...finishingInward.map(item => ({ type: 'inward', module: 'Finishing', date: item.date, desc: `Received ${item.quantity} ${item.unit} of ${item.material}` })),
      ...finishingUsage.map(item => ({ type: 'usage', module: 'Finishing', date: item.date, desc: `Used ${item.used} ${item.unit} of ${item.material}` })),
      ...electricInward.map(item => ({ type: 'inward', module: 'MEP (Electric)', date: item.date, desc: `Received ${item.quantity} ${item.unit} of ${item.material}` })),
      ...electricUsage.map(item => ({ type: 'usage', module: 'MEP (Electric)', date: item.date, desc: `Used ${item.used} ${item.unit} of ${item.material}` })),
      ...plumbingInward.map(item => ({ type: 'inward', module: 'MEP (Plumbing)', date: item.date, desc: `Received ${item.quantity} ${item.unit} of ${item.material || item.itemName}` })),
      ...plumbingUsage.map(item => ({ type: 'usage', module: 'MEP (Plumbing)', date: item.date, desc: `Used ${item.used} ${item.unit} of ${item.material || item.itemName}` })),
      ...mechanicalInward.map(item => ({ type: 'inward', module: 'MEP (Mechanical)', date: item.date, desc: `Received ${item.quantity} ${item.unit} of ${item.material || item.itemName}` })),
      ...mechanicalUsage.map(item => ({ type: 'usage', module: 'MEP (Mechanical)', date: item.date, desc: `Used ${item.used} ${item.unit} of ${item.material || item.itemName}` })),
      ...salaryPayments.map(item => ({ type: 'salary', module: 'Salary', date: item.date, desc: `Advance given: ${item.description || 'No description'}` })),
      ...expenses.map(item => ({ type: 'expense', module: 'Others', date: item.date, desc: `Expense: ${item.description || item.item}` }))
    ];
    
    return allActivities
      .filter(a => a.date)
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
      })
      .slice(0, 8); // Show a bit more activity
  }, [greyInward, greyUsage, finishingInward, finishingUsage, electricInward, electricUsage, plumbingInward, plumbingUsage, mechanicalInward, mechanicalUsage, salaryPayments, expenses]);

  const projectStartDate = "15 December 2025";

  const grandTotal = totalGreyAmount + totalFinishingAmount + totalMepAmount + totalSalaryAmount + totalOtherExpenses;

  // Dynamic progress based on expenditure vs estimated phase budgets
  const greyProgress = totalGreyAmount > 0 ? Math.min(Math.round((totalGreyAmount / 2500000) * 100), 88) : 0; // Cap at 88% to show not completed
  const mepProgress = totalMepAmount > 0 ? Math.min(Math.round((totalMepAmount / 800000) * 100), 62) : 0; // Cap at 62% to show less than 65%
  const finishingProgress = totalFinishingAmount > 0 ? Math.min(Math.round((totalFinishingAmount / 1500000) * 100), 95) : 0;

  const renderMilestoneStatus = (progress: number) => {
    if (progress >= 100) return <p className="text-xs text-slate-500 mt-0.5">Completed - 100%</p>;
    if (progress > 0) return <p className="text-xs text-teal-600 font-medium mt-0.5">In Progress - {progress}%</p>;
    return <p className="text-xs text-slate-400 mt-0.5">Upcoming</p>;
  };

  const renderMilestoneIcon = (progress: number) => {
    if (progress >= 100) return <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center shrink-0 border-4 border-white shadow-sm"><CheckCircle size={14} className="text-white" /></div>;
    if (progress > 0) return <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center shrink-0 border-4 border-white shadow-sm animate-pulse"><Activity size={14} className="text-white" /></div>;
    return <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border-4 border-white"><Circle size={10} className="text-slate-400 fill-current" /></div>;
  };

  // 3. GRAPH DATA
  const graphData = [
    { name: 'Grey', amount: totalGreyAmount, color: '#64748b' }, // slate-500
    { name: 'MEP', amount: totalMepAmount, color: '#0d9488' }, // teal-600
    { name: 'Finishing', amount: totalFinishingAmount, color: '#ef4444' }, // red-500
    { name: 'Salary', amount: totalSalaryAmount, color: '#c084fc' }, // purple-400
    { name: 'Others', amount: totalOtherExpenses, color: '#22c55e' }, // green-500
  ].filter(item => item.amount >= 0); // Show all even if 0 to ensure it's "there"

  return (
    <div className="space-y-8 animate-fade-in pb-16 relative">
      {/* Subtle global background pattern for dashboard */}
      <div className="absolute inset-0 -z-20 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0f172a 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-slate-100/80 via-slate-50/50 to-transparent -z-10 pointer-events-none"></div>
      
      {/* 1. HEADER & GRAND TOTAL - MODERN GLASSMORPHISM */}
      <div className="relative rounded-[2rem] p-6 md:p-8 shadow-xl overflow-hidden bg-slate-900 border border-slate-800">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[30%] -right-[10%] w-[80%] h-[80%] rounded-full bg-teal-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute -bottom-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
          <div className="absolute top-[20%] left-[40%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-1 shadow-inner whitespace-nowrap">
              <TrendingUp size={12} className="text-teal-400" />
              <span className="text-[10px] md:text-xs font-bold text-teal-50 tracking-widest uppercase">Project Started: {projectStartDate}</span>
              <div className="w-px h-3 bg-white/20 mx-0.5"></div>
              <SyncButton 
                onClick={refreshData} 
                isLoading={isLoading} 
                size={12} 
                className="!p-0.5 !bg-transparent !border-none !text-teal-400 hover:!text-teal-300 !shadow-none" 
              />
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              Project Dashboard
            </h1>
            <p className="text-slate-400 font-medium max-w-md text-xs md:text-sm leading-relaxed">
              Real-time financial tracking and material consumption analytics.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-2xl flex flex-col items-center md:items-end shadow-2xl transform hover:scale-105 transition-transform duration-500 group">
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center md:justify-end gap-2 group-hover:text-teal-300 transition-colors">
                <Wallet size={14} /> Total Expenditure
              </span>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 1.5, 
                  ease: [0.16, 1, 0.3, 1],
                  scale: { type: "spring", damping: 15, stiffness: 80 }
                }}
                className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-lg brand-text py-1"
              >
                <span className="text-lg md:text-xl mr-1.5 font-bold">Rs.</span>{(grandTotal || 0).toLocaleString()}
              </motion.div>
          </div>
        </div>
      </div>

      {/* 2. EXPENSE GRAPH - MODERN LIGHT DONUT CHART */}
      <div className="relative bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 md:p-8 overflow-hidden">
        {/* Subtle background pattern for the graph card */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2.5 md:p-3.5 bg-teal-50 rounded-xl md:rounded-2xl text-teal-600 shadow-sm border border-teal-100 relative overflow-hidden group">
              <BarChart3 size={20} md:size={28} strokeWidth={2} className="relative z-10" />
            </div>
            <div>
              <h2 className="text-lg md:text-3xl font-black text-slate-800 tracking-tight">Expense Distribution</h2>
              <p className="text-[10px] md:text-sm text-slate-500 font-medium mt-0.5 md:mt-1 flex items-center gap-1.5">
                <Activity size={12} className="text-indigo-500" />
                Interactive breakdown of costs across all categories
              </p>
            </div>
          </div>
            <div className="bg-teal-50 px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-teal-100 shadow-sm flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto">
              <span className="text-[9px] md:text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-0 md:mb-0.5">Total Investment</span>
              <span className="text-base md:text-xl font-black text-teal-900">Rs. {(grandTotal / 1000000).toFixed(2)}M</span>
            </div>
        </div>
        
        <div className="relative z-10 mt-6 p-1 md:p-6 rounded-2xl md:rounded-3xl border-t-4 border-t-teal-500 border-b-4 border-b-rose-500 border-x border-x-slate-200 bg-white shadow-inner">
          <div className="h-[300px] md:h-[450px] w-full">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={graphData} 
                  margin={{ top: 20, right: 5, left: windowWidth < 768 ? -10 : 20, bottom: 10 }}
                  barSize={windowWidth < 768 ? 28 : 48}
                >
                  <defs>
                    {/* Solid colors, no gradients as requested */}
                  </defs>
                  
                  <CartesianGrid 
                    strokeDasharray="0" 
                    vertical={false} 
                    stroke="#f1f5f9" 
                    opacity={1}
                  />
                  
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ 
                      fill: '#1e293b', 
                      fontSize: windowWidth < 768 ? 7 : 11, 
                      fontWeight: 800,
                    }}
                    interval={0}
                    height={30}
                  />
                  
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: windowWidth < 768 ? 7 : 10, fontWeight: 700, dx: windowWidth < 768 ? -2 : 0 }}
                    tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}k`}
                    width={windowWidth < 768 ? 45 : 60}
                  />
                  
                  <Tooltip 
                    content={<CustomTooltip grandTotal={grandTotal} />} 
                    cursor={{ fill: '#f8fafc', opacity: 1 }}
                  />
                  
                  <Bar 
                    dataKey="amount" 
                    animationDuration={1500}
                    radius={0}
                  >
                    {graphData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <PieChartIcon size={48} className="mb-4 opacity-20" />
                <p className="font-medium">No expense data available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MODERN CONSTRUCTION DASHBOARD FEATURES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* A. Visual Project Timeline */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Project Timeline</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Current phase and milestones</p>
            </div>
            <div className="p-2 md:p-3 bg-teal-50 rounded-xl md:rounded-2xl text-teal-600 border border-teal-200">
              <Clock size={16} md:size={20} />
            </div>
          </div>
          
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-1 bg-slate-100 rounded-full"></div>
            
            <div className="space-y-6 relative z-10">
              {/* Milestone 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Excavation & Foundation</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Completed - 100%</p>
                </div>
              </div>
              
              {/* Milestone 2 */}
              <div className="flex gap-4">
                {renderMilestoneIcon(greyProgress)}
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Grey Structure</h4>
                  {renderMilestoneStatus(greyProgress)}
                </div>
              </div>
              
              {/* Milestone 3 */}
              <div className="flex gap-4">
                {renderMilestoneIcon(mepProgress)}
                <div>
                  <h4 className="text-sm font-bold text-slate-800">MEP Works</h4>
                  {renderMilestoneStatus(mepProgress)}
                </div>
              </div>
              
              {/* Milestone 4 */}
              <div className="flex gap-4">
                {renderMilestoneIcon(finishingProgress)}
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Finishing & Interior</h4>
                  {renderMilestoneStatus(finishingProgress)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* B. Recent Activity Feed */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Activity</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Latest site updates</p>
            </div>
            <div className="p-2 md:p-3 bg-teal-50 rounded-xl md:rounded-2xl text-teal-600 border border-teal-200">
              <History size={16} md:size={20} />
            </div>
          </div>
          
          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className={`p-2 rounded-lg shrink-0 ${
                  activity.type === 'inward' ? 'bg-teal-50 text-teal-600' :
                  activity.type === 'usage' ? 'bg-red-50 text-red-500' :
                  'bg-slate-800 text-white'
                }`}>
                  {activity.type === 'inward' ? <ArrowDownRight size={16} /> : 
                   activity.type === 'usage' ? <ArrowUpRight size={16} /> : 
                   <Wallet size={16} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{activity.desc}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{activity.module}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-xs text-slate-500">{formatDate(activity.date)}</span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic text-center py-4">No recent activity found.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

