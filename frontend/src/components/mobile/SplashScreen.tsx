import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
        >
          {/* Pulsing circle */}
          <div className="relative mb-8">
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="relative w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center"
              animate={{ scale: [0.95, 1, 0.95] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Signal icon as SVG */}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M1 6C1 6 5 2 12 2C19 2 23 6 23 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
                <path d="M4 10C4 10 7 7 12 7C17 7 20 10 20 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                <path d="M7.5 14C7.5 14 9 12 12 12C15 12 16.5 14 16.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="18" r="2" fill="currentColor"/>
              </svg>
            </motion.div>
          </div>

          {/* App name */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-center"
          >
            <h1 className="text-2xl font-black text-foreground tracking-tight" dir="rtl">
              متتبع الضفة الغربية
            </h1>
            <p className="text-sm text-muted-foreground mt-1" dir="rtl">
              تحديثات فورية · الحواجز والتنبيهات
            </p>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            className="mt-10 w-32 h-0.5 bg-border rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
