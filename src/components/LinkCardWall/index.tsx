import React, { ReactNode, AnchorHTMLAttributes, HTMLAttributes } from 'react';
import classNames from 'classnames';

interface LinkCardProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  length?: number;
  children?: ReactNode;
  icon?: ReactNode;
}

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
