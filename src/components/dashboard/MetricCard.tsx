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
    return trend === 'up' ? 'text-emerald-400' : 'text-rose-400';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? '↗' : '↘';
  };

  const getTrendGradient = () => {
    if (!trend) return '';
    return trend === 'up' 
      ? 'from-emerald-500/10 to-emerald-600/5' 
      : 'from-rose-500/10 to-rose-600/5';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.4, 0, 0.2, 1],
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl" />
        
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3 pt-6">
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
          <motion.div 
            className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 shadow-lg group-hover:shadow-xl transition-all duration-300"
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/15 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Icon className="relative h-6 w-6 text-primary group-hover:text-primary-glow transition-colors duration-300" />
          </motion.div>
        </CardHeader>
        
        <CardContent className="relative pt-0">
          <div className="flex items-baseline space-x-3">
            <motion.div 
              className="text-3xl font-black bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {value}
            </motion.div>
            {trend && (
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.3, 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 10 
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold ${getTrendColor()} bg-gradient-to-r ${getTrendGradient()} border border-current/20`}
              >
                <span className="text-lg">{getTrendIcon()}</span>
              </motion.div>
            )}
          </div>
          {description && (
            <motion.p 
              className="text-sm text-muted-foreground mt-3 font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              {description}
            </motion.p>
          )}
          
          {/* Bottom shine effect */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </CardContent>
        
        {/* Corner accent */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-br from-primary to-accent rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-300" />
      </Card>
    </motion.div>
  );
}