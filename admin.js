const norm=s=>String(s??'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ');
const match=(p,q)=>{const h=norm([p.name,p.brand,p.model,p.category].join(' ')),t=norm(q).split(' ').filter(Boolean);return t.every(w=>h.includes(w));};
const C=CONFIG,$=s=>document.querySelector(s);let prods=[],imgs=[],fresh=[],editId=null,saved=false,uploading=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const HD=['ID','Name','Category','Brand','Model','Price','Discount Price','Stock','Description','Specifications','Image URLs','Image Public IDs','Featured','Status'];
let tt;function toast(m,bad){const t=$('#toast');try{t.hidePopover();}catch(e){}(document.querySelector('dialog[open]')||document.body).append(t);
  t.innerHTML='<span></span><button aria-label="Close">×</button>';t.firstChild.textContent=m;t.className=bad?'bad':'';t.querySelector('button').onclick=()=>t.hidePopover();
  t.showPopover();clearTimeout(tt);tt=setTimeout(()=>{try{t.hidePopover();}catch(e){}},bad?10000:3500);}
async function api(action,data={}){
  const r=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action,token:sessionStorage.tok,...data})});
  const j=await r.json();if(j.auth===false){sessionStorage.removeItem('tok');location.reload();}if(!j.ok)throw new Error(j.error);return j.data;
}
async function go(btn,fn){const o=btn.textContent;btn.disabled=true;btn.textContent='...';try{await fn();}catch(e){toast(e.message,1);}btn.disabled=false;btn.textContent=o;}
$('#lb').onclick=e=>go(e.target,async()=>{$('#le').textContent='';
  try{const d=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'login',password:$('#pw').value})}).then(r=>r.json());
    if(!d.ok)throw new Error(d.error);sessionStorage.tok=d.token;start();}catch(x){$('#le').textContent=x.message;}});
$('#pw').onkeydown=e=>{if(e.key==='Enter')$('#lb').click();};
$('#lo').onclick=()=>{sessionStorage.removeItem('tok');location.reload();};
function start(){$('#login').hidden=true;$('#app').hidden=false;$('#sn').textContent=C.SHOP_NAME+' – Admin';refresh().catch(e=>toast(e.message,1));}
async function refresh(){const d=await api('stats');prods=d.products;const s=d.stats;
  $('#st').innerHTML=`<div><b>${s.total}</b>Products</div><div><b>${s.low}</b>Low stock</div><div><b>${s.out}</b>Out of stock</div>`+Object.entries(s.categories).map(([k,v])=>`<div><b>${v}</b>${esc(k)}</div>`).join('');draw();}
function draw(){const q=$('#aq').value.toLowerCase();
  $('#tb').innerHTML='<tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>'+prods.filter(p=>match(p,q)).map(p=>
  `<tr><td>${p.images[0]?`<img src="${esc(p.images[0].replace('/upload/','/upload/f_auto,q_auto,w_80/'))}" width="40">`:''}</td><td>${esc(p.name)}<br><small>${esc(p.brand)}</small></td><td>${esc(p.category)}</td><td>${p.discountPrice||p.price}</td><td>${p.stock}</td>
  <td><button class="btn alt" data-t="${esc(p.id)}">${esc(p.status)}</button></td><td><button class="btn alt" data-e="${esc(p.id)}">Edit</button> <button class="btn red" data-d="${esc(p.id)}">Delete</button></td></tr>`).join('');}
$('#aq').oninput=draw;
$('#tb').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.t||b.dataset.e||b.dataset.d,p=prods.find(x=>x.id===id);
  if(b.dataset.t)go(b,async()=>{await api('toggleStatus',{id});toast('Status changed');await refresh();});
  if(b.dataset.e)openForm(p);
  if(b.dataset.d&&confirm(`Delete "${p.name}" and all its images? This cannot be undone.`))go(b,async()=>{await api('deleteProduct',{id});toast('Deleted');await refresh();});};
$('#addb').onclick=()=>openForm(null);
const FL=[['name','Name'],['category','Category'],['brand','Brand'],['model','Model'],['price','Price','number'],['discountPrice','Discount Price','number'],['stock','Stock','number']];
function openForm(p){
  editId=p?p.id:null;saved=false;fresh=[];imgs=p?p.images.map((u,i)=>({url:u,pid:p.publicIds[i]})):[];
  $('#fm').innerHTML=`<h3>${p?'Edit':'Add'} product</h3><div class="fg">${FL.map(f=>`<label>${f[1]}<input id="f_${f[0]}" type="${f[2]||'text'}" min="0" value="${esc(p?p[f[0]]||'':'')}"></label>`).join('')}
  <label>Featured<select id="f_featured"><option>No</option><option ${p&&p.featured?'selected':''}>Yes</option></select></label>
  <label>Status<select id="f_status"><option>Active</option><option ${p&&p.status==='Hidden'?'selected':''}>Hidden</option></select></label>
  <label class="w">Description<textarea id="f_description" rows="3">${esc(p?p.description:'')}</textarea></label></div>
  <h4>Specifications</h4><div id="sp"></div><button class="btn alt" id="addsp">+ Row</button><h4>Images</h4>
  <div id="dz">Drag images here or click to choose (max 5 MB each)<input id="fi" type="file" accept="image/*" multiple hidden></div><div id="th"></div>
  <p><button class="btn" id="sv">Save</button> <button class="btn alt" id="cx">Cancel</button></p>`;
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
  await api(editId?'updateProduct':'addProduct',{product:p});saved=true;$('#fm').close();toast('Saved');await refresh();
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
    $('#pv').innerHTML=`<h3>Import preview: ${rows.length} rows</h3>${errs.length?`<p class="err">${errs.slice(0,15).map(esc).join('<br>')}</p>`:'<p>All rows valid.</p>'}<div class="scroll"><table>${rows.slice(0,10).map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.category)}</td><td>${esc(r.price)}</td><td>${esc(r.stock)}</td></tr>`).join('')}</table></div>
    <button class="btn" id="ap" ${errs.length||!rows.length?'disabled':''}>Apply import</button> <button class="btn alt" onclick="$('#pv').close()">Cancel</button>`;
    $('#ap').onclick=ev=>go(ev.target,async()=>{const r=await api('bulkImport',{rows});$('#pv').close();toast(`Added ${r.added}, updated ${r.updated}`);await refresh();});$('#pv').showModal();
  }catch(x){toast('Could not read file: '+x.message,1);}};
if(sessionStorage.tok)start();
