'use strict';
// Question families follow the actual generator structures, not broad modules or
// generic difficulty labels. Existing answer history needs no migration.
const questionFamilies = [
 ['Limit versus point value','Unequal one-sided limits','Missing point values','What a limit does not determine'],
 ['Open circles and approached values','Reading filled points','Recognizing holes on graphs','Jumps on graphs'],
 ['Absolute values from the left','Absolute values from the right','Left-hand piecewise branches','Right-hand piecewise branches'],
 ['Linear substitution','Quadratic substitution','Radical substitution','Translated polynomial substitution'],
 ['Rational substitution','Exact trig values at zero','Rational limits at negative inputs','Trig quotients'],
 ['Matching piecewise limits','Unequal piecewise limits','Matching limits with shifted branches','Point values versus branch limits'],
 ['Verifying all continuity conditions','Limit and value disagree','One-sided limits disagree','Undefined point values'],
 ['Canceled factors and holes','Infinite discontinuities','Jump discontinuities','Removable point-value mismatches'],
 ['Difference-of-squares limits','Difference-of-cubes limits','Factoring trinomials for limits','Reducing rational expressions'],
 ['Conjugates with square roots','Radicals in the denominator','Shifted radical differences','Scaled radical differences'],
 ['Estimating a limit from a table','Limits of numerical evidence','Unequal trends in a table','Missing function values in tables'],
 ['Filling a removable hole','Matching a constant parameter','Matching a coefficient parameter','Joining two boundaries'],
 ['Checking the IVT hypotheses','Discontinuities inside an IVT interval','Finding a guaranteed input','IVT tests versus actual existence'],
 ['Left-hand infinite limits','Right-hand infinite limits','Even powers near an asymptote','Negative numerators near an asymptote'],
 ['Even asymptote multiplicity','Odd asymptote multiplicity','Multiplicity after cancellation','Odd behavior after reduction'],
 ['Equal degrees at infinity','Lower numerator degree','Higher numerator degree and sign','Total degree of factored expressions'],
 ['Radical limits at positive infinity','Radical limits at negative infinity','Scaled radical limits on the right','Scaled radical limits on the left'],
 ['Exponential decay toward the left','Negative exponents toward the right','Exponential versus polynomial growth','Combining exponential and rational limits'],
 ['Keeping original domain restrictions','Finding a hole’s height','Finding remaining vertical asymptotes','Domain after cancellation'],
 ['Valid x-intercepts','Finding y-intercepts','Even roots that touch the axis','Odd roots that cross the axis'],
 ['Quadratic secant slopes','Cubic secant slopes','Rates from motion tables','Rates for combined polynomial terms'],
 ['Nearby secant estimates','Shorter-interval estimates','Cubic local-rate estimates','Choosing a local interval'],
 ['Squeezing a quadratic oscillation','Squeezing a higher-power oscillation','Matching bounding limits','Unequal bounds and insufficient evidence'],
 ['Sum and constant-multiple limit laws','Product limits','Quotients with nonzero limits','Recognizing indeterminate limit-law results'],
 ['Continuous outer functions','Inner outputs approach from below','Inner outputs approach from above','Insufficient composition information']
];
const targetedSkills = window.UNIT_DATA.modules.flatMap(m => (m.families||[...questionFamilies[m.id-1], 'Combining ideas: '+m.title.toLowerCase()]).map((label,family)=>({
 id:`${m.id}:${family}`,module:m.id,label,
 problems:window.UNIT_DATA.problems.filter(p=>p.module===m.id&&(p.family??(Number(p.id.slice(-2))===20?4:Math.trunc((Number(p.id.slice(-2))-1)/5)))===family)
})));
const skillByProblem = new Map(targetedSkills.flatMap(s=>s.problems.map(p=>[p.id,s])));
let targetedSelected = new Set(), targetedInitialized=false, targetedView='weak', targetedModule='all', targetedQuery='', targetedCount=10;

function weaknessSummary(history=state.attempts){
 const latest=new Map();
 for(const a of history)if(skillByProblem.has(a.id)&&typeof a.correct==='boolean')latest.set(a.id,a);
 return targetedSkills.map(skill=>{
  const recent=skill.problems.map(p=>latest.get(p.id)).filter(Boolean).sort((a,b)=>a.time-b.time).slice(-8);
  const totalWeight=recent.length*(recent.length+1)/2;
  const weighted=recent.length?recent.reduce((n,a,i)=>n+(a.correct?i+1:0),0)/totalWeight:null;
  const missed=recent.filter(a=>!a.correct).length;
  return {...skill,recent,missed,accuracy:recent.length?accuracy(recent):null,weighted,
   weak:missed>0&&weighted<.8,
   status:!recent.length?'Not assessed':missed>0&&weighted<.8?(recent.length<3?'Early signal':'Needs practice'):'On track'};
 }).sort((a,b)=>Number(b.weak)-Number(a.weak)||(a.weighted??2)-(b.weighted??2)||b.missed-a.missed||a.module-b.module||a.label.localeCompare(b.label));
}

function buildTargetedQuestions(ids,count,history=state.attempts){
 const latest=new Map(history.map(a=>[a.id,a]));
 const requested=new Set(ids);
 const queues=weaknessSummary(history).filter(s=>requested.has(s.id)).map(s=>[
  ...shuffle(s.problems.filter(p=>latest.get(p.id)?.correct===false)),
  ...shuffle(s.problems.filter(p=>!latest.has(p.id))),
  ...shuffle(s.problems.filter(p=>latest.get(p.id)?.correct===true))
 ]);
 const chosen=[];
 // Round-robin gives each selected kind a turn, weakest kinds first. Within a
 // kind, revisit misses, then unseen variations, then previously correct ones.
 while(chosen.length<count&&queues.some(q=>q.length))for(const q of queues){if(q.length&&chosen.length<count)chosen.push(q.shift())}
 return chosen;
}

function startTargetedPractice(ids=[...targetedSelected]){
 const selected=targetedSkills.filter(s=>ids.includes(s.id));
 const questions=buildTargetedQuestions(selected.map(s=>s.id),targetedCount);
 if(!questions.length)return;
 const before=weaknessSummary().filter(s=>ids.includes(s.id));
 session={mode:'practice',questions,pool:questions,unlimited:false,index:0,answers:{},recorded:{},assisted:{},started:Date.now(),finished:false,elapsed:0,
  targeted:{skills:selected.map(s=>s.id),before:before.map(s=>({id:s.id,accuracy:s.accuracy,status:s.status}))}};
 resetQuestion();go('session');if(route==='session')questionPage();
}

function targetedPage(){
 const summary=weaknessSummary().filter(s=>mget(s.module).unit===activeUnit),weak=summary.filter(s=>s.weak);
 if(!targetedInitialized){targetedSelected=new Set(weak.slice(0,3).map(s=>s.id));targetedInitialized=true}
 const shown=summary.filter(s=>(targetedView==='all'||s.weak)&&(targetedModule==='all'||s.module===Number(targetedModule))&&(`${s.label} ${mget(s.module).title}`).toLowerCase().includes(targetedQuery.toLowerCase()));
 const selected=summary.filter(s=>targetedSelected.has(s.id));
 const planned=buildTargetedQuestions([...targetedSelected],targetedCount);
 shell(intro('PRACTICE WITH A PURPOSE','Targeted Practice','Find the kinds of questions that need another look, then build a practice session around them.')+`
 <div class="target-overview card"><div><span class="eyebrow">YOUR CURRENT FOCUS</span><h2>${weak.length?`${weak.length} question type${weak.length===1?'':'s'} to revisit`:'Start with the skills you want to strengthen'}</h2><p class="muted">${weak.length?'Suggestions come from your practice and quiz answers. Newer answers matter more, and a correct retry replaces the earlier miss.':attempts().length?'Your assessed question types are on track. Choose any skill below, or try a quiz to check new areas.':'Complete some practice or a quiz to get personal suggestions. You can also choose question types yourself right now.'}</p></div><button id="target-browse">Choose question types</button></div>
 <div class="target-layout"><section aria-label="Question types"><div class="pill-row" role="group" aria-label="Question type view"><button data-target-view="weak" class="${targetedView==='weak'?'primary':''}" aria-pressed="${targetedView==='weak'}">My weaknesses (${weak.length})</button><button data-target-view="all" class="${targetedView==='all'?'primary':''}" aria-pressed="${targetedView==='all'}">All question types</button></div>
 <form id="target-filter" class="card target-filter"><div class="field"><label for="target-module">Topic</label><select id="target-module">${options([['all',`All Unit ${activeUnit} topics`],...modules.map(m=>[m.id,(m.sourceLesson?m.sourceLesson+' · ':'')+m.title])],targetedModule)}</select></div><div class="field"><label for="target-search">Find a question type</label><input id="target-search" value="${esc(targetedQuery)}" placeholder="${activeUnit===2?'e.g. quotient or velocity':'e.g. conjugates or one-sided'}"></div><button class="small" type="submit">Filter</button></form>
 <div class="target-list">${shown.map(s=>`<article class="card target-skill ${targetedSelected.has(s.id)?'chosen':''}"><label class="target-choice"><input type="checkbox" data-target-skill="${s.id}" ${targetedSelected.has(s.id)?'checked':''}><span><span class="mini-label">${mget(s.module).title}</span><strong>${esc(s.label)}</strong></span></label><div class="target-evidence"><span class="badge ${s.weak?'hard':''}">${s.status}</span><span>${s.accuracy===null?'No answers yet':`${s.accuracy}% accuracy · ${s.missed} missed of ${s.recent.length} recently answered`}</span><span>${s.problems.length} matching problem${s.problems.length===1?'':'s'}</span></div>${s.status==='Early signal'?'<p class="mini-label">Only a little evidence so far. Try related questions to check this skill.</p>':''}<details><summary>What this practice covers</summary><p>${esc(s.problems[0].question)}</p>${math(s.problems[0].math)}<p class="muted"><b>Skill reminder:</b> ${mget(s.module).mistake}</p><a class="text-btn small" href="#lesson/${s.module}">Review the lesson →</a></details><button class="small" data-practice-skill="${s.id}">Practice this type</button></article>`).join('')||`<div class="card empty"><h3>${targetedView==='weak'?'No matching weaknesses yet.':'No question types match.'}</h3><p>${targetedView==='weak'?'Your list updates after checked answers and submitted quizzes. Browse all question types to choose your own focus.':'Try another topic or a broader search.'}</p><button id="target-show-all">Browse all question types</button></div>`}</div></section>
 <aside class="card target-builder" aria-label="Targeted session setup"><span class="eyebrow">YOUR PRACTICE PLAN</span><h2>${selected.length} type${selected.length===1?'':'s'} selected</h2><div class="target-selected">${selected.map(s=>`<div><span>${esc(s.label)}</span><button class="text-btn" data-remove-skill="${s.id}" aria-label="Remove ${esc(s.label)}">×</button></div>`).join('')||'<p class="muted">Select a question type to build your session.</p>'}</div><div class="field"><label for="target-count">Questions</label><select id="target-count">${options(['5','10','20'],targetedCount)}</select></div><p class="mini-label">${planned.length} unique matching questions in this session. ${planned.length<targetedCount&&selected.length?'This selection has fewer problems than your requested count.':''}</p><button class="primary" id="target-start" ${planned.length?'':'disabled'}>Start targeted practice →</button><button class="text-btn small" id="target-clear" ${selected.length?'':'disabled'}>Clear selection</button><hr><h3>How your session is picked</h3><p class="muted">Each selected type gets a turn. Within that type, missed questions come first, followed by unseen variations and then earlier correct answers.</p><details><summary>How weaknesses are identified</summary><p>We use your latest checked answer to each of up to 8 recently answered questions per type. Newer questions receive more weight. A weighted score below 80% with at least one miss suggests practice. Fewer than 3 answered questions is an early signal, not a firm assessment. Unattempted types are never labeled weaknesses.</p></details></aside></div>`);
 $$('[data-target-view]').forEach(b=>b.onclick=()=>{targetedView=b.dataset.targetView;targetedPage()});
 const browse=()=>{targetedView='all';targetedModule='all';targetedQuery='';targetedPage()};$('#target-browse').onclick=browse;if($('#target-show-all'))$('#target-show-all').onclick=browse;
 $('#target-filter').onsubmit=e=>{e.preventDefault();targetedModule=$('#target-module').value;targetedQuery=$('#target-search').value.trim();targetedPage()};$('#target-module').onchange=()=>{targetedModule=$('#target-module').value;targetedQuery=$('#target-search').value.trim();targetedPage()};
 $$('[data-target-skill]').forEach(el=>el.onchange=()=>{el.checked?targetedSelected.add(el.dataset.targetSkill):targetedSelected.delete(el.dataset.targetSkill);targetedPage();$(`[data-target-skill="${el.dataset.targetSkill}"]`)?.focus()});
 $$('[data-remove-skill]').forEach(b=>b.onclick=()=>{targetedSelected.delete(b.dataset.removeSkill);targetedPage()});
 $$('[data-practice-skill]').forEach(b=>b.onclick=()=>startTargetedPractice([b.dataset.practiceSkill]));
 $('#target-count').onchange=e=>{targetedCount=Number(e.target.value);targetedPage()};$('#target-clear').onclick=()=>{targetedSelected.clear();targetedPage()};$('#target-start').onclick=()=>startTargetedPractice();
}

function targetedSessionBanner(){if(!session?.targeted)return'';return `<div class="feedback target-session"><b>Targeted Practice</b><p>${session.targeted.skills.map(id=>esc(targetedSkills.find(s=>s.id===id)?.label)).join(' · ')}</p><a href="#targeted" class="text-btn small">Back to weaknesses →</a></div>`}
function targetedResults(){if(!session?.targeted)return'';const current=weaknessSummary().filter(s=>session.targeted.skills.includes(s.id));return `<section class="card target-results"><div class="heading-row" style="margin-top:0"><h2>Your targeted skills</h2><a class="text-btn small" href="#targeted">Update my practice plan →</a></div>${current.map(s=>{const before=session.targeted.before.find(b=>b.id===s.id);return `<div class="row"><div><strong>${esc(s.label)}</strong><div class="mini-label">${before?.accuracy==null?'Previously unassessed':`Before: ${before.accuracy}%`} → ${s.accuracy==null?'Not answered yet':`Now: ${s.accuracy}%`} · Latest answers to distinct questions</div></div><span class="badge ${s.weak?'hard':''}">${s.status}</span></div>`}).join('')}</section>`}
