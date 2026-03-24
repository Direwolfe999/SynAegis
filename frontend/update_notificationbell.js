const fs = require('fs');
const file = 'components/NotificationBell.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure API_BASE is imported if not already
if (!content.includes('import { API_BASE }')) {
    content = content.replace(/import \{ useToast \} from "\.\/ToastProvider";/, 'import { useToast } from "./ToastProvider";\nimport { API_BASE } from "../lib/api";');
}

// Replace literal http://localhost:8080/api with ${API_BASE}
content = content.replace(/"http:\/\/localhost:8080\/api\/notifications\/recent"/g, '`${API_BASE}/notifications/recent`');
content = content.replace(/"http:\/\/localhost:8080\/api\/notifications\/mark_read"/g, '`${API_BASE}/notifications/mark_read`');

fs.writeFileSync(file, content);
