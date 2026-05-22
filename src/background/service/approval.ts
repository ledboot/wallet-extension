import { EventEmitter } from 'eventemitter3';

export interface ApprovalRequest {
  id: string;
  origin: string;
  name: string;
  icon: string;
  type: string;
  params?: any;
}

class ApprovalService extends EventEmitter {
  private pendingApprovals = new Map<
    string,
    {
      request: ApprovalRequest;
      resolve: (value: any) => void;
      reject: (reason?: any) => void;
      windowId?: number;
    }
  >();

  constructor() {
    super();
    chrome.windows.onRemoved.addListener((windowId) => {
      for (const [id, entry] of this.pendingApprovals.entries()) {
        if (entry.windowId === windowId) {
          this.rejectRequest(id, new Error('User closed the window'));
        }
      }
    });
  }

  async requestApproval(data: Omit<ApprovalRequest, 'id'>): Promise<any> {
    const id = Math.random().toString(36).substring(2, 15);
    let path = '/approval/connect';
    switch (data.type) {
      case 'switchNetwork':
        path = '/approval/switch-network';
        break;
      case 'signTransaction':
        path = '/approval/sign-transaction';
        break;
      case 'sendTransaction':
        path = '/approval/send-transaction';
        break;
      case 'signMessage':
        path = '/approval/sign-message';
        break;
      default:
        path = '/approval/connect';
    }
    const url = chrome.runtime.getURL(`index.html#${path}?id=${id}`);

    // Create a new window for approval
    const win = await chrome.windows.create({
      url,
      type: 'popup',
      width: 400,
      height: 600,
    });

    return new Promise((resolve, reject) => {
      this.pendingApprovals.set(id, {
        request: { ...data, id },
        resolve,
        reject,
        windowId: win.id,
      });
    });
  }

  getPendingRequest(id: string): ApprovalRequest | undefined {
    return this.pendingApprovals.get(id)?.request;
  }

  resolveRequest(id: string, data: any) {
    const entry = this.pendingApprovals.get(id);
    if (entry) {
      entry.resolve(data);
      this.pendingApprovals.delete(id);
    }
  }

  rejectRequest(id: string, reason?: any) {
    const entry = this.pendingApprovals.get(id);
    if (entry) {
      entry.reject(reason || new Error('User rejected request'));
      this.pendingApprovals.delete(id);
    }
  }
}

export default new ApprovalService();
