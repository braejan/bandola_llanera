/**
 * Single source of truth for the `/historia` article.
 *
 * Typed per SDD spec #63 (H1–H7) and design #67.
 * Contract: body MUST be ReadonlyArray<Paragraph>, sources MUST be typed Source,
 * unconfirmed claims MUST be in callouts (NOT italics alone).
 *
 * Research scope (per obs #56–#59): Wikipedia ES only. Any claim beyond that
 * is wrapped in a callout with literal text "por confirmar".
 */

export interface Source {
  readonly url: string;
  readonly label: string;
}

export type Paragraph =
  | { readonly kind: 'p'; readonly text: string }
  | { readonly kind: 'em'; readonly text: string };

/**
 * A claim that is NOT confirmed by the current research budget.
 * Surfaced in DOM with class `.callout` and literal text "por confirmar"
 * per spec H3 / H3-1.
 */
export interface Callout {
  readonly text: string;
}

export interface ArticleSection {
  readonly id: string;
  readonly title: string;
  readonly body: ReadonlyArray<Paragraph>;
  readonly source: Source;
  readonly porConfirmar: ReadonlyArray<Callout>;
  readonly footnotes?: ReadonlyArray<string>;
}

export interface Article {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly sections: ReadonlyArray<ArticleSection>;
}

const WIKI_BANDOLA = {
  url: 'https://es.wikipedia.org/wiki/Bandola_llanera',
  label: 'Wikipedia ES — Bandola llanera',
} as const;

const WIKI_JOROPO = {
  url: 'https://es.wikipedia.org/wiki/Joropo_llanero',
  label: 'Wikipedia ES — Joropo llanero',
} as const;

const WIKI_ANSELMO = {
  url: 'https://es.wikipedia.org/wiki/Anselmo_L%C3%B3pez',
  label: 'Wikipedia ES — Anselmo López (desambiguación)',
} as const;

export const historiaArticle: Article = {
  id: 'historia',
  title: 'Historia de la bandola llanera',
  subtitle:
    'Origen, afinación, genealogía y contexto orinoquense de un instrumento del joropo.',
  sections: [
    {
      id: 'origen-historico',
      title: 'Origen histórico',
      body: [
        {
          kind: 'p',
          text: 'La bandola llanera es un instrumento de cuerda tradicional de los Llanos de Colombia y Venezuela, asociado al joropo.',
        },
        {
          kind: 'p',
          text: 'Tiene forma de pera, cuatro cuerdas (dos primas y dos bordones) y, en su forma tradicional, un diapasón con siete trastes.',
        },
        {
          kind: 'p',
          text: 'Según el arpista y compositor colombiano Carlos Cuco Rojas, la bandola llanera deriva del laúd español, que a su vez proviene del laúd árabe.',
        },
        {
          kind: 'p',
          text: 'Surgió por el deseo de los intérpretes llaneros de contar con un instrumento que soportara una interpretación con mayor rudeza, cosa que el bandolón, de cuerdas aceradas, no permitía.',
        },
        {
          kind: 'p',
          text: 'También recibe los nombres de bandola barinesa, casanareña, criolla, pin-pón y tradicional.',
        },
        {
          kind: 'p',
          text: 'La variante casanareña suele llevar dieciocho trastes en el diapasón; la variante pin-pón tiene tres cuerdas y tres bordones, con sonido grave que reemplaza al bajo para acompañar al bandolón.',
        },
      ],
      source: WIKI_BANDOLA,
      porConfirmar: [
        {
          text: 'La afirmación "Pedro Flórez fue el precursor inmediato de la cadena de bandolistas documentada" no aparece en Wikipedia ni en las páginas individuales consultadas.',
        },
      ],
    },
    {
      id: 'mani-y-afinacion',
      title: 'Maní y afinación',
      body: [
        {
          kind: 'p',
          text: 'La historiografía colombiana sitúa a Maní, en el departamento de Casanare, como el lugar en el que fue creada la primera bandola llanera.',
        },
        {
          kind: 'p',
          text: 'Existe una versión venezolana contradictoria que sitúa ese origen en el estado Portuguesa.',
        },
        {
          kind: 'p',
          text: 'El monumento a la bandola llanera se levanta en Maní.',
        },
        {
          kind: 'p',
          text: 'La afinación más común documentada en la fuente principal consultada es Mi, La, Re y La, es decir E-A-D-A.',
        },
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
          text: 'Una de las afinaciones referidas en el artículo de Wikipedia se asocia a Anselmo López como "temple básico", aunque la fuente no la nombra explícitamente con la notación A-D-A-E.',
        },
      ],
      source: WIKI_BANDOLA,
      porConfirmar: [
        {
          text: 'La asignación popular "A-D-A-E = afinación de Maní" no aparece literalmente en Wikipedia; las fuentes regionales serían las indicadas para confirmarla o refutarla.',
        },
      ],
      footnotes: [
        'Sobre la afinación A-D-A-E atribuida a Maní: por confirmar; la fuente consultada (es.wikipedia.org/wiki/Bandola_llanera) no la menciona de forma explícita con esa notación.',
      ],
    },
    {
      id: 'genealogia-de-bandolistas',
      title: 'Genealogía de bandolistas',
      body: [
        {
          kind: 'p',
          text: 'Entre los intérpretes documentados por Wikipedia se encuentran Pedro Flórez (con tilde en la ese) y Luis Quinitiva.',
        },
        {
          kind: 'p',
          text: 'Del lado venezolano, la lista incluye a Arévalo Tapia (Juan Carlos Silva Arévalo Tapia) y a Anselmo López.',
        },
        {
          kind: 'p',
          text: 'Anselmo López (1934-2016) fue un bandolista venezolano que, a principios de la década de 1970, innovó la técnica mixta de púa y dedos.',
        },
        {
          kind: 'p',
          text: 'Esa innovación permitió pulsar simultáneamente las cuerdas de dos maneras diferentes: una para las notas altas y otra para los bordones.',
        },
        {
          kind: 'p',
          text: 'El resultado fueron posibilidades polifónicas que las técnicas tradicionales no contemplaban.',
        },
        {
          kind: 'p',
          text: 'Las páginas individuales de los bandolistas colombianos referidos (Pedro Flórez, Luis Quinitiva) o bien no existen en Wikipedia, o son vacías o stubs.',
        },
      ],
      source: WIKI_BANDOLA,
      porConfirmar: [
        {
          text: 'La cadena causal Pedro Flórez → Luis Quinitiva → Arévalo Tapia → Anselmo López no está corroborada en Wikipedia. Las páginas individuales o no existen o son stubs.',
        },
        {
          text: 'La grafía "Pedro Flores" (sin tilde), recordada por la tradición oral local, podría ser una confusión ortográfica respecto de "Pedro Flórez", que es la forma escrita por Wikipedia.',
        },
        {
          text: 'El "precursor inmediato de Anselmo López que tocaba aún más criollo" no está documentado en las fuentes consultadas.',
        },
      ],
      footnotes: [
        'Sobre la variante "Pedro Flores" (sin tilde): por confirmar; Wikipedia escribe "Flórez" con tilde. Posible confusión ortográfica en la transmisión oral.',
      ],
    },
    {
      id: 'lutheria-y-resinas',
      title: 'Luthería y resinas',
      body: [
        {
          kind: 'p',
          text: 'Las fuentes consultadas dentro del presupuesto de esta investigación son Wikipedia ES sobre la bandola llanera y sobre el joropo llanero.',
        },
        {
          kind: 'p',
          text: 'Ninguna de esas dos fuentes aborda la construcción del instrumento ni los acabados o resinas empleados por los luthiers tradicionales.',
        },
      ],
      source: WIKI_BANDOLA,
      porConfirmar: [
        {
          text: 'El luthier Olimpo Díaz, mencionado en la tradición oral, no aparece documentado en las fuentes consultadas.',
        },
        {
          text: 'Requiere verificación en hemeroteca regional o en el Banco de la República / FUNDIMUSEO Casanare.',
        },
        {
          text: 'La tradición de acabados y resinas (copal, damar, colofonia, brea) en la luthería llanera no está documentada en las fuentes consultadas en este presupuesto.',
        },
        {
          text: 'La eventual diferencia entre barnices naturales llaneros y lacas sintéticas propias de la tradición andina no se ha podido establecer con las fuentes disponibles.',
        },
      ],
    },
    {
      id: 'contexto-orinoquense',
      title: 'Contexto orinoquense',
      body: [
        {
          kind: 'p',
          text: 'La Región de Los Llanos abarca el oriente de Colombia y el occidente, centro y oriente de Venezuela.',
        },
        {
          kind: 'p',
          text: 'En Colombia comprende los departamentos de Arauca, Casanare, Meta y Vichada, y se extiende al Piedemonte llanero y a municipios de Caquetá, Guainía y Guaviare.',
        },
        {
          kind: 'p',
          text: 'En Venezuela comprende los estados Apure, Barinas, Cojedes, Guárico y Portuguesa, más algunos municipios de Anzoátegui y Monagas.',
        },
        {
          kind: 'p',
          text: 'La bandola llanera es un instrumento propio del joropo llanero y apenas se encuentra en otras regiones de los dos países o en otros géneros musicales.',
        },
        {
          kind: 'p',
          text: 'Según el artículo sobre el joropo, el instrumento puede tener hasta cinco cuerdas, mientras que el artículo dedicado a la bandola describe únicamente la forma tradicional de cuatro cuerdas.',
        },
      ],
      source: WIKI_JOROPO,
      porConfirmar: [],
    },
    {
      id: 'conclusion',
      title: 'Conclusión',
      body: [
        {
          kind: 'p',
          text: 'La bandola llanera es un instrumento de tradición regional cuya forma, función y repertorio están estrechamente ligados al joropo.',
        },
        {
          kind: 'p',
          text: 'Su origen se disputa entre Maní, en Casanare, y Portuguesa, en Venezuela.',
        },
        {
          kind: 'p',
          text: 'Su afinación más común está documentada como E-A-D-A; existen otras variantes referidas por la investigadora Isabel Aretz.',
        },
        {
          kind: 'p',
          text: 'La cadena causal de bandolistas que suele repetirse en la transmisión oral no se encuentra corroborada en las fuentes enciclopédicas consultadas.',
        },
        {
          kind: 'p',
          text: 'La cadena referida es: Pedro Flórez → Luis Quinitiva → Arévalo Tapia → Anselmo López.',
        },
        {
          kind: 'p',
          text: 'Esa ausencia se señala explícitamente como "por confirmar" en la sección correspondiente.',
        },
        {
          kind: 'p',
          text: 'Quedan fuera de este presupuesto dos líneas de investigación relevantes: la luthería llanera y la genealogía biográfica completa.',
        },
        {
          kind: 'p',
          text: 'La luthería incluye el nombre del luthier Olimpo Díaz y la tradición de resinas; la genealogía abarca a los bandolistas colombianos.',
        },
        {
          kind: 'p',
          text: 'Su incorporación futura robustecerá tanto la sección de luthería como la de genealogía.',
        },
      ],
      source: WIKI_BANDOLA,
      porConfirmar: [],
    },
  ],
};
