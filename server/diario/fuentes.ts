// Fuentes de la edición. Todas verificadas (HTTP 200, notas del día) el 13/10/2026.
// Una misma URL puede aparecer en más de una sección con filtros distintos:
// se pide una sola vez.

import type { SeccionId } from './tipos.js';

export interface Fuente {
  id:        string;
  nombre:    string;
  url:       string;
  seccion:   SeccionId;
  tags:      string[];      // se suman a las <category> del feed
  idioma:    'es' | 'en';
  maxHoras:  number;        // antigüedad máxima aceptada
  incluir?:  RegExp;        // sobre título, bajada y categorías del feed
  excluir?:  RegExp;
}

const H48 = 48;
const SEMANA = 24 * 7;
const MES = 24 * 30;

// Los términos deben empezar palabra: "cienc" no tiene que coincidir con "eficiencia"
// ni "ética" con "genética".
const CIENCIA = /(?<!\p{L})(cienci|científ|planeta|climátic|biolog|físic|universo|cerebr|neuro|evoluci|especie|célula|genétic|astron|astrof|fósil|océano|vacuna|virus|bacteria|matemátic|químic|dinosaur|galaxia|telescop|materia oscura|cuántic|ecosistema|volcán|terremoto|paleont|molécul|átomo|nasa|descubr)/iu;
const FILOSOFIA = /(?<!\p{L})(filosof|ética|moral|pensamiento|existenc|conciencia|libertad|sentido de la vida|virtud|estoic|metafísic|sócrates|platón|aristóteles|nietzsche|kant|spinoza|camus|sartre)/iu;
const OFERTAS = /oferta|rebaj|descuento|amazon|precio|chollo|black friday|cupón|cyber/i;
const NO_CIENCIA = /oferta|rebaj|descuento|amazon|precio|chollo|historia|biograf|famos|celebrit|televisi|película|serie|actor|actriz/i;

export const FUENTES: Fuente[] = [
  // ── Argentina
  { id: 'infobae-politica', nombre: 'Infobae',   url: 'https://www.infobae.com/arc/outboundfeeds/rss/category/politica/', seccion: 'argentina', tags: ['argentina', 'política'], idioma: 'es', maxHoras: H48 },
  { id: 'pagina12',         nombre: 'Página/12', url: 'https://www.pagina12.com.ar/arc/outboundfeeds/rss/secciones/el-pais/notas', seccion: 'argentina', tags: ['argentina', 'política'], idioma: 'es', maxHoras: H48 },
  { id: 'perfil',           nombre: 'Perfil',    url: 'https://www.perfil.com/feed', seccion: 'argentina', tags: ['argentina', 'sociedad'], idioma: 'es', maxHoras: H48 },
  { id: 'clarin-politica',  nombre: 'Clarín',    url: 'https://www.clarin.com/rss/politica/', seccion: 'argentina', tags: ['argentina', 'política'], idioma: 'es', maxHoras: H48 },
  // ── Contexto ("Por qué importa")
  { id: 'chequeado', nombre: 'Chequeado', url: 'https://chequeado.com/feed/?post_type=nota', seccion: 'contexto', tags: ['argentina', 'chequeo'], idioma: 'es', maxHoras: SEMANA },
  { id: 'ambito',    nombre: 'Ámbito',    url: 'https://www.ambito.com/rss/pages/home.xml', seccion: 'contexto', tags: ['economía', 'argentina'], idioma: 'es', maxHoras: H48 },
  // ── Mundo y tecnología
  { id: 'xataka',        nombre: 'Xataka',       url: 'https://www.xataka.com/feedburner.xml', seccion: 'tecnologia', tags: ['tecnología'], idioma: 'es', maxHoras: H48, excluir: OFERTAS },
  { id: 'hipertextual',  nombre: 'Hipertextual', url: 'https://hipertextual.com/feed/', seccion: 'tecnologia', tags: ['tecnología'], idioma: 'es', maxHoras: H48, excluir: OFERTAS },
  { id: 'infobae-tecno', nombre: 'Infobae',      url: 'https://www.infobae.com/arc/outboundfeeds/rss/category/tecno/', seccion: 'tecnologia', tags: ['tecnología'], idioma: 'es', maxHoras: H48, excluir: OFERTAS },
  { id: 'bbc-mundo',     nombre: 'BBC Mundo',    url: 'https://feeds.bbci.co.uk/mundo/rss.xml', seccion: 'internacional', tags: ['internacional'], idioma: 'es', maxHoras: H48 },
  { id: 'elpais-int',    nombre: 'El País',      url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada', seccion: 'internacional', tags: ['internacional'], idioma: 'es', maxHoras: 72 },
  { id: 'france24',      nombre: 'France 24',    url: 'https://www.france24.com/es/rss', seccion: 'internacional', tags: ['internacional'], idioma: 'es', maxHoras: H48 },
  // ── Deportes
  { id: 'infobae-deportes', nombre: 'Infobae', url: 'https://www.infobae.com/arc/outboundfeeds/rss/category/deportes/', seccion: 'deportes', tags: ['deporte'], idioma: 'es', maxHoras: H48 },
  { id: 'ole',              nombre: 'Olé',     url: 'https://www.ole.com.ar/rss/ultimas-noticias/', seccion: 'deportes', tags: ['deporte'], idioma: 'es', maxHoras: H48 },
  // ── Ciencia
  { id: 'conversation-ciencia', nombre: 'The Conversation', url: 'https://theconversation.com/es/articles.atom', seccion: 'ciencia', tags: ['ciencia'], idioma: 'es', maxHoras: SEMANA, incluir: CIENCIA },
  { id: 'sinc',                 nombre: 'Agencia SINC',     url: 'https://www.agenciasinc.es/feed/Ciencia', seccion: 'ciencia', tags: ['ciencia'], idioma: 'es', maxHoras: SEMANA * 2 },
  { id: 'muy-interesante',      nombre: 'Muy Interesante',  url: 'https://muyinteresante.okdiario.com/feed/', seccion: 'ciencia', tags: ['ciencia'], idioma: 'es', maxHoras: SEMANA, incluir: CIENCIA, excluir: NO_CIENCIA },
  // ── Filosofía
  { id: 'filco',                   nombre: 'Filosofía&Co',     url: 'https://filco.es/feed/', seccion: 'filosofia', tags: ['filosofía'], idioma: 'es', maxHoras: MES },
  { id: 'ethic',                   nombre: 'Ethic',            url: 'https://ethic.es/feed/', seccion: 'filosofia', tags: ['filosofía', 'ética'], idioma: 'es', maxHoras: MES, incluir: FILOSOFIA },
  { id: 'conversation-filosofia', nombre: 'The Conversation', url: 'https://theconversation.com/es/articles.atom', seccion: 'filosofia', tags: ['filosofía'], idioma: 'es', maxHoras: MES, incluir: FILOSOFIA },
  // ── Cultura e intereses
  { id: 'godot',          nombre: 'Godot Engine',   url: 'https://godotengine.org/rss.xml', seccion: 'cultura', tags: ['godot', 'desarrollo', 'videojuegos'], idioma: 'en', maxHoras: MES },
  { id: 'sk-anime',       nombre: 'Somoskudasai',   url: 'https://somoskudasai.com/noticias/anime/feed/', seccion: 'cultura', tags: ['anime'], idioma: 'es', maxHoras: SEMANA },
  { id: 'sk-manga',       nombre: 'Somoskudasai',   url: 'https://somoskudasai.com/noticias/manga/feed/', seccion: 'cultura', tags: ['manga'], idioma: 'es', maxHoras: SEMANA },
  { id: 'sk-videojuegos', nombre: 'Somoskudasai',   url: 'https://somoskudasai.com/noticias/videojuegos/feed/', seccion: 'cultura', tags: ['videojuegos'], idioma: 'es', maxHoras: SEMANA },
  { id: '3djuegos',       nombre: '3DJuegos',       url: 'https://www.3djuegos.com/feedburner.xml', seccion: 'cultura', tags: ['videojuegos'], idioma: 'es', maxHoras: SEMANA, excluir: OFERTAS },
  { id: 'vandal',         nombre: 'Vandal',         url: 'https://vandal.elespanol.com/xml.cgi', seccion: 'cultura', tags: ['videojuegos'], idioma: 'es', maxHoras: SEMANA, excluir: OFERTAS },
  { id: 'espinof',        nombre: 'Espinof',        url: 'https://www.espinof.com/feedburner.xml', seccion: 'cultura', tags: ['cine', 'series'], idioma: 'es', maxHoras: SEMANA },
  { id: 'ramen',          nombre: 'Ramen Para Dos', url: 'https://ramenparados.com/feed/', seccion: 'cultura', tags: ['manga', 'anime'], idioma: 'es', maxHoras: SEMANA },
];
