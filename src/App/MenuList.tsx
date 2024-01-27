import React, { HTMLAttributes, MouseEvent } from 'react';
import { NavLink } from 'react-router-dom';
import routes from '@/config/router';
import { Collapse } from '@/components';

interface MenuListProps extends HTMLAttributes<HTMLUListElement> {
  /**
   * 点击路由链接时间
   */
  onLinkClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

const MenuList: React.FC<MenuListProps> = ({ onLinkClick, ...props }) => {
  return (
    <ul className='menu-list' {...props}>
      {routes.map((route) => (
        <li key={route.title}>
          {'path' in route ? ( // 无子级，生成NavLink
            <NavLink
              to={route.path}
              onClick={onLinkClick}
              className='router-link'
            >
              {route.title}
            </NavLink>
          ) : ( // 有子级，生成折叠按钮
            <Collapse type='list' label={route.title}>
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
          )}
        </li>
      ))}
    </ul>
  );
};

export default MenuList;
