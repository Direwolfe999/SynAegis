const fs = require('fs');
let content = fs.readFileSync('components/OpticalFeed.tsx', 'utf8');

content = content.replace(
    /type Props = \{[\s\S]*?\};/,
    `type Props = {\n    active: boolean;\n    videoRef: React.RefObject<HTMLVideoElement | null>;\n    inline?: boolean;\n};`
);

content = content.replace(
    /export default function OpticalFeed\(\{ active, videoRef \}: Props\) \{/,
    `export default function OpticalFeed({ active, videoRef, inline = false }: Props) {`
);

content = content.replace(
    /className="pointer-events-none absolute left-2 top-28 z-20 w-\[9rem\] rounded-xl border border-white\/15 bg-white\/5 p-1\.5 backdrop-blur-xl sm:left-3 sm:top-32 sm:w-\[12rem\] sm:rounded-2xl sm:p-2 md:left-5 md:top-36 md:w-\[18rem\]"/g,
    `className={\`pointer-events-none z-20 rounded-xl border border-white/15 bg-white/5 p-1.5 backdrop-blur-xl sm:rounded-2xl sm:p-2 \${inline ? "relative w-full shadow-lg pointer-events-auto mt-4" : "absolute left-2 top-28 w-[9rem] sm:left-3 sm:top-32 sm:w-[12rem] md:left-5 md:top-36 md:w-[18rem]"}\`}`
);

content = content.replace(
    /className="h-20 w-full bg-black object-cover sm:h-28 md:h-40"/g,
    `className={\`w-full bg-black object-cover \${inline ? "h-[30vh] md:h-[40vh] rounded-xl" : "h-20 sm:h-28 md:h-40"}\`}`
);

fs.writeFileSync('components/OpticalFeed.tsx', content);
