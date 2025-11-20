import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  className = '', 
  variant = 'primary',
  disabled = false
}) => {
  const baseStyles = "px-6 py-3 rounded-lg font-bold transition-all duration-200 transform active:scale-95 font-pixel text-sm md:text-base shadow-lg";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white border-b-4 border-indigo-800",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white border-b-4 border-gray-900",
    danger: "bg-red-500 hover:bg-red-400 text-white border-b-4 border-red-800"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};
