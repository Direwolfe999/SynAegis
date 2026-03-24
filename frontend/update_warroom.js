const fs = require('fs');
let content = fs.readFileSync('components/WarRoom.tsx', 'utf8');

// The mobile section has this
content = content.replace(
    /\<OpticalFeed active=\{cameraActive\} videoRef=\{videoRef\} \/\>/,
    `<OpticalFeed active={cameraActive} videoRef={videoRef} inline={true} />`
);

fs.writeFileSync('components/WarRoom.tsx', content);
