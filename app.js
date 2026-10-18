import { keyOf, shiftDate, validateData, dayTotal } from './model.js';
const $=s=>document.querySelector(s), KEY='daily-meal-log-v1';
let data={goal:2000,days:{}}, selected=keyOf(new Date()), edit=null;
try{const saved=localStorage.getItem(KEY);if(saved)data=validateData(JSON.parse(saved));}catch{announce('저장된 기록을 불러오지 못했습니다. 백업 파일을 확인해 주세요.');}
// Apply conversation records once per browser; retain later edits and deletions.
try {
  const batchKey='meal-import-2026-10-18-lunch-v1';
  if(!localStorage.getItem(batchKey)) {
    const day=data.days['2026-10-18']??={items:[],note:''};
    const records=[
      {id:'20261018-lunch-gimbap',meal:'lunch',name:'김밥 1줄 (칼로리 추정)',calories:450},
      {id:'20261018-lunch-chicken',meal:'lunch',name:'닭가슴살 떡볶이맛 (칼로리 추정)',calories:130},
      {id:'20261018-lunch-tiger',meal:'lunch',name:'타이거 맥주 500ml (칼로리 추정)',calories:215}
    ];
    for(const record of records)if(!day.items.some(item=>item.id===record.id))day.items.push(record);
    localStorage.setItem(KEY,JSON.stringify(data));
    localStorage.setItem(batchKey,'1');
  }
}catch{announce('기록 저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.');}
const groups=[['breakfast','아침','BREAKFAST'],['lunch','점심','LUNCH'],['dinner','저녁','DINNER'],['snack','간식','SNACK']];
function announce(message){$('#status').textContent=message;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));announce('브라우저에 저장되었습니다.');}catch{announce('저장 공간에 접근할 수 없습니다. 기록을 내보내 백업하세요.');}}
function current(){return data.days[selected]??{items:[],note:''};}
function writable(){return data.days[selected]??=( {items:[],note:''} );}
function el(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
function render(){const day=current(),total=dayTotal(day);$('#date').value=selected;$('#weekday').textContent=new Date(selected+'T12:00:00').toLocaleDateString('ko-KR',{weekday:'long'});$('#total').textContent=total.toLocaleString();$('#goal').value=data.goal;$('#progress').max=data.goal;$('#progress').value=total;$('#goalStatus').textContent=total<=data.goal?`목표까지 ${(data.goal-total).toLocaleString()} kcal 남았어요`:`목표보다 ${(total-data.goal).toLocaleString()} kcal 더 섭취했어요`;$('#count').textContent=`${day.items.length}개의 음식 기록`;$('#note').value=day.note;$('#meals').replaceChildren();for(const [key,label,en] of groups){const section=el('section','','meal'),heading=el('div','','meal-heading'),title=el('h3',label);title.append(el('small',en));heading.append(title,el('span',`${day.items.filter(i=>i.meal===key).reduce((n,i)=>n+i.calories,0).toLocaleString()} kcal`));section.append(heading);const items=day.items.filter(i=>i.meal===key);if(!items.length)section.append(el('p','아직 기록한 음식이 없어요.','empty'));for(const item of items){const row=el('div','','food-row');row.append(el('span',item.name),el('span',`${item.calories.toLocaleString()} kcal`));const change=el('button','수정'),remove=el('button','삭제');change.onclick=()=>open(key,item);remove.onclick=()=>{if(!confirm(`“${item.name}” 기록을 삭제할까요?`))return;writable().items=writable().items.filter(i=>i.id!==item.id);save();render();};row.append(change,remove);section.append(row);}const add=el('button','+ 음식 추가','add');add.onclick=()=>open(key);section.append(add);$('#meals').append(section);}}
function navigate(date){selected=date;const url=new URL(location.href);url.searchParams.set('date',date);history.replaceState(null,'',url);render();}
function open(meal,item){edit={meal,id:item?.id};$('#formTitle').textContent=item?'음식 수정':'음식 추가';$('#food').value=item?.name??'';$('#calories').value=item?.calories??'';$('#editor').showModal();$('#food').focus();}
$('#prev').onclick=()=>navigate(shiftDate(selected,-1));$('#next').onclick=()=>navigate(shiftDate(selected,1));$('#today').onclick=()=>navigate(keyOf(new Date()));$('#date').onchange=e=>{if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value))navigate(e.target.value);};$('#close').onclick=()=>$('#editor').close();
$('#form').onsubmit=e=>{e.preventDefault();const name=$('#food').value.trim(),calories=Number($('#calories').value);if(!name||!Number.isInteger(calories)||calories<0||calories>100000)return;const day=writable();if(edit.id){const item=day.items.find(i=>i.id===edit.id);if(item)Object.assign(item,{name,calories});}else day.items.push({id:crypto.randomUUID(),meal:edit.meal,name,calories});save();$('#editor').close();render();};
$('#goal').onchange=e=>{const value=Number(e.target.value);if(!Number.isInteger(value)||value<1||value>100000){render();return;}data.goal=value;save();render();};$('#note').oninput=e=>{writable().note=e.target.value;save();};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`daily-meal-log-${keyOf(new Date())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};$('#import').onclick=()=>$('#file').click();$('#file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10000000)throw Error();const imported=validateData(JSON.parse(await file.text()));if(!confirm('현재 기록 전체를 백업 파일의 기록으로 교체할까요? 먼저 내보내기로 백업하는 것을 권장합니다.'))return;data=imported;save();render();announce('백업 기록을 가져왔습니다.');}catch{announce('가져오지 못했습니다. 올바른 식단 백업 JSON 파일인지 확인하세요.');}finally{e.target.value='';}};
const param=new URL(location.href).searchParams.get('date');if(param&&/^\d{4}-\d{2}-\d{2}$/.test(param)&&!Number.isNaN(Date.parse(param+'T12:00:00')))selected=param;render();
