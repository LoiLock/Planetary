<p align="center">
  <img width="100" height="100" src="public/tn_logo_128.png">
</p>

# Planetary - ShareX server


### TODO:
- Albums. There's some snippets of it in the codebase already, although it doesn't work yet.
- Admin panel
- Profile settings page
- Clean up code
- Invite tokens

## Setup:
- `mkdir planetary && cd planetary`
- `git clone https://github.com/LoiLock/Planetary.git .` - Clone repository
- `npm i` - Install dependencies
- `node setup.js` - Start setup wizard
- `npm run build`
- `npm start` - Start it

##### Update:
- `git pull`
- `npm run build`
- `npm start`

The first user will also have admin rights

### Import files from a previous server:
Planetary supports importing files from previous ShareX servers.

**Make sure you have started Planetary at least once before and that the filenames contain only alphanumeric characters**
##### Import files:
- Place the files you want to import in `public/u/`
- In the root directory of Planetary run: `node import.js`
