# Game music

Upload any authorized audio directly into this folder on development. Keep original filenames; any number of tracks is allowed. MP3 is recommended; OGG, WAV, M4A, AAC, FLAC and Opus are discovered, with playback dependent on browser codec support. Subfolders are optional. The checked-in `playlist.json` lets the static game deploy without a custom build command. After adding or removing tracks, run `node scripts/generate-music-playlist.mjs` and commit the regenerated playlist with the audio changes. CI checks that it matches the available files. A track is currently bundled; audio is loaded on demand. Keep artist, title, rights holder and permission records here for each addition. Do not upload music without permission for public hosting and game distribution.

## Permission record retained from the original album proposal

Music: The Northerner Diaries – Symphonic Sketches by Jeremy Soule. Copyright remains with the rights holder. Public game-use permission reported January 9, 2019: https://www.pcgamesn.com/jeremy-soule-mods-northerner and https://www.gamebusiness.jp/article/2019/01/12/15347.html . The original post was not independently recovered; game-use permission is not a general open-source or standalone redistribution license. Confirm the upload and hosting scope before public distribution. Audio is streamed on demand, not precached.
