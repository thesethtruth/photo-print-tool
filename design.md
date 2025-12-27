# Photo Grid Tool — Architecture Spec

## Purpose

Arrange photos in a print-ready A4 grid (90×60mm cards with instant-photo styling). Store batches for reprinting later.

---

## Core Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PDF generation | Browser `window.print()` | WYSIWYG - same engine renders preview and output |
| Backend | SvelteKit API routes | Already have SvelteKit; no need for separate service |
| Persistence | Filesystem (mounted volume) | Simple, inspectable, portable |
| Index | Built in-memory from glob on startup | Can't drift, single source of truth |
| Styling | Tailwind + shadcn-svelte | Consistent components, utility CSS |
| Auth | None | Local single-user service |

---

## Architecture

```
┌────────────────────────────────────────┐
│  Docker                                │
│  ┌──────────────────────────────────┐  │
│  │  SvelteKit (Bun)                 │  │
│  │  ├── UI (Tailwind + shadcn)      │  │
│  │  └── API routes (/api/*)         │  │
│  │      :5173                       │  │
│  └──────────────┬───────────────────┘  │
│                 │                      │
│       ┌─────────▼─────────┐            │
│       │  /data (volume)   │            │
│       │  └── batches/     │            │
│       └───────────────────┘            │
└────────────────────────────────────────┘
```

Single service. Single volume. No orchestration complexity.

---

## Data Flow

### Create batch (after print)

```
User clicks "Save"
    │
    ▼
Frontend collects:
  - images (File objects)
  - config (grid state as JSON)
    │
    ▼
POST /api/batches (multipart)
    │
    ▼
Server:
  1. Generate batch ID (timestamp or nanoid)
  2. Write images to /data/batches/{id}/images/
  3. Write config.json to /data/batches/{id}/
  4. Add to in-memory index
    │
    ▼
Return { id, title, date }
```

### List batches

```
GET /api/batches
    │
    ▼
Server returns in-memory index
(built from glob on startup)
    │
    ▼
[{ id, title, date, printed }]
```

### Load batch for reprint

```
GET /api/batches/{id}
    │
    ▼
Server reads /data/batches/{id}/config.json
    │
    ▼
Return config + image URLs
    │
    ▼
Frontend reconstructs grid state
Images loaded via GET /api/batches/{id}/images/{filename}
```

---

## File Storage Layout

```
/data/
└── batches/
    └── {id}/
        ├── config.json
        └── images/
            ├── 001.jpg
            ├── 002.jpg
            └── ...
```

### config.json schema

```json
{
  "id": "2025-01-15-abc123",
  "title": "Holiday prints",
  "createdAt": "2025-01-15T10:30:00Z",
  "printed": false,
  
  "grid": {
    "cardWidth": 90,
    "cardHeight": 60,
    "cardPadding": 5,
    "gap": 5,
    "pageMargin": 10
  },
  
  "images": [
    {
      "filename": "001.jpg",
      "objectPosition": [50, 50],
      "rotation": 0
    }
  ]
}
```

**JSON → CSS mapping:**

| JSON | CSS |
|------|-----|
| `grid.cardWidth` | `grid-template-columns: repeat(N, {cardWidth}mm)` |
| `grid.cardHeight` | `grid-auto-rows: {cardHeight}mm` |
| `grid.cardPadding` | `.card { padding: {cardPadding}mm }` |
| `grid.gap` | `.grid { gap: {gap}mm }` |
| `grid.pageMargin` | `.grid-container { padding: {pageMargin}mm }` |
| `images[].objectPosition` | `img { object-position: {x}% {y}% }` |
| `images[].rotation` | `img { transform: rotate({rotation}deg) }` |

Index fields (`id`, `title`, `createdAt`, `printed`) extracted during glob.

---

## API Contract

Three endpoints. No update. No delete.

### `POST /api/batches`

Create new batch.

**Request:** `multipart/form-data`
- `config`: JSON string (title, grid settings, image order/positions)
- `images`: File[] 

**Response:** `201 Created`
```json
{ "id": "2025-01-15-abc123" }
```

### `GET /api/batches`

List all batches (from in-memory index).

**Response:** `200 OK`
```json
[
  { "id": "...", "title": "...", "createdAt": "...", "printed": false }
]
```

### `GET /api/batches/{id}`

Get batch config + image URLs.

**Response:** `200 OK`
```json
{
  "config": { ... },
  "images": [
    "/api/batches/{id}/images/001.jpg",
    "/api/batches/{id}/images/002.jpg"
  ]
}
```

### `GET /api/batches/{id}/images/{filename}`

Serve image file. Static file serving from volume.

---

## Frontend State Model

```typescript
// stores/grid.ts

interface GridImage {
  id: string              // local ID for keying
  file: File | null       // present during editing session
  url: string             // blob URL or server URL (reprint)
  filename: string        // for saving
  objectPosition: [number, number]  // [x%, y%]
  rotation: number        // 0, 90, 180, 270
}

interface GridSettings {
  cardWidth: number       // mm
  cardHeight: number      // mm  
  cardPadding: number     // mm (instant photo border)
  gap: number             // mm
  pageMargin: number      // mm
}

interface GridState {
  settings: GridSettings
  images: GridImage[]
  title: string
  batchId: string | null  // set after save or when loading
}
```

State lives in a Svelte store. Serializes directly to `config.json` on save — field names match.

---

## UI Components

Using shadcn-svelte + Tailwind.

| Component | Responsibility | shadcn components |
|-----------|----------------|-------------------|
| `DropZone` | Drag-drop image upload, file picker fallback | - |
| `GridPreview` | A4 preview with CSS grid, mm units, scaled to viewport | - |
| `ImageCard` | Single card with objectPosition drag, rotation buttons | `Button` |
| `GridSettings` | Inputs for card dimensions, padding, gap | `Input`, `Label`, `Slider` |
| `BatchList` | Sidebar/dialog listing saved batches | `Card`, `Button`, `ScrollArea` |
| `PrintButton` | Triggers `window.print()` | `Button` |
| `SaveDialog` | Title input before saving | `Dialog`, `Input`, `Button` |

---

## Print Approach

### Screen view (preview)

GridPreview renders at actual mm dimensions, then scaled via CSS transform to fit viewport:

```css
.grid-preview {
  /* Actual A4 dimensions */
  width: 210mm;
  min-height: 297mm;
  
  /* Scale to fit viewport */
  transform: scale(var(--preview-scale));
  transform-origin: top left;
}
```

`--preview-scale` calculated in JS based on container width.

### Print view

```css
@media print {
  /* Hide UI chrome */
  .no-print { display: none; }
  
  /* A4 page setup */
  @page {
    size: A4 portrait;
    margin: 0; /* we handle margins in grid */
  }
  
  /* Remove scaling, render at actual size */
  .grid-preview {
    transform: none;
  }
}
```

Same component, same CSS grid, same images. Print just removes the scale.

---

## Route Structure

```
src/
├── routes/
│   ├── +page.svelte              # Main app
│   ├── +layout.svelte            # Shell, global styles
│   └── api/
│       └── batches/
│           ├── +server.ts        # GET (list), POST (create)
│           └── [id]/
│               ├── +server.ts    # GET (load config)
│               └── images/
│                   └── [filename]/
│                       └── +server.ts  # GET (serve image)
├── lib/
│   ├── components/
│   │   ├── DropZone.svelte
│   │   ├── GridPreview.svelte
│   │   ├── ImageCard.svelte
│   │   ├── GridSettings.svelte
│   │   ├── BatchList.svelte
│   │   └── SaveDialog.svelte
│   ├── stores/
│   │   └── grid.ts
│   └── server/
│       └── batches.ts            # Index management, file I/O
```

---

## Server-Side Index Management

```typescript
// lib/server/batches.ts

interface BatchIndexEntry {
  id: string
  title: string
  createdAt: string
  printed: boolean
}

// Module-level state (persists across requests in same process)
let index: Map<string, BatchIndexEntry> | null = null

export async function getIndex(): Promise<Map<string, BatchIndexEntry>> {
  if (index) return index
  index = await buildIndexFromDisk()
  return index
}

async function buildIndexFromDisk(): Promise<Map<string, BatchIndexEntry>> {
  // glob /data/batches/*/config.json
  // read each, extract index fields
  // return as Map
}

export function addToIndex(entry: BatchIndexEntry): void {
  index?.set(entry.id, entry)
}
```

Index rebuilt on cold start. Updated in-memory on writes.

---

## Docker Setup

### Dockerfile

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json .
ENV DATA_DIR=/data
EXPOSE 5173
CMD ["bun", "./build/index.js"]
```

### docker-compose.yml

```yaml
services:
  photogrid:
    build: .
    ports:
      - "5173:5173"
    volumes:
      - ./data:/data
    environment:
      - DATA_DIR=/data
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_DIR` | `/data` | Base path for batch storage |
| `PORT` | `5173` | Server port |

---

## User Flow

### New batch

```
1. Open app
   └── Empty grid preview, drop zone visible

2. Drop/select images
   └── Images appear in grid with default objectPosition [50, 50]
   └── Grid auto-calculates column count based on card dimensions

3. Adjust images (optional)
   ├── Drag on image to shift objectPosition
   ├── Click rotate button for 90° increments
   └── Drag to reorder

4. Adjust grid settings (optional)
   └── Change cardWidth, cardHeight, cardPadding, gap, pageMargin
   └── Preview updates live

5. Print
   └── Click print button → browser print dialog
   └── Save as PDF or send to printer

6. Save batch (optional)
   └── Click save → enter title → confirm
   └── Images + config stored to /data/batches/{id}/
```

### Reprint existing batch

```
1. Open app
   └── Click "Saved batches" or similar

2. Select batch from list
   └── Shows title, date, printed status

3. Load batch
   └── Grid reconstructed from config.json
   └── Images loaded from server

4. Print
   └── Same as new batch flow
```

---

## Implementation Order

1. **Scaffold** — SvelteKit + Tailwind + shadcn-svelte setup
2. **GridPreview** — Static grid with hardcoded dimensions, mm units
3. **DropZone** — Image upload to local state (blob URLs)
4. **ImageCard** — Render in grid with object-fit, crop position
5. **objectPosition interaction** — Drag to adjust object-position
6. **Rotation** — 90° increment buttons
7. **GridSettings** — Dimension controls bound to store
8. **Print** — `@media print` styles, print button
9. **Save endpoint** — POST /api/batches, write to disk
10. **Index + list** — GET /api/batches, glob on startup
11. **Load endpoint** — GET /api/batches/{id}
12. **BatchList UI** — Display saved batches, load on click
13. **Docker** — Containerize, test with volume

---

## Out of Scope (for now)

- Image resizing/optimization on upload
- Multi-page preview (assume single page)
- Batch deletion endpoint (delete via filesystem)
- Batch update/edit after save
- Multiple grid templates
