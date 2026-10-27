import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
const now = () => new Date().toISOString();
const uid = () => randomUUID();
const hash = bcrypt.hashSync('Demo123!', 10);
export const users = [
  { id:'user_creator', name:'Harper Lane', email:'creator@demo.brandsentinel.test', passwordHash:hash, role:'creator' },
  { id:'user_reviewer', name:'Jordan Ellis', email:'reviewer@demo.brandsentinel.test', passwordHash:hash, role:'reviewer' },
  { id:'user_admin', name:'Morgan Reed', email:'admin@demo.brandsentinel.test', passwordHash:hash, role:'admin' }
];
export let brandKit = {
  id:'brandkit_northstar', orgId:'northstar', name:'Northstar Studio',
  toneProfile:'Clear, optimistic, and helpful. Sound confident without making absolute promises. Avoid fear-based language and medical claims.',
  facts:[
    {id:'fact-1',text:'Northstar Daily Moisture is designed to support skin hydration.',effectiveDate:'2026-01-01'},
    {id:'fact-2',text:'The product is available in a 50 ml bottle.',effectiveDate:'2026-01-01'},
    {id:'fact-3',text:'The product launched in 2024.',effectiveDate:'2024-03-01'},
    {id:'fact-4',text:'The product is fragrance-free according to the sample brand brief.',effectiveDate:'2025-06-01'},
    {id:'fact-5',text:'The formula was tested for skin compatibility.',effectiveDate:'2025-09-01'},
    {id:'fact-6',text:'The brand offers a 30-day return window on eligible purchases.',effectiveDate:'2026-02-01'},
    {id:'fact-7',text:'The product is designed for daily use.',effectiveDate:'2026-01-01'},
    {id:'fact-8',text:'Northstar products are not intended to diagnose, treat, cure, or prevent disease.',effectiveDate:'2026-01-01'},
    {id:'fact-9',text:'The product page lists ingredients and usage instructions.',effectiveDate:'2025-11-01'},
    {id:'fact-10',text:'The sample campaign uses the tagline “Small steps, brighter days.”',effectiveDate:'2025-01-01'}
  ],
  bannedTerms:[
    {id:'ban-1',term:'100% guaranteed',reason:'Absolute guarantees are not approved.'},
    {id:'ban-2',term:'cure',reason:'Medical outcome claims are not approved.'},
    {id:'ban-3',term:'miracle',reason:'Avoid exaggerated product claims.'},
    {id:'ban-4',term:'risk-free',reason:'Absolute risk claims are not approved.'},
    {id:'ban-5',term:'instant results',reason:'Avoid unsupported speed-of-result claims.'},
    {id:'ban-6',term:'clinically proven',reason:'Requires a specific approved substantiation source.'},
    {id:'ban-7',term:'permanent',reason:'Avoid unsupported permanence claims.'},
    {id:'ban-8',term:'best in the world',reason:'Avoid unsubstantiated superlatives.'}
  ],
  preferredTerms:[
    {id:'pref-1',term:'cheap',replacement:'great value'},
    {id:'pref-2',term:'flawless',replacement:'healthy-looking'},
    {id:'pref-3',term:'anti-aging',replacement:'skin-supporting'}
  ],
  disclaimers:['Terms and conditions apply.'],
  version:1, updatedAt:now()
};
export const submissions = [];
export const auditEvents = [];
export const addAudit = ({actor,action,submissionId=null,description=''}) => {
  const u=users.find(x=>x.id===actor);
  auditEvents.unshift({id:uid(),actorId:actor,actorName:u?.name||'System',actorRole:u?.role||'system',action,submissionId,description,createdAt:now()});
};
export const timestamp = now;
export const makeId = uid;
export function seedDemo() {
  if (submissions.length) return;
  const creator=users[0];
  const samples=[
    {title:'Spring campaign: bold promise',text:'Our new formula is 100% guaranteed to cure tired skin overnight. Try it today!'},
    {title:'Product launch announcement',text:'Meet Northstar Daily Moisture, designed to support skin hydration. Terms and conditions apply.'},
    {title:'The old launch figure',text:'Our product launched in 2021 and is a miracle for every skin type.'},
    {title:'Weekend offer',text:'Get great value with our daily moisturizer. Terms and conditions apply.'},
    {title:'Short product caption',text:'Clinically proven to deliver instant results. Shop the permanent solution today.'}
  ];
  for(const sample of samples){
    const id=uid(),created=now();
    submissions.push({id,title:sample.title,text:sample.text,contentType:'social_post',creatorId:creator.id,creatorName:creator.name,status:'draft',versions:[{text:sample.text,createdAt:created}],findings:[],comments:[],createdAt:created,updatedAt:created});
  }
  addAudit({actor:creator.id,action:'demo_seeded',description:'Seeded five synthetic sample submissions for evaluation.'});
}
