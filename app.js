const norm=s=>String(s??'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ');
const match=(p,q)=>{const h=norm([p.name,p.brand,p.model,p.category].join(' ')),t=norm(q).split(' ').filter(Boolean);return t.every(w=>h.includes(w));};
const C=CONFIG,$=s=>document.querySelector(s);let P=[],CAT='',FAV=false,sig='',wl=[];
try{wl=JSON.parse(localStorage.getItem('wl')||'[]');}catch(e){}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>C.CURRENCY+Number(n).toLocaleString('en-IN');
const img=(u,w)=>u?u.replace('/upload/','/upload/f_auto,q_auto,w_'+w+'/'):'';
const eff=p=>p.discountPrice>0?p.discountPrice:p.price,pct=p=>p.discountPrice>0?Math.round((1-p.discountPrice/p.price)*100):0;
const TINT=['#ffdccb','#d9ecfb','#e6dff6','#fdf0b8','#d5f0e2'],DOT=['#ffb99a','#9fd0f5','#b9a7ec','#f5d35c','#7fd1a8'];
document.title=C.SHOP_NAME+(C.CITY?' – '+C.CITY:'');$('#sn').textContent=C.SHOP_NAME;$('#lg').textContent=C.SHOP_NAME[0];
$('#hp').textContent=`Mobiles, accessories and more from ${C.SHOP_NAME}${C.CITY?', '+C.CITY:''}. Tap a product and ask us on WhatsApp.`;
$('#wa').href='https://wa.me/'+C.WHATSAPP;
$('#ft').innerHTML=`<p>Thanks for stopping by. Take your time, we are not going anywhere.</p><p><a href="${esc(C.MAP_URL)}" target="_blank" rel="noopener">Get directions</a>${C.PHONE?` · <a href="tel:${esc(C.PHONE)}">Call us</a>`:''}</p>`;
$('#go').onclick=()=>$('#pl').scrollIntoView({behavior:'smooth'});
function saveWl(){try{localStorage.setItem('wl',JSON.stringify(wl));}catch(e){}}
function heart(){const h=$('#hc');h.hidden=!wl.length;h.textContent=wl.length;$('#hb').style.background=FAV?'var(--pe2)':'';}
$('#hb').onclick=()=>{FAV=!FAV;if(FAV&&!wl.length)FAV=false;heart();render();};
async function get(){const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),15000);
  try{const r=await fetch(C.API_URL+'?action=products&_='+Date.now(),{signal:ctl.signal});const j=await r.json();if(!j.ok)throw 0;return j.data;}finally{clearTimeout(tm);}}
async function load(){
  $('#g').innerHTML='<div class="sk"></div>'.repeat(8);
  try{P=await get();sig=JSON.stringify(P);setup();render();}
  catch(e){$('#g').innerHTML='<div class="msg">Could not load products (server slow or offline).<br><br><button class="bt dk" onclick="load()">Try again</button></div>';}
}
async function sync(){if(document.hidden||!sig)return;try{const d=await get(),s=JSON.stringify(d);if(s!==sig){sig=s;P=d;setup();render();}}catch(e){}}
setInterval(sync,20000);document.addEventListener('visibilitychange',sync);window.addEventListener('focus',sync);
function setup(){
  const cats=[...new Set(P.map(p=>p.category).filter(Boolean))].sort();if(CAT&&!cats.includes(CAT))CAT='';
  $('#pl').innerHTML=['All',...cats].map((c,i)=>`<button class="pl${(c==='All'?'':c)===CAT?' on':''}" data-c="${c==='All'?'':esc(c)}"><i style="background:${DOT[i%5]}"></i>${esc(c)}</button>`).join('');
  const s=$('#br'),v=s.value;s.innerHTML='<option value="">All brands</option>'+[...new Set(P.map(p=>p.brand).filter(Boolean))].sort().map(x=>`<option>${esc(x)}</option>`).join('');s.value=v;heart();
}
$('#pl').onclick=e=>{const b=e.target.closest('button');if(!b)return;CAT=b.dataset.c;setup();render();};
const heartSvg='<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 21s-7-4.4-9.3-8.6C1 9 2.7 5.5 6.2 5.5c2 0 3.2 1 3.8 2 .6-1 1.8-2 3.8-2 3.5 0 5.2 3.5 3.5 6.9C19 16.6 12 21 12 21z"/></svg>';
function card(p){const c=pct(p);return `<div class="card${p.stock<=0?' oos':''}" data-id="${esc(p.id)}" tabindex="0" role="button"><div class="im" style="background:${TINT[P.indexOf(p)%5]}">${p.stock<=0?'<span class="badge o">Sold out</span>':c>0?`<span class="badge">${c}% off</span>`:''}<button class="hr${wl.includes(p.id)?' on':''}" data-h="${esc(p.id)}" aria-label="Save">${heartSvg}</button>${p.images[0]?`<img loading="lazy" src="${esc(img(p.images[0],500))}" alt="${esc(p.name)}">`:''}</div><div class="tx"><small>${esc(p.brand)}</small><span class="nm">${esc(p.name)}</span><div class="pr"><div><span class="price">${money(eff(p))}</span>${p.discountPrice>0?`<span class="old">${money(p.price)}</span>`:''}</div><span class="add">+</span></div></div></div>`;}
function render(){
  const q=$('#q').value,b=$('#br').value,mn=+$('#mn').value||0,mx=+$('#mx').value||1e12,so=$('#so').value;
  let l=P.filter(p=>(!CAT||p.category===CAT)&&(!FAV||wl.includes(p.id))&&(!b||p.brand===b)&&match(p,q)&&eff(p)>=mn&&eff(p)<=mx);
  if(so==='pa')l.sort((a,b)=>eff(a)-eff(b));if(so==='pd')l.sort((a,b)=>eff(b)-eff(a));if(so==='n')l.sort((a,b)=>a.name.localeCompare(b.name));
  $('#ct').textContent=l.length+(l.length===1?' product':' products')+(FAV?' saved':'');
  $('#g').innerHTML=l.length?l.map(card).join(''):`<div class="msg"><b>${FAV?'Nothing saved yet':'No products match your search.'}</b><br>${FAV?'Tap the heart on a product to save it.':'Try fewer words or clear the filters.'}</div>`;
}
['q','br','mn','mx','so'].forEach(i=>$('#'+i).addEventListener('input',render));
$('#g').onclick=e=>{const h=e.target.closest('.hr');
  if(h){const id=h.dataset.h;wl=wl.includes(id)?wl.filter(x=>x!==id):[...wl,id];saveWl();heart();if(FAV&&!wl.length)FAV=false;return FAV?render():(h.classList.toggle('on'),void 0);}
  const c=e.target.closest('.card');if(c)openP(c.dataset.id);};
$('#g').onkeydown=e=>{if(e.key==='Enter'){const c=e.target.closest('.card');if(c)openP(c.dataset.id);}};
function openP(id){
  const p=P.find(x=>x.id===id),d=$('#d'),wa=`https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(`Hi, I'm interested in ${p.name} (${money(eff(p))})`)}`,c=pct(p);
  const st=p.stock<=0?'<span class="pill r">Out of stock</span>':p.stock<5?`<span class="pill y">Only ${p.stock} left</span>`:'<span class="pill g">In stock</span>';
  d.innerHTML=`<button class="x" aria-label="Close" onclick="$('#d').close()">×</button><div class="pm"><div class="gl">${p.images[0]?`<img id="mi" src="${esc(img(p.images[0],900))}" alt="${esc(p.name)}">`:'<div class="ph"></div>'}${p.images.length>1?`<div class="tm">${p.images.map((u,i)=>`<img loading="lazy" class="${i?'':'on'}" src="${esc(img(u,120))}" data-f="${esc(img(u,900))}" alt="" onclick="$('#mi').src=this.dataset.f;document.querySelectorAll('.tm img').forEach(x=>x.classList.toggle('on',x===this))">`).join('')}</div>`:''}</div>
  <div class="pi"><small>${esc([p.brand,p.model].filter(Boolean).join(' · '))}</small><h2>${esc(p.name)}</h2><div><span class="price">${money(eff(p))}</span>${c>0?`<span class="old">${money(p.price)}</span> <span class="pill g">${c}% off</span>`:''}</div><div>${st}</div>
  ${p.description?`<p class="mu" style="margin:0">${esc(p.description)}</p>`:''}${Object.keys(p.specs||{}).length?`<h3 class="sh">Specifications</h3><table class="spec">${Object.entries(p.specs).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>`:''}
  <a class="bt wa" href="${wa}" target="_blank" rel="noopener">Ask on WhatsApp</a></div></div>`;
  d.showModal();
}
$('#d').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
load();
