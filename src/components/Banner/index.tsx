import React, { ReactNode, HTMLAttributes } from 'react';
import classNames from 'classnames';

interface BannerProps extends HTMLAttributes<HTMLElement> {
  type?: 'default' | 'header';
  className?: string;
  signature?: ReactNode;
  children?: ReactNode;
  source?: ReactNode;
}

const Banner: React.FC<BannerProps> = ({ className, type, signature, source, children, ...props }) => {
  const BannerClass = classNames(
    'bearui-banner',
    `bearui-banner-${type || 'default'}`,
    className
  );
  return (
    <div
      className={BannerClass}
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
