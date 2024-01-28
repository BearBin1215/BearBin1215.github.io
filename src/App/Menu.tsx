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

  useEffect(() => {
    contentWrapperRef.current!.style.height = '0';
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
