import React, { useEffect, useRef } from 'react';

export const CursorGlow: React.FC = () => {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = glowRef.current;
    if (!element || !window.matchMedia('(pointer: fine)').matches) return;

    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
        element.dataset.visible = 'true';
      });
    };
    const hide = () => {
      if (element) element.dataset.visible = 'false';
    };

    window.addEventListener('pointermove', move);
    document.addEventListener('mouseleave', hide);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('mouseleave', hide);
    };
  }, []);

  return <div className="cursor-glow" ref={glowRef} aria-hidden="true" />;
};
