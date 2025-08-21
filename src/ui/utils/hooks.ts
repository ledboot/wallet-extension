import { useEffect, useRef, useState } from 'react';

export const useWalletRequest = (
  requestFn: any,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (arg: unknown) => void;
    onError?: (arg: unknown) => void;
  }
) => {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const [loading, setLoading] = useState<boolean>(false);
  const [res, setRes] = useState<unknown>();
  const [err, setErr] = useState<unknown>();

  const run = async (...args: unknown[]) => {
    setLoading(true);
    try {
      const _res = await Promise.resolve(requestFn(...args));
      if (!mounted.current) {
        return;
      }
      setRes(_res);
      onSuccess && onSuccess(_res);
    } catch (e) {
      if (!mounted.current) {
        return;
      }
      setErr(e);
      onError && onError(e);
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  return [run, loading, res, err] as const;
};
