import { useState } from 'react';
import { toast } from 'sonner';

import { useUnlockCallback } from '@/ui/state/hooks';
import { useWallet } from '@/ui/utils';

import { useNavigate } from '../mainRoute';

export default function UnlockScreen() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('12345678');
  const unlock = useUnlockCallback();
  const wallet = useWallet();
  const handleUnlock = async () => {
    try {
      await unlock(password);
      const hasVault = await wallet.hasVault();
      if (hasVault) {
        
        navigate('MainScreen');
        return;
      } else {
        navigate('WelcomeScreen');
      }
    } catch (error) {
      toast.error('Invalid password');
      console.error(error);
    }
  };
  return (
    <div className='flex h-full w-full flex-col items-center justify-center p-4'>
      <div className='text-2xl font-bold'>Unlock Screen</div>
      <span className='mb-2 text-sm text-gray-500'>Enter your password</span>
      <input
        type='password'
        required
        placeholder='Password'
        minLength={8}
        className='w-full rounded-md border border-gray-300 p-2 text-lg'
        pattern='(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}'
        title='Must be more than 8 characters, including number, lowercase letter, uppercase letter'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className='btn mt-4 w-full' onClick={handleUnlock}>
        Unlock
      </button>
    </div>
  );
}
