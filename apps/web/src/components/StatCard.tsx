import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * Tarjeta de estadística para KPIs
 * Muestra un valor destacado con ícono y título
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  trend,
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm mb-2">{title}</p>
          <p className="text-white text-3xl font-bold">{value}</p>
        </div>
        <div
          className={`p-3 rounded-lg ${iconColor}`}
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
};
