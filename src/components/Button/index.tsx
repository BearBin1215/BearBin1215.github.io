import React from 'react';
import classNames from 'classnames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 按钮类型
   */
  buttonType?: 'normal' | 'primary' | 'danger' | 'flat' | 'link';
  className?: string;
  children?: React.ReactNode;
}

/**
 * 按钮组件
 */
const Button: React.FC<ButtonProps> = ({ buttonType = 'normal', className, children, ...otherProps }) => {
  const classes = classNames(
    'bearui-button',
    `bearui-button-${buttonType}`,
    className
  );
  return (
    <button
      className={classes}
      {...otherProps}
    >
      {children}
    </button>
  );
};

export default Button;
export {ButtonProps};
