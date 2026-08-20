class HttpCRMAdapter{
  constructor(config){
    this.name='http';
    this.apiBase=config.apiBase;
    this.timeout=config.requestTimeoutMs;
    this.telegramInitData=String(config.telegramInitData||'');
    this.revision='';
  }
  async request(path,options={}){
    if(!this.telegramInitData)throw telegramAuthError('AUTH_REQUIRED');
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),this.timeout);
    try{
      const {headers={},...requestOptions}=options;
      const response=await fetch(this.apiBase+path,{
        credentials:'include',
        ...requestOptions,
        headers:{
          'Content-Type':'application/json',
          [TELEGRAM_INIT_DATA_HEADER]:this.telegramInitData,
          ...headers
        },
        signal:controller.signal
      });
      if(response.status===204)return null;

      let body=null;
      let parseError=null;
      try{
        if(typeof response.text==='function'){
          const text=await response.text();
          if(!String(text).trim())throw new SyntaxError('Empty response body');
          body=JSON.parse(text);
        }else{
          body=await response.json();
        }
      }catch(err){
        parseError=err;
      }
      if(!response.ok){
        const err=new Error(body?.error?.message||body?.message||body?.detail||`CRM API ${response.status}`);
        err.status=response.status;
        err.payload=body;
        err.code=body?.error?.code||'HTTP_ERROR';
        err.details=body?.error?.details||{};
        if(parseError)err.parseError=parseError;
        throw err;
      }
      if(parseError){
        const err=new Error('CRM API returned invalid JSON');
        err.code='INVALID_JSON';
        err.cause=parseError;
        throw err;
      }
      return body;
    }catch(err){
      if(controller.signal.aborted){
        const timeoutError=new Error(`CRM request timed out after ${this.timeout} ms`);
        timeoutError.name='CRMTimeoutError';
        timeoutError.code='TIMEOUT';
        timeoutError.cause=err;
        throw timeoutError;
      }
      throw err;
    }finally{
      clearTimeout(timer);
    }
  }
  async load(defaultStages){
    const payload=await this.request('/crm/state',{method:'GET'});
    if(!payload || !Array.isArray(payload.stages)){
      throw new Error('CRM API returned an invalid state payload');
    }
    this.revision=String(payload.revision||'');
    return {
      stages:normalizeStages(payload.stages),
      rentalItems:Array.isArray(payload.rentalItems)?payload.rentalItems:null,
      revision:this.revision
    };
  }
  async save(snapshot){
    const payload=await this.request('/crm/state',{
      method:'PUT',
      headers:this.revision?{'If-Match':this.revision}:{},
      body:JSON.stringify({
        version:snapshot.version,
        stages:snapshot.stages
      })
    });
    this.revision=String(payload?.revision||this.revision||snapshot.updatedAt);
    return {ok:true,revision:this.revision};
  }
  async updateRentalCapacity(productId,total){
    const payload=await this.request('/crm/rental-capacity',{
      method:'POST',
      headers:this.revision?{'If-Match':this.revision}:{},
      body:JSON.stringify({productId:String(productId||''),total:Number(total)})
    });
    this.revision=String(payload?.revision||this.revision||'');
    return payload;
  }
  async createCallLink(eventId){
    return await this.request('/crm/call-link',{
      method:'POST',
      body:JSON.stringify({eventId:String(eventId||'')})
    });
  }
  async createClientPdf(eventId,purpose='download'){
    return await this.request('/crm/client-pdf',{
      method:'POST',
      body:JSON.stringify({eventId:String(eventId||''),purpose:String(purpose||'download')})
    });
  }
}
