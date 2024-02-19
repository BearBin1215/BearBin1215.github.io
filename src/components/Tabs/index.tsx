import React, { useState } from 'react';
import classnames from 'classnames';

interface TabProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 标签显示文字
   */
  label: string;

  /**
   * 页签内容
   */
  children?: React.ReactNode;
}

const Tab: React.FC<TabProps> = ({ children, className, ...props }) => {
  const classes = classnames('bearui-tabs-content', className);

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Tab组成的页签
   */
  children: React.ReactElement<TabProps> | React.ReactElement<TabProps>[];

  /**
   * 默认显示的页签，与Tab的label对应
   */
  defaultTab?: string;
}

/**
 * 标签页组件
 */
const Tabs: React.FC<TabsProps> & { Tab: typeof Tab } = ({ children, className, defaultTab, ...props }) => {
  /**
   * 显示的页签
   */
  const childrens = Array.isArray(children) ? children : [children]; // 确保子组件为数组
  const [activeTab, setActiveTab] = useState(defaultTab || childrens[0].props.label);
  const classes = classnames('bearui-tabs', className);

  return (
    <div className={classes} {...props}>
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
};

Tabs.Tab = Tab;

export default Tabs;
