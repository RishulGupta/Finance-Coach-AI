import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className = ''
}: MetricCardProps) {
  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground';
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? '↗' : '↘';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4 }}
      className={className}
    >
      <Card className="metric-card shadow-md hover:shadow-lg transition-all duration-300 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {title}
          </CardTitle>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {value}
            </div>
            {trend && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-lg font-medium ${getTrendColor()}`}
              >
                {getTrendIcon()}
              </motion.span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}