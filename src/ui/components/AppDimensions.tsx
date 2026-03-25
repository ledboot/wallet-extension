import type { CSSProperties, PropsWithChildren, ReactElement } from 'react';
import { useMemo } from 'react';

import { useExtensionIsInTab } from '../features/browser/tabs';
import { getUiType } from '../utils';

type AppDimensionsProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
}>;

export const AppDimensions = ({ children, className, style }: AppDimensionsProps): ReactElement => {
  const extensionIsInTab = useExtensionIsInTab();
  const isSidePanel = getUiType().isSidePanel;

  const dimensions = useMemo<CSSProperties>(() => {
    if (extensionIsInTab || isSidePanel) {
      return {
        width: '100vw',
        minHeight: '100vh',
        height: '100vh',
      };
    }

    return {
      width: '357px',
      minHeight: '600px',
      height: '600px',
    };
  }, [extensionIsInTab, isSidePanel]);

  return (
    <div className={className} style={{ ...dimensions, ...style }}>
      {children}
    </div>
  );
};
