# Photo Print Grid Tool

A SvelteKit application for arranging photos in print-ready A4 grids with 90×60mm instant-photo styling. Upload images, adjust positioning and rotation, save batches for later reprinting, and generate print-ready PDFs using your browser's print dialog.

## Features

- **Drag-and-drop image upload** - Add multiple images at once
- **Adjustable positioning** - Drag on images to adjust focal point (object-position)
- **Rotation** - Rotate images in 90° increments
- **Live preview** - A4 grid preview with exact millimeter dimensions, scaled to viewport
- **Customizable grid** - Adjust card dimensions, padding, gaps, and page margins
- **Batch management** - Save batches with titles, load them later for reprinting
- **Print-ready output** - Uses browser `window.print()` for WYSIWYG PDF generation
- **Batch thumbnails** - Quick visual identification of saved batches
- **Delete batches** - Remove batches you no longer need
- **Unsaved changes warning** - Prevents accidental data loss

## Quick Start

### Development

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser automatically
npm run dev -- --open
```

### Production with Docker

```sh
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

Data is persisted in the `./data` directory via volume mount.

## Usage

### Creating a New Batch

1. **Upload images** - Drag and drop or click to select multiple images
2. **Adjust positioning** - Drag on each image to reposition the focal point
3. **Rotate if needed** - Click the rotate button on any image (90° increments)
4. **Customize grid** - Adjust card dimensions, padding, and gaps in the settings panel
5. **Print** - Click "Print" to open browser print dialog (save as PDF or print directly)
6. **Save batch** - Click "Save Batch", enter a title, and save for later reprinting

### Reprinting a Saved Batch

1. **View saved batches** - Recent batches shown in sidebar, click "View All" for complete list
2. **Load batch** - Click on any batch to load its images and settings
3. **Print** - Click "Print" to reprint with original settings

### Managing Batches

- **Delete** - Hover over a batch in "View All" dialog and click trash icon
- **Clear current grid** - Click "Clear All" to start fresh

## Architecture

Built with:
- **SvelteKit** - Full-stack framework with API routes
- **Svelte 5** - Using runes (`$state`, `$derived`, etc.)
- **Tailwind CSS v4** - Utility-first styling
- **shadcn-svelte** - UI components (buttons, dialogs, sliders)
- **TypeScript** - Type-safe development
- **Bun** - Fast JavaScript runtime

### Data Storage

Batches stored in filesystem at `data/batches/{id}/`:
```
data/batches/YYYY-MM-DD-{random}/
├── config.json          # Grid settings, image positions, metadata
└── images/
    ├── 001.jpg
    ├── 002.jpg
    └── ...
```

### API Endpoints

- `POST /api/batches` - Create new batch
- `GET /api/batches` - List all batches
- `GET /api/batches/{id}` - Load batch config
- `GET /api/batches/{id}/images/{filename}` - Serve image
- `GET /api/batches/{id}/thumbnail` - Serve first image as thumbnail
- `DELETE /api/batches/{id}` - Delete batch

## Configuration

### Environment Variables

- `DATA_DIR` - Base path for batch storage (default: `./data` in dev, `/app/data` in Docker)
- `PORT` - Server port (default: `5173` in dev, `3000` in production)

### Default Grid Settings

- Card width: 90mm
- Card height: 60mm
- Card padding: 5mm (instant photo border)
- Gap: 5mm
- Page margin: 10mm

## Type Checking

```sh
# Run once
npm run check

# Watch mode
npm run check:watch
```

## Docker Deployment

The included `Dockerfile` and `docker-compose.yml` provide containerized deployment:

```sh
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Data persists in `./data` directory on host.

## Technical Details

- **PDF generation** - Uses browser's native print functionality for WYSIWYG output
- **State management** - Svelte stores in `src/lib/stores/grid.ts`
- **Indexing** - In-memory index built from filesystem on startup, updated on writes
- **No authentication** - Designed as local single-user service
- **No image optimization** - Original files stored as-is

See `CLAUDE.md` and `design.md` for detailed architecture documentation.
