import React, { forwardRef } from 'react';
import classnames from 'classnames';

export interface TabProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 标签显示文字 */
  label: string;

  /** 页签内容 */
  children?: React.ReactNode;
}

const Tab = forwardRef<HTMLDivElement, TabProps>(({
  children,
  className,
  ...props
}, ref) => {
  const classes = classnames('bearui-tabs-content', className);

  return (
    <div
      className={classes}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
});

Tab.displayName = 'Tab';

export default Tab;
