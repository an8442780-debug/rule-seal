import React from 'react';

export type RoleType = 'public' | 'owner' | 'resolver' | 'integrator' | 'auditor';

interface RoleBoundaryBannerProps {
  role: RoleType;
  title: string;
  description: string;
  badgeText?: string;
}

export const RoleBoundaryBanner: React.FC<RoleBoundaryBannerProps> = ({
  role,
  title,
  description,
  badgeText,
}) => {
  const getRoleBadgeClass = () => {
    switch (role) {
      case 'owner':
        return 'role-pill role-pill-owner';
      case 'resolver':
        return 'role-pill role-pill-resolver';
      case 'integrator':
        return 'role-pill role-pill-integrator';
      case 'auditor':
        return 'role-pill role-pill-auditor';
      default:
        return 'role-pill role-pill-public';
    }
  };

  const getBorderColor = () => {
    switch (role) {
      case 'owner':
        return '#c084fc';
      case 'resolver':
        return '#fbbf24';
      case 'integrator':
        return '#38bdf8';
      case 'auditor':
        return '#34d399';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div
      className="role-banner"
      style={{ borderLeftColor: getBorderColor() }}
      role="note"
      aria-label={`Role Boundary: ${title}`}
    >
      <div className="role-banner-title">
        <span className={getRoleBadgeClass()}>{badgeText || role.toUpperCase()}</span>
        <span>{title}</span>
      </div>
      <div className="role-banner-desc">
        {description}
      </div>
    </div>
  );
};
