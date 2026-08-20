const CRMDataLayer={
  adapter:null,
  revision:'',
  rentalItems:null,
  status:'idle',
  pendingSave:Promise.resolve(),
  dirty:false,
  lastError:null,
  lastRefreshError:null,
  refreshInFlight:null,
  errorHandler:null,
  saveSequence:0,
  savedSequence:0,
  setErrorHandler(handler){
    this.errorHandler=typeof handler==='function'?handler:null;
  },
  reportError(operation,err){
    const error=err instanceof Error?err:new Error(String(err||'Unknown CRM data error'));
    error.dataOperation=operation;
    this.status='error';
    this.lastError=error;
    console.error(operation==='load'?'CRM data bootstrap failed':'CRM save failed',error);
    try{this.errorHandler?.(error,operation)}catch(handlerError){
      console.error('CRM error notification failed',handlerError);
    }
    return error;
  },
  chooseAdapter(){
    return CRM_DATA_CONFIG.mode==='http'
      ? new HttpCRMAdapter(CRM_DATA_CONFIG)
      : new LocalCRMAdapter();
  },
  async init(defaultStages){
    this.adapter=this.chooseAdapter();
    this.status='loading';
    try{
      const loaded=await this.adapter.load(defaultStages);
      this.revision=loaded.revision||'';
      this.rentalItems=Array.isArray(loaded.rentalItems)?loaded.rentalItems:null;
      this.status='ready';
      this.lastError=null;
      return normalizeStages(loaded.stages);
    }catch(err){
      throw this.reportError('load',err);
    }
  },
  save(currentStages){
    if(!this.adapter || this.status==='idle' || this.status==='loading'){
      const error=new Error('CRM data layer is not ready to save');
      error.name='CRMDataLayerStateError';
      error.code='CRM_NOT_READY';
      return Promise.reject(this.reportError('save',error));
    }
    const snapshot=crmSnapshot(currentStages);
    const sequence=++this.saveSequence;
    this.dirty=true;
    this.pendingSave=this.pendingSave
      .catch(()=>{})
      .then(async()=>{
        try{
          const result=await this.adapter.save(snapshot);
          this.revision=result?.revision||this.revision;
          this.savedSequence=Math.max(this.savedSequence,sequence);
          this.dirty=this.savedSequence<this.saveSequence;
          this.status=this.dirty?'saving':'ready';
          if(!this.dirty)this.lastError=null;
          return result;
        }catch(err){
          this.dirty=true;
          throw this.reportError('save',err);
        }
      });
    return this.pendingSave;
  },
  async refresh(currentStages){
    if(!this.adapter || this.status==='idle' || this.status==='loading' || this.dirty){
      return {changed:false,skipped:true,stages:null,revision:this.revision};
    }
    if(this.refreshInFlight)return await this.refreshInFlight;
    const previousRevision=String(this.revision||'');
    const startingSaveSequence=this.saveSequence;
    this.refreshInFlight=(async()=>{
      try{
        const loaded=await this.adapter.load(currentStages);
        /* A user save may start while the GET is in flight. Never apply that
           older snapshot over a local mutation or over a completed newer save. */
        if(this.dirty || this.saveSequence!==startingSaveSequence){
          return {changed:false,skipped:true,stages:null,revision:this.revision};
        }
        const nextRevision=String(loaded.revision||'');
        let changed=nextRevision!==previousRevision;
        if(/^\d+$/.test(previousRevision) && /^\d+$/.test(nextRevision)){
          changed=BigInt(nextRevision)>BigInt(previousRevision);
        }
        if(!changed){
          this.status='ready';
          this.lastRefreshError=null;
          return {changed:false,skipped:false,stages:null,revision:this.revision};
        }
        this.revision=nextRevision;
        this.rentalItems=Array.isArray(loaded.rentalItems)?loaded.rentalItems:this.rentalItems;
        this.status='ready';
        this.lastRefreshError=null;
        return {
          changed:true,
          skipped:false,
          stages:normalizeStages(loaded.stages),
          rentalItems:Array.isArray(loaded.rentalItems)?loaded.rentalItems:null,
          revision:nextRevision
        };
      }catch(err){
        this.lastRefreshError=err instanceof Error?err:new Error(String(err||'CRM refresh failed'));
        return {changed:false,skipped:false,stages:null,revision:this.revision,error:this.lastRefreshError};
      }finally{
        this.refreshInFlight=null;
      }
    })();
    return await this.refreshInFlight;
  },
  async flush(){
    return await this.pendingSave;
  },
  async createCallLink(eventId){
    if(!this.adapter || typeof this.adapter.createCallLink!=='function'){
      const error=new Error('Protected call handoff requires the production API');
      error.code='FEATURE_REQUIRES_SERVER';
      throw error;
    }
    return await this.adapter.createCallLink(eventId);
  },
  async createClientPdf(eventId,purpose='download'){
    if(!this.adapter || typeof this.adapter.createClientPdf!=='function'){
      const error=new Error('Client PDF requires the production API');
      error.code='FEATURE_REQUIRES_SERVER';
      throw error;
    }
    return await this.adapter.createClientPdf(eventId,purpose);
  }
};

/* Compatibility façade: UI calls this, not localStorage/fetch directly. */
function persistCRM(){
  CRMDataLayer.save(stages).catch(()=>{/* reportError already recorded and notified the failure. */});
  return true;
}
