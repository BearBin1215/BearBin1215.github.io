import React from 'react';
import classNames from 'classnames';

interface BannerProps extends React.HTMLAttributes<HTMLElement> {
  type?: 'default' | 'header';
  className?: string;
  signature?: React.ReactNode;
  children?: React.ReactNode;
  source?: React.ReactNode;
}

const Banner: React.FC<BannerProps> = ({ className, type, signature, source, children, ...props }) => {
  const classes = classNames(
    'bearui-banner',
    `bearui-banner-${type || 'default'}`,
    className
  );
  return (
    <div
      className={classes}
      {...props}
    >
      <div
        className='bearui-banner-inner'
      >
        <div
          className='bearui-banner-text'
        >
          {children}
          {source && <div className='bearui-banner-source'>——{source}</div>}
        </div>
        {signature &&
          <footer
            className='bearui-banner-signature'
          >
            {signature}
          </footer>
        }

      </div>
    </div>
  );
};

export default Banner;
export { BannerProps };
