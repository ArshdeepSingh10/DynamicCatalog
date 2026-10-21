const norm=s=>String(s??'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ');
const match=(p,q)=>{const h=norm([p.name,p.brand,p.model,p.category].join(' ')),t=norm(q).split(' ').filter(Boolean);return t.every(w=>h.includes(w));};
const C=CONFIG,$=s=>document.querySelector(s);let cats=[],catF='',prods=[],imgs=[],fresh=[],editId=null,saved=false,uploading=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const HD=['ID','Name','Category','Brand','Model','Price','Discount Price','Stock','Description','Specifications','Image URLs','Image Public IDs','Featured','Status'];
let tt;function toast(m,bad){const t=$('#toast');try{t.hidePopover();}catch(e){}(document.querySelector('dialog[open]')||document.body).append(t);
  t.innerHTML='<span></span><button aria-label="Close">×</button>';t.firstChild.textContent=m;t.className=bad?'bad':'';t.querySelector('button').onclick=()=>t.hidePopover();
  t.showPopover();clearTimeout(tt);tt=setTimeout(()=>{try{t.hidePopover();}catch(e){}},bad?10000:3500);}
let nb=0;
async function api(action,data={}){
  nb++;$('#tl').hidden=false;
  try{const r=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action,token:sessionStorage.tok,...data})});
    const j=await r.json();if(j.auth===false){sessionStorage.removeItem('tok');location.reload();}if(!j.ok)throw new Error(j.error);return j.data;}
  finally{if(--nb===0)$('#tl').hidden=true;}
}
async function go(btn,fn){btn.classList.add('ld');btn.disabled=true;try{await fn();}catch(e){toast(e.message,1);}btn.classList.remove('ld');btn.disabled=false;}
$('#lb').onclick=e=>go(e.target,async()=>{$('#le').textContent='';
  try{const d=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'login',password:$('#pw').value})}).then(r=>r.json());
    if(!d.ok)throw new Error(d.error);sessionStorage.tok=d.token;start();}catch(x){$('#le').textContent=x.message;}});
$('#pw').onkeydown=e=>{if(e.key==='Enter')$('#lb').click();};
$('#lo').onclick=()=>{sessionStorage.removeItem('tok');location.reload();};
function start(){$('#login').hidden=true;$('#app').hidden=false;$('#sn').textContent=C.SHOP_NAME+' – Admin';$('#st').innerHTML='<div class="sk" style="height:76px"></div>'.repeat(4);$('#tb').innerHTML='<tbody>'+'<tr><td colspan="7"><div class="sk" style="height:48px"></div></td></tr>'.repeat(5)+'</tbody>';refresh().catch(e=>toast(e.message,1));}
function renderAll(){
  const cm={};prods.forEach(p=>{const k=p.category||'Uncategorized';cm[k]=(cm[k]||0)+1;});cats=Object.entries(cm).sort((x,y)=>y[1]-x[1]);
  $('#st').innerHTML=`<div><b>${prods.length}</b>Products</div><div><b>${prods.filter(p=>p.stock>0&&p.stock<5).length}</b>Low stock</div><div><b>${prods.filter(p=>p.stock<=0).length}</b>Out of stock</div><button class="cc" id="cats"><b>${cats.length}</b>Categories · View all</button>`;
  $('#cats').onclick=openCats;if(catF&&!cm[catF])catF='';setCat(catF);}
async function refresh(){const d=await api('stats');prods=d.products.slice().reverse();renderAll();}
const money=n=>C.CURRENCY+Number(n).toLocaleString('en-IN');
function draw(){const l=prods.filter(p=>(!catF||(p.category||'Uncategorized')===catF)&&match(p,$('#aq').value));
  $('#tb').innerHTML=l.length?'<thead><tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>'+l.map(p=>
  `<tr><td class="im">${p.images[0]?`<img src="${esc(p.images[0].replace('/upload/','/upload/f_auto,q_auto,w_100/'))}" alt="">`:''}</td><td class="pn"><b>${esc(p.name)}</b><small>${esc(p.brand)}</small></td><td data-l="Category">${esc(p.category)}</td><td data-l="Price">${money(p.discountPrice||p.price)}</td><td data-l="Stock"><span class="pill ${p.stock<=0?'r':p.stock<5?'y':'g'}">${p.stock}</span></td>
  <td data-l="Status"><button class="pill ${p.status==='Active'?'g':''}" data-t="${esc(p.id)}" title="Click to change">${esc(p.status)}</button></td><td class="ac"><button class="btn alt" data-e="${esc(p.id)}">Edit</button> <button class="btn red" data-d="${esc(p.id)}">Delete</button></td></tr>`).join('')+'</tbody>':'<tbody><tr><td class="msg">No products yet. Click “Add product” to create one.</td></tr></tbody>';}
$('#aq').oninput=draw;
$('#tb').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.t||b.dataset.e||b.dataset.d,p=prods.find(x=>x.id===id);
  if(b.dataset.t)go(b,async()=>{const r=await api('toggleStatus',{id});p.status=r.status;renderAll();toast('Status changed');});
  if(b.dataset.e)openForm(p);
  if(b.dataset.d)ask('Delete this product?',`“${p.name}” and all its images will be removed permanently.`,'Delete product').then(ok=>ok&&go(b,async()=>{const tr=b.closest('tr');tr.classList.add('busy');try{await api('deleteProduct',{id});prods=prods.filter(x=>x.id!==id);renderAll();toast('Product deleted');}finally{tr.classList.remove('busy');}}));};
function ask(title,msg,okLabel){return new Promise(res=>{const d=$('#cf');let r=false;d.innerHTML=`<div class="dp cfm"><h3>${esc(title)}</h3><p>${esc(msg)}</p><div class="ft"><button class="btn alt" id="cn">Cancel</button><button class="btn red" id="ck">${esc(okLabel)}</button></div></div>`;d.onclose=()=>res(r);$('#ck').onclick=()=>{r=true;d.close();};$('#cn').onclick=()=>d.close();d.showModal();$('#cn').focus();});}
$('#addb').onclick=()=>openForm(null);
const FL=[['name','Name'],['category','Category'],['brand','Brand'],['model','Model'],['price','Price','number'],['discountPrice','Discount Price','number'],['stock','Stock','number']];
function openForm(p){
  editId=p?p.id:null;saved=false;fresh=[];imgs=p?p.images.map((u,i)=>({url:u,pid:p.publicIds[i]})):[];
  $('#fm').innerHTML=`<div class="dp"><h3>${p?'Edit':'Add'} product</h3><div class="fg">${FL.map(f=>`<label>${f[1]}<input id="f_${f[0]}" type="${f[2]||'text'}" min="0" value="${esc(p?p[f[0]]||'':'')}"></label>`).join('')}
  <label>Featured<select id="f_featured"><option>No</option><option ${p&&p.featured?'selected':''}>Yes</option></select></label>
  <label>Status<select id="f_status"><option>Active</option><option ${p&&p.status==='Hidden'?'selected':''}>Hidden</option></select></label>
  <label class="w">Description<textarea id="f_description" rows="3">${esc(p?p.description:'')}</textarea></label></div>
  <h4>Specifications</h4><div id="sp"></div><button class="btn alt" id="addsp">+ Row</button><h4>Images</h4>
  <div id="dz">Drag images here or click to choose (max 5 MB each)<input id="fi" type="file" accept="image/*" multiple hidden></div><div id="th"></div>
  <div class="ft"><button class="btn alt" id="cx">Cancel</button><button class="btn" id="sv">Save product</button></div></div>`;
  Object.entries(p?p.specs:{}).forEach(([k,v])=>spRow(k,v));if(!p)spRow('','');
  $('#addsp').onclick=()=>spRow('','');drawImgs();
  const dz=$('#dz');dz.onclick=()=>$('#fi').click();$('#fi').onchange=e=>addFiles(e.target.files);
  dz.ondragover=e=>{e.preventDefault();dz.classList.add('on');};dz.ondragleave=()=>dz.classList.remove('on');
  dz.ondrop=e=>{e.preventDefault();dz.classList.remove('on');addFiles(e.dataTransfer.files);};
  $('#cx').onclick=()=>$('#fm').close();$('#sv').onclick=e=>go(e.target,save);$('#fm').showModal();
}
$('#fm').addEventListener('close',()=>{if(!saved)fresh.forEach(pid=>api('deleteImage',{publicId:pid}).catch(()=>{}));fresh=[];});
function spRow(k,v){const d=document.createElement('div');d.className='sr';d.innerHTML=`<input placeholder="Name" value="${esc(k)}"><input placeholder="Value" value="${esc(v)}"><button class="btn alt">×</button>`;d.querySelector('button').onclick=()=>d.remove();$('#sp').append(d);}
function drawImgs(){$('#th').innerHTML=imgs.map((m,i)=>`<span class="th"><img src="${esc(m.url.replace('/upload/','/upload/f_auto,q_auto,w_160/'))}"><button data-i="${i}">×</button></span>`).join('');
  $('#th').querySelectorAll('button').forEach(b=>b.onclick=()=>go(b,async()=>{const m=imgs[b.dataset.i];
    await api('deleteImage',{id:editId||'',publicId:m.pid});fresh=fresh.filter(x=>x!==m.pid);imgs.splice(b.dataset.i,1);drawImgs();toast('Image deleted');await refresh().catch(()=>{});}));}
function up(file,bar){return new Promise((res,rej)=>{
  if(!file.type.startsWith('image/')||file.size>5*1024*1024)return rej(new Error(file.name+': images up to 5 MB only'));
  const x=new XMLHttpRequest(),f=new FormData();x.open('POST',`https://api.cloudinary.com/v1_1/${C.CLOUD_NAME}/image/upload`);
  x.upload.onprogress=e=>bar.style.width=(e.loaded/e.total*100)+'%';
  x.onload=()=>{let j={};try{j=JSON.parse(x.responseText);}catch(e){}x.status===200?res(j):rej(new Error((j.error&&j.error.message)||'Upload failed'));};
  x.onerror=()=>rej(new Error('Network error'));f.append('file',file);f.append('upload_preset',C.UPLOAD_PRESET);x.send(f);});}
async function addFiles(fl){for(const file of fl){
  const s=document.createElement('span');s.className='th';s.innerHTML=`<img src="${URL.createObjectURL(file)}" style="opacity:.5"><i style="width:0"></i>`;$('#th').append(s);uploading++;
  try{const j=await up(file,s.querySelector('i'));imgs.push({url:j.secure_url,pid:j.public_id});fresh.push(j.public_id);}catch(e){toast(e.message,1);}
  uploading--;drawImgs();}}
async function save(){
  if(uploading)throw new Error('Wait for uploads to finish');
  const specs={};document.querySelectorAll('#sp .sr').forEach(r=>{const i=r.querySelectorAll('input');if(i[0].value.trim())specs[i[0].value.trim()]=i[1].value;});
  const p={id:editId,specs,images:imgs.map(m=>m.url),publicIds:imgs.map(m=>m.pid)};
  [...FL.map(f=>f[0]),'featured','status','description'].forEach(k=>p[k]=$('#f_'+k).value);
  if(!p.name.trim())throw new Error('Name is required');
  const d=await api(editId?'updateProduct':'addProduct',{product:p});saved=true;$('#fm').close();
  if(d.product){const i=prods.findIndex(x=>x.id===d.product.id);if(i>=0)prods[i]=d.product;else prods.unshift(d.product);renderAll();}else await refresh();
  toast(editId?'Product updated':'Product added');
}
// ---- bulk tools
const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
function dl(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/csv'}));a.download=name;a.click();}
$('#exp').onclick=()=>dl('products.csv',HD.join(',')+'\n'+prods.map(p=>[p.id,p.name,p.category,p.brand,p.model,p.price,p.discountPrice||'',p.stock,p.description,JSON.stringify(p.specs),p.images.join(','),p.publicIds.join(','),p.featured?'Yes':'No',p.status].map(q).join(',')).join('\n'));
$('#tpl').onclick=()=>dl('template.csv',HD.join(',')+'\n'+['','Galaxy A15','Mobiles','Samsung','A15',14999,12999,10,'Nice phone','{"RAM":"6GB"}','','','No','Active'].map(q).join(','));
$('#imp').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}),raw=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''}),rows=[],errs=[];
    raw.forEach((r,i)=>{let sp={};try{sp=r['Specifications']?JSON.parse(r['Specifications']):{};}catch(x){errs.push(`Row ${i+1}: Specifications is not valid JSON`);}
      const sp2=s=>String(s||'').split(',').map(x=>x.trim()).filter(Boolean),im=sp2(r['Image URLs']),ids=sp2(r['Image Public IDs']);
      if(!String(r.Name).trim())errs.push(`Row ${i+1}: Name missing`);if(isNaN(Number(r.Price))||r.Price==='')errs.push(`Row ${i+1}: Price invalid`);
      if(im.length!==ids.length)errs.push(`Row ${i+1}: image URLs/IDs count differ`);
      rows.push({id:String(r.ID||''),name:r.Name,category:r.Category,brand:r.Brand,model:r.Model,price:r.Price,discountPrice:r['Discount Price'],stock:r.Stock,description:r.Description,specs:sp,images:im,publicIds:ids,featured:r.Featured,status:r.Status});});
    $('#pv').innerHTML=`<div class="dp"><h3>Import preview: ${rows.length} rows</h3>${errs.length?`<p class="err">${errs.slice(0,15).map(esc).join('<br>')}</p>`:'<p>All rows valid.</p>'}<div class="scroll"><table>${rows.slice(0,10).map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.category)}</td><td>${esc(r.price)}</td><td>${esc(r.stock)}</td></tr>`).join('')}</table></div>
    <div class="ft"><button class="btn alt" onclick="$('#pv').close()">Cancel</button><button class="btn" id="ap" ${errs.length||!rows.length?'disabled':''}>Apply import</button></div></div>`;
    $('#ap').onclick=ev=>go(ev.target,async()=>{const r=await api('bulkImport',{rows});$('#pv').close();toast(`Added ${r.added}, updated ${r.updated}`);await refresh();});$('#pv').showModal();
  }catch(x){toast('Could not read file: '+x.message,1);}};
if(sessionStorage.tok)start();

document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));

function setCat(c){catF=c;const f=$('#af');f.hidden=!c;f.innerHTML=c?`${esc(c)} <button aria-label="Clear category filter">×</button>`:'';if(c)f.querySelector('button').onclick=()=>setCat('');draw();}
function openCats(){const d=$('#cd');
  d.innerHTML=`<div class="dp"><h3>Categories (${cats.length})</h3><input id="cq" class="s" type="search" placeholder="Search categories" style="width:100%"><div id="cl" class="cl"></div></div>`;
  const paint=()=>{const q=$('#cq').value.toLowerCase();$('#cl').innerHTML='<button class="cr" data-c=""><span>All products</span></button>'+(cats.filter(c=>c[0].toLowerCase().includes(q)).map(c=>`<button class="cr" data-c="${esc(c[0])}"><span>${esc(c[0])}</span><span class="pill">${c[1]}</span></button>`).join('')||'<p class="mu">No category found.</p>');};
  paint();$('#cq').oninput=paint;$('#cl').onclick=e=>{const b=e.target.closest('button');if(b){setCat(b.dataset.c);d.close();}};d.showModal();}
