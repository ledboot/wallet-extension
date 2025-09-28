import { Account } from '@shared/types';
import KeyringService, { Keyring } from './index';

class DisplayKeyring {
  public accounts: Account[] = [];
  type = '';

  constructor(keyring: Keyring) {
    keyring.getAccounts().then(accounts => {
      this.accounts = accounts || [];
    });
    this.type = keyring.type;
  }


  getAccounts = async () => {
    const keyring = await KeyringService.getKeyringForAccount(
      this.accounts[0].address,
      this.type
    );
    return await keyring.getAccounts();
  };

}

export default DisplayKeyring;
