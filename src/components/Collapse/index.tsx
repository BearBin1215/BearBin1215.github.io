import React, { useState, useRef, useEffect, forwardRef } from 'react';
import classNames from 'classnames';

interface CollapseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 标题文字 */
  label?: string;

  /** 初始是否展开。默认不展开 */
  expanded?: boolean;
}

/** 折叠组件 */
const Collapse = forwardRef<HTMLDivElement, CollapseProps>(({
  expanded = false,
  label,
  children,
  className,
  ...props
}, ref) => {
  const [isExpanded, setExpanded] = useState(expanded);

  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentWrapperRef.current && !expanded) {
      contentWrapperRef.current.style.height = '0';
    }
  }, []);

  const handleExpand = () => {
    if (contentWrapperRef.current) {
      // 根据折叠情况，设置高度为0或内容高度
      if (isExpanded) {
        contentWrapperRef.current.style.height = '0';
      } else {
        contentWrapperRef.current.style.height = `${contentRef.current?.offsetHeight}px`;
      }
    }
    setExpanded(!isExpanded);
  };

  return (
    <div
      className={classNames(
        'bearui-collapse',
        `bearui-collapse-${isExpanded ? 'expended' : 'collapsed'}`,
        className
      )}
      ref={ref}
      {...props}
    >
      <a
        className='bearui-collapse-label'
        onClick={handleExpand}
      >
        {label || (isExpanded ? '折叠' : '展开')}
      </a>
      <div
        className='bearui-collapse-content-wrapper'
        ref={contentWrapperRef}
      >
        <div
          className='bearui-collapse-content'
          ref={contentRef}
        >
          {children}
        </div>
      </div>
    </div>
  );
});

Collapse.displayName = 'Collapse';

export default Collapse;
