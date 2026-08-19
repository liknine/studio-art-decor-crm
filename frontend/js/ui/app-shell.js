const nativeMobile=window.matchMedia('(max-width:600px)').matches;
const telegramWebApp=window.Telegram && window.Telegram.WebApp;
const mobileEditableSelector='input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]),textarea,select';
let expandedMobileShellHeight=0;
let mobileShellWidth=Math.round(window.innerWidth||0);

function hasFocusedEditable(){
  const active=document.activeElement;
  return Boolean(active && typeof active.matches==='function' && active.matches(mobileEditableSelector));
}

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

function syncMobileShellHeight(focusedOverride){
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

  const currentWidth=Math.round(window.innerWidth||0);
  if(currentWidth && mobileShellWidth && currentWidth!==mobileShellWidth){
    expandedMobileShellHeight=0;
  }
  if(currentWidth)mobileShellWidth=currentWidth;

  const focused=typeof focusedOverride==='boolean' ? focusedOverride : hasFocusedEditable();
  const visualHeight=Math.round((window.visualViewport && window.visualViewport.height)||0);
  if(!expandedMobileShellHeight && h>0)expandedMobileShellHeight=h;

  const baseHeight=Math.max(h,expandedMobileShellHeight);
  const keyboardOpen=focused && visualHeight>0 && baseHeight-visualHeight>=80;
  if(keyboardOpen){
    h=Math.min(baseHeight,visualHeight);
  }else if(!focused){
    const keyboardStillClosing=visualHeight>0 && expandedMobileShellHeight-visualHeight>=80;
    if(keyboardStillClosing)h=expandedMobileShellHeight;
    else if(h>0)expandedMobileShellHeight=h;
  }

  document.documentElement.classList.toggle('crm-keyboard-open',keyboardOpen);

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
document.addEventListener('focusin',event=>{
  if(event.target?.matches?.(mobileEditableSelector))syncMobileShellHeight(true);
});
document.addEventListener('focusout',event=>{
  if(event.target?.matches?.(mobileEditableSelector)){
    syncMobileShellHeight(false);
    requestAnimationFrame(syncMobileShellHeight);
  }
});
if(telegramWebApp && typeof telegramWebApp.onEvent==='function'){
  telegramWebApp.onEvent('viewportChanged',syncMobileShellHeight);
  telegramWebApp.onEvent('safeAreaChanged',syncTelegramSafeArea);
  telegramWebApp.onEvent('contentSafeAreaChanged',syncTelegramSafeArea);
}
