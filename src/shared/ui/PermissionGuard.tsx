import React from 'react';
import { authService } from '../../features/auth/data/authService';

interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  fallback = null,
  children,
}) => {
  const isAllowed = authService.hasPermission(permission);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface ModuleGuardProps {
  module: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({
  module,
  fallback = null,
  children,
}) => {
  const isAllowed = authService.hasModule(module);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
