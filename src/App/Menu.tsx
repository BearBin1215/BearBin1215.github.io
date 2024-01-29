import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import routes from '@/config/router';

interface FolderProps {
  label?: string;

  children: React.ReactNode;
}

interface MenuProps extends React.HTMLAttributes<HTMLUListElement> {
  /**
   * 点击路由链接事件
   */
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * 菜单折叠组件
 */
const Folder: React.FC<FolderProps> = ({ label, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const contentRef = useRef<HTMLUListElement>(null);

  const [animationTimoute, setAnimationTimeout] = useState(setTimeout(() => 0));

  useEffect(() => {
    contentWrapperRef.current!.style.display = 'none';

    return () => {
      clearTimeout(animationTimoute);
    };
  }, []);

  const handleExpand = () => {
    if (contentWrapperRef.current && contentRef.current) {
      clearTimeout(animationTimoute); // 每次点击时清除Timeout

      if (isExpanded) {
        // 若为展开状态，设置display无属性，然后将高度设为内容高度（初始），马上异步设置高度为0，利用transition实现动画
        contentWrapperRef.current.style.display = '';
        contentWrapperRef.current.style.height = `${contentRef.current.offsetHeight}px`;
        setTimeout(() => {
          contentWrapperRef.current!.style.height = '0';
        });
        // 再延时0.35s将display设为none、取消高度设置
        setAnimationTimeout(setTimeout((() => {
          if (contentWrapperRef.current) {
            contentWrapperRef.current.style.height = '';
            contentWrapperRef.current.style.display = 'none';
          }
        }), 350));
      } else {
        // 若为折叠状态，设置display无属性，设置高度为0（初始），马上异步设置为内容高度，利用transition实现动画
        contentWrapperRef.current.style.display = '';
        contentWrapperRef.current.style.height = '0';
        setTimeout(() => {
          contentWrapperRef.current!.style.height = `${contentRef.current!.offsetHeight}px`;
        });
        // 再延时0.35s取消高度设置
        setAnimationTimeout(setTimeout((() => {
          if (contentWrapperRef.current) {
            contentWrapperRef.current.style.height = '';
          }
        }), 350));
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <li className={`menu-folder menu-folder-${isExpanded ? 'expended' : 'folded'}`}>
      <a className='menu-folder-label' onClick={handleExpand}>
        {label || (isExpanded ? '折叠' : '展开')}
      </a>
      <div className='menu-folder-content-wrapper' ref={contentWrapperRef}>
        <ul className='menu-folder-content' ref={contentRef}>
          {children}
        </ul>
      </div>
    </li>
  );
};

const Menu: React.FC<MenuProps> = ({ onLinkClick, ...props }) => {
  return (
    <ul className='menu-list' {...props}>
      {routes.map((route) =>
        'path' in route ? ( // 无子级，生成NavLink
          <li key={route.title}>
            <NavLink
              to={route.path}
              onClick={onLinkClick}
              className='router-link'
            >
              {route.title}
            </NavLink>
          </li>
        ) : ( // 有子级，生成折叠按钮
          <Folder key={route.title} label={route.title}>
            {route.children.map(({ title, path }) => (
              <li key={title}>
                <NavLink
                  to={path}
                  onClick={onLinkClick}
                  className='router-link'
                >
                  {title}
                </NavLink>
              </li>
            ))}
          </Folder>
        )
      )}
    </ul>
  );
};

export default Menu;
