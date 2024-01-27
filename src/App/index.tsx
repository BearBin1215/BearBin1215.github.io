import React, { useEffect, useRef, Suspense } from 'react';
import {
  Routes,
  Route,
  NavLink,
  useLocation
} from 'react-router-dom';
import throttle from 'lodash/throttle';
import MenuList from './MenuList';
import { LoadingIcon } from '@/components/SvgIcon';
import router, { flattenRoutes } from '@/config/router';
import externalLinkList from '@/config/externalLink';
import './index.scss';

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

  const location = useLocation();

  /**
   * 打开弹窗
   */
  const openSideMenu = () => {
    sideMenuRef.current?.classList.replace('side-menu-close', 'side-menu-open');
  };

  /**
   * 关闭弹窗
   */
  const closeSideMenu = () => {
    sideMenuRef.current?.classList.replace('side-menu-open', 'side-menu-close');
  };

  const switchSideMenu = () => {
    if (sideMenuRef.current?.classList.contains('side-menu-open')) {
      closeSideMenu();
    } else {
      openSideMenu();
    }
  };

  useEffect(() => {
    /**
     * 检测屏幕宽度缩小至1024以上时关闭弹窗
     */
    const closeSide = throttle(() => {
      if (window.innerWidth > 1024 && sideMenuRef.current) {
        closeSideMenu();
      }
    }, 200);

    /**
     * 页面滚动检测是否在顶部，控制header阴影
     */
    const addHeader = throttle(() => {
      if (headerRef.current) {
        if (window.scrollY && !headerRef.current.classList.contains('shadowed')) {
          headerRef.current.classList.add('shadowed');
        } else if (!window.scrollY && headerRef.current.classList.contains('shadowed')) {
          headerRef.current.classList.remove('shadowed');
        }
      }
    }, 200);

    window.addEventListener('resize', closeSide);
    window.addEventListener('scroll', addHeader);

    return () => {
      window.removeEventListener('resize', closeSide);
      window.removeEventListener('scroll', addHeader);
    };
  }, []);

  // 在页面路由切换时提供页面淡入效果
  useEffect(() => {
    const { current } = articleRef;

    if (current) {
      current.classList.add('fade-in'); // 动画开始，添加对应的类

      const onAnimationEnd = () => current.classList.remove('fade-in');
      current.addEventListener('animationend', onAnimationEnd); // 检测动画结束，删除对应的类

      return () => current.removeEventListener('animationend', onAnimationEnd);
    }
  }, [location]);

  return (
    <>
      <div id='global-background' />
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
              <line x1='3' y1='6' x2='21' y2='6' />
              <line x1='3' y1='12' x2='21' y2='12' />
              <line x1='3' y1='18' x2='21' y2='18' />
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
          {externalLinkList.map(({ href, title, Icon }) => (
            <a
              key={href}
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
          <MenuList onClick={closeSideMenu} />
        </nav>
      </div>
      <div id='page-container'>
        <aside id='page-sidebar'>
          <nav className='modal'>
            <MenuList onClick={closeSideMenu} />
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
                {flattenRoutes(router).map(({ path, Component }) => {
                  return (
                    <Route
                      key={path}
                      path={path}
                      element={<Component />
                      }
                    />
                  );
                })}
              </Routes>
            </Suspense>
          </article>
        </main>
      </div>
    </>
  );
};

export default App;
