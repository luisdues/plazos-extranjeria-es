# plazos-extranjeria-es

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22696991.svg)](https://doi.org/10.5281/zenodo.22696991)

Datos abiertos y una librería pequeña para calcular **plazos administrativos de extranjería en España**:

- **Días inhábiles de 2026** del Estado y de las **19 comunidades y ciudades autónomas**, tomados del anexo del calendario oficial publicado en el BOE (art. 30.7 de la Ley 39/2015).
- **Plazo máximo de resolución y sentido del silencio** de **32 trámites de extranjería** (arraigos, renovaciones, reagrupación, larga duración, visados, Ley de emprendedores, NIE, asilo, nacionalidad, recursos), cada uno con su artículo.
- Funciones en JavaScript, sin dependencias, que aplican las reglas de cómputo del **art. 30 de la Ley 39/2015**: meses de fecha a fecha, días hábiles sin sábados, domingos ni festivos, y prórroga al primer día hábil.

Es el motor de la [calculadora de plazos de extranjería](https://esextranjeria.es/calculadora-plazos) de esextranjeria.es, donde se puede usar sin instalar nada. La tabla de trámites, comentada caso por caso, está en [cuánto tarda extranjería en resolver cada trámite](https://esextranjeria.es/blog/cuanto-tarda-extranjeria-resolver-tramites-2026).

## Datos

| Fichero | Contenido |
|---|---|
| `data/dias-inhabiles.json` | Festivos nacionales de 2026, festivos de cada comunidad autónoma y un avance provisional de 2027 |
| `data/dias-inhabiles-2026.csv` | Lo mismo en una fila por día: `fecha, ambito, ccaa, ccaa_nombre, confirmado` |
| `data/tramites-plazos-silencio.json` | 32 trámites: `slug, tramite, plazo, cantidad, unidad, silencio, norma` |
| `data/tramites-plazos-silencio.csv` | Lo mismo en CSV |

Claves de comunidad: `andalucia`, `aragon`, `asturias`, `baleares`, `canarias`, `cantabria`, `castilla-la-mancha`, `castilla-y-leon`, `cataluna`, `valencia`, `extremadura`, `galicia`, `madrid`, `murcia`, `navarra`, `pais-vasco`, `rioja`, `ceuta`, `melilla`.

## Uso

```js
const P = require('./src/plazos.js');

// Denegación notificada el 10-09-2026: último día para el recurso de reposición (1 mes)
P.vencimiento('2026-09-10', 1, 'meses');
// { vence: '2026-10-13', venceSinProrroga: '2026-10-10', prorrogado: true }
// El 10-10 es sábado y el 12-10 festivo nacional: se prorroga al martes 13.

// Requerimiento de subsanación recibido el 24-12-2026 en Madrid: 10 días hábiles
P.vencimiento('2026-12-24', 10, 'habiles', 'madrid').vence; // '2027-01-12'

// Hasta cuándo tiene la Administración para resolver una renovación, y qué pasa después
P.plazoResolucion('renovacion-residencia-trabajo-cuenta-ajena', '2026-09-15', 'valencia');
// { vence: '2026-12-15', silencio: 'positivo', norma: 'RD 1155/2024, art. 80.9', ... }
```

Funciones: `vencimiento`, `plazoResolucion`, `sumarMeses`, `sumarHabiles`, `sumarNaturales`, `primerHabil`, `esInhabil`, `diasInhabiles`, `comunidades`, `tramite` y el array `tramites`. Las fechas entran y salen como `AAAA-MM-DD`, y los cálculos se hacen en UTC para que el cambio de hora no mueva ningún día.

```sh
npm test   # node --test, sin dependencias
```

## Fuentes

- Resolución de 18 de noviembre de 2025, de la Secretaría de Estado de Función Pública, por la que se establece el calendario de días inhábiles en el ámbito de la Administración General del Estado para el año 2026: [BOE-A-2025-23702](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-23702). Se ha leído el anexo del XML oficial del BOE.
- [Ley 39/2015](https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565), arts. 21-24 (plazo y silencio), 30 (cómputo), 68 (subsanación), 122 y 124 (recursos).
- [Ley Orgánica 4/2000](https://www.boe.es/buscar/act.php?id=BOE-A-2000-544) (disposición adicional primera) y [Real Decreto 1155/2024](https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099), Reglamento de extranjería; además la Ley 14/2013, el RD 240/2007, la Ley 12/2009, el RD 1004/2015 y el Reglamento (CE) 810/2009 para los trámites que citan.

Cada fila de `tramites-plazos-silencio` lleva su artículo en el campo `norma`.

## Límites

- **No incluye los dos festivos locales** de cada municipio. También son inhábiles en su término municipal, así que solo pueden alargar un plazo, nunca acortarlo.
- **2027 es provisional**: solo recoge los festivos nacionales fijos y el Viernes Santo hasta que se publique el calendario oficial (suele salir en noviembre). Cuando un cálculo cae en 2027 la función devuelve un `aviso`.
- Los plazos de resolución **se suspenden** mientras dura un requerimiento de subsanación (art. 22.1.a de la Ley 39/2015). La librería no puede saberlo: hay que sumar ese tiempo.
- Es información, no asesoramiento jurídico. Ante un plazo que vence, confírmalo con la resolución que te han notificado.

## English

Open data and a tiny dependency-free JavaScript library for **Spanish administrative deadlines in immigration procedures**: the 2026 official calendar of non-working days for the State and all 19 autonomous communities (from the BOE), the maximum decision time and the effect of administrative silence for 32 immigration procedures (renewals, family reunification, long-term residence, visas, digital nomad and other Startup Law permits, NIE, asylum, citizenship, appeals), and functions that apply the counting rules of article 30 of Law 39/2015. English guides to Spanish visas and residence permits: [esextranjeria.es/en](https://esextranjeria.es/en/).

## Cómo citarlo

Durá Esteve, L. (2026). *plazos-extranjeria-es: días inhábiles 2026 y plazos de resolución de los trámites de extranjería en España* (v1.0.0) [Conjunto de datos]. Zenodo. https://doi.org/10.5281/zenodo.22696991

## Licencia

MIT. Mantenido por [esextranjeria.es](https://esextranjeria.es). Si detectas un error en un plazo o un festivo, abre una incidencia con la referencia del BOE.
