/** N-7 dialogue catalogue: deterministic trigger lookup, no runtime hooks. */
export const N7_DIALOGUES=Object.freeze({
 sectorStart:Object.freeze({
  1:'N-7 en línea. Bienvenido a los Suburbios Neón. Aprende a leer las corrientes.',
  2:'Las redes urbanas despiertan. Cada paquete de datos es una pista.',
  3:'Los procesadores industriales están fuera de control. Mantén la nave estable.',
  4:'La Matriz Cibernética registra nuestros movimientos. Evita sus centinelas.',
  5:'Entramos en el Abismo. Mi origen está al otro lado del núcleo.'
 }),
 bossWarning:Object.freeze({
  10:'Firma hostil detectada: Centinela Prisma. Prepárate para dos fases.',
  20:'Guardián del Umbral en ruta. Su barrera no permanecerá activa siempre.',
  30:'Firewall Viviente. Observa sus disparos antes de contraatacar.',
  40:'Arquitecto de Datos. Sus defensas se reorganizan.',
  50:'Forjador de Silicio. El calor de sus sistemas altera el campo.',
  60:'Titán de Procesos. Detecto una segunda fase blindada.',
  70:'Supervisor de Nodos. Sus proyectiles se dispersan en abanico.',
  80:'Matriz Centinela. Espera la caída de su barrera.',
  90:'Eco del Abismo. Sus señales imitan las mías.',
  100:'El núcleo corrupto usa mi firma. No confundas su voz con la mía.'
 }),
 criticalHull:'Integridad crítica. Prioriza la supervivencia y busca reparación.',
 perfectStreak:'Racha perfecta confirmada. La sincronización es extraordinaria.'
});
export function n7Dialogue(event,{level,hull,perfectStreak=false}={}){
 if(event==='sectorStart'){if(!Number.isInteger(level)||level<1||level>100)return null;return (level-1)%20===0?N7_DIALOGUES.sectorStart[Math.floor((level-1)/20)+1]:null;}
 if(event==='bossWarning')return N7_DIALOGUES.bossWarning[level]??null;
 if(event==='criticalHull')return Number.isFinite(hull)&&hull<=20?N7_DIALOGUES.criticalHull:null;
 if(event==='perfectStreak')return perfectStreak?N7_DIALOGUES.perfectStreak:null;
 return null;
}
