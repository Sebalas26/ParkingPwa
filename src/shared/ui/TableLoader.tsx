import React from 'react';

interface TableLoaderProps {
  message?: string;
}

export const TableLoader: React.FC<TableLoaderProps> = ({ message = 'Cargando datos...' }) => {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <span>{message}</span>
    </div>
  );
};
