import React, { forwardRef } from 'react';
import classNames from 'classnames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮类型 */
  buttonType?: 'normal' | 'primary' | 'danger' | 'flat' | 'link';
}

/** 按钮组件 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  buttonType = 'normal',
  className,
  children,
  ...props
}, ref) => {
  const classes = classNames(
    'bearui-button',
    `bearui-button-${buttonType}`,
    className
  );
  return (
    <button
      className={classes}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
export { ButtonProps };
