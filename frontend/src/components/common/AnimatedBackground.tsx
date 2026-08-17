import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="animated-background" aria-hidden="true">
      <div className="background-grid" />
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="orb orb-three" />
      <div className="scan-line" />
    </div>
  );
};
