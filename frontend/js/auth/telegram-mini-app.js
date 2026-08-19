const TELEGRAM_INIT_DATA_HEADER='X-Telegram-Init-Data';

function telegramAuthError(code='AUTH_REQUIRED'){
  const error=new Error('Откройте CRM через Telegram');
  error.name='TelegramMiniAppAuthError';
  error.code=code;
  return error;
}

function telegramAuthMessage(){
  return 'Откройте CRM через Telegram';
}

const TelegramMiniAppAuth={
  initData:'',
  prepare(config=CRM_DATA_CONFIG){
    this.initData='';
    config.telegramInitData='';
    if(config.mode!=='http')return {required:false,initData:''};

    const webApp=window.Telegram?.WebApp;
    if(webApp){
      try{webApp.ready?.()}catch(_){}
    }
    const raw=typeof webApp?.initData==='string'?webApp.initData:'';
    if(!raw.trim())throw telegramAuthError('AUTH_REQUIRED');

    this.initData=raw;
    config.telegramInitData=raw;
    return {required:true,initData:raw};
  }
};
