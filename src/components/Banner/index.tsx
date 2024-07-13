import React, { forwardRef } from 'react';
import classNames from 'classnames';

interface BannerProps extends React.HTMLAttributes<HTMLElement> {
  type?: 'default' | 'header';
  signature?: React.ReactNode;
  source?: React.ReactNode;
}

const Banner = forwardRef<HTMLDivElement, BannerProps>(({
  className,
  type,
  signature,
  source,
  children,
  ...props
}, ref) => {
  const classes = classNames(
    'bearui-banner',
    `bearui-banner-${type || 'default'}`,
    className
  );
  return (
    <div
      className={classes}
      ref={ref}
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
});

Banner.displayName = 'Banner';

export default Banner;
export { BannerProps };
