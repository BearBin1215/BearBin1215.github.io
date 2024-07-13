import React, { forwardRef } from 'react';

interface MGPLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'rel' | 'target'> {
  /** 页面名 */
  page: string;

  /** 子站点，默认zh */
  site?: 'zh' | 'mzh' | 'mobile' | 'en' | 'ja' | 'library' | 'common';

  /** 是否在新标签页打开，默认是 */
  blank?: boolean;
}

/** 萌娘百科链接 */
const MGPLink = forwardRef<HTMLAnchorElement, MGPLinkProps>(({
  page,
  children,
  blank = true,
  site = 'zh',
  ...props
}, ref) => {
  const anchorProps = blank
    ? { rel: 'noopener noreferrer', target: '_blank', ...props }
    : { ...props };

  return (
    <a
      href={`https://${site}.moegirl.org.cn/${page}`}
      ref={ref}
      {...anchorProps}
    >
      {children}
    </a>
  );
});

MGPLink.displayName = 'MGPLink';

export default MGPLink;
