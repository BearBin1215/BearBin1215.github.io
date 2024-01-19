import React, { ReactNode, AnchorHTMLAttributes, HTMLAttributes } from 'react';
import classNames from 'classnames';

interface LinkCardProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * 长度等级（未使用）
   */
  length?: number;

  /**
   * 左侧图标
   */
  icon?: ReactNode | string;

  /**
   * 右侧内容
   */
  children?: ReactNode;
}

/**
 * 卡片组件
 */
const LinkCard: React.FC<LinkCardProps> = ({ length = 1, children, className, icon, ...props }) => {
  const classes = classNames(
    'link-card',
    `link-card-length-${length}`,
    icon ? '' : 'noicon',
    className
  );
  return (
    <a
      className={classes}
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
};

interface LinkCardWallProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * 卡片墙
 */
const LinkCardWall: React.FC<LinkCardWallProps> & { LinkCard: typeof LinkCard } = ({ children, className, ...props }) => {
  const classes = classNames(
    'link-card-list',
    className
  );
  return (
    <div
      {...props}
      className={classes}
    >
      {children}
    </div>
  );
};

LinkCardWall.LinkCard = LinkCard;

export default LinkCardWall;
