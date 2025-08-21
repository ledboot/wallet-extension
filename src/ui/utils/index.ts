export * from './hooks';
export * from './walletContext';

const UI_TYPE = {
  Tab: 'index',
  Pop: 'popup',
  Notification: 'notification',
  SidePanel: 'sidepanel',
};

type UiTypeCheck = {
  isTab: boolean;
  isNotification: boolean;
  isPop: boolean;
  isSidePanel: boolean;
};

export const getUiType = (): UiTypeCheck => {
  const { pathname } = window.location;
  return Object.entries(UI_TYPE).reduce((m, [key, value]) => {
    m[`is${key}` as keyof UiTypeCheck] = pathname === `/${value}.html`;

    return m;
  }, {} as UiTypeCheck);
};
