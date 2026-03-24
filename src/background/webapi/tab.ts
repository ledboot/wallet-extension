import { EventEmitter } from 'eventemitter3';

import browser, {
  browserTabsCreate,
  browserTabsOnRemoved,
  browserTabsOnUpdated,
} from './browser';

const tabEvent = new EventEmitter();

browserTabsOnUpdated((tabId: number, changeInfo: any) => {
  if (changeInfo.url) {
    tabEvent.emit('tabUrlChanged', tabId, changeInfo.url);
  }
});

// window close will trigger this event also
browserTabsOnRemoved((tabId: number) => {
  tabEvent.emit('tabRemove', tabId);
});

const createTab = async (url: string): Promise<number | undefined> => {
  const tab = await browserTabsCreate({
    active: true,
    url,
  });

  return tab?.id;
};

const openIndexPage = (route = ''): Promise<number | undefined> => {
  const url = `index.html${route && `#${route}`}`;

  return createTab(url);
};

const queryCurrentActiveTab = async function () {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs) return resolve({});
      const [activeTab] = tabs;
      const { id, title, url } = activeTab;
      const { origin, protocol } = url
        ? new URL(url)
        : { origin: null, protocol: null };

      if (!origin || origin === 'null') {
        resolve({});
        return;
      }

      resolve({ id, title, origin, protocol, url });
    });
  });
};

export const openExtensionInTab = async (route: string, params: any = {}) => {
  // If it's an internal extension page, open directly
  if (route.startsWith('index.html')) {
    const tab = await browserTabsCreate({
      url: browser.runtime.getURL(route),
      active: true,
    });
    return tab;
  }

  try {
    // Check if target URL is a phishing site
    // const hostname = new URL(route).hostname;

    // Open page normally
    const tab = await browserTabsCreate({ url: route });
    return tab;
  } catch (e) {
    console.error('Failed to check URL:', e);
    // If URL parsing fails, still open the target page
    const tab = await browserTabsCreate({ url: route });
    return tab;
  }
};

export default tabEvent;

export { createTab, openIndexPage, queryCurrentActiveTab };
