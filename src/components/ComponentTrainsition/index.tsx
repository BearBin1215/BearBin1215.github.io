import React, { useEffect, RefObject } from 'react';
import { useLocation } from 'react-router-dom';

interface ComponentTransitionProps {
  Component: React.FC;
  animationClass: string;
  elementRef: RefObject<HTMLElement>;
}

/**
 * 设定要传入的类和ref以实现切换页面动画
 */
const ComponentTransition: React.FC<ComponentTransitionProps> = ({ Component, animationClass, elementRef }) => {
  const location = useLocation();

  useEffect(() => {
    const {current} = elementRef;

    if (current) {
      current.classList.add(animationClass); // 动画开始，添加对应的类

      const onAnimationEnd = () => {
        current.classList.remove(animationClass);
      };
      current.addEventListener('animationend', onAnimationEnd); // 检测动画结束，删除对应的类
      return () => current.removeEventListener('animationend', onAnimationEnd);
    }
  }, [location, animationClass, elementRef]);

  return <Component />;
};

export default ComponentTransition;
