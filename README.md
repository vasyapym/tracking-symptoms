# Tracking Symptoms

Tracking Symptoms is an Obsidian plugin for fast, mobile-friendly symptom logging.

It is designed for quick daily capture with:
- one-tap logging
- reusable items grouped by category
- pinned shortcuts
- recent items
- relief-event presets
- history filtering and editing
- review heatmaps and summaries
- JSON and CSV export

## Features

### Fast logging
Log events quickly from:
- the main **Log** screen
- category browsers
- pinned items
- recent items
- commands
- the ribbon icon

### Category-based library
Create reusable items in these categories:
- Sleep
- Stress
- Activity
- Food & drink
- Digestive sensation
- General context

Each item can use:
- **Instant** logging
- **Intensity choice** logging
- a valence such as supportive, challenging, uncertain, or neutral

### Relief event workflow
Tracking Symptoms includes a special **Relief event** flow with:
- preset buttons
- editable preset definitions
- structured fields for:
  - completion
  - ease
  - comfort after
  - residual discomfort
  - urgency before
  - bloating after

### History and review
Use the built-in interface to:
- browse recent entries
- filter by period
- search by label, note, or tags
- edit or delete entries
- review activity by category
- see heatmap-style daily summaries
- export data as JSON or CSV

## Commands

The plugin provides these commands:
- **Open Tracking Symptoms**
- **Open Tracking Symptoms review**
- **Log relief event**

## Settings

Available settings:
- **Data folder**
- **Duplicate window (seconds)**
- **Relief event label**
- quick actions for opening the tracker
- relief preset management
- JSON export
- CSV export

## Data storage

Your data is stored inside your vault in the configured data folder.

By default, the plugin stores data in:

`data/tracking-symptoms-data.json`

Exports are also written to the configured data folder.

## Privacy

Tracking Symptoms does not send your data to any external server.
All data stays inside your Obsidian vault unless you choose to export it.

## Installation

### Community Plugins
After the plugin is accepted into the Obsidian Community Plugins directory, install it from:

**Settings → Community plugins → Browse**

Search for **Tracking Symptoms**.

### Manual installation
1. Open your vault
2. Go to `.obsidian/plugins/`
3. Create a folder named `tracking-symptoms`
4. Copy `main.js` and `manifest.json` into that folder
5. Reload Obsidian
6. Enable the plugin in **Settings → Community plugins**

## Support

If you find a bug or want to request a feature, please open an issue on GitHub.

## License

MIT
