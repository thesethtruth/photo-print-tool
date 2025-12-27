# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Photo Print Grid Tool - A SvelteKit application for arranging photos in print-ready A4 grids (90×60mm cards with instant-photo styling). Users can upload images, adjust their positioning/rotation, save batches for later reprinting, and generate print-ready PDFs using the browser's print dialog.

## Commands

### Development
- `npm run dev` - Start development server (default: http://localhost:5173)
- `npm run dev -- --open` - Start dev server and open in browser

### Build & Preview
- `npm run build` - Create production build
- `npm run preview` - Preview production build

### Type Checking
- `npm run check` - Run svelte-check once
- `npm run check:watch` - Run svelte-check in watch mode

## Architecture

### Core Design Principles

1. **PDF Generation**: Uses browser `window.print()` for WYSIWYG output - same rendering engine for preview and print
2. **Persistence**: Filesystem-based storage (batches stored in `data/batches/`)
3. **Indexing**: In-memory index built from filesystem on startup, updated on writes
4. **No Auth**: Designed as local single-user service

### State Management

Frontend state lives in `src/lib/stores/grid.ts` using Svelte stores. The store manages:
- Grid settings (dimensions, padding, gaps in millimeters)
- Images array with File objects, blob URLs, object-position, and rotation
- Batch metadata (title, batchId, dirty tracking)

State serializes directly to `config.json` when saving - field names intentionally match between store and API.

### Data Flow

**Creating a batch:**
1. Frontend collects images (File objects) and config (grid state as JSON)
2. POST to `/api/batches` with multipart form data
3. Server generates batch ID (format: `YYYY-MM-DD-{random6}`)
4. Writes images to `data/batches/{id}/images/`
5. Writes config.json to `data/batches/{id}/`
6. Updates in-memory index

**Loading a batch:**
1. GET `/api/batches/{id}` returns config + image URLs
2. Frontend reconstructs grid state using `gridStore.loadBatch()`
3. Images loaded via `/api/batches/{id}/images/{filename}`
4. Updates `lastOpenedAt` timestamp in config

### File Storage Layout

```
data/
└── batches/
    └── {YYYY-MM-DD-random}/
        ├── config.json
        └── images/
            ├── 001.jpg
            ├── 002.jpg
            └── ...
```

The `config.json` schema includes:
- `id`, `title`, `createdAt`, `lastOpenedAt`, `printed` (index fields)
- `grid` object with cardWidth, cardHeight, cardPadding, gap, pageMargin (all in mm)
- `images` array with filename, objectPosition [x%, y%], rotation (degrees)

### API Endpoints

All defined in `src/routes/api/batches/`:

- `POST /api/batches` - Create new batch (multipart: config JSON + images)
- `GET /api/batches` - List all batches (from in-memory index, sorted by lastOpenedAt)
- `GET /api/batches/{id}` - Get batch config + image URLs
- `GET /api/batches/{id}/images/{filename}` - Serve image file
- `GET /api/batches/{id}/thumbnail` - Serve first image as thumbnail
- `DELETE /api/batches/{id}` - Delete batch and its files

Server-side index management in `src/lib/server/batches.ts`:
- Module-level Map persists across requests in same process
- Built from filesystem glob on cold start
- Updated in-memory on writes (no drift from source of truth)

### Print System

The same component (`GridPreview.svelte`) handles both preview and print:

**Screen view:**
- Renders at actual mm dimensions (A4: 210×297mm)
- Scaled to viewport using CSS transform: `transform: scale(var(--preview-scale))`
- Scale calculated in JS based on container width

**Print view:**
- `@media print` removes all `.no-print` elements
- Sets `@page` to A4 portrait with zero margin
- Removes transform to render at actual size
- Images use CSS Grid with mm units throughout

### Component Structure

Key components in `src/lib/components/`:

- **DropZone** - Drag-drop image upload, file picker fallback
- **GridPreview** - A4 preview with CSS grid, mm units, scaled to viewport
- **ImageCard** - Single card with drag-to-pan object-position and rotation buttons
- **GridSettings** - Inputs for card dimensions, padding, gap (using shadcn-svelte Slider)
- **BatchList** - Display saved batches with thumbnails
- **SaveDialog** - Title input before saving batch
- **PrintButton** - Triggers `window.print()`

UI built with shadcn-svelte (bits-ui) + Tailwind CSS v4.

### Key Implementation Details

**Image positioning:**
- Each image has `objectPosition: [x%, y%]` stored as percentages
- Rendered as CSS `object-position: {x}% {y}%`
- User drags on image to adjust focal point (ImageCard handles mouse events)

**Rotation:**
- Stored as degrees (0, 90, 180, 270)
- Rendered as CSS `transform: rotate({rotation}deg)`
- Increments by 90° on button click

**Grid calculations:**
- Column count auto-calculated from A4 width (210mm), margins, gaps, and card width
- Rows grow automatically based on image count
- All dimensions specified in millimeters for print accuracy

**Dirty state tracking:**
- `isDirty` flag set when images added/modified
- `beforeunload` event warns user of unsaved changes
- Cleared after save or when loading existing batch

## Environment Variables

- `DATA_DIR` - Base path for batch storage (default: `./data`)
- `PORT` - Server port (default: `5173`)

## Important Notes

- This is a SvelteKit app using Svelte 5 with runes (`$state`, `$derived`, etc.)
- Uses TypeScript with strict mode enabled
- Adapter: `@sveltejs/adapter-auto` (can switch to `adapter-node` for deployment)
- No Docker setup currently implemented (planned in design.md but not built)
- No image resizing/optimization on upload (original files stored as-is)
- Single-page assumption (multi-page grids not currently supported)
- No update/edit endpoints for saved batches (can only create, load, or delete)

## File Conventions

- API routes use SvelteKit's filesystem routing (`+server.ts` files)
- Server-only code lives in `src/lib/server/`
- Shared types exported from `src/lib/server/batches.ts`
- UI components use `.svelte` extension
- Path alias `$lib` maps to `src/lib/`
