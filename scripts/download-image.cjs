const https = require('https');
const fs = require('fs');

function download(url, dest) {
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303) {
      console.log('Redirecting to:', res.headers.location);
      download(res.headers.location, dest);
    } else {
      console.log('Downloading with status:', res.statusCode);
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Downloaded successfully to ' + dest);
      });
    }
  }).on('error', (err) => {
    console.error('Error:', err.message);
  });
}

download('https://drive.google.com/uc?export=download&id=1tty51cjrFxGh6d5qmhAozFyMUAb9z_cm', 'public/aqua-regia.png');
