import { useMemo } from 'react';

import { useExtensionIsInTab } from '../features/browser/tabs';
import { getUiType } from '../utils';

export const AppDimensions = (props: any) => {
  const extensionIsInTab = useExtensionIsInTab();
  const isSidePanel = getUiType().isSidePanel;

  const width = useMemo(() => {
    if (extensionIsInTab) {
      return '100vw';
    }
    return isSidePanel ? '100vw' : '357px';
  }, [extensionIsInTab, isSidePanel]);

  const height = useMemo(() => {
    if (extensionIsInTab) {
      return '100vh';
    }
    return isSidePanel ? '100vh' : '600px';
  }, [extensionIsInTab, isSidePanel]);
  return (
    <div className={`w-[${width}] h-[${height}]`}
      {...props}
    >
      {props.children}
    </div>
  );
};
