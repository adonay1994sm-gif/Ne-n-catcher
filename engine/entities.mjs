export class EntityWorld{
  constructor(){this.entities=new Map();this.nextId=1;}
  add(type,data={}){const entity={...data,id:this.nextId++,type};this.entities.set(entity.id,entity);return entity;}
  remove(id){return this.entities.delete(id);}
  ofType(type){return [...this.entities.values()].filter(entity=>entity.type===type);}
  clear(){this.entities.clear();}
  update(dt){for(const entity of this.entities.values()){entity.x+=(entity.vx||0)*dt;entity.y+=(entity.vy||0)*dt;}}
}
