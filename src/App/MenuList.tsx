import React from 'react';
import { NavLink } from 'react-router-dom';
import routes from '@/config/router';
import { Collapse } from '@/components';

interface MenuListProps extends React.HTMLAttributes<HTMLUListElement> {
  /**
   * 点击路由链接时间
   */
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const MenuList: React.FC<MenuListProps> = ({ onLinkClick, ...props }) => {
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
          <Collapse key={route.title} type='menu' label={route.title}>
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
          </Collapse>
        )
      )}
    </ul>
  );
};

export default MenuList;
