export * from './hooks';
export * from './walletContext';
export * from './format';

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

export const getApprovalId = (): string | null => {
  const hash = window.location.hash;
  const search = window.location.search;
  const searchParams = new URLSearchParams(
    hash.includes('?') 
      ? hash.split('?')[1] 
      : search
  );
  return searchParams.get('id');
};

