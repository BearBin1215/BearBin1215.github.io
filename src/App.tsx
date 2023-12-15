import React, { useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import {
  HashRouter,
  Routes,
  Route,
  Link
} from 'react-router-dom';
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
   * 打开弹窗
   */
  const openSideMenu = () => {
    sideMenuRef.current.classList.replace('side-menu-close', 'side-menu-open');
    document.body.style.overflow = 'hidden';
  };

  /**
   * 关闭弹窗
   */
  const closeSideMenu = () => {
    sideMenuRef.current.classList.replace('side-menu-open', 'side-menu-close');
    document.body.style.overflow = 'auto';
  };

  /**
   * 检测屏幕宽度缩小至1024以上时关闭弹窗
   */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && sideMenuRef.current) {
      closeSideMenu();
    }
  });

  /**
   * 链接
   */
  const NavLinks: React.FC = () => (
    <ul className='menu-list'>
      {routes
        .filter(({ path }) => path !== '/')
        .map(({ title, path }: RouteType) => (
          <li key={title}>
            <Link
              to={path}
              onClick={closeSideMenu}
            >
              {title}
            </Link>
          </li>
        ))}
    </ul>
  );

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
        <header id='page-header'>
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
            <Link
              className='home-link'
              to='/'
              onClick={closeSideMenu}
            >
              <div className='avatar' />
              <div className='name'>BearBin</div>
            </Link>
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
          <article id='article-base'>
            <Suspense fallback={<LoadingIcon className='loading-icon' color='#7171df' />}>
              <Routes>
                {routes.map(({ path, Component }: RouteType) => {
                  return (
                    <Route
                      key={path}
                      path={path}
                      element={<Component />}
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
