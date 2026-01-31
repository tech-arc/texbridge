const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open DB:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.all('SELECT id, photos FROM donations WHERE photos IS NOT NULL AND photos != ""', (err, rows) => {
    if (err) return console.error(err);

    rows.forEach(row => {
      const photos = row.photos.split(',').map(p => p.trim()).filter(Boolean);
      const normalized = photos.map(p => {
        // Extract filename and map to uploads/donations/<filename>
        const filename = path.basename(p);
        return `uploads/donations/${filename}`;
      }).join(',');

      db.run('UPDATE donations SET photos = ? WHERE id = ?', [normalized, row.id], (err) => {
        if (err) console.error('Failed to update row', row.id, err);
        else console.log('Updated donation', row.id);
      });
    });
  });
});

// Close DB after a short delay to allow updates to finish
setTimeout(() => db.close(), 1000);
