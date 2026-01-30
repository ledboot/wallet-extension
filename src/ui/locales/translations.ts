export const translations = {
  zh: {
    // Header
    header: {
      refresh: '刷新',
      settings: '设置',
      language: '语言',
      network: '网络',
      address_copied: '地址已复制',
      language_changed: '语言已切换到',
    },
    
    // Account
    account: {
      wallet: '钱包',
      add_wallet: '添加钱包',
      import_wallet: '导入钱包',
      create_wallet: '创建钱包',
      edit_name: '编辑名称',
      delete_wallet: '删除钱包',
      delete_account: '删除账户',
      confirm_delete_wallet: '确定要删除这个钱包吗？',
      confirm_delete_account: '确定要删除这个账户吗？',
      wallet_deleted: '钱包已删除',
      account_deleted: '账户已删除',
      confirm_delete_account_specific: '确定要删除账户 "{name}" 吗？此操作不可恢复。',
      confirm_delete_keyring_specific: '确定要删除钱包 "{name}" 吗？此操作将删除钱包中的所有账户，且不可恢复。',
      delete_account_success: '账户删除成功',
      delete_wallet_success: '钱包删除成功',
      delete_account_failed: '删除账户失败: {error}',
      delete_wallet_failed: '删除钱包失败: {error}',
      select_wallet: '选择钱包',
      no_wallets: '暂无钱包',
      create_wallet_title: '创建钱包',
      import_wallet_title: '导入钱包',
      wallet_address: '钱包地址',
      private_key: '私钥',
      backup_private_key: '我已备份私钥',
      confirm_backup: '请确认已备份私钥',
      enter_private_key: '请输入私钥',
      wallet_created_success: '钱包创建成功',
      wallet_imported_success: '钱包导入成功',
      wallet_create_failed: '钱包创建失败: {error}',
      wallet_import_failed: '钱包导入失败: {error}',
    },
    
    // Common
    common: {
      confirm: '确认',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      account_name: '账户名称',
      account_address: '账户地址',
      enter_account_name: '请输入账户名称',
      characters: '字符',
      wallet_name: '钱包名称',
      enter_wallet_name: '请输入钱包名称',
      wallet_type: '钱包类型',
      account_count: '账户数量',
      accounts: '个账户',
    },
    
    // Language names
    lang: {
      chinese: '中文',
      english: 'English',
      japanese: '日本語',
      korean: '한국어',
    },
    
    // Welcome
    welcome: {
      title: '欢迎使用 ANEX 扩展',
    },
    
    // Password
    password: {
      create_password: '创建密码',
      password: '密码',
      confirm_password: '确认密码',
      password_placeholder: '密码',
      confirm_password_placeholder: '确认密码',
      continue: '继续',
      password_requirements: '必须超过8个字符，包括数字、小写字母、大写字母',
      password_min_length: '密码至少需要8个字符',
      password_mismatch: '两次输入的密码不一致',
      unlock_title: '解锁钱包',
      unlock_subtitle: '请输入您的密码',
      unlock_button: '解锁',
      unlock_failed: '解锁失败: {error}',
    },
    
    // Assets
    assets: {
      send: '发送',
      receive: '接收',
      history: '历史',
      crypto: '代币',
      nft: 'NFT',
      loading: '加载中...',
      no_tokens_found: '没有找到代币',
      no_tokens_description: '您当前没有可用的代币',
      token_icon: '代币图标',
      refresh_success: '刷新完成',
      refresh_failed: '刷新失败',
      fetch_assets_failed: '获取资产列表失败，请重试',
    },
    
    // Boost
    boost: {
      boosting: '启动中...',
    },
    
    // Network
    network: {
      select_network: '选择网络',
    },
    
    // Transfer
    transfer: {
      select_token: '选择代币',
      back: '返回',
      no_tokens_found: '没有找到代币',
      no_tokens_description: '您当前没有可用的代币',
      send_token: '发送 {token}',
      enter_address: '输入{token}收款地址',
      paste_address: '粘贴地址',
      invalid_address: '无效的地址',
      recent_used: '最近使用',
      continue: '继续',
      amount: '金额',
      available: '可用: {balance} {token}',
      max: '最大',
      network_fee: '网络费用',
      calculating: '计算中...',
      total: '总计',
      confirm_transaction: '确认交易',
      send_from: '发送自',
      send_to: '发送至',
      network: '网络',
      token_label: '代币',
      confirm_send: '确认发送',
      processing: '处理中...',
      warning_message: '请仔细检查交易详情。交易一旦发送将无法撤销。',
      enter_password: '输入密码',
      password_description: '请输入您的钱包密码以确认交易',
      wallet_password: '钱包密码',
      cancel: '取消',
      confirm: '确认',
      sending: '发送中...',
      password_error: '密码错误，请重试',
      transaction_sent: '交易已发送',
      transaction_failed: '交易发送失败',
      clipboard_error: 'Failed to read from clipboard',
      fee_fetch_failed: '获取交易费失败',
      max_amount_failed: '获取最大可转金额失败',
      copied: '已复制',
    },
    
    // Receive
    receive: {
      back: '返回',
      wallet_address: '钱包地址',
      network: '网络',
      address_copied: '地址已复制',
    },
    
    // History
    history: {
      title: '交易记录',
      filter: '筛选:',
      all: '全部',
      send: '发送',
      receive: '接收',
      unknown: '未知',
      no_transactions: '暂无交易记录',
      no_transactions_description: '您的钱包还没有任何交易记录',
      no_filtered_transactions: '没有{type}类型的交易',
      loading_more: '加载中...',
      load_more: '加载更多',
    },
  },
  
  en: {
    // Header
    header: {
      refresh: 'Refresh',
      settings: 'Settings',
      language: 'Language',
      network: 'Network',
      address_copied: 'Address copied',
      language_changed: 'Language switched to',
    },
    
    // Account
    account: {
      wallet: 'Wallet',
      add_wallet: 'Add Wallet',
      import_wallet: 'Import Wallet',
      create_wallet: 'Create Wallet',
      edit_name: 'Edit Name',
      delete_wallet: 'Delete Wallet',
      delete_account: 'Delete Account',
      confirm_delete_wallet: 'Are you sure you want to delete this wallet?',
      confirm_delete_account: 'Are you sure you want to delete this account?',
      wallet_deleted: 'Wallet deleted',
      account_deleted: 'Account deleted',
      confirm_delete_account_specific: 'Are you sure you want to delete account "{name}"? This action cannot be undone.',
      confirm_delete_keyring_specific: 'Are you sure you want to delete wallet "{name}"? This will delete all accounts in this wallet and cannot be undone.',
      delete_account_success: 'Account deleted successfully',
      delete_wallet_success: 'Wallet deleted successfully',
      delete_account_failed: 'Failed to delete account: {error}',
      delete_wallet_failed: 'Failed to delete wallet: {error}',
      select_wallet: 'Select Wallet',
      no_wallets: 'No wallets available',
      create_wallet_title: 'Create Wallet',
      import_wallet_title: 'Import Wallet',
      wallet_address: 'Wallet Address',
      private_key: 'Private Key',
      backup_private_key: 'I backup my private key',
      confirm_backup: 'Please check the backup box',
      enter_private_key: 'Enter a private key',
      wallet_created_success: 'Wallet created successfully',
      wallet_imported_success: 'Wallet imported successfully',
      wallet_create_failed: 'Failed to create wallet: {error}',
      wallet_import_failed: 'Failed to import wallet: {error}',
    },
    
    // Common
    common: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      account_name: 'Account Name',
      account_address: 'Account Address',
      enter_account_name: 'Enter account name',
      characters: 'characters',
      wallet_name: 'Wallet Name',
      enter_wallet_name: 'Enter wallet name',
      wallet_type: 'Wallet Type',
      account_count: 'Account Count',
      accounts: 'accounts',
    },
    
    // Language names
    lang: {
      chinese: '中文',
      english: 'English',
      japanese: '日本語',
      korean: '한국어',
    },
    
    // Welcome
    welcome: {
      title: 'Welcome to the ANEX extension',
    },
    
    // Password
    password: {
      create_password: 'Create Password',
      password: 'Password',
      confirm_password: 'Confirm Password',
      password_placeholder: 'Password',
      confirm_password_placeholder: 'Confirm Password',
      continue: 'Continue',
      password_requirements: 'Must be more than 8 characters, including number, lowercase letter, uppercase letter',
      password_min_length: 'Password must be at least 8 characters',
      password_mismatch: 'Passwords do not match',
      unlock_title: 'Unlock Wallet',
      unlock_subtitle: 'Enter your password',
      unlock_button: 'Unlock',
      unlock_failed: 'Unlock failed: {error}',
    },
    
    // Assets
    assets: {
      send: 'Send',
      receive: 'Receive',
      history: 'History',
      crypto: 'Crypto',
      nft: 'NFT',
      loading: 'Loading...',
      no_tokens_found: 'No tokens found',
      no_tokens_description: 'You currently have no available tokens',
      token_icon: 'Token icon',
      refresh_success: 'Refresh completed',
      refresh_failed: 'Refresh failed',
      fetch_assets_failed: 'Failed to fetch asset list, please try again',
    },
    
    // Boost
    boost: {
      boosting: 'Boosting...',
    },
    
    // Network
    network: {
      select_network: 'Select Network',
    },
    
    // Transfer
    transfer: {
      select_token: 'Select Token',
      back: 'Back',
      no_tokens_found: 'No tokens found',
      no_tokens_description: 'You currently have no available tokens',
      send_token: 'Send {token}',
      enter_address: 'Enter {token} recipient address',
      paste_address: 'Paste Address',
      invalid_address: 'Invalid address',
      recent_used: 'Recent',
      continue: 'Continue',
      amount: 'Amount',
      available: 'Available: {balance} {token}',
      max: 'MAX',
      network_fee: 'Network Fee',
      calculating: 'Calculating...',
      total: 'Total',
      confirm_transaction: 'Confirm Transaction',
      send_from: 'From',
      send_to: 'To',
      network: 'Network',
      token_label: 'Token',
      confirm_send: 'Confirm Send',
      processing: 'Processing...',
      warning_message: 'Please carefully check the transaction details. Once sent, it cannot be undone.',
      enter_password: 'Enter Password',
      password_description: 'Please enter your wallet password to confirm the transaction',
      wallet_password: 'Wallet Password',
      cancel: 'Cancel',
      confirm: 'Confirm',
      sending: 'Sending...',
      password_error: 'Incorrect password, please try again',
      transaction_sent: 'Transaction sent',
      transaction_failed: 'Transaction failed',
      clipboard_error: 'Failed to read from clipboard',
      fee_fetch_failed: 'Failed to fetch transaction fee',
      max_amount_failed: 'Failed to fetch maximum transferable amount',
      copied: 'Copied',
    },
    
    // Receive
    receive: {
      back: 'Back',
      wallet_address: 'Wallet Address',
      network: 'Network',
      address_copied: 'Address copied',
    },
    
    // History
    history: {
      title: 'Transaction History',
      filter: 'Filter:',
      all: 'All',
      send: 'Send',
      receive: 'Receive',
      unknown: 'Unknown',
      no_transactions: 'No transactions',
      no_transactions_description: 'Your wallet has no transactions yet',
      no_filtered_transactions: 'No {type} transactions',
      loading_more: 'Loading...',
      load_more: 'Load More',
    },
  },
  
  ja: {
    // Header
    header: {
      refresh: '更新',
      settings: '設定',
      language: '言語',
      network: 'ネットワーク',
      address_copied: 'アドレスがコピーされました',
      language_changed: '言語が切り替わりました',
    },
    
    // Account
    account: {
      wallet: 'ウォレット',
      add_wallet: 'ウォレットを追加',
      import_wallet: 'ウォレットをインポート',
      create_wallet: 'ウォレットを作成',
      edit_name: '名前を編集',
      delete_wallet: 'ウォレットを削除',
      delete_account: 'アカウントを削除',
      confirm_delete_wallet: 'このウォレットを削除してもよろしいですか？',
      confirm_delete_account: 'このアカウントを削除してもよろしいですか？',
      wallet_deleted: 'ウォレットが削除されました',
      account_deleted: 'アカウントが削除されました',
      confirm_delete_account_specific: 'アカウント "{name}" を削除してもよろしいですか？この操作は元に戻せません。',
      confirm_delete_keyring_specific: 'ウォレット "{name}" を削除してもよろしいですか？これによりウォレット内のすべてのアカウントが削除され、元に戻せません。',
      delete_account_success: 'アカウントが正常に削除されました',
      delete_wallet_success: 'ウォレットが正常に削除されました',
      delete_account_failed: 'アカウントの削除に失敗しました: {error}',
      delete_wallet_failed: 'ウォレットの削除に失敗しました: {error}',
      select_wallet: 'ウォレットを選択',
      no_wallets: '利用可能なウォレットがありません',
      create_wallet_title: 'ウォレットを作成',
      import_wallet_title: 'ウォレットをインポート',
      wallet_address: 'ウォレットアドレス',
      private_key: '秘密鍵',
      backup_private_key: '秘密鍵をバックアップしました',
      confirm_backup: 'バックアップボックスを確認してください',
      enter_private_key: '秘密鍵を入力してください',
      wallet_created_success: 'ウォレットが正常に作成されました',
      wallet_imported_success: 'ウォレットが正常にインポートされました',
      wallet_create_failed: 'ウォレットの作成に失敗しました: {error}',
      wallet_import_failed: 'ウォレットのインポートに失敗しました: {error}',
    },
    
    // Common
    common: {
      confirm: '確認',
      cancel: 'キャンセル',
      save: '保存',
      delete: '削除',
      edit: '編集',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      account_name: 'アカウント名',
      account_address: 'アカウントアドレス',
      enter_account_name: 'アカウント名を入力してください',
      characters: '文字',
      wallet_name: 'ウォレット名',
      enter_wallet_name: 'ウォレット名を入力してください',
      wallet_type: 'ウォレットタイプ',
      account_count: 'アカウント数',
      accounts: 'アカウント',
    },
    
    // Language names
    lang: {
      chinese: '中文',
      english: 'English',
      japanese: '日本語',
      korean: '한국어',
    },
    
    // Welcome
    welcome: {
      title: 'ANEX拡張機能へようこそ',
    },
    
    // Password
    password: {
      create_password: 'パスワードを作成',
      password: 'パスワード',
      confirm_password: 'パスワードを確認',
      password_placeholder: 'パスワード',
      confirm_password_placeholder: 'パスワードを確認',
      continue: '続行',
      password_requirements: '8文字以上で、数字、小文字、大文字を含む必要があります',
      password_min_length: 'パスワードは最低8文字必要です',
      password_mismatch: 'パスワードが一致しません',
      unlock_title: 'ウォレットをロック解除',
      unlock_subtitle: 'パスワードを入力してください',
      unlock_button: 'ロック解除',
      unlock_failed: 'ロック解除に失敗しました: {error}',
    },
    
    // Assets
    assets: {
      send: '送信',
      receive: '受信',
      history: '履歴',
      crypto: '暗号資産',
      nft: 'NFT',
      loading: '読み込み中...',
      no_tokens_found: 'トークンが見つかりません',
      no_tokens_description: '現在利用可能なトークンがありません',
      token_icon: 'トークンアイコン',
      refresh_success: '更新完了',
      refresh_failed: '更新失敗',
      fetch_assets_failed: 'アセットリストの取得に失敗しました。もう一度お試しください',
    },
    
    // Boost
    boost: {
      boosting: '起動中...',
    },
    
    // Network
    network: {
      select_network: 'ネットワークを選択',
    },
    
    // Transfer
    transfer: {
      select_token: 'トークンを選択',
      back: '戻る',
      no_tokens_found: 'トークンが見つかりません',
      no_tokens_description: '現在利用可能なトークンがありません',
      send_token: '{token}を送信',
      enter_address: '{token}の受取アドレスを入力',
      paste_address: 'アドレスを貼り付け',
      invalid_address: '無効なアドレス',
      recent_used: '最近使用',
      continue: '続行',
      amount: '金額',
      available: '利用可能: {balance} {token}',
      max: '最大',
      network_fee: 'ネットワーク手数料',
      calculating: '計算中...',
      total: '合計',
      confirm_transaction: '取引を確認',
      send_from: '送信元',
      send_to: '送信先',
      network: 'ネットワーク',
      token_label: 'トークン',
      confirm_send: '送信を確認',
      processing: '処理中...',
      warning_message: '取引詳細を慎重に確認してください。一度送信すると取り消せません。',
      enter_password: 'パスワードを入力',
      password_description: '取引を確認するためウォレットのパスワードを入力してください',
      wallet_password: 'ウォレットのパスワード',
      cancel: 'キャンセル',
      confirm: '確認',
      sending: '送信中...',
      password_error: 'パスワードが正しくありません。もう一度お試しください',
      transaction_sent: '取引が送信されました',
      transaction_failed: '取引の送信に失敗しました',
      clipboard_error: 'クリップボードからの読み取りに失敗しました',
      fee_fetch_failed: '取引手数料の取得に失敗しました',
      max_amount_failed: '最大送信可能金額の取得に失敗しました',
      copied: 'コピーしました',
    },
    
    // Receive
    receive: {
      back: '戻る',
      wallet_address: 'ウォレットアドレス',
      network: 'ネットワーク',
      address_copied: 'アドレスがコピーされました',
    },
    
    // History
    history: {
      title: '取引履歴',
      filter: 'フィルター:',
      all: 'すべて',
      send: '送信',
      receive: '受信',
      unknown: '不明',
      no_transactions: '取引がありません',
      no_transactions_description: 'ウォレットにまだ取引がありません',
      no_filtered_transactions: '{type}の取引がありません',
      loading_more: '読み込み中...',
      load_more: 'もっと読み込む',
    },
  },
  
  ko: {
    // Header
    header: {
      refresh: '새로고침',
      settings: '설정',
      language: '언어',
      network: '네트워크',
      address_copied: '주소가 복사되었습니다',
      language_changed: '언어가 변경되었습니다',
    },
    
    // Account
    account: {
      wallet: '지갑',
      add_wallet: '지갑 추가',
      import_wallet: '지갑 가져오기',
      create_wallet: '지갑 생성',
      edit_name: '이름 편집',
      delete_wallet: '지갑 삭제',
      delete_account: '계정 삭제',
      confirm_delete_wallet: '이 지갑을 삭제하시겠습니까?',
      confirm_delete_account: '이 계정을 삭제하시겠습니까?',
      wallet_deleted: '지갑이 삭제되었습니다',
      account_deleted: '계정이 삭제되었습니다',
      confirm_delete_account_specific: '계정 "{name}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      confirm_delete_keyring_specific: '지갑 "{name}"을(를) 삭제하시겠습니까? 이렇게 하면 지갑의 모든 계정이 삭제되며 되돌릴 수 없습니다.',
      delete_account_success: '계정이 성공적으로 삭제되었습니다',
      delete_wallet_success: '지갑이 성공적으로 삭제되었습니다',
      delete_account_failed: '계정 삭제 실패: {error}',
      delete_wallet_failed: '지갑 삭제 실패: {error}',
      select_wallet: '지갑 선택',
      no_wallets: '사용 가능한 지갑이 없습니다',
      create_wallet_title: '지갑 생성',
      import_wallet_title: '지갑 가져오기',
      wallet_address: '지갑 주소',
      private_key: '개인 키',
      backup_private_key: '개인 키를 백업했습니다',
      confirm_backup: '백업 상자를 확인하세요',
      enter_private_key: '개인 키를 입력하세요',
      wallet_created_success: '지갑이 성공적으로 생성되었습니다',
      wallet_imported_success: '지갑이 성공적으로 가져왔습니다',
      wallet_create_failed: '지갑 생성 실패: {error}',
      wallet_import_failed: '지갑 가져오기 실패: {error}',
    },
    
    // Common
    common: {
      confirm: '확인',
      cancel: '취소',
      save: '저장',
      delete: '삭제',
      edit: '편집',
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
      account_name: '계정 이름',
      account_address: '계정 주소',
      enter_account_name: '계정 이름을 입력하세요',
      characters: '문자',
      wallet_name: '지갑 이름',
      enter_wallet_name: '지갑 이름을 입력하세요',
      wallet_type: '지갑 유형',
      account_count: '계정 수',
      accounts: '개 계정',
    },
    
    // Language names
    lang: {
      chinese: '中文',
      english: 'English',
      japanese: '日本語',
      korean: '한국어',
    },
    
    // Welcome
    welcome: {
      title: 'ANEX 확장 프로그램에 오신 것을 환영합니다',
    },
    
    // Password
    password: {
      create_password: '비밀번호 생성',
      password: '비밀번호',
      confirm_password: '비밀번호 확인',
      password_placeholder: '비밀번호',
      confirm_password_placeholder: '비밀번호 확인',
      continue: '계속',
      password_requirements: '8자 이상, 숫자, 소문자, 대문자 포함',
      password_min_length: '비밀번호는 최소 8자여야 합니다',
      password_mismatch: '비밀번호가 일치하지 않습니다',
      unlock_title: '지갑 잠금 해제',
      unlock_subtitle: '비밀번호를 입력하세요',
      unlock_button: '잠금 해제',
      unlock_failed: '잠금 해제 실패: {error}',
    },
    
    // Assets
    assets: {
      send: '보내기',
      receive: '받기',
      history: '기록',
      crypto: '암호화폐',
      nft: 'NFT',
      loading: '로딩 중...',
      no_tokens_found: '토큰을 찾을 수 없습니다',
      no_tokens_description: '현재 사용 가능한 토큰이 없습니다',
      token_icon: '토큰 아이콘',
      refresh_success: '새로고침 완료',
      refresh_failed: '새로고침 실패',
      fetch_assets_failed: '자산 목록을 가져오는 데 실패했습니다. 다시 시도하세요',
    },
    
    // Boost
    boost: {
      boosting: '부팅 중...',
    },
    
    // Network
    network: {
      select_network: '네트워크 선택',
    },
    
    // Transfer
    transfer: {
      select_token: '토큰 선택',
      back: '뒤로',
      no_tokens_found: '토큰을 찾을 수 없습니다',
      no_tokens_description: '현재 사용 가능한 토큰이 없습니다',
      send_token: '{token} 보내기',
      enter_address: '{token} 수신 주소 입력',
      paste_address: '주소 붙여넣기',
      invalid_address: '유효하지 않은 주소',
      recent_used: '최근 사용',
      continue: '계속',
      amount: '금액',
      available: '사용 가능: {balance} {token}',
      max: '최대',
      network_fee: '네트워크 수수료',
      calculating: '계산 중...',
      total: '합계',
      confirm_transaction: '거래 확인',
      send_from: '보낸 주소',
      send_to: '받는 주소',
      network: '네트워크',
      token_label: '토큰',
      confirm_send: '전송 확인',
      processing: '처리 중...',
      warning_message: '거래 세부 정보를 신중히 확인하세요. 한번 전송되면 취소할 수 없습니다.',
      enter_password: '비밀번호 입력',
      password_description: '거래를 확인하려면 지갑 비밀번호를 입력하세요',
      wallet_password: '지갑 비밀번호',
      cancel: '취소',
      confirm: '확인',
      sending: '전송 중...',
      password_error: '비밀번호가 틀렸습니다. 다시 시도하세요',
      transaction_sent: '거래가 전송되었습니다',
      transaction_failed: '거래 전송 실패',
      clipboard_error: '클립보드 읽기 실패',
      fee_fetch_failed: '거래 수수료 가져오기 실패',
      max_amount_failed: '최대 전송 가능 금액 가져오기 실패',
      copied: '복사됨',
    },
    
    // Receive
    receive: {
      back: '뒤로',
      wallet_address: '지갑 주소',
      network: '네트워크',
      address_copied: '주소가 복사되었습니다',
    },
    
    // History
    history: {
      title: '거래 기록',
      filter: '필터:',
      all: '전체',
      send: '보내기',
      receive: '받기',
      unknown: '알 수 없음',
      no_transactions: '거래 기록이 없습니다',
      no_transactions_description: '지갑에 아직 거래 기록이 없습니다',
      no_filtered_transactions: '{type} 유형의 거래가 없습니다',
      loading_more: '로딩 중...',
      load_more: '더 보기',
    },
  },
};
