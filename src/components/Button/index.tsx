import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  buttonType?: 'normal' | 'primary' | 'danger' | 'flat' | 'link';
  className?: string;
  children?: ReactNode;
}

const Button: React.FC<ButtonProps> = ({ buttonType = 'normal', className = '', children, ...otherProps }) => {
  const buttonClass = classNames(
    'bearui-button',
    `bearui-button-${buttonType}`,
    className
  );
  return (
    <button
      className={buttonClass}
      {...otherProps}
    >
      {children}
    </button>
  );
};

export default Button;
