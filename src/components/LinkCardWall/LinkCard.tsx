import React, { forwardRef } from 'react';
import classNames from 'classnames';

interface LinkCardProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** 长度等级（未使用） */
  length?: number;

  /** 左侧图标 */
  icon?: React.ReactNode | string;

  /** 右侧内容 */
  children?: React.ReactNode;
}

/** 卡片组件 */
const LinkCard = forwardRef<HTMLAnchorElement, LinkCardProps>(({
  length = 1,
  children,
  className,
  icon,
  ...props
}, ref) => {
  const classes = classNames(
    'link-card',
    `link-card-length-${length}`,
    icon ? '' : 'noicon',
    className
  );
  return (
    <a
      className={classes}
      ref={ref}
      {...props}
    >
      <div className='link-card-inner'>
        {icon && <div className='link-card-icon'>
          {icon}
        </div>}
        <div className='link-card-text'>
          {children}
        </div>
      </div>
    </a>
  );
});

LinkCard.displayName = 'LinkCard';

export default LinkCard;
