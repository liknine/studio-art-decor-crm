const nativeMobile=window.matchMedia('(max-width:600px)').matches;
function syncMobileShellHeight(){
  if(!nativeMobile)return;

  let h=0;

  const tg=window.Telegram && window.Telegram.WebApp;
  if(tg){
    h=Math.round(tg.viewportStableHeight || tg.viewportHeight || 0);
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

  if(h>500){
    document.documentElement.style.setProperty('--crm-shell-h',h+'px');
  }

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
