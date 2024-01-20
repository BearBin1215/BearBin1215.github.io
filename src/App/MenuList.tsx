import React, { HTMLAttributes } from 'react';
import {
  NavLink
} from 'react-router-dom';
import routes from '@/config/router';

interface SideMenuProps extends HTMLAttributes<HTMLUListElement> {
  onClick?: () => void;
}

const MenuList: React.FC<SideMenuProps> = ({ onClick, ...props }) => {
  return (
    <ul className='menu-list' {...props}>
      {routes.map(({ title, path }) => (
        <li key={path}>
          <NavLink
            to={path}
            onClick={onClick}
          >
            {title}
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

export default MenuList;