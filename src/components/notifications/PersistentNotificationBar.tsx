
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface PersistentNotificationBarProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const PersistentNotificationBar: React.FC<PersistentNotificationBarProps> = ({
  message,
  type = 'info',
  onDismiss,
  autoHide = false,
  autoHideDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDelay) as unknown as NodeJS.Timeout;

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
      case 'error':
        return <AlertTriangle size={16} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-0 left-0 right-0 z-50 p-3 border-b ${getTypeStyles()}`}
        >
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-2">
              {getIcon()}
              <span className="text-sm font-medium">{message}</span>
            </div>
            
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-transparent"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PersistentNotificationBar;
