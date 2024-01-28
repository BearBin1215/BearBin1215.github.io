import React, { useState, useRef, useEffect, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';

interface CollapseProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 标题文字
   */
  label?: string;

  /**
   * 初始是否展开。默认不展开
   */
  expanded?: boolean;

  /**
   * 折叠框类型，目前用于兼容menu
   */
  type?: 'normal' | 'list';

  children: ReactNode;
}

/**
 * 折叠组件
 */
const Collapse: React.FC<CollapseProps> = ({ expanded = false, label, children, className, type = 'normal', ...props }) => {
  const [isExpanded, setExpanded] = useState(expanded);

  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const contentRef = useRef<HTMLDivElement & HTMLUListElement>(null);

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

  const WrapperTagName = (() => {
    switch (type) {
      case 'list':
        return 'ul';
      case 'normal':
      default:
        return 'div';
    }
  })();

  return (
    <div
      className={classNames(
        'bearui-collapse',
        `bearui-collapse-${isExpanded ? 'expended' : 'collapsed'}`,
        `bearui-collapse-${type}`,
        className
      )}
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
        <WrapperTagName
          className='bearui-collapse-content'
          ref={contentRef}
        >
          {children}
        </WrapperTagName>
      </div>
    </div>
  );
};

export default Collapse;
