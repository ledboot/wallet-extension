
// 钓鱼黑名单
const PHISHING_BLACKLIST = [
  'malicious-site.com',
  'fake-wallet.com',
  'scam-token.org',
  // 可以添加更多钓鱼网站域名
];

// 安全检查函数
function performSecurityChecks(): boolean {
  const hostname = window.location.hostname;
  
  // 1. 钓鱼黑名单检测
  if (PHISHING_BLACKLIST.some(domain => hostname.includes(domain))) {
    console.warn('⚠️ 检测到钓鱼网站:', hostname);
    showPhishingWarning(hostname);
    return false; // 阻止注入
  }
  
  // 2. iframe 检测 (防止点击劫持)
  if (window.self !== window.top) {
    console.warn('⚠️ 检测到 iframe 嵌套，可能存在点击劫持风险');
    showIframeWarning();
    return false; // 阻止注入
  }
  
  return true; // 通过安全检查
}

// 显示钓鱼警告
function showPhishingWarning(hostname: string) {
  // 创建警告覆盖层
  const warningDiv = document.createElement('div');
  warningDiv.id = 'wallet-security-warning';
  warningDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 0, 0, 0.95);
    color: white;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Arial, sans-serif;
  `;
  
  warningDiv.innerHTML = `
    <div style="text-align: center; max-width: 500px; padding: 20px;">
      <h1 style="color: #ff6b6b; margin-bottom: 20px;">⚠️ 安全警告</h1>
      <p style="font-size: 18px; margin-bottom: 20px;">
        检测到当前网站 <strong>${hostname}</strong> 在钓鱼黑名单中！
      </p>
      <p style="margin-bottom: 20px;">
        这可能是恶意网站，试图窃取您的钱包资产。
      </p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="leave-site" style="
          background: #ff6b6b;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        ">离开此网站</button>
        <button id="ignore-warning" style="
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        ">忽略风险</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(warningDiv);
  
  // 绑定事件
  const leaveBtn = document.getElementById('leave-site');
  const ignoreBtn = document.getElementById('ignore-warning');
  
  if (leaveBtn) {
    leaveBtn.addEventListener('click', () => {
      window.location.href = 'about:blank';
    });
  }
  
  if (ignoreBtn) {
    ignoreBtn.addEventListener('click', () => {
      if (document.body.contains(warningDiv)) {
        document.body.removeChild(warningDiv);
      }
      // 用户选择忽略，继续注入
      injectScript();
    });
  }
}

// 显示 iframe 警告
function showIframeWarning() {
  const warningDiv = document.createElement('div');
  warningDiv.id = 'iframe-security-warning';
  warningDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(255, 165, 0, 0.9);
    color: white;
    padding: 10px 15px;
    border-radius: 6px;
    z-index: 999999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
  `;
  
  warningDiv.innerHTML = `
    <div>
      <strong>⚠️ 安全风险</strong><br>
      钱包在 iframe 中运行，可能存在点击劫持风险
    </div>
  `;
  
  document.body.appendChild(warningDiv);
  
  // 3秒后自动移除
  setTimeout(() => {
    if (document.body.contains(warningDiv)) {
      document.body.removeChild(warningDiv);
    }
  }, 3000);
}

// 点击拦截防护
function setupClickInterception() {
  // 监听所有点击事件
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // 检查是否为外部链接
    if (target && target.tagName === 'A') {
      const anchor = target as HTMLAnchorElement;
      if (anchor.href) {
        const href = anchor.href;
        const currentDomain = window.location.hostname;
        const linkDomain = new URL(href).hostname;
        
        // 如果链接到不同域名，显示确认对话框
        if (linkDomain !== currentDomain) {
          event.preventDefault();
          
          const confirmed = confirm(`
            即将跳转到外部网站:
            ${linkDomain}
            
            这可能是钓鱼链接，确定要继续吗？
          `);
          
          if (confirmed) {
            window.open(href, '_blank');
          }
        }
      }
    }
  }, true); // 使用捕获阶段
}

import inpageUrl from './inpage.ts?url';

// 1. 注入脚本的函数 (和 UniSat 逻辑一致)
function injectScript() {
  console.log('1. 准备开始注入...');
  try {
    const container = document.head || document.documentElement;
    const scriptTag = document.createElement('script');
    // 指向编译后的文件
    scriptTag.src = inpageUrl;
    console.log('2. 生成的目标路径 URL:', scriptTag.src);
    scriptTag.setAttribute('type', 'module');
    scriptTag.setAttribute('async', 'false');
    container.insertBefore(scriptTag, container.children[0]);
    console.log('3. <script> 标签已插入 DOM');
    // container.removeChild(scriptTag);
  } catch (error) {
    console.error('注入失败:', error);
  }
}

// 2. 消息转发监听器 (核心：打通网页和后台) 
window.addEventListener('message', (event) => {
  console.log('---------------消息转发监听器')
  // 安全检查：只接受当前窗口的消息
  if (event.source !== window) return;
  
  // 这里的 'ZENT_REQUEST' 是你自己定义的暗号
  if (event.data.target === 'ZENT_REQUEST') {
    // 转发给 Background
    chrome.runtime.sendMessage(event.data.payload, (response) => {
      // 把 Background 的回信转发回网页
      window.postMessage({
        target: 'ZENT_RESPONSE',
        id: event.data.id, // 对应请求ID
        data: response
      }, '*');
    });
  }
});

// 执行安全检查和注入
if (performSecurityChecks()) {
  injectScript();
}

// 设置点击拦截防护
setupClickInterception();
