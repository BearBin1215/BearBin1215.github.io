import React, { forwardRef } from 'react';
import classNames from 'classnames';

/** 卡片墙 */
const LinkCardWall = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  children,
  className,
  ...props
}, ref) => {
  const classes = classNames(
    'link-card-list',
    className
  );
  return (
    <div
      className={classes}
      {...props}
      ref={ref}
    >
      {children}
    </div>
  );
});

LinkCardWall.displayName = 'LinkCardWall';

export default LinkCardWall;
