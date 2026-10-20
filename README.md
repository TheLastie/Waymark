# Waymark

## English

**A route should be more than a line on a map.** Waymark compares a small street network using the needs that change whether a trip is possible: steps, curb height, surface, slope, crossings, lighting and field verification. People can add a note to a segment and export a route report or a spreadsheet of observations.

![Waymark desktop preview](preview.png)

![Waymark mobile preview](preview-mobile.png)

The built-in Ufa-like map is an **illustrative sample**, not official street, navigation or accessibility data. Reports carry that warning with them. Use Waymark to explore route trade-offs and organize field checks; verify conditions on site before relying on a route.

## Try it

Open `index.html` in a recent browser. No build step, account, server or network access is required for the planner itself. Changes stay in local browser storage. Google Fonts are an optional visual enhancement; system fonts are used when offline.

1. Choose a start, destination and mobility profile.
2. Compare balanced, shortest and more thoroughly checked routes.
3. Select a street segment on the map to record its surface, slope, curb, crossing, lighting, verification and a note.
4. Download a route report (JSON), segment register (CSV), or a local map you can reopen later.

### Bring your own survey network

Waymark can open a small JSON network prepared from a local accessibility survey. Coordinates use the map's schematic view box (`x`: 20–980, `y`: 20–600); they position places for the diagram and do not imply geographic accuracy. Keep identifiers unique and use one record per walkable segment.

```json
{
  "places": [
    { "id": "stop-a", "name": "Bus stop", "x": 120, "y": 420 },
    { "id": "clinic", "name": "Clinic entrance", "x": 850, "y": 160 }
  ],
  "edges": [
    {
      "id": "sidewalk-01", "a": "stop-a", "b": "clinic", "km": 0.64,
      "surface": "smooth", "slope": 3, "curb": 0, "steps": false,
      "crossing": "signal", "lit": true, "verified": false, "note": ""
    }
  ]
}
```

`surface` accepts `unknown`, `smooth`, `pavers`, `rough`, or `gravel`; `crossing` accepts `unknown`, `none`, `marked`, `signal`, or `uncontrolled`. A network can contain 2–100 places and 1–500 segments. Missing measurements stay unknown, increase the route's uncertainty and remain visible in the report. The app validates imported data, keeps it in this browser, and flags user-provided information as unverified until someone records a field check.

## Why this project exists

City accessibility data is often incomplete or outdated. Waymark makes uncertainty visible instead of silently treating an unverified sidewalk as safe. Its useful output is a shareable list of exact segments to check, with enough context for a resident, community group or city team to discuss what needs fixing.

## Design and privacy

The visual idea is a **field atlas**: a quiet street-map palette with a distinct route line and separate marks for checked paths and questions to investigate. This makes confidence visible without turning accessibility into a score or decorating the interface with generic dashboards. There is no account or analytics; route choices and notes remain in this browser unless you export them.

## Русский

**Маршрут — это больше, чем линия на карте.** Waymark сравнивает варианты пути с учётом того, от чего зависит доступность прогулки: ступеней, высоты бордюра, покрытия, уклона, переходов, освещения и наличия полевой проверки. На отрезках можно оставить заметки и выгрузить отчёт по маршруту или таблицу наблюдений.

Встроенная схема в духе Уфы — **иллюстративный образец**, а не официальная карта улиц, навигации или доступности. Это предупреждение включается в экспорт. Waymark помогает сравнивать компромиссы и организовать проверку на месте; перед поездкой состояние маршрута нужно проверить самостоятельно.

Откройте `index.html` в современном браузере. Сборка, учётная запись, сервер и сетевое подключение для работы планировщика не нужны. Изменения сохраняются только в локальном хранилище браузера. Шрифты Google — необязательное оформление; без сети браузер использует системные шрифты.

1. Выберите начальную точку, место назначения и профиль передвижения.
2. Сравните сбалансированный, кратчайший и более тщательно проверенный маршруты.
3. Выберите отрезок улицы на карте и укажите покрытие, уклон, бордюр, переход, освещение, проверку и заметку.
4. Скачайте отчёт по маршруту (JSON), таблицу отрезков (CSV) или локальную карту для последующего открытия.

Waymark принимает собственные JSON-схемы районной сети: места с `id`, `name`, координатами схемы `x` и `y`, а также отрезки между ними с длиной и условиями прохода. Если измерений нет, они остаются неизвестными, влияют на сравнение маршрутов и видны в отчёте. Импортированные схемы можно редактировать, сохранить в браузере и выгрузить вместе с пометками. Пример и допустимые поля находятся выше.

### GEO и SEO

В `index.html` указаны русский язык, описание и поисковые метаданные, Open Graph и географические метки Уфы, Республика Башкортостан (RU-BA). Геометки описывают регион примера и не означают наличие официального картографического источника.
