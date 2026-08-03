"use strict";(globalThis.webpackChunksecure_vault=globalThis.webpackChunksecure_vault||[]).push([[714],{70225(r,e,t){t.d(e,{A:()=>n});var a=t(8395),o=t(44414);const n=(0,a.A)((0,o.jsx)("path",{d:"M12.6 18.06c-.36.28-.87.28-1.23 0l-6.15-4.78a.991.991 0 0 0-1.22 0c-.51.4-.51 1.17 0 1.57l6.76 5.26c.72.56 1.73.56 2.46 0l6.76-5.26c.51-.4.51-1.17 0-1.57l-.01-.01a.991.991 0 0 0-1.22 0zm.63-3.02 6.76-5.26c.51-.4.51-1.18 0-1.58l-6.76-5.26c-.72-.56-1.73-.56-2.46 0L4.01 8.21c-.51.4-.51 1.18 0 1.58l6.76 5.26c.72.56 1.74.56 2.46-.01"}),"LayersRounded")},55364(r,e,t){t.d(e,{A:()=>n});var a=t(8395),o=t(44414);const n=(0,a.A)((0,o.jsx)("path",{d:"M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82"}),"PlayArrowRounded")},47082(r,e,t){t.d(e,{A:()=>n});var a=t(8395),o=t(44414);const n=(0,a.A)((0,o.jsx)("path",{d:"M12 5V2.21c0-.45-.54-.67-.85-.35l-3.8 3.79c-.2.2-.2.51 0 .71l3.79 3.79c.32.31.86.09.86-.36V7c3.73 0 6.68 3.42 5.86 7.29-.47 2.27-2.31 4.1-4.57 4.57-3.57.75-6.75-1.7-7.23-5.01-.07-.48-.49-.85-.98-.85-.6 0-1.08.53-1 1.13.62 4.39 4.8 7.64 9.53 6.72 3.12-.61 5.63-3.12 6.24-6.24C20.84 9.48 16.94 5 12 5"}),"ReplayRounded")},47371(r,e,t){t.d(e,{A:()=>b});var a=t(9950),o=t(72004),n=t(65698),i=t(96195),s=t(48802),l=t(54212),u=t(43396);function c(r){return(0,u.Ay)("MuiDialogActions",r)}(0,l.A)("MuiDialogActions",["root","spacing"]);var p=t(44414);const d=(0,i.Ay)("div",{name:"MuiDialogActions",slot:"Root",overridesResolver:(r,e)=>{const{ownerState:t}=r;return[e.root,!t.disableSpacing&&e.spacing]}})({display:"flex",alignItems:"center",padding:8,justifyContent:"flex-end",flex:"0 0 auto",variants:[{props:r=>{let{ownerState:e}=r;return!e.disableSpacing},style:{"& > :not(style) ~ :not(style)":{marginLeft:8}}}]}),b=a.forwardRef(function(r,e){const t=(0,s.b)({props:r,name:"MuiDialogActions"}),{className:a,disableSpacing:i=!1,...l}=t,u={...t,disableSpacing:i},b=(r=>{const{classes:e,disableSpacing:t}=r,a={root:["root",!t&&"spacing"]};return(0,n.A)(a,c,e)})(u);return(0,p.jsx)(d,{className:(0,o.A)(b.root,a),ownerState:u,ref:e,...l})})},98506(r,e,t){t.d(e,{A:()=>M});var a=t(9950),o=t(72004),n=t(65698),i=t(87563),s=t(88283),l=t(96195),u=t(25853),c=t(87673),p=t(48802),d=t(4927),b=t(54212),f=t(43396);function m(r){return(0,f.Ay)("MuiLinearProgress",r)}(0,b.A)("MuiLinearProgress",["root","colorPrimary","colorSecondary","determinate","indeterminate","buffer","query","dashed","dashedColorPrimary","dashedColorSecondary","bar","bar1","bar2","barColorPrimary","barColorSecondary","bar1Indeterminate","bar1Determinate","bar1Buffer","bar2Indeterminate","bar2Buffer"]);var v=t(44414);const g=s.i7`
  0% {
    left: -35%;
    right: 100%;
  }

  60% {
    left: 100%;
    right: -90%;
  }

  100% {
    left: 100%;
    right: -90%;
  }
`,y="string"!==typeof g?s.AH`
        animation: ${g} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
      `:null,h=s.i7`
  0% {
    left: -200%;
    right: 100%;
  }

  60% {
    left: 107%;
    right: -8%;
  }

  100% {
    left: 107%;
    right: -8%;
  }
`,A="string"!==typeof h?s.AH`
        animation: ${h} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
      `:null,C=s.i7`
  0% {
    opacity: 1;
    background-position: 0 -23px;
  }

  60% {
    opacity: 0;
    background-position: 0 -23px;
  }

  100% {
    opacity: 1;
    background-position: -200px -23px;
  }
`,w="string"!==typeof C?s.AH`
        animation: ${C} 3s infinite linear;
      `:null,S=(r,e)=>r.vars?r.vars.palette.LinearProgress[`${e}Bg`]:"light"===r.palette.mode?r.lighten(r.palette[e].main,.62):r.darken(r.palette[e].main,.5),x=(0,l.Ay)("span",{name:"MuiLinearProgress",slot:"Root",overridesResolver:(r,e)=>{const{ownerState:t}=r;return[e.root,e[`color${(0,d.A)(t.color)}`],e[t.variant]]}})((0,u.A)(r=>{let{theme:e}=r;return{position:"relative",overflow:"hidden",display:"block",height:4,zIndex:0,"@media print":{colorAdjust:"exact"},variants:[...Object.entries(e.palette).filter((0,c.A)()).map(r=>{let[t]=r;return{props:{color:t},style:{backgroundColor:S(e,t)}}}),{props:r=>{let{ownerState:e}=r;return"inherit"===e.color&&"buffer"!==e.variant},style:{"&::before":{content:'""',position:"absolute",left:0,top:0,right:0,bottom:0,backgroundColor:"currentColor",opacity:.3}}},{props:{variant:"buffer"},style:{backgroundColor:"transparent"}},{props:{variant:"query"},style:{transform:"rotate(180deg)"}}]}})),k=(0,l.Ay)("span",{name:"MuiLinearProgress",slot:"Dashed",overridesResolver:(r,e)=>{const{ownerState:t}=r;return[e.dashed,e[`dashedColor${(0,d.A)(t.color)}`]]}})((0,u.A)(r=>{let{theme:e}=r;return{position:"absolute",marginTop:0,height:"100%",width:"100%",backgroundSize:"10px 10px",backgroundPosition:"0 -23px",variants:[{props:{color:"inherit"},style:{opacity:.3,backgroundImage:"radial-gradient(currentColor 0%, currentColor 16%, transparent 42%)"}},...Object.entries(e.palette).filter((0,c.A)()).map(r=>{let[t]=r;const a=S(e,t);return{props:{color:t},style:{backgroundImage:`radial-gradient(${a} 0%, ${a} 16%, transparent 42%)`}}})]}}),w||{animation:`${C} 3s infinite linear`}),$=(0,l.Ay)("span",{name:"MuiLinearProgress",slot:"Bar1",overridesResolver:(r,e)=>{const{ownerState:t}=r;return[e.bar,e.bar1,e[`barColor${(0,d.A)(t.color)}`],("indeterminate"===t.variant||"query"===t.variant)&&e.bar1Indeterminate,"determinate"===t.variant&&e.bar1Determinate,"buffer"===t.variant&&e.bar1Buffer]}})((0,u.A)(r=>{let{theme:e}=r;return{width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",variants:[{props:{color:"inherit"},style:{backgroundColor:"currentColor"}},...Object.entries(e.palette).filter((0,c.A)()).map(r=>{let[t]=r;return{props:{color:t},style:{backgroundColor:(e.vars||e).palette[t].main}}}),{props:{variant:"determinate"},style:{transition:"transform .4s linear"}},{props:{variant:"buffer"},style:{zIndex:1,transition:"transform .4s linear"}},{props:r=>{let{ownerState:e}=r;return"indeterminate"===e.variant||"query"===e.variant},style:{width:"auto"}},{props:r=>{let{ownerState:e}=r;return"indeterminate"===e.variant||"query"===e.variant},style:y||{animation:`${g} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite`}}]}})),j=(0,l.Ay)("span",{name:"MuiLinearProgress",slot:"Bar2",overridesResolver:(r,e)=>{const{ownerState:t}=r;return[e.bar,e.bar2,e[`barColor${(0,d.A)(t.color)}`],("indeterminate"===t.variant||"query"===t.variant)&&e.bar2Indeterminate,"buffer"===t.variant&&e.bar2Buffer]}})((0,u.A)(r=>{let{theme:e}=r;return{width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",variants:[...Object.entries(e.palette).filter((0,c.A)()).map(r=>{let[t]=r;return{props:{color:t},style:{"--LinearProgressBar2-barColor":(e.vars||e).palette[t].main}}}),{props:r=>{let{ownerState:e}=r;return"buffer"!==e.variant&&"inherit"!==e.color},style:{backgroundColor:"var(--LinearProgressBar2-barColor, currentColor)"}},{props:r=>{let{ownerState:e}=r;return"buffer"!==e.variant&&"inherit"===e.color},style:{backgroundColor:"currentColor"}},{props:{color:"inherit"},style:{opacity:.3}},...Object.entries(e.palette).filter((0,c.A)()).map(r=>{let[t]=r;return{props:{color:t,variant:"buffer"},style:{backgroundColor:S(e,t),transition:"transform .4s linear"}}}),{props:r=>{let{ownerState:e}=r;return"indeterminate"===e.variant||"query"===e.variant},style:{width:"auto"}},{props:r=>{let{ownerState:e}=r;return"indeterminate"===e.variant||"query"===e.variant},style:A||{animation:`${h} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite`}}]}})),M=a.forwardRef(function(r,e){const t=(0,p.b)({props:r,name:"MuiLinearProgress"}),{className:a,color:s="primary",value:l,valueBuffer:u,variant:c="indeterminate",...b}=t,f={...t,color:s,variant:c},g=(r=>{const{classes:e,variant:t,color:a}=r,o={root:["root",`color${(0,d.A)(a)}`,t],dashed:["dashed",`dashedColor${(0,d.A)(a)}`],bar1:["bar","bar1",`barColor${(0,d.A)(a)}`,("indeterminate"===t||"query"===t)&&"bar1Indeterminate","determinate"===t&&"bar1Determinate","buffer"===t&&"bar1Buffer"],bar2:["bar","bar2","buffer"!==t&&`barColor${(0,d.A)(a)}`,"buffer"===t&&`color${(0,d.A)(a)}`,("indeterminate"===t||"query"===t)&&"bar2Indeterminate","buffer"===t&&"bar2Buffer"]};return(0,n.A)(o,m,e)})(f),y=(0,i.I)(),h={},A={bar1:{},bar2:{}};if("determinate"===c||"buffer"===c)if(void 0!==l){h["aria-valuenow"]=Math.round(l),h["aria-valuemin"]=0,h["aria-valuemax"]=100;let r=l-100;y&&(r=-r),A.bar1.transform=`translateX(${r}%)`}else 0;if("buffer"===c)if(void 0!==u){let r=(u||0)-100;y&&(r=-r),A.bar2.transform=`translateX(${r}%)`}else 0;return(0,v.jsxs)(x,{className:(0,o.A)(g.root,a),ownerState:f,role:"progressbar",...h,ref:e,...b,children:["buffer"===c?(0,v.jsx)(k,{className:g.dashed,ownerState:f}):null,(0,v.jsx)($,{className:g.bar1,ownerState:f,style:A.bar1}),"determinate"===c?null:(0,v.jsx)(j,{className:g.bar2,ownerState:f,style:A.bar2})]})})}}]);