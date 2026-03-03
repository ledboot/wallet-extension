let tryCount = 0;

const checkLoaded = (callback: () => void) => {
  tryCount++;
  if (tryCount > 600) {
    return;
  }
  if (document.readyState === 'complete') {
    callback();
    return true;
  } else {
    setTimeout(() => {
      checkLoaded(callback);
    }, 100);
  }
};

const domReadyCall = (callback: () => void) => {
  checkLoaded(callback);
};

const $ = document.querySelector.bind(document);

export { $, domReadyCall };
