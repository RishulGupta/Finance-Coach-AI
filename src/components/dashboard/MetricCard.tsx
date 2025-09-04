import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  className,
  variant = 'default'
}: MetricCardProps) {
  const variantStyles = {
    default: 'metric-card',
    primary: 'metric-card gradient-primary text-primary-foreground',
    secondary: 'metric-card gradient-secondary text-secondary-foreground',
    accent: 'metric-card gradient-accent text-accent-foreground'
  };

  const changeColorMap = {
    positive: 'text-secondary',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(variantStyles[variant], className)}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="h-8 w-8 opacity-70" />
        {change && (
          <span className={cn("text-sm font-medium", changeColorMap[changeType])}>
            {change}
          </span>
        )}
      </div>
      
      <div>
        <p className="text-3xl font-bold mb-1">{value}</p>
        <p className="text-sm opacity-70">{title}</p>
      </div>
    </motion.div>
  );
}