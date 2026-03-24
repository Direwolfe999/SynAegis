const fs = require('fs');
['components/CICDDashboard.tsx', 'components/CloudDashboard.tsx', 'components/SecurityDashboard.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\\nimport/g, '\nimport');
    fs.writeFileSync(file, content);
});
