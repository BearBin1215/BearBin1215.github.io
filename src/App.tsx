import React, { useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import {
  HashRouter,
  Routes,
  Route,
  NavLink
} from 'react-router-dom';
import { throttle } from '@/utils/perf';
import { ComponentTransition } from '@/components';
import { LoadingIcon } from '@/components/SvgIcon';
import routes, { Route as RouteType } from '@/config/router';
import externalLinkList, { ExternalLink } from '@/config/externalLink';
import './App.scss';

const App: React.FC = () => {
  /**
   * 侧边菜单
   */
  const sideMenuRef = useRef<HTMLDivElement>(null);

  /**
   * 页眉
   */
  const headerRef = useRef<HTMLHeadElement>(null);

  /**
   * article
   */
  const articleRef = useRef<HTMLElement>(null);

  /**
   * 打开弹窗
   */
  const openSideMenu = () => {
    sideMenuRef.current.classList.replace('side-menu-close', 'side-menu-open');
  };

  /**
   * 关闭弹窗
   */
  const closeSideMenu = () => {
    sideMenuRef.current.classList.replace('side-menu-open', 'side-menu-close');
  };

  /**
   * 检测屏幕宽度缩小至1024以上时关闭弹窗
   */
  window.addEventListener('resize', throttle(() => {
    if (window.innerWidth > 1024 && sideMenuRef.current) {
      closeSideMenu();
    }
  }, 200));

  /**
   * 检测屏幕宽度缩小至1024以上时关闭弹窗
   */
  window.addEventListener('scroll', throttle(() => {
    if (headerRef.current) {
      if (window.scrollY && !headerRef.current.classList.contains('shadowed')) {
        headerRef.current.classList.add('shadowed');
      } else if (!window.scrollY && headerRef.current.classList.contains('shadowed')) {
        headerRef.current.classList.remove('shadowed');
      }
    }
  }, 200));

  /**
   * 链接
   */
  const NavLinks: React.FC = () => {
    return (
      <ul className='menu-list'>
        {routes.map(({ title, path }: RouteType) => (
          <li key={title}>
            <NavLink
              to={path}
              onClick={closeSideMenu}
            >
              {title}
            </NavLink>
          </li>
        ))}
      </ul>
    );
  };

  /**
   * 页顶
   */
  const Header: React.FC = () => {
    /**
     * 切换
     */
    const switchSideMenu = () => {
      if (sideMenuRef.current.classList.contains('side-menu-open')) {
        closeSideMenu();
      } else {
        openSideMenu();
      }
    };

    return (
      <>
        <header id='page-header' ref={headerRef}>
          <nav className='header-left'>
            <button
              className='menu-button'
              onClick={switchSideMenu}
            >
              <svg
                width='24px'
                height='24px'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeWidth='2'
              >
                <line
                  x1='3'
                  y1='6'
                  x2='21'
                  y2='6'
                />
                <line
                  x1='3'
                  y1='12'
                  x2='21'
                  y2='12'
                />
                <line
                  x1='3'
                  y1='18'
                  x2='21'
                  y2='18'
                />
              </svg>
            </button>
            <NavLink
              className='home-link'
              to='/'
              onClick={closeSideMenu}
            >
              <div className='avatar' />
              <div className='name'>BearBin</div>
            </NavLink>
          </nav>
          <nav className='header-right'>
            {externalLinkList.map(({ href, title, Icon }: ExternalLink) => (
              <a
                key={title}
                title={title}
                href={href}
                rel='noreferrer'
                target='_blank'
              >
                <Icon className='link-icon' />
              </a>
            ))}
          </nav>
        </header>
        <div
          id='side-modal-wrapper'
          className='side-menu-close'
          ref={sideMenuRef}
          onClick={closeSideMenu}
        >
          <nav
            className='modal'
            onClick={(e) => e.stopPropagation()}
          >
            <NavLinks />
          </nav>
        </div>
      </>
    );
  };

  return (
    <HashRouter>
      {createPortal(
        <div id='global-background' />,
        document.body
      )}
      <Header />
      <div id='page-container'>
        <aside id='page-sidebar'>
          <nav className='modal'>
            <NavLinks />
          </nav>
          <footer>
            <a
              href='https://www.pixiv.net/artworks/104835785'
              rel='noreferrer'
              target='_blank'
            >
              BG: pixiv 104835785
            </a>
          </footer>
        </aside>
        <main id='content-base'>
          <article id='article-base' ref={articleRef}>
            <Suspense fallback={<LoadingIcon className='loading-icon' color='#7171df' />}>
              <Routes>
                {routes.map(({ path, Component }: RouteType) => {
                  return (
                    <Route
                      key={path}
                      path={path}
                      element={
                        <ComponentTransition
                          Component={Component}
                          animationClass='fade-in'
                          elementRef={articleRef}
                        />
                      }
                    />
                  );
                })}
              </Routes>
            </Suspense>
          </article>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
