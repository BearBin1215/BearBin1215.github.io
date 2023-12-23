/**
 * @description 折叠组件
 * @todo 折叠动画
 */
import React, { useState, HTMLAttributes } from 'react';
import classNames from 'classnames';

interface CollapseProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 标题文字
   */
  label?: string;

  /**
   * 默认展开
   */
  expanded?: boolean;

  children: React.ReactNode;
}

/**
 * 折叠组件
 */
const Collapse: React.FC<CollapseProps> = ({ expanded = false, label, children, className, ...props }) => {
  const [isExpanded, setExpanded] = useState(expanded);

  return (
    <div
      className={classNames('bearui-collapse', `bearui-collapse-${isExpanded ? 'expended' : 'collapsed'}`, className)}
      {...props}
    >
      <div
        className='bearui-collapse-label'
        onClick={() => setExpanded(!isExpanded)}
      >
        {label || (isExpanded ? '折叠' : '展开')}
      </div>
      <div
        className='bearui-collapse-content'
      >
        {children}
      </div>
    </div>
  );
};

export default Collapse;
