const norm=s=>String(s??'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ');
const match=(p,q)=>{const h=norm([p.name,p.brand,p.model,p.category].join(' ')),t=norm(q).split(' ').filter(Boolean);return t.every(w=>h.includes(w));};
const C=CONFIG,$=s=>document.querySelector(s);let P=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>C.CURRENCY+Number(n).toLocaleString('en-IN');
const img=(u,w)=>u?u.replace('/upload/','/upload/f_auto,q_auto,w_'+w+'/'):'';
const eff=p=>p.discountPrice>0?p.discountPrice:p.price;
document.title=C.SHOP_NAME;$('#sn').textContent=C.SHOP_NAME;
async function load(){
  $('#g').innerHTML='<div class="sk"></div>'.repeat(8);
  try{const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),15000);
    const r=await fetch(C.API_URL+'?action=products',{signal:ctl.signal});clearTimeout(tm);
    const j=await r.json();if(!j.ok)throw 0;P=j.data;filters();render();
  }catch(e){$('#g').innerHTML='<div class="msg">Could not load products (server slow or offline).<br><br><button class="btn" onclick="load()">Retry</button></div>';}
}
function opts(sel,label,arr){const v=sel.value;sel.innerHTML=`<option value="">${label}</option>`+[...new Set(arr)].filter(Boolean).sort().map(x=>`<option>${esc(x)}</option>`).join('');sel.value=v;}
function filters(){opts($('#cat'),'All categories',P.map(p=>p.category));opts($('#br'),'All brands',P.map(p=>p.brand));}
function render(){
  const q=$('#q').value.toLowerCase(),c=$('#cat').value,b=$('#br').value,mn=+$('#mn').value||0,mx=+$('#mx').value||1e12,so=$('#so').value;
  let l=P.filter(p=>match(p,q)&&(!c||p.category===c)&&(!b||p.brand===b)&&eff(p)>=mn&&eff(p)<=mx);
  if(so==='pa')l.sort((a,b)=>eff(a)-eff(b));if(so==='pd')l.sort((a,b)=>eff(b)-eff(a));if(so==='n')l.sort((a,b)=>a.name.localeCompare(b.name));
  $('#ct').textContent=l.length+(l.length===1?' product':' products');
  $('#g').innerHTML=l.length?l.map(p=>{const pc=p.discountPrice>0?Math.round((1-p.discountPrice/p.price)*100):0;return `<div class="card${p.stock<=0?' oos':''}" tabindex="0" role="button" onkeydown="if(event.key==='Enter')openP('${esc(p.id)}')" onclick="openP('${esc(p.id)}')">${p.stock<=0?'<span class="badge o">Out of stock</span>':pc>0?`<span class="badge">−${pc}%</span>`:''}<div class="im">${p.images[0]?`<img loading="lazy" src="${esc(img(p.images[0],500))}" alt="${esc(p.name)}">`:'<div class="ph"></div>'}</div><div class="tx"><small>${esc(p.brand)}</small><span class="nm">${esc(p.name)}</span><div class="pr"><span class="price">${money(eff(p))}</span>${p.discountPrice>0?`<span class="old">${money(p.price)}</span>`:''}</div></div></div>`;}).join(''):'<div class="msg"><b>No products match your search.</b><br>Try fewer words or clear the filters.</div>';
}
['q','cat','br','mn','mx','so'].forEach(i=>$('#'+i).addEventListener('input',render));
function openP(id){
  const p=P.find(x=>x.id===id),d=$('#d'),wa=`https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(`Hi, I'm interested in ${p.name} (${money(eff(p))})`)}`,pc=p.discountPrice>0?Math.round((1-p.discountPrice/p.price)*100):0;
  const st=p.stock<=0?'<span class="pill r">Out of stock</span>':p.stock<5?`<span class="pill y">Only ${p.stock} left</span>`:'<span class="pill g">In stock</span>';
  d.innerHTML=`<button class="x" aria-label="Close" onclick="$('#d').close()">×</button><div class="pm"><div class="gl">${p.images[0]?`<img id="mi" src="${esc(img(p.images[0],900))}" alt="${esc(p.name)}">`:'<div class="ph"></div>'}${p.images.length>1?`<div class="tm">${p.images.map((u,i)=>`<img loading="lazy" class="${i?'':'on'}" src="${esc(img(u,120))}" data-f="${esc(img(u,900))}" alt="" onclick="$('#mi').src=this.dataset.f;document.querySelectorAll('.tm img').forEach(x=>x.classList.toggle('on',x===this))">`).join('')}</div>`:''}</div>
  <div class="pi"><small>${esc([p.brand,p.model].filter(Boolean).join(' · '))}</small><h2>${esc(p.name)}</h2><div><span class="price">${money(eff(p))}</span>${p.discountPrice>0?`<span class="old">${money(p.price)}</span> <span class="pill r">Save ${pc}%</span>`:''}</div><div>${st}</div>
  ${p.description?`<p class="mu" style="margin:0">${esc(p.description)}</p>`:''}${Object.keys(p.specs||{}).length?`<table class="spec">${Object.entries(p.specs).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>`:''}
  <a class="btn wa" href="${wa}" target="_blank" rel="noopener">WhatsApp Inquiry</a></div></div>`;
  d.showModal();
}
$('#d').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
load();
