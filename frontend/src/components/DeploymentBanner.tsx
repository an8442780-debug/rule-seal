import React from 'react';
import { CONTRACT_ADDRESS } from '../config/chain.ts';

export const DeploymentBanner: React.FC = () => {
  if (CONTRACT_ADDRESS) {
    return null;
  }

  return (
    <div className="banner banner-warning" role="alert">
      <div>
        <strong>Deployment Not Configured:</strong> Contract address is not set in the environment (<code>VITE_CONTRACT_ADDRESS</code>).
        On-chain write actions and live queries are disabled. Set a verified contract address to enable interactive operations.
      </div>
    </div>
  );
};
