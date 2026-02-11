import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

const FloatingHearts = forwardRef(({ className = '' }, ref) => {
  const [hearts, setHearts] = useState([]);

  const addHeart = useCallback(() => {
    const id = Date.now() + Math.random();
    // Randomize starting position slightly and color
    const randomX = Math.random() * 40 - 20; // -20px to +20px
    const colors = ['#ef4444', '#ec4899', '#8b5cf6', '#f43f5e', '#d946ef'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    setHearts((prev) => [...prev, { id, x: randomX, color }]);
    
    // Cleanup after animation
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  }, []);

  useImperativeHandle(ref, () => ({
    trigger: addHeart
  }));

  return (
    <div className={`pointer-events-none absolute bottom-0 right-0 w-24 h-64 overflow-hidden ${className}`}>
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 0, scale: 0, y: 0, x: heart.x }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.2, 1],
              y: -200,
              x: heart.x + (Math.random() * 40 - 20) // Wiggle
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          >
            <Heart 
              className="w-8 h-8 drop-shadow-md fill-current" 
              style={{ color: heart.color }} 
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

FloatingHearts.displayName = 'FloatingHearts';

export { FloatingHearts };
