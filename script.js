const $=s=>document.querySelector(s),K='sleepsync.v1';
let db=null;try{db=JSON.parse(localStorage.getItem(K))}catch(e){}
db=db||{users:{},data:{},session:null,theme:'auto'};
const save=()=>{try{localStorage.setItem(K,JSON.stringify(db))}catch(e){}};
const hash=s=>{let h=5381;for(const c of s)h=(h*33^c.charCodeAt(0))>>>0;return h.toString(36)};
const U=()=>db.users[db.session],D=()=>db.data[db.session];
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2600)};
const fd=m=>m==null||isNaN(m)?'–':Math.floor(m/60)+'h '+String(Math.round(m%60)).padStart(2,'0')+'m';
const ft=d=>new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
const fday=d=>new Date(d).toLocaleDateString([],{month:'short',day:'numeric'});
const dur=r=>(new Date(r.wake)-new Date(r.bed))/6e4;
const mod=d=>{d=new Date(d);return d.getHours()*60+d.getMinutes()};
const avgT=(rs,k)=>{if(!rs.length)return null;let a=rs.map(r=>{let m=mod(r[k]);return k=='bed'&&m<720?m+1440:m});let v=Math.round(a.reduce((x,y)=>x+y,0)/a.length)%1440;return String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0')};
const recs=()=>[...D().recs].sort((a,b)=>new Date(b.wake)-new Date(a.wake));
const QL=['','Poor','Average','Good','Excellent'],ML=['','😞 Low','😐 Okay','🙂 Good','😄 Great','🤩 Energised'];
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const cons=rs=>{if(rs.length<3)return null;const a=rs.map(r=>{let m=mod(r.bed);return m<720?m+1440:m}),m=avg(a),sd=Math.sqrt(avg(a.map(x=>(x-m)**2)));return Math.max(0,Math.round(100-sd/1.2))};
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function seed(email){const r=[];let s=7;const rnd=()=>(s=(s*9301+49297)%233280)/233280;
for(let i=14;i>=1;i--){const b=new Date();b.setDate(b.getDate()-i);b.setHours(22+Math.floor(rnd()*2),Math.floor(rnd()*60),0,0);const w=new Date(b.getTime()+(360+Math.floor(rnd()*150))*6e4);
const q=Math.min(4,Math.max(1,Math.round(dur({bed:b,wake:w})/120-1.2+rnd())));r.push({id:'d'+i,bed:b.toISOString(),wake:w.toISOString(),q,mood:Math.min(5,q+(rnd()>.5?1:0)),note:'Sample record',demo:1})}
db.data[email].recs=r}
function mk(email,name){db.users[email]={name,goal:8,bed:'23:00',wake:'07:00',pw:null};db.data[email]={recs:[],alarms:[{id:1,t:'07:00',label:'Weekday wake-up',days:[1,2,3,4,5],on:true}],timer:null}}
let mode='login';
function af(){$('#af').innerHTML='<label>Your name</label><input id="n" autocomplete="name" placeholder="e.g. Alex">'}
$('#go').onclick=()=>{const n=$('#n').value.trim();if(!n)return toast('Enter your name to continue.');const e='u:'+n.toLowerCase();if(!db.users[e]){mk(e,n);db.users[e].new=1}db.session=e;save();boot()};
$('#demo').onclick=()=>{const e='demo@sleepsync.app';if(!db.users[e]){mk(e,'Demo user');seed(e)}db.session=e;save();boot()};
const PAGES={dashboard:'Dashboard',track:'Track sleep',alarm:'Smart alarm',history:'Sleep history',analytics:'Analytics',wellness:'Wellness',settings:'Settings',about:'About & help'};
function boot(){$('#auth').style.display='none';$('#app').style.display='block';theme();$('#nav').innerHTML='<div class="logo">🌙 SleepSync</div>'+Object.entries(PAGES).map(([k,v])=>`<a data-p="${k}" href="#${k}">${v}</a>`).join('');route();
if(U().new){U().new=0;save();toast('Welcome! Set your sleep goal in Settings.')}}
function theme(){const t=db.theme;t=='auto'?document.documentElement.removeAttribute('data-theme'):document.documentElement.dataset.theme=t}
let charts=[],tick=null;
const mkc=(id,cfg)=>{const c=new Chart($(id),cfg);charts.push(c)};
function route(){charts.forEach(c=>c.destroy());charts=[];clearInterval(tick);stopSound();
const p=PAGES[location.hash.slice(1)]?location.hash.slice(1):'dashboard';
document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.p==p));
$('#main').innerHTML=VIEW[p]();AFTER[p]&&AFTER[p]();window.scrollTo(0,0)}
addEventListener('hashchange',()=>db.session&&route());
const head=(t,s,x='')=>`<div class="top"><div><h1>${t}</h1><div class="mut">${s}</div></div>${x}</div>`;
const empty=m=>`<p class="mut" style="padding:14px 0">${m}</p>`;
function cd(t){let d=new Date();const[h,m]=t.split(':');d.setHours(h,m,0,0);if(d<=new Date())d.setDate(d.getDate()+1);const s=Math.round((d-new Date())/1000);return Math.floor(s/3600)+'h '+String(Math.floor(s%3600/60)).padStart(2,'0')+'m '+String(s%60).padStart(2,'0')+'s'}
const VIEW={
dashboard(){const rs=recs(),l=rs[0],w=rs.slice(0,7),a=avg(w.map(dur)),g=U().goal*60,c=cons(w),h=new Date().getHours();
const tip=l?(dur(l)<g-30?'You slept under your goal last night. Try bedtime 30 minutes earlier tonight.':'You met your sleep goal last night. Keep your bedtime steady.'):'Log your first night to unlock insights.';
return head((h<12?'Good morning, ':h<18?'Good afternoon, ':'Good evening, ')+U().name.split(' ')[0],new Date().toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'}),'<a class="btn" href="#track">Start sleep</a>')+
`${db.session.startsWith('demo@')?'<p class="pill">Sample data – reset in Settings</p>':''}<div class="grid g4" style="margin-top:8px">
<div class="card"><div class="mut">Last sleep</div><div class="big">${l?fd(dur(l)):'–'}</div><div class="mut">${l?ft(l.bed)+' → '+ft(l.wake):'No records yet'}</div><div class="bar"><i style="width:${l?Math.min(100,dur(l)/g*100):0}%"></i></div></div>
<div class="card"><div class="mut">7-night average</div><div class="big">${fd(a)}</div><div class="mut">Goal ${U().goal}h</div></div>
<div class="card"><div class="mut">Consistency</div><div class="big">${c==null?'–':c+'%'}</div><div class="mut">Based on bedtime spread</div></div>
<div class="card"><div class="mut">Next bedtime in</div><div class="big" id="cb">–</div><div class="mut">Wake-up in <b id="cw">–</b></div></div></div>
<div class="grid g2" style="margin-top:16px"><div class="card"><h2>This week</h2>${w.length?'<canvas id="c1" height="170"></canvas>':empty('No sleep records yet. Use Track sleep to add one.')}</div>
<div class="card"><h2>Today’s tip</h2><p>${tip}</p><h2 style="margin-top:18px">Recent activity</h2>${rs.slice(0,4).map(r=>`<div class="row sp mut" style="padding:5px 0"><span>${fday(r.wake)}</span><span>${fd(dur(r))}</span><span class="pill">${QL[r.q]}</span></div>`).join('')||empty('Nothing yet.')}
<h2 style="margin-top:14px">Upcoming alarms</h2>${D().alarms.filter(x=>x.on).map(x=>`<div class="mut">${x.t} · ${x.label}</div>`).join('')||empty('No active alarms.')}</div></div>`},
track(){const t=D().timer,n=new Date(),p=x=>String(x).padStart(2,'0'),dv=n.getFullYear()+'-'+p(n.getMonth()+1)+'-'+p(n.getDate());
return head('Track sleep','Use the timer tonight, or log a past night.')+`<div class="grid g2"><div class="card"><h2>Sleep timer</h2><div class="big" id="el" style="margin:10px 0">${t?'…':'Not tracking'}</div><button class="btn ${t?'bad':''}" id="tm">${t?'End sleep':'Start sleep'}</button><p class="mut">${t?'Started '+ft(t):'Only one session can be active.'}</p></div>
<div class="card"><h2>Log manually</h2><label>Wake-up date</label><input type="date" id="md" value="${dv}" max="${dv}"><div class="row"><div style="flex:1"><label>Bedtime</label><input type="time" id="mb" value="${U().bed}"></div><div style="flex:1"><label>Wake-up</label><input type="time" id="mw" value="${U().wake}"></div></div>
<label>Sleep quality</label><select id="mq"><option value="4">Excellent</option><option value="3" selected>Good</option><option value="2">Average</option><option value="1">Poor</option></select><label>Morning mood</label><select id="mm">${[1,2,3,4,5].map(i=>`<option value="${i}" ${i==3?'selected':''}>${ML[i]}</option>`).join('')}</select><label>Notes</label><textarea id="mn" rows="2"></textarea><p class="mut" id="pv"></p><button class="btn" id="ms">Save record</button></div></div>`},
alarm(){return head('Smart alarm','Wake-up alarms and bedtime reminder.')+`<div class="card" style="border-left:4px solid var(--gold)"><b>Browser limits:</b> alarms only ring while this tab is open and your device is awake. For reliable alarms, use your phone’s clock app or a native app.</div>
<div class="grid g2" style="margin-top:16px"><div class="card"><h2>Add alarm</h2><label>Time</label><input type="time" id="at" value="07:00"><label>Label</label><input id="al" placeholder="Wake-up"><label>Repeat</label><div class="row" id="ad">${'SMTWTFS'.split('').map((d,i)=>`<label style="margin:0;display:flex;gap:3px;align-items:center"><input type="checkbox" style="width:auto" value="${i}" ${i>0&&i<6?'checked':''}>${d}</label>`).join('')}</div>
<button class="btn" id="aa" style="margin-top:14px">Add alarm</button> <button class="btn ghost" id="an">Allow notifications</button></div>
<div class="card"><h2>Your alarms</h2>${D().alarms.map(x=>`<div class="row sp" style="padding:8px 0;border-bottom:1px solid var(--line)"><div><b>${x.t}</b> <span class="mut">${x.label} · ${x.days.length?x.days.map(d=>'SMTWTFS'[d]).join(' '):'Once'}</span></div><div class="row"><input type="checkbox" style="width:auto" data-t="${x.id}" ${x.on?'checked':''}><button class="btn ghost sm" data-d="${x.id}">Delete</button></div></div>`).join('')||empty('No alarms yet. Add one to get started.')}
<h2 style="margin-top:18px">Bedtime reminder</h2><p class="mut">Bedtime ${U().bed}. Next in <b id="cb">–</b></p><button class="btn ghost sm" id="at2">Test alarm sound</button></div></div>`},
history(){const rs=recs();return head('Sleep history',rs.length+' records')+`<div class="card"><input id="sq" placeholder="Search by date or note" style="max-width:320px;margin-bottom:10px"><div class="wrap"><table><thead><tr><th>Date</th><th>Bed</th><th>Wake</th><th>Duration</th><th>Quality</th><th>Goal</th><th></th></tr></thead><tbody id="hb"></tbody></table></div></div>`},
analytics(){const rs=recs(),g=U().goal*60;if(!rs.length)return head('Analytics','Charts use your recorded nights.')+`<div class="card">${empty('No data yet. Log a night or try the demo account.')}</div>`;
const w=rs.slice(0,7),pw=rs.slice(7,14),hit=Math.round(rs.filter(r=>dur(r)>=g).length/rs.length*100),debt=rs.slice(0,7).reduce((s,r)=>s+(g-dur(r)),0);
return head('Analytics','Charts use your recorded nights.')+`<div class="grid g4"><div class="card"><div class="mut">Avg bedtime</div><div class="big">${avgT(rs,'bed')}</div></div><div class="card"><div class="mut">Avg wake-up</div><div class="big">${avgT(rs,'wake')}</div></div><div class="card"><div class="mut">Goal met</div><div class="big">${hit}%</div></div>
<div class="card"><div class="mut">7-day sleep debt (estimate)</div><div class="big">${debt>0?fd(debt):'None'}</div></div></div>
<div class="grid g2" style="margin-top:16px"><div class="card"><h2>Duration vs goal</h2><canvas id="c1" height="190"></canvas></div><div class="card"><h2>Quality & mood</h2><canvas id="c2" height="190"></canvas></div></div>
<div class="card" style="margin-top:16px"><h2>Insights</h2><ul>${ins(w,pw,g).map(i=>`<li>${i}</li>`).join('')}</ul><p class="mut">Observations come from your own records. They are not medical advice.</p></div>`},
wellness(){return head('Wellness','Breathe, then drift off.')+`<div class="grid g2"><div class="card" style="text-align:center"><h2>Guided breathing</h2><div class="breath">Breathe</div><p class="mut">In 4 s · hold 2 s · out 8 s. Grow with the circle, shrink as it falls.</p></div>
<div class="card"><h2>Sleep sounds</h2><p class="mut">Generated live in your browser.</p><div class="row">${['White noise','Rain','Ocean'].map((n,i)=>`<button class="btn ghost" data-s="${i}">${n}</button>`).join('')}<button class="btn bad" id="ss">Stop</button></div><label>Auto-stop timer</label><select id="st"><option value="0">Off</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">60 min</option></select><label>Volume</label><input type="range" id="sv" min="0" max="1" step=".05" value=".4">
<h2 style="margin-top:18px">Sleep hygiene</h2><ul><li>Keep a steady wake-up time, even on weekends.</li><li>Dim screens 60 minutes before bed.</li><li>Keep the room cool, dark and quiet.</li></ul></div></div>`},
settings(){const u=U();return head('Settings','Profile, goals and data.')+`<div class="grid g2"><div class="card"><h2>Profile & goals</h2><label>Name</label><input id="sn" value="${u.name}"><label>Sleep goal (hours)</label><input id="sg" type="number" min="4" max="12" step=".5" value="${u.goal}"><div class="row"><div style="flex:1"><label>Bedtime</label><input id="sb" type="time" value="${u.bed}"></div><div style="flex:1"><label>Wake-up</label><input id="sw2" type="time" value="${u.wake}"></div></div><p class="mut">Suggested bedtime for a ${u.wake} wake-up: <b id="sug"></b></p><button class="btn" id="sv2">Save settings</button></div>
<div class="card"><h2>App & data</h2><label>Theme</label><select id="th">${['auto','light','dark'].map(t=>`<option ${db.theme==t?'selected':''}>${t}</option>`).join('')}</select><div class="row" style="margin-top:14px"><button class="btn ghost" id="ex">Export CSV</button><button class="btn ghost" id="bk">Backup JSON</button><label class="btn ghost" style="margin:0;color:var(--ink)">Restore<input type="file" id="rs" accept=".json" hidden></label></div>
<div class="row" style="margin-top:14px"><button class="btn ghost" id="rd">Reset sample data</button><button class="btn bad" id="lo">Switch profile</button></div></div></div>`},
about(){return head('About & help','SleepSync is a mini-project for tracking sleep habits.')+`<div class="grid g2"><div class="card"><h2>How to use it</h2><p>Start the timer when you go to bed and end it when you wake, or log a night manually. Overnight sessions are handled automatically. Set alarms under Smart alarm, review charts in Analytics, and export data from Settings.</p></div><div class="card"><h2>Privacy</h2><p>All data stays in this browser’s LocalStorage. Nothing is sent to a server. SleepSync does not measure sleep stages and gives no medical advice; sleep debt is an estimate.</p></div></div>`}};
function ins(w,pw,g){const o=[],a=avg(w.map(dur)),b=avg(pw.map(dur));o.push(`You met your goal on ${w.filter(r=>dur(r)>=g).length} of the last ${w.length} nights.`);
if(b!=null){const d=Math.round(a-b);o.push(`Average sleep ${d>=0?'rose':'fell'} by ${Math.abs(d)} minutes compared with the prior week.`)}
const c=cons(w);if(c!=null)o.push(`Your bedtime consistency score is ${c}%.`);
const hi=w.filter(r=>r.mood>=4);if(hi.length)o.push(`You reported a good mood after ${hi.length} nights averaging ${fd(avg(hi.map(dur)))} of sleep.`);return o}
const AFTER={
dashboard(){const f=()=>{$('#cb').textContent=cd(U().bed);$('#cw').textContent=cd(U().wake)};f();tick=setInterval(f,1000);
const w=recs().slice(0,7).reverse();if(w.length)mkc('#c1',{type:'bar',data:{labels:w.map(r=>fday(r.wake)),datasets:[{label:'Hours',data:w.map(r=>+(dur(r)/60).toFixed(1)),backgroundColor:css('--acc'),borderRadius:4}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}})},
track(){const t=D().timer;if(t){const f=()=>{$('#el').textContent=fd((Date.now()-new Date(t))/6e4)+' elapsed'};f();tick=setInterval(f,1000)}
$('#tm').onclick=()=>{if(D().timer){const b=D().timer,w=new Date().toISOString(),r={id:'r'+Date.now(),bed:b,wake:w,q:3,mood:3,note:'Timer session'};D().timer=null;if(dur(r)<1){save();route();return toast('Session too short to save.')}D().recs.push(r);toast('Saved '+fd(dur(r))+'. Rate it in History.')}else D().timer=new Date().toISOString();save();route()};
const pv=()=>{const r=mr();$('#pv').textContent=r?'Duration: '+fd(dur(r)):''};const mr=()=>{const d=$('#md').value,b=$('#mb').value,w=$('#mw').value;if(!d||!b||!w)return null;const wk=new Date(d+'T'+w),bd=new Date(d+'T'+b);if(bd>=wk)bd.setDate(bd.getDate()-1);return{bed:bd.toISOString(),wake:wk.toISOString()}};
['md','mb','mw'].forEach(i=>$('#'+i).oninput=pv);pv();
$('#ms').onclick=()=>{const r=mr();if(!r)return toast('Fill in the date, bedtime and wake-up time.');const m=dur(r);if(m>16*60)return toast('That session is over 16 hours. Check your times.');if(new Date(r.wake)>new Date())return toast('Wake-up time is in the future.');
if(D().recs.some(x=>Math.abs(new Date(x.bed)-new Date(r.bed))<36e5))return toast('A record already exists for this night.');
D().recs.push({id:'r'+Date.now(),...r,q:+$('#mq').value,mood:+$('#mm').value,note:$('#mn').value.trim()});save();toast('Record saved: '+fd(m));location.hash='history'}},
alarm(){const f=()=>$('#cb').textContent=cd(U().bed);f();tick=setInterval(f,1000);
$('#aa').onclick=()=>{const t=$('#at').value;if(!t)return toast('Choose an alarm time.');D().alarms.push({id:Date.now(),t,label:$('#al').value.trim()||'Alarm',days:[...document.querySelectorAll('#ad input:checked')].map(i=>+i.value),on:true});save();toast('Alarm added.');route()};
$('#an').onclick=()=>'Notification'in window?Notification.requestPermission().then(p=>toast('Notifications '+p)):toast('Notifications are not supported here.');
$('#at2').onclick=()=>beep(1.5);
document.querySelectorAll('[data-t]').forEach(c=>c.onchange=()=>{D().alarms.find(a=>a.id==c.dataset.t).on=c.checked;save();toast(c.checked?'Alarm on.':'Alarm off.')});
document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{D().alarms=D().alarms.filter(a=>a.id!=b.dataset.d);save();route()})},
history(){const draw=()=>{const q=$('#sq').value.toLowerCase(),g=U().goal*60,rs=recs().filter(r=>(fday(r.wake)+' '+r.note).toLowerCase().includes(q));
$('#hb').innerHTML=rs.map(r=>`<tr><td>${fday(r.wake)}</td><td>${ft(r.bed)}</td><td>${ft(r.wake)}</td><td>${fd(dur(r))}</td><td><select data-q="${r.id}" style="width:auto">${[4,3,2,1].map(i=>`<option value="${i}" ${r.q==i?'selected':''}>${QL[i]}</option>`).join('')}</select></td><td>${dur(r)>=g?'<span class="pill">Met</span>':'<span class="mut">Missed</span>'}</td><td><button class="btn ghost sm" data-x="${r.id}">Delete</button></td></tr>`).join('')||`<tr><td colspan="7">${empty('No records match. Log a night in Track sleep.')}</td></tr>`;
document.querySelectorAll('[data-q]').forEach(s=>s.onchange=()=>{D().recs.find(r=>r.id==s.dataset.q).q=+s.value;save();toast('Quality updated.')});
document.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{if(confirm('Delete this record?')){D().recs=D().recs.filter(r=>r.id!=b.dataset.x);save();draw();toast('Record deleted.')}})};draw();$('#sq').oninput=draw},
analytics(){const w=recs().slice(0,14).reverse(),g=U().goal;if(!w.length)return;const L=w.map(r=>fday(r.wake));
mkc('#c1',{type:'bar',data:{labels:L,datasets:[{label:'Hours slept',data:w.map(r=>+(dur(r)/60).toFixed(1)),backgroundColor:css('--acc'),borderRadius:4},{type:'line',label:'Goal',data:w.map(()=>g),borderColor:css('--gold'),borderDash:[6,4],pointRadius:0}]}});
mkc('#c2',{type:'line',data:{labels:L,datasets:[{label:'Quality (1-4)',data:w.map(r=>r.q),borderColor:css('--acc2'),tension:.3},{label:'Mood (1-5)',data:w.map(r=>r.mood),borderColor:css('--gold'),tension:.3}]},options:{scales:{y:{min:0,max:5}}}})},
wellness(){document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>playSound(+b.dataset.s));$('#ss').onclick=()=>{stopSound();toast('Stopped.')};$('#sv').oninput=e=>{if(gain)gain.gain.value=+e.target.value}},
settings(){const sg=()=>{const[h,m]=$('#sw2').value.split(':'),d=new Date();d.setHours(h,m-(+$('#sg').value*60)-15,0,0);$('#sug').textContent=ft(d)+' (goal + 15 min to fall asleep)'};['sg','sw2'].forEach(i=>$('#'+i).oninput=sg);sg();
$('#sv2').onclick=()=>{const g=+$('#sg').value;if(!$('#sn').value.trim()||!(g>=4&&g<=12))return toast('Enter a name and a goal between 4 and 12 hours.');Object.assign(U(),{name:$('#sn').value.trim(),goal:g,bed:$('#sb').value,wake:$('#sw2').value});save();toast('Settings saved.')};
$('#th').onchange=e=>{db.theme=e.target.value;save();theme()};
const dl=(n,t,m)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click()};
$('#ex').onclick=()=>{if(!D().recs.length)return toast('Nothing to export yet.');dl('sleepsync.csv','date,bed,wake,minutes,quality,mood,note\n'+recs().map(r=>[r.wake.slice(0,10),r.bed,r.wake,Math.round(dur(r)),QL[r.q],r.mood,'"'+r.note.replace(/"/g,'""')+'"'].join(',')).join('\n'),'text/csv')};
$('#bk').onclick=()=>dl('sleepsync-backup.json',JSON.stringify({user:{...U(),pw:null},data:D()}),'application/json');
$('#rs').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const j=JSON.parse(t);if(!Array.isArray(j.data.recs))throw 0;D().recs=j.data.recs;D().alarms=j.data.alarms||[];save();toast('Backup restored.')}catch(x){toast('That file is not a valid SleepSync backup.')}})};
$('#rd').onclick=()=>{if(db.session.startsWith('demo@')){seed(db.session);save();toast('Sample data reset.')}else toast('Sample data only applies to the demo account.')};
$('#lo').onclick=()=>{db.session=null;save();$('#app').style.display='none';$('#auth').style.display='grid'}}};
let ac,gain,src,stopT;
function stopSound(){try{src&&src.stop()}catch(e){}src=null;clearTimeout(stopT)}
function playSound(i){stopSound();ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume();const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let k=0;k<n;k++)d[k]=Math.random()*2-1;
src=ac.createBufferSource();src.buffer=b;src.loop=true;gain=ac.createGain();gain.gain.value=+$('#sv').value;let node=src;
if(i>0){const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=i==1?3500:500;src.connect(f);node=f;if(i==2){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=.12;lg.gain.value=.3;l.connect(lg);lg.connect(gain.gain);l.start()}}
node.connect(gain);gain.connect(ac.destination);src.start();const m=+$('#st').value;if(m)stopT=setTimeout(stopSound,m*6e4);toast('Playing.')}
function beep(sec){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=660;g.gain.setValueAtTime(.01,ac.currentTime);g.gain.linearRampToValueAtTime(.4,ac.currentTime+sec);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+sec+.3);return o}catch(e){}}
let snoozeAt=0,lastMin='',ringing=false,rt;
function ring(l){if(ringing)return;ringing=true;$('#rl').textContent=l;$('#ring').style.display='grid';const go=()=>beep(2);go();rt=setInterval(go,3000);if('Notification'in window&&Notification.permission=='granted')new Notification('SleepSync',{body:l})}
const stopRing=()=>{ringing=false;clearInterval(rt);$('#ring').style.display='none'};
$('#dis').onclick=stopRing;$('#snz').onclick=()=>{snoozeAt=Date.now()+3e5;stopRing();toast('Snoozed for 5 minutes.')};
setInterval(()=>{if(!db.session||!D())return;const n=new Date(),k=n.toDateString()+n.getHours()+':'+n.getMinutes();
if(snoozeAt&&Date.now()>=snoozeAt){snoozeAt=0;ring('Snooze over')}
if(k!=lastMin){lastMin=k;const t=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
D().alarms.forEach(a=>{if(a.on&&a.t==t&&(!a.days.length||a.days.includes(n.getDay()))){ring(a.label);if(!a.days.length){a.on=false;save()}}})}},1000);
af();if(db.session&&db.users[db.session])boot();