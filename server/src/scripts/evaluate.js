// Run from repository root after installing: node server/src/scripts/evaluate.js
// This is a small illustrative evaluation of the deterministic rules, not an independent truth benchmark.
import { readFile } from 'node:fs/promises';
import { analyzeText } from '../services/reviewPipeline.js';
const posts=JSON.parse(await readFile(new URL('../seed/testPosts.json',import.meta.url),'utf8'));
for(const post of posts){
 const findings=analyzeText(post.text);
 console.log(`${post.id} | ${post.title} | ${findings.length} findings | ${findings.map(f=>f.kind+':'+f.severity).join(', ')||'no findings'}`);
}
