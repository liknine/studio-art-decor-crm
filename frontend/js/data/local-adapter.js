class LocalCRMAdapter{
  constructor(){
    this.name='local';
    this.keys=[CRM_STORAGE_KEY,...CRM_LEGACY_STORAGE_KEYS];
    this.writeBlockedError=null;
  }
  async load(defaultStages){
    for(const key of this.keys){
      let raw;
      try{
        raw=localStorage.getItem(key);
      }catch(err){
        throw this.loadFailure('read',key,err);
      }
      if(!raw)continue;

      let payload;
      try{
        payload=JSON.parse(raw);
      }catch(err){
        throw this.loadFailure('parse',key,err);
      }
      if(!payload || !Array.isArray(payload.stages)){
        throw this.loadFailure('validate',key,new Error('Invalid CRM storage payload'));
      }

      const normalized=normalizeStages(payload.stages);
      if(key!==CRM_STORAGE_KEY || payload.version!==CRM_SCHEMA_VERSION){
        try{
          localStorage.setItem(CRM_STORAGE_KEY,JSON.stringify({
            version:CRM_SCHEMA_VERSION,
            updatedAt:new Date().toISOString(),
            stages:normalized
          }));
        }catch(err){
          throw this.loadFailure('migrate',key,err);
        }
      }
      return {stages:normalized,revision:String(payload.updatedAt||'local')};
    }

    const initial=normalizeStages(defaultStages);
    await this.save(crmSnapshot(initial));
    return {stages:initial,revision:'local-initial'};
  }
  async save(snapshot){
    if(this.writeBlockedError){
      const error=new Error('Local CRM storage save blocked after a failed load');
      error.name='LocalCRMStorageError';
      error.code='LOCAL_STORAGE_BLOCKED';
      error.operation='save';
      error.storageKey=this.writeBlockedError.storageKey;
      error.cause=this.writeBlockedError;
      throw error;
    }
    let serialized;
    try{
      serialized=JSON.stringify(snapshot);
      localStorage.setItem(CRM_STORAGE_KEY,serialized);
    }catch(err){
      throw this.error('save',CRM_STORAGE_KEY,err);
    }
    return {ok:true,revision:String(snapshot.updatedAt||Date.now())};
  }
  error(operation,key,cause){
    const message=cause instanceof Error?cause.message:String(cause||'Unknown storage error');
    const error=new Error(`Local CRM storage ${operation} failed: ${message}`);
    error.name='LocalCRMStorageError';
    error.code='LOCAL_STORAGE_ERROR';
    error.operation=operation;
    error.storageKey=key;
    error.cause=cause;
    return error;
  }
  loadFailure(operation,key,cause){
    const error=this.error(operation,key,cause);
    this.writeBlockedError=error;
    return error;
  }
}
