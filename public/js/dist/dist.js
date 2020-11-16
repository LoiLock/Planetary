(()=>{"use strict";var e={606:(e,t,n)=>{n.d(t,{n:()=>g});var o=!1,a=!1;function i(){console.info("Attempting to connect"),o=!1,s();const e=new EventSource("/events",{withCredentials:!0});e.onmessage=e=>{c(),o=!0,s(),function(e){var t=JSON.parse(e.data);switch(t.type){case"poll":break;case"message":d("Message:",{body:t.message});break;case"fileupload":d("New file uploaded:",{body:t.message}),g()}}(e)},e.onopen=e=>{c(),o=!0,s(),console.info("Connected to server")},e.onerror=t=>{e.close(),o=!1,a=!0,s(),console.log(t.target.readyState),console.warn("Lost connection to server")},e.addEventListener("error",(function(e){console.log(e),console.log(e.target.readyState)}))}var r=null;function c(){null!=r&&(o=!0,clearTimeout(r)),r=setTimeout(i,2e4)}function l(){var e,t,n,o=("token",document.cookie.split("; token=")[0].replace("token=","")),a=atob(o.split(".")[1]),i=JSON.parse(a),r=i.sharextoken,c=window.location.host,l={Name:c,DestinationType:"ImageUploader, FileUploader",RequestType:"POST",RequestURL:`${window.location.protocol}//${c}/upload`,FileFormName:"uploadfile",Arguments:{type:"file",key:r},ResponseType:"Text",URL:"$json:Url$",DeletionURL:"$json:DeletionURL$"};e=`${c}-${i.username}.sxcu`,t=JSON.stringify(l,null,2),(n=document.createElement("a")).setAttribute("href","data:text/plain;charset=utf-8,"+encodeURIComponent(t)),n.setAttribute("download",e),n.style.display="none",document.body.appendChild(n),n.click(),document.body.removeChild(n)}function d(e,t){"Notification"in window&&("granted"===Notification.permission?new Notification(e,t):"denied"!==Notification.permission&&Notification.requestPermission().then((function(n){"granted"===n&&new Notification(e,t)})))}function s(){a&&!o?(document.querySelector(".is-online-check").classList.add("reconnecting"),document.querySelector(".is-online-check").classList.remove("online")):(document.querySelector(".is-online-check").classList.remove("reconnecting"),document.querySelector(".is-online-check").classList.contains("online")!=o&&(o?document.querySelector(".is-online-check").classList.add("online"):document.querySelector(".is-online-check").classList.remove("online"))),setTimeout((()=>{s()}),5*m.SECONDS)}function u(){document.cookie="token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;",window.location.reload()}const m={SECONDS:1e3,MINUTES:6e4,HOUR:36e5};var p=!1;window.onload=function(){!function(){var e;e=localStorage.getItem("color-theme"),console.log(e),e||(console.log("setting theme"),console.log("empty"),localStorage.setItem("color-theme","dark"),e="dark"),"dark"==e?document.querySelector(".toggle-colortheme").classList.add("dark"):(document.querySelector(".toggle-colortheme").classList.remove("dark"),document.body.classList.remove("dark")),document.body.classList.add(e),document.querySelector(".generate-sharex-config").addEventListener("click",l,!1),document.querySelector(".toggle-colortheme").addEventListener("click",(e=>{var t;t=e,document.body.classList.toggle("dark"),t.currentTarget.classList.toggle("dark"),t.currentTarget.classList.contains("dark")?localStorage.setItem("color-theme","dark"):localStorage.setItem("color-theme","light"),console.log(t.currentTarget)}),!1),document.querySelector(".start-editor").addEventListener("click",(e=>{!function(e){p=!p;var t=document.querySelector(".editor-controls"),n=document.querySelector(".start-editor");if(p){n.classList.add("selected"),t.style.display="flex";for(var o=document.getElementsByTagName("video"),a=document.getElementsByTagName("audio"),i=0;i<o.length;i++)o[i].pause();for(var r=0;r<a.length;r++)a[r].pause()}else{n.classList.remove("selected"),t.style.display="none";var c=document.querySelectorAll(".thumbnail-container.selected");for(i=0;i<c.length;i++)c[i].classList.remove("selected")}}()}),!1),document.querySelector(".submit-deletion").addEventListener("click",b,!1),document.querySelector(".editor-controls__album-select").addEventListener("change",k,!1),document.querySelector(".editor-controls__submit-album").addEventListener("click",S,!1),document.querySelector(".page-header__user__logout").addEventListener("click",u,!1);for(var t=document.querySelectorAll(".toggle-filter"),n=0;n<t.length;n++)t[n].addEventListener("click",(function(e){y(e)}),!1)}(),i()},window.addEventListener("DOMContentLoaded",(e=>{g(),document.body.classList.remove("preload")}));var h=[];async function g(){var e=await fetch("/uploads"),t=await e.json(),n=t.filter((({deletionkey:e})=>!h.some((({deletionkey:t})=>t===e))));h=t,console.log(n);var o=document.createDocumentFragment();n.forEach((e=>{o.prepend(function(e){var t,n,o,a=document.createElement("div"),i=document.createElement("img"),r=document.createElement("div"),c=document.createElement("div"),l=document.createElement("h3"),d=document.createElement("span"),s=document.createTextNode(e.filename),u=document.createTextNode((t=e.unixtime,new Date(1e3*t).toLocaleString("en-GB",{day:"numeric",month:"numeric",year:"numeric",hour:"numeric",minute:"numeric",second:"numeric"})));if(l.appendChild(s),d.appendChild(u),c.appendChild(l),c.appendChild(d),a.classList.add("thumbnail-container"),c.classList.add("thumbnail-container__summary"),i.classList.add("thumbnail-container__child"),r.classList.add("thumbnail-container__summary__actions"),a.addEventListener("click",(e=>{var t;t=e,p&&(t.stopImmediatePropagation(),t.currentTarget.classList.toggle("selected"))}),!1),e.thumbnail&&""!=e.thumbnail){var h=e.thumbnail.split(".").pop();h=h.toLowerCase();var g=e.filename.split(".").pop();switch(g=g.toLowerCase(),h){case"mp4":c.classList.add("type","type__video"),a.addEventListener("click",(function(e){var t;t=e.currentTarget,p||(t.firstChild.paused?t.firstChild.play():t.firstChild.pause())}),!1),a.setAttribute("data-filename",e.filename);var v=document.createElement("video");"gif"==g&&v.setAttribute("loop",""),v.preload="metadata",v.classList.add("thumbnail-container__video");var y=document.createElement("source");y.type="video/mp4",y.src="thumbs/"+e.thumbnail,v.appendChild(y),a.appendChild(v);break;case"jpg":"pdf"==g?c.classList.add("type","type__file"):c.classList.add("type","type__image"),a.addEventListener("click",(function(e){f(e.currentTarget)}),!1),a.setAttribute("data-filename",e.filename),i.setAttribute("loading","lazy"),i.setAttribute("alt",e.thumbnail),i.src="thumbs/"+e.thumbnail;break;case"opus":c.classList.add("type","type__sound"),a.setAttribute("data-filename",e.filename);var b=document.createElement("audio");b.preload="metadata";var L=document.createElement("source");L.type="audio/ogg",L.src="thumbs/"+e.thumbnail;var k=document.createElement("div");k.classList.add("audio-progress"),b.addEventListener("timeupdate",(function(e){var t=100/this.duration*this.currentTime/100;k.setAttribute("style","transform: scaleX("+t+");")}),!1),a.addEventListener("click",(function(e){var t;t=e.currentTarget,p||(t.firstChild.paused?t.firstChild.play():t.firstChild.pause())}),!1);var E=document.createElement("i");E.classList.add("icon-bg","icon-bg__sound"),a.appendChild(k),a.appendChild(E),b.appendChild(L),a.prepend(b);break;default:c.classList.add("type","type__file"),a.addEventListener("click",(function(e){f(e.currentTarget)}),!1),a.setAttribute("data-filename",e.filename)}}else c.classList.add("type","type__file"),a.addEventListener("click",(function(e){f(e.currentTarget)}),!1),a.setAttribute("data-filename",e.filename);return r.appendChild((n=e.deletionkey,(o=document.createElement("a")).classList.add("icon-btn","icon-btn__delete"),o.addEventListener("click",(function(e){e.stopImmediatePropagation(),window.open("/delete/"+n,"_blank")}),!1),o)),r.appendChild(function(e){var t=document.createElement("button");return t.classList.add("icon-btn","icon-btn__share"),t.setAttribute("aria-label","Copy link to file"),t.addEventListener("click",(function(t){t.stopImmediatePropagation(),this.disable=!0;var n=t.currentTarget.parentNode.parentNode,o=location.protocol+"//"+location.hostname+(location.port?":"+location.port:"")+"/u/"+e;navigator.clipboard.writeText(o).then((()=>{console.log("Copied URL to clipboard"),n.classList.add("clipboard-copied"),setTimeout((()=>{n.classList.remove("clipboard-copied"),this.disable=!1}),5*m.SECONDS)}),(()=>{console.log("Failed to copy URL to clipboard")}))}),!1),t}(e.filename)),r.appendChild(function(e){var t=document.createElement("a");return t.classList.add("icon-btn","icon-btn__download"),t.setAttribute("download",e),t.setAttribute("href","/u/"+e),t.setAttribute("target","_blank"),t.addEventListener("click",(function(e){e.stopImmediatePropagation()}),!1),t}(e.filename)),c.appendChild(r),1==e.isdeleted&&(a.setAttribute("data-isdeleted",!0),c.style.backgroundColor="rgba(153, 30, 38, 0.3)"),a.setAttribute("data-deletionkey",e.deletionkey),""==!i.src&&a.appendChild(i),a.appendChild(c),a}(e))})),document.querySelector(".dashboard__content").prepend(o),console.log(document.querySelectorAll(".thumbnail-container").length),function(){for(var e=document.querySelectorAll(".toggle-filter"),t=0;t<e.length;t++){var n=e[t].getAttribute("data-checked"),o=e[t].getAttribute("data-value");n&&"true"==n&&v[o](n)}}()}function f(e){p||window.open("/u/"+e.dataset.filename,"_blank")}var v={showFilenames:function(e){for(var t=document.getElementsByClassName("thumbnail-container"),n=0;n<t.length;n++)e?t[n].classList.add("show-info"):t[n].classList.remove("show-info")},hideDeleted:function(e){for(var t=document.querySelectorAll('.thumbnail-container[data-isdeleted="true"]'),n=0;n<t.length;n++)t[n].style.display=e?"none":"inline-block"}};function y(e){var t=e.currentTarget,n=t.getAttribute("data-value");"true"==t.getAttribute("data-checked")?(t.setAttribute("data-checked","false"),v[n](!1)):(t.setAttribute("data-checked","true"),v[n](!0))}async function b(){(async function(e){L(".popup-container");var t=document.createElement("div");t.classList.add("popup-container");var n=document.createElement("h2");n.classList.add("popup-container__header");var o=document.createTextNode("Delete the selected files?");n.appendChild(o);var a=document.createElement("button");a.classList.add("confirm-btn");var i=document.createElement("button");i.classList.add("cancel-btn");var r=document.createTextNode("Yes, delete"),c=document.createTextNode("No, cancel");a.appendChild(r),i.appendChild(c),a.classList.add("btn-danger"),i.classList.add("btn-secondary"),t.appendChild(n),t.appendChild(a),t.appendChild(i),document.body.appendChild(t),console.log("2");var l=new Promise(((e,n)=>{a.addEventListener("click",(function(){e(!0)}),!1),i.addEventListener("click",(function(){t.remove(),n(!1)}),!1)}));return await l})().then((async e=>{if(e){L(".popup-container");var t=document.querySelectorAll(".thumbnail-container.selected"),n=[];for(let e=0;e<t.length;e++){var o=t[e].getAttribute("data-deletionkey");n.push(o)}if(0==n.length)return;var a=await fetch("/deleteselection",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({keys:n})}),i=await a.json();console.log(i)}})).catch((e=>{}))}function L(e){document.querySelectorAll(e).forEach((e=>e.remove())),console.log("1")}function k(e){var t=e.target.value;console.log(t);var n=document.querySelector(".editor-controls__album-name-input");n.addEventListener("paste",E,!1),n.addEventListener("input",E,!1),n.style.display="newalbum"==t?"block":"none"}function E(e){var t=e.target.value,n=document.querySelector(".editor-controls__submit-album");t.match(/^[a-z0-9]+$/i)&&t.length<=14?(n.style.display="block",e.target.style.color="var(--fg-color-text)"):(n.style.display="none",e.target.style.color="var(--color-medium-red)"),0==t.length&&(e.target.style.color="var(--fg-color-text)")}async function S(){var e=document.querySelector(".editor-controls__album-name-input").value,t=await fetch("/albums/add",{method:"POST",credentials:"include",headers:{"Content-type":"application/json"},body:JSON.stringify({albumname:e})}),n=await t.json();console.log(n)}}},t={};function n(o){if(t[o])return t[o].exports;var a=t[o]={exports:{}};return e[o](a,a.exports,n),a.exports}n.d=(e,t)=>{for(var o in t)n.o(t,o)&&!n.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:t[o]})},n.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),n(606)})();