import React from 'react';

const LoadingState = ({ message = "Loading..." }) => {
  return (
    <div className="p-8 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-DEFAULT"></div>
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingState; 