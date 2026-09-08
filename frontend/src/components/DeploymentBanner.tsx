import React from 'react';
import { CONTRACT_ADDRESS } from '../config/chain.ts';

export const DeploymentBanner: React.FC = () => {
  if (CONTRACT_ADDRESS) {
    return null;
  }

  return (
    <div className="banner banner-warning" role="alert">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontSize: '18px', lineHeight: 1 }} aria-hidden="true">⚠</span>
        <div>
          <strong>Deployment Not Configured:</strong> Contract address is not set in the environment (<code>VITE_CONTRACT_ADDRESS</code>).
          On-chain write actions and live queries are disabled. Set a verified contract address to enable interactive operations on GenLayer Studionet.
        </div>
      </div>
    </div>
  );
};
