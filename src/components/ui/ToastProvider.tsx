'use client';

import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';

export function ToastProvider() {
  useEffect(() => {
    // Override the native browser alert to use Sonner toast messages instead
    // This instantly upgrades all legacy alerts in the app without refactoring every file!
    window.alert = (message?: any) => {
      const msgStr = String(message || '');
      const lowerMsg = msgStr.toLowerCase();
      
      // Heuristics to determine if it's an error, success, or generic info
      if (lowerMsg.includes('success')) {
        toast.success(msgStr);
      } else if (
        lowerMsg.includes('fail') || 
        lowerMsg.includes('error') || 
        lowerMsg.includes('could not') ||
        lowerMsg.includes('invalid') ||
        lowerMsg.includes('required')
      ) {
        toast.error(msgStr);
      } else {
        toast(msgStr);
      }
    };
  }, []);

  return <Toaster position="top-right" richColors theme="dark" closeButton />;
}
