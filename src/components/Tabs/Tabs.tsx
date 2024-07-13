import React, { useState, forwardRef } from 'react';
import classnames from 'classnames';
import type { TabProps } from './Tab';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tab组成的页签 */
  children: React.ReactElement<TabProps> | React.ReactElement<TabProps>[];

  /** 默认显示的页签，与Tab的label对应 */
  defaultTab?: string;
}

/** 标签页组件 */
const Tabs = forwardRef<HTMLDivElement, TabsProps>(({
  children,
  className,
  defaultTab,
  ...props
}, ref) => {
  /** 显示的页签 */
  const childrens = Array.isArray(children) ? children : [children]; // 确保子组件为数组
  const [activeTab, setActiveTab] = useState(defaultTab || childrens[0].props.label);
  const classes = classnames('bearui-tabs', className);

  return (
    <div className={classes} ref={ref} {...props}>
      <div className='bearui-tabs-panel'>
        {childrens.map((tab, index) => {
          const { label } = tab.props;
          const isActive = activeTab === label;
          const buttonClasses = classnames('bearui-tabs-label', isActive ? 'bearui-tabs-label-active' : '');

          return (
            <div
              className={buttonClasses}
              onClick={() => setActiveTab(label)}
              key={index}
            >
              {label}
            </div>
          );
        })}
      </div>
      {childrens.find(({ props: { label } }) => label === activeTab)}
    </div>
  );
});

Tabs.displayName = 'Tabs';

export default Tabs;
