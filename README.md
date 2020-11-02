# WIP
## Works:
- Login with JWT
- Registration (No limits currently)
- Awful
- File uploading and logging in database
- File Deletion with confirmation screen

## Does not work:
- PWA gallery
- Dashboard "exists" but there's nothing of value there

Also, DB calls are super inconsistent (at least parameterized I guess...) Due to me figuring out late in the project that the standard sqlite package isn't async. Will fix this later... The best example of what that will look like is in delete.js
