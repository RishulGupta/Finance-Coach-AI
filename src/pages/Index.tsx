import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ChatInterface } from '@/components/advisor/ChatInterface';
import { DataUpload } from '@/components/upload/DataUpload';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gradient-primary">Advanced Analytics</h2>
            <div className="financial-card p-8 text-center">
              <p className="text-muted-foreground">Advanced analytics features coming soon...</p>
            </div>
          </div>
        );
      case 'advisor':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gradient-primary">AI Financial Advisor</h2>
            <ChatInterface />
          </div>
        );
      case 'recommendations':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gradient-primary">Investment Recommendations</h2>
            <div className="financial-card p-8 text-center">
              <p className="text-muted-foreground">Investment recommendations coming soon...</p>
            </div>
          </div>
        );
      case 'upload':
        return <DataUpload />;
      case 'export':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gradient-primary">Export Data</h2>
            <div className="financial-card p-8 text-center">
              <p className="text-muted-foreground">Export functionality coming soon...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gradient-primary">Settings</h2>
            <div className="financial-card p-8 text-center">
              <p className="text-muted-foreground">Settings panel coming soon...</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="flex-1 overflow-hidden">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full overflow-y-auto p-6"
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
