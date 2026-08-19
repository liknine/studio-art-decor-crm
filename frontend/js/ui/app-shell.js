const nativeMobile=window.matchMedia('(max-width:600px)').matches;
const telegramWebApp=window.Telegram && window.Telegram.WebApp;

function insetValue(source,side){
  const value=Number(source && source[side]);
  return Number.isFinite(value) && value>=0 ? Math.round(value) : 0;
}

function syncTelegramSafeArea(){
  if(!nativeMobile || !telegramWebApp)return;

  const root=document.documentElement;
  root.classList.add('telegram-mini-app');
  for(const side of ['top','right','bottom','left']){
    root.style.setProperty('--crm-tg-safe-area-'+side,insetValue(telegramWebApp.safeAreaInset,side)+'px');
    root.style.setProperty('--crm-tg-content-safe-area-'+side,insetValue(telegramWebApp.contentSafeAreaInset,side)+'px');
  }
}

function syncMobileShellHeight(){
  if(!nativeMobile)return;

  let h=0;

  if(telegramWebApp){
    h=Math.round(telegramWebApp.viewportStableHeight || telegramWebApp.viewportHeight || 0);
  }

  if(!h){
    const raw=Math.round(window.innerHeight || 0);
    const screenH=Math.round((window.screen && window.screen.height) || raw);

    /*
      In the ChatGPT iPhone HTML preview, WebKit reports almost the whole
      physical screen while ~120 CSS px are occupied by native preview chrome.
      In normal Safari/WebApp innerHeight is already meaningfully smaller.
    */
    const previewLike=screenH>0 && raw>=screenH-40;
    h=previewLike ? raw-120 : raw;
  }

  if(h>0){
    document.documentElement.style.setProperty('--crm-shell-h',h+'px');
  }

  syncTelegramSafeArea();

  document.documentElement.scrollTop=0;
  document.body.scrollTop=0;
  if(window.scrollY!==0)window.scrollTo(0,0);
}

syncMobileShellHeight();
requestAnimationFrame(syncMobileShellHeight);
setTimeout(syncMobileShellHeight,80);

window.addEventListener('resize',syncMobileShellHeight,{passive:true});
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',syncMobileShellHeight,{passive:true});
}
if(telegramWebApp && typeof telegramWebApp.onEvent==='function'){
  telegramWebApp.onEvent('viewportChanged',syncMobileShellHeight);
  telegramWebApp.onEvent('safeAreaChanged',syncTelegramSafeArea);
  telegramWebApp.onEvent('contentSafeAreaChanged',syncTelegramSafeArea);
}
