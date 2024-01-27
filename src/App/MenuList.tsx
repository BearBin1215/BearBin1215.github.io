import React, { HTMLAttributes, MouseEvent } from 'react';
import { NavLink } from 'react-router-dom';
import type { To } from 'react-router';
import routes, { Route } from '@/config/router';
import { Collapse } from '@/components';

interface ParentListProps extends Omit<HTMLAttributes<HTMLUListElement>, 'onClick'> {
  title: string;
  childrenList: Route[];
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

interface LinkNodeProps extends Omit<HTMLAttributes<HTMLLIElement>, 'onClick'> {
  path: To;
  title: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

interface MenuListProps extends Omit<HTMLAttributes<HTMLUListElement>, 'onClick'> {
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

const LinkNode: React.FC<LinkNodeProps> = ({ onClick, path, title }) => {
  return (
    <NavLink
      to={path}
      onClick={onClick}
      className='router-link'
    >
      {title}
    </NavLink>
  );
};

const ParentList: React.FC<ParentListProps> = ({ title, childrenList, onClick }) => {
  return (
    <Collapse type='list' label={title}>
      {childrenList.map((route) => {
        if ('children' in route) {
          return (
            <ParentList key={route.title} title={route.title} childrenList={route.children} onClick={onClick} />
          );
        }
        return (
          <li key={route.title}>
            <LinkNode
              key={route.path}
              path={route.path}
              title={route.title}
              onClick={onClick}
            />
          </li>
        );
      })}
    </Collapse>
  );
};

const MenuList: React.FC<MenuListProps> = ({ onClick, ...props }) => {
  return (
    <ul className='menu-list' {...props}>
      {routes.map((route) => (
        <li key={route.title}>
          {'path' in route ? (
            <LinkNode
              key={route.path}
              path={route.path}
              title={route.title}
              onClick={onClick}
            />
          ) : (
            <ParentList title={route.title} key={route.title} childrenList={route.children} onClick={onClick} />
          )}
        </li>
      ))}
    </ul>
  );
};

export default MenuList;