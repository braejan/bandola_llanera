import type { Article } from './historia';
import { WIKI_BANDOLA } from './_sources';

/**
 * Typed Article for `/afinacion/`. Sourced only from the Wikipedia ES allowlist.
 * Anything beyond the source evidence is wrapped in a `.callout` with literal
 * text "Por confirmar" (INV-2).
 *
 * REQ-M-007 / INV-1 / INV-2 / INV-6.
 */
export const afinacionArticle: Article = {
  id: 'afinacion',
  title: 'Afinación de la bandola llanera',
  subtitle:
    'Afinación más común, variantes documentadas y notas pedagógicas para empezar a tocar.',
  sections: [
    {
      id: 'afinacion-comun',
      title: 'Afinación más común (E-A-D-A)',
      body: [
        {
          kind: 'p',
          text: 'Según el artículo de Wikipedia sobre la bandola llanera, la afinación más común es Mi, La, Re y La, es decir E-A-D-A.',
        },
        {
          kind: 'p',
          text: 'Las cuatro cuerdas se enumeran de la más aguda a la más grave, con dos primas (mi y la) y dos bordones (re y la).',
        },
      ],
      source: WIKI_BANDOLA,
      porConfirmar: [],
    },
    {
      id: 'variantes-documentadas',
      title: 'Variantes documentadas por Aretz',
      body: [
        {
          kind: 'p',
          text: 'La investigadora Isabel Aretz (1967, "Instrumentos musicales de Venezuela", Universidad de Oriente, Cumaná, pp. 162-163) documenta además otras afinaciones.',
        },
        {
          kind: 'p',
          text: 'Entre las variantes referidas por Aretz se cuentan Mi-Si-Mi-La, Sol-Do-Re-La y Mi-La-Mi-La.',
        },
        {
          kind: 'p',
          text: 'Estas variantes amplían el espacio sonoro del instrumento manteniendo la técnica de púa mixta.',
        },
      ],
      source: WIKI_BANDOLA,
      porConfirmar: [],
    },
    {
      id: 'temple-basico-anselmo',
      title: 'Anselmo López y el "temple básico"',
      body: [
        {
          kind: 'p',
          text: 'Una de las afinaciones referidas en el artículo de Wikipedia se asocia a Anselmo López como "temple básico", aunque la fuente no la nombra explícitamente con la notación A-D-A-E.',
        },
        {
          kind: 'p',
          text: 'Anselmo López (1934-2016) fue un bandolista venezolano que, a principios de la década de 1970, innovó la técnica mixta de púa y dedos.',
        },
      ],
      source: WIKI_BANDOLA,
      porConfirmar: [
        {
          text: 'La asignación popular "A-D-A-E = afinación de Maní" no aparece literalmente en Wikipedia; las fuentes regionales serían las indicadas para confirmarla o refutarla.',
        },
      ],
    },
    {
      id: 'forma-del-instrumento',
      title: 'Forma del instrumento (4 cuerdas)',
      body: [
        {
          kind: 'p',
          text: 'La bandola llanera tiene forma de pera, cuatro cuerdas (dos primas y dos bordones) y, en su forma tradicional, un diapasón con siete trastes.',
        },
        {
          kind: 'p',
          text: 'La variante casanareña suele llevar dieciocho trastes en el diapasón; la variante pin-pón tiene tres cuerdas y tres bordones, con sonido grave que reemplaza al bajo para acompañar al bandolón.',
        },
      ],
      source: WIKI_BANDOLA,
      porConfirmar: [],
    },
    {
      id: 'conclusion-pedagogica',
      title: 'Para empezar a tocar',
      body: [
        {
          kind: 'p',
          text: 'Para el estudiante que se acerca por primera vez, la afinación E-A-D-A ofrece un punto de partida claro: dos primas en Mi y La, dos bordones en Re y La.',
        },
        {
          kind: 'p',
          text: 'A partir de esa base, las variantes referidas por Aretz (Mi-Si-Mi-La, Sol-Do-Re-La, Mi-La-Mi-La) abren rutas estilísticas dentro del joropo.',
        },
      ],
      source: WIKI_BANDOLA,
      porConfirmar: [],
    },
  ],
};
