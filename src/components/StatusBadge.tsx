import React from 'react';

type StatusType = 'pending' | 'assigned' | 'in-transit' | 'delivered' | 'available' | 'unavailable';

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  let bgColor = '';
  let textColor = '';
  let displayText = text || status;
  
  switch (status) {
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case 'assigned':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    case 'in-transit':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      break;
    case 'delivered':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'available':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'unavailable':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
  }
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} capitalize`}
    >
      {displayText}
    </span>
  );
};

export default StatusBadge;