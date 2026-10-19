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
  let l=P.filter(p=>(!q||(p.name+p.brand+p.model+p.category).toLowerCase().includes(q))&&(!c||p.category===c)&&(!b||p.brand===b)&&eff(p)>=mn&&eff(p)<=mx);
  if(so==='pa')l.sort((a,b)=>eff(a)-eff(b));if(so==='pd')l.sort((a,b)=>eff(b)-eff(a));if(so==='n')l.sort((a,b)=>a.name.localeCompare(b.name));
  $('#g').innerHTML=l.length?l.map(p=>`<div class="card" onclick="openP('${esc(p.id)}')">${p.stock<=0?'<span class="badge">Out of stock</span>':''}${p.images[0]?`<img loading="lazy" src="${esc(img(p.images[0],400))}" alt="">`:'<div class="ph"></div>'}<div><b>${esc(p.name)}</b><br><small>${esc(p.brand)}</small><br><span class="price">${money(eff(p))}</span>${p.discountPrice>0?`<span class="old">${money(p.price)}</span>`:''}</div></div>`).join(''):'<div class="msg">No products found.</div>';
}
['q','cat','br','mn','mx','so'].forEach(i=>$('#'+i).addEventListener('input',render));
function openP(id){
  const p=P.find(x=>x.id===id),d=$('#d'),wa=`https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(`Hi, I'm interested in ${p.name} (${money(eff(p))})`)}`;
  d.innerHTML=`<div class="gal">${p.images.map(u=>`<img loading="lazy" src="${esc(img(u,800))}" alt="">`).join('')}</div><h2>${esc(p.name)}</h2><p>${esc(p.brand)} ${esc(p.model)}</p>
  <p class="price">${money(eff(p))}${p.discountPrice>0?`<span class="old">${money(p.price)}</span>`:''} ${p.stock<=0?'<span class="err">Out of stock</span>':''}</p><p>${esc(p.description)}</p>
  <table class="spec">${Object.entries(p.specs||{}).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table><p><a class="btn" href="${wa}" target="_blank" rel="noopener">WhatsApp Inquiry</a> <button class="btn alt" onclick="$('#d').close()">Close</button></p>`;
  d.showModal();
}
load();
