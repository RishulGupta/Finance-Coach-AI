import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  PieChart, 
  MessageSquare, 
  Upload, 
  Download, 
  Settings,
  TrendingUp,
  DollarSign,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: PieChart },
  { id: 'advisor', label: 'AI Advisor', icon: MessageSquare },
  { id: 'recommendations', label: 'Recommendations', icon: TrendingUp },
  { id: 'upload', label: 'Upload Data', icon: Upload },
  { id: 'export', label: 'Export', icon: Download },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className={cn(
        "bg-card border-r border-border h-screen flex flex-col transition-all duration-300 shadow-xl",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Finance Coach
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto hover:bg-accent/50 transition-colors"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20" 
                    : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-semibold text-sm">{item.label}</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Finance Coach</p>
            <p className="mt-0.5">v1.0.0 · Premium</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}