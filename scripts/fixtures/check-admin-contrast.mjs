// Inspect rendered text, compositing transparent ancestor backgrounds in the browser.
export function checkAdminContrast() {
 const root = document.getElementById('cookie-banner-admin');
 const canvas = document.createElement('canvas'); canvas.width=canvas.height=1;
 const context = canvas.getContext('2d',{willReadFrequently:true});
 function rgba(color) {context.clearRect(0,0,1,1);context.fillStyle=color;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);}
 function blend(top,bottom) {return top.slice(0,3).map((v,i)=>v*top[3]+bottom[i]*(1-top[3]));}
 function luminance(rgb) {return rgb.map(value=>{const n=value/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((total,n,i)=>total+n*[.2126,.7152,.0722][i],0);}
 const failures=[];
 for(const el of root.querySelectorAll('h1,h2,h3,h4,p,label,a,button,th,td,code,dt,dd,span,legend')) {
  if(!el.getClientRects().length || ![...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE && n.textContent.trim()) || el.matches(':disabled')) continue;
  const style=getComputedStyle(el);
  let background=[255,255,255]; const ancestors=[];
  for(let parent=el;parent;parent=parent.parentElement) ancestors.unshift(parent);
  if(ancestors.some(parent=>parseFloat(getComputedStyle(parent).opacity)<1)) continue;
  for(const parent of ancestors) background=blend(rgba(getComputedStyle(parent).backgroundColor),background);
  const foreground=blend(rgba(style.color),background);
  const values=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);
  const ratio=(values[0]+.05)/(values[1]+.05);
  const large=parseFloat(style.fontSize)>=24 || (parseFloat(style.fontSize)>=18.66 && parseFloat(style.fontWeight)>=700);
  if(ratio<(large?3:4.5)-.02) failures.push({text:el.textContent.trim().slice(0,90),ratio:Number(ratio.toFixed(2)),color:style.color,background});
 }
 return failures;
}
