# 🎣 Fishing Game

Een complete Excalibur.js visgame waarin je met een dobber vissen en afval uit het water vist. Toon inheritance, composition, encapsulation en alle beoordelingscriteria!

## Features
- Gooi een dobber in het water met spatie
- Verplaats de dobber vrij met de pijltjestoetsen
- Vang vissen door op het juiste moment op spatie te drukken als de dobber onder water is
- Elke vis heeft een eigen schaduw en echte afbeelding
- Trash (afval) heeft ook een eigen schaduw en geeft minpunten
- Zeldzame vissen geven meer punten
- Feedback in beeld: "Gevangen!", "Trash gevangen!", "Mis!"
- Highscore wordt automatisch opgeslagen
- OOP: inheritance (Fish/Trash van Shadow), composition (Player heeft Dobber), encapsulation (private/protected properties)

## Controls
- Pijltjestoetsen: Dobber bewegen
- Spatie: Dobber duikt onder water / vangpoging doen

## Beoordelingspunten
- Gooi dobber in het water met een knop
- Dobber vrij verplaatsbaar
- Dobber kan alleen onder water vangen
- Schaduwen bewegen random, links/rechts, random snelheid
- Elke schaduw hoort bij een eigen vis/trash
- Echte vis/trash verschijnt na vangen
- Zeldzame vissen geven meer punten
- Trash geeft minpunten
- Highscore wordt bewaard
- OOP: inheritance, composition, encapsulation

## Installatie & starten
1. Clone deze repo
2. `npm install`
3. `npm run dev` (lokaal testen)
4. `npm run build` → deploy `/docs` map naar GitHub Pages

## Deployment (GitHub Pages)
- Zorg dat je build output in de `/docs` map staat
- Zet GitHub Pages aan op de `main` branch, root `/docs` map

Veel visplezier! 🐟

## Class Diagram
```
+------------------------+       +------------------------+
|         Actor          |       |         Engine         |
+------------------------+       +------------------------+
| +x: number             |       | +width: number         |
| +y: number             |       | +height: number        |
| +width: number         |       | +maxFps: number        |
| +height: number        |       | +isGameOver: boolean   |
| +vel: Vector           |       | +trashCaught: number   |
| +pos: Vector           |       | +player: Player        |
| +graphics: any         |       | +ui: UI                |
| +update()              |       | +startGame()           |
| +kill()                |       | +spawnFish()           |
+------------------------+       | +spawnTrash()          |
                ^                +------------------------+
                |                          ^
                |                          |
+------------------------+       +------------------------+
|         Shadow         |       |         Player         |
+------------------------+       +------------------------+
| +speed: number         |       | -dobber: Dobber        |
| +direction: number     |       | -score: number         |
| +time: number          |       | -lives: number         |
| +stopped: boolean      |       | +getScore()            |
| +update()              |       | +addPoints()           |
+------------------------+       | +handleCatch()         |
                ^                | +gameOver()            |
                |                +------------------------+
        +-------+-------+
        |               |
+---------------+  +----------------+  +------------------------+
|     Fish      |  |     Trash      |  |         Dobber         |
+---------------+  +----------------+  +------------------------+
| +points: num  |  | +penalty: num  |  | -isUnderwater: boolean |
| +isShadow: b  |  | +isShadow: b   |  | -canCatch: boolean     |
| +showReal()   |  | +showReal()    |  | -_lastCollided: any    |
+---------------+  +----------------+  | -underwaterTimer: any  |
                                      | -catchTimeLimit: number |
                                      | +update()               |
                                      +------------------------+

+------------------------+
|          UI            |
+------------------------+
| -highScore: number     |
| -scoreLabel: Label     |
| -highScoreLabel: Label |
| -feedbackLabel: Label  |
| -livesContainer: Actor |
| -lives: Array<Actor>   |
| +updateScore()         |
| +updateLives()         |
| +showFeedback()        |
+------------------------+

Legenda:
+ = public property/method
- = private property/method
^ = inheritance
-> = composition
```

### Relaties in het Class Diagram

1. **Inheritance (Overerving)**:
   - `Shadow` erft over van `Actor`
   - `Fish` en `Trash` erven over van `Shadow`
   - `Dobber` erft over van `Actor`

2. **Composition (Compositie)**:
   - `Player` heeft een `Dobber` (composition)
   - `Game` heeft een `Player` en `UI` (composition)

3. **Properties en Methods**:
   - Public properties/methods zijn gemarkeerd met `+`
   - Private properties/methods zijn gemarkeerd met `-`

4. **Belangrijke Classes**:
   - `Actor`: Basis class van Excalibur.js
   - `Shadow`: Basis class voor alle onderwater objecten
   - `Fish` en `Trash`: Specifieke objecten die overerven van Shadow
   - `Player`: Beheert de speler logica en score
   - `Dobber`: Beheert de dobber beweging en interactie
   - `UI`: Beheert de gebruikersinterface
   - `Game`: Hoofdclass die alles coördineert
