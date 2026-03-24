const fs = require('fs');
const file = 'components/WarRoom.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { WS_BASE }')) {
    content = content.replace(/import \{ useToast \} from "\.\/ToastProvider";/, 'import { useToast } from "./ToastProvider";\nimport { WS_BASE } from "../lib/api";');
}

content = content.replace(
    /const wsUrl = useMemo\(\(\) => \{\s*const fallback = "wss:\/\/synaegis-backend\.onrender\.com\/ws\/warroom";\s*return process\.env\.NEXT_PUBLIC_BACKEND_WS_URL \|\| fallback;\s*\}, \[\]\);/g,
    'const wsUrl = `${WS_BASE}/warroom`;'
);

fs.writeFileSync(file, content);
