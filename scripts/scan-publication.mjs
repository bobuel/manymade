import {execFileSync} from 'node:child_process';
const files=execFileSync('git',['diff','--cached','--name-only','--diff-filter=ACM','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
if(!files.length){console.error('No staged files to review. Stage the intended publication first.');process.exit(1)}
const rules=[
  ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['provider secret',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b/],
  ['AWS access key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['Slack token',/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ['credential assignment',/(?:api[_-]?key|client[_-]?secret|access[_-]?token|password)\s*[:=]\s*["'][A-Za-z0-9_./+-]{16,}["']/i],
  ['credential URL',/https?:\/\/[^\s/:]+:[^\s/@]+@/],
  ['private local path',/[A-Z]:\\Users\\[^\s"'<>]+/i],
];
let issues=0,bytes=0;
for(const file of files){
  if(/(^|\/)(?:\.env(?:\.|$)|node_modules|dist|\.codex|\.publication|test-results|playwright-report)(\/|$)|\.(?:pem|key|p12)$/i.test(file)){
    console.error('Forbidden publication path: '+file);issues++;continue;
  }
  const contents=execFileSync('git',['show',':'+file],{maxBuffer:16*1024*1024});bytes+=contents.length;
  if(file.endsWith('.png')){
    if(!contents.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){console.error('Invalid image: '+file);issues++}
    continue;
  }
  if(contents.includes(0)){console.error('Unreviewed binary: '+file);issues++;continue}
  const text=contents.toString('utf8');
  for(const [label,regex] of rules)if(regex.test(text)){console.error('Potential '+label+' in '+file);issues++}
}
console.log('Reviewed '+files.length+' staged files ('+bytes.toLocaleString()+' bytes); '+issues+' findings. No matching values are printed.');
if(issues)process.exit(1);
