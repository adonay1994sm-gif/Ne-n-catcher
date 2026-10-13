import {levelDefinition} from './sectors.js';

// Authored route and encounter order. Randomness only arranges each encounter.
const TITLES = [
  ['Primer pulso', 'Calle del despertar', 'Luces sin dueño', 'El primer desvío', 'Ecos del mercado', 'Señales cruzadas', 'Puente de retorno', 'Danza de antenas', 'Antes del prisma', 'Centinela Prisma', 'Un nombre borrado', 'Jardines de datos', 'El callejón azul', 'Correo perdido', 'Faros en la niebla', 'Patrulla de barrio', 'Dos rutas, una salida', 'La puerta muda', 'Código de acceso', 'Guardián del Umbral'],
  ['La red fragmentada', 'Avenida de paquetes', 'Cruce sincronizado', 'El mensajero', 'Rutas de energía', 'La estación vacía', 'Voces en paralelo', 'Cifrado rojo', 'Al otro lado del muro', 'Firewall Viviente', 'Pista de auditoría', 'La ciudad escucha', 'Repetidores', 'Mensaje de Asha', 'El primer tirador', 'Ventana de transmisión', 'Calles coordinadas', 'El mapa incompleto', 'Permiso denegado', 'Arquitecto de Datos'],
  ['Memoria térmica', 'Cintas de silicio', 'La fábrica dormida', 'Prensa de luz', 'Reciclar el pasado', 'Hornos de memoria', 'Turno fantasma', 'Válvulas de fuga', 'La firma de N-7', 'Forjador de Silicio', 'Archivo de origen', 'Engranajes rotos', 'La copia de seguridad', 'Sala de ensamblaje', 'El pulso industrial', 'Cadena de mando', 'Proceso huérfano', 'Detener la prensa', 'Último turno', 'Titán de Procesos'],
  ['La verdad de la Matriz', 'Ojos del servidor', 'Un recuerdo prestado', 'Espejos de vigilancia', 'Orden de silencio', 'Nodos hermanos', 'La llave de Asha', 'Registro prohibido', 'El testigo central', 'Supervisor de Nodos', 'La orden original', 'Recursión', 'Firmas compartidas', 'La ruta de emergencia', 'Consentimiento', 'Romper el protocolo', 'La voz de Custodio', 'Puertas de la Matriz', 'Nadie queda atrás', 'Matriz Centinela'],
  ['El Abismo', 'Copia sin cuerpo', 'El pulso que falta', 'Entre dos memorias', 'La señal verdadera', 'Fragmentos de Asha', 'El error voluntario', 'La última réplica', 'Escuchar al eco', 'Eco del Abismo', 'El archivo vivo', 'Restituir los nombres', 'Un cielo posible', 'Decisión compartida', 'Liberar la red', 'N-7 recuerda', 'Todos los caminos', 'El último cortafuegos', 'Hasta el núcleo', 'N-7: Núcleo Corrupto']
];

const RHYTHMS = [
  ['linear', 'linear', 'recovery'], ['linear', 'split', 'recovery'],
  ['split', 'linear', 'crosscurrent'], ['linear', 'crosscurrent', 'recovery'],
  ['split', 'crosscurrent', 'split'], ['crosscurrent', 'linear', 'recovery'],
  ['linear', 'zigzag', 'recovery'], ['zigzag', 'split', 'zigzag'],
  ['split', 'zigzag', 'recovery'], ['linear', 'split', 'recovery'],
  ['crosscurrent', 'zigzag', 'split'], ['split', 'crosscurrent', 'recovery'],
  ['zigzag', 'linear', 'split'], ['crosscurrent', 'split', 'recovery'],
  ['split', 'zigzag', 'crosscurrent'], ['zigzag', 'crosscurrent', 'recovery'],
  ['crosscurrent', 'split', 'zigzag'], ['zigzag', 'split', 'crosscurrent'],
  ['split', 'crosscurrent', 'recovery'], ['crosscurrent', 'zigzag', 'recovery']
];

const OBJECTIVES = [
  'Lee las señales y recupera núcleos durante las oleadas.',
  'Alterna flancos para recuperar los paquetes perdidos.',
  'Cruza la corriente de maquinaria y conserva tu casco.',
  'Identifica las ventanas de las patrullas y recupera el registro.',
  'Recupera los fragmentos necesarios para abrir el núcleo.'
];

export function authoredLevel(level) {
  const definition = levelDefinition(level);
  const index = definition.withinSector - 1;
  const sector = definition.sectorId - 1;
  return Object.freeze({
    ...definition,
    title: TITLES[sector][index],
    mission: OBJECTIVES[sector],
    objective: 'recover-and-survive',
    goal: 14 + sector * 4 + Math.floor(index / 5) * 2,
    waveCount: 6 + Math.floor(index / 7),
    rhythm: Object.freeze(RHYTHMS[index].slice()),
    mechanics: Object.freeze([
      'linear', ...(level >= 7 ? ['zigzag'] : []),
      ...(level >= 24 ? ['chaser'] : []), ...(level >= 35 ? ['shooter'] : [])
    ]),
    recoveryEvery: sector < 2 ? 3 : 4,
    bossEncounter: definition.isBoss
  });
}

export const AUTHORED_LEVELS = Object.freeze(Array.from({length: 100}, (_, i) => authoredLevel(i + 1)));
