/**
 * Docker 构建专用：把 index.html 里 miaoda 平台的模板变量替换为实际值。
 * 纯 nginx 静态托管不会注入这些变量，必须在构建后手动替换。
 */
import fs from 'node:fs';
import path from 'node:path';

const indexPath = path.resolve('dist/client/index.html');

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found at', indexPath);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf-8');

// 注意顺序：先替换三个大括号的 {{{appAvatar}}}，再替换两个大括号的 {{appAvatar}}
const replacements = [
  ['{{{appAvatar}}}', '/favicon.svg'],
  ['{{appAvatar}}', '/favicon.svg'],
  ['{{appId}}', 'football-ai-assistant'],
  ['{{userId}}', 'p1'],
  ['{{tenantId}}', 'default'],
  ['{{userName}}', '张伟'],
  ['{{csrfToken}}', ''],
  ['{{environment}}', 'production'],
  ['{{basename}}', '/'],
  ['{{appName}}', '足球AI助手'],
  ['{{appDescription}}', '校园足球AI助手'],
];

for (const [from, to] of replacements) {
  html = html.split(from).join(to);
}

fs.writeFileSync(indexPath, html);
console.log('Template variables replaced:', indexPath);
