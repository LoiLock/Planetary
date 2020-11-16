<p align="center">
  <img width="100" height="100" src="public/tn_logo_128.png">
</p>

# Planetary - ShareX server


### TODO:
- Albums. There's some snippets of it in the codebase already, al though it doesn't work yet.
- Admin panel
- Profile settings page
- Clean up the sometimes absolutely horrible to read code
- Improve SSE


## Setup:
- `mkdir planetary && cd planetary`
- `git clone https://github.com/LoiLock/Planetary.git .` - Clone repository
- `npm i` - Install dependencies
- `node setup.js` - Start setup wizard
- `npm start` - Start it

The first user will also have admin rights

### Import files from a previous server:
Planetary supports importing files from previous ShareX servers.

**Make sure you have started Planetary at least once before and that the filenames do consist of only alphanumeric characters**
##### Import files:
- Place the files you want to import in `public/u/`
- In the root directory of Planetary run: `node import.js`
