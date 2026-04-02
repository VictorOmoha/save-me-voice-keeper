import{t as j}from"./jspdf.es.min-C8WoLxsT.js";import"./vendor-ui-BZXQuPcq.js";import"./EntryViewDialog-C02gck4_.js";import"./index-DemZbdRU.js";import"./vendor-charts-Cd3UQbZ4.js";import"./vendor-firebase-BJRo5C9w.js";import"./chevron-right-CGe1hCAL.js";import"./check-B3CEo6PX.js";import"./input-CORvSLfA.js";import"./zap-CjcY5r-G.js";import"./trending-up-i6Wk0ldO.js";import"./badge-C1anEb7y.js";import"./dialog-D9N7oD_I.js";import"./users-C3H0sEB0.js";import"./user-CRibr76y.js";import"./chevron-left-CTHrHjGE.js";import"./square-check-big-DASaAlcF.js";import"./plus-6WoPLJGm.js";import"./layout-dashboard-1iADzKzt.js";import"./settings-CL3uq1rE.js";import"./label-CKkbCzfH.js";import"./select-DDrNa6lF.js";import"./textarea-BSyTUrRH.js";import"./upload-piN9qWUH.js";import"./circle-alert-COG3V4Vd.js";import"./volume-2-BfP4Oi1W.js";const N=(e,t={})=>{const{includeMetadata:o=!0,pageBreakBetweenEntries:r=!1,fontSize:s="medium"}=t,i=T(e,{includeMetadata:o,pageBreakBetweenEntries:r,fontSize:s});z(i)},he=(e,t={})=>{N([e],t)},P=e=>{const t=e.columns.map(i=>i.name.toLowerCase()),o=t.some(i=>i.includes("book")||i.includes("title")||i.includes("novel")),r=t.some(i=>i.includes("author")||i.includes("writer")||i.includes("by")),s=t.some(i=>i.includes("read")||i.includes("genre")||i.includes("isbn")||i.includes("publisher")||i.includes("pages")||i.includes("rating"));return o&&r||o&&s},q=e=>{const t=e.columns.map(s=>s.name.toLowerCase()),o=t.some(s=>s.includes("movie")||s.includes("film")||s.includes("title")),r=t.some(s=>s.includes("director")||s.includes("genre")||s.includes("year")||s.includes("rating")||s.includes("watched")||s.includes("runtime"));return o&&r},F=e=>{const t=e.columns.map(s=>s.name.toLowerCase()),o=t.some(s=>s.includes("recipe")||s.includes("dish")||s.includes("meal")),r=t.some(s=>s.includes("ingredient")||s.includes("cooking")||s.includes("prep")||s.includes("time")||s.includes("servings")||s.includes("cuisine"));return o||r&&t.some(s=>s.includes("name")||s.includes("title"))},I=e=>{const t=e.columns.map(s=>s.name.toLowerCase()),o=t.some(s=>s.includes("inventory")||s.includes("stock")||s.includes("warehouse")),r=t.some(s=>s.includes("quantity")||s.includes("location")||s.includes("sku")||s.includes("barcode")||s.includes("storage")||s.includes("shelf"));return o||r},C=e=>{const t=e.columns.map(d=>d.name.toLowerCase()),o=t.some(d=>d.includes("item")||d.includes("product")||d.includes("name")),r=t.some(d=>d.includes("quantity")||d.includes("qty")||d.includes("amount")),s=t.some(d=>d.includes("price")||d.includes("cost")||d.includes("total")),i=t.some(d=>d.includes("shop")||d.includes("buy")||d.includes("purchase"));return o&&(r||s)||i},$=e=>{const t=e.columns.map(i=>i.name.toLowerCase()),o=t.some(i=>i.includes("name")||i.includes("contact")),r=t.some(i=>i.includes("phone")||i.includes("mobile")||i.includes("tel")),s=t.some(i=>i.includes("email")||i.includes("mail"));return o&&(r||s)},M=e=>{const t=e.columns.map(i=>i.name.toLowerCase()),o=t.some(i=>i.includes("date")||i.includes("when")),r=t.some(i=>i.includes("amount")||i.includes("cost")||i.includes("price")||i.includes("total")),s=t.some(i=>i.includes("description")||i.includes("item")||i.includes("expense"));return o&&r&&s},R=e=>{const t=e.columns.map(i=>i.name.toLowerCase()),o=t.some(i=>i.includes("task")||i.includes("todo")||i.includes("item")),r=t.some(i=>i.includes("status")||i.includes("done")||i.includes("complete")),s=t.some(i=>i.includes("deadline")||i.includes("due")||i.includes("date"));return o&&(r||s)},E=(e,t)=>{const o=e.columns.find(n=>n.name.toLowerCase().includes("title")||n.name.toLowerCase().includes("book")||n.name.toLowerCase().includes("name")),r=e.columns.find(n=>n.name.toLowerCase().includes("author")||n.name.toLowerCase().includes("writer")),s=e.columns.find(n=>n.name.toLowerCase().includes("genre")||n.name.toLowerCase().includes("category")),i=e.columns.find(n=>n.name.toLowerCase().includes("rating")||n.name.toLowerCase().includes("score")),d=e.columns.find(n=>n.name.toLowerCase().includes("read")||n.name.toLowerCase().includes("status")||n.name.toLowerCase().includes("finished")),c=e.columns.find(n=>n.name.toLowerCase().includes("pages")||n.name.toLowerCase().includes("length")),a=e.columns.find(n=>n.name.toLowerCase().includes("year")||n.name.toLowerCase().includes("published")),p=e.rows.length,l=e.rows.filter(n=>d?n[d.id]===!0||String(n[d.id]).toLowerCase().includes("read"):!1).length;return`
    <div class="book-list-container">
      <div class="library-summary">
        <div class="summary-stats">
          <span class="stat-item">📚 ${p} books</span>
          <span class="stat-item">✅ ${l} read</span>
          <span class="stat-item">📖 ${p-l} to read</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${p>0?l/p*100:0}%"></div>
        </div>
      </div>
      
      <div class="book-grid">
        ${e.rows.map(n=>{const g=o?n[o.id]:"Unknown Title",m=r?n[r.id]:"",u=s?n[s.id]:"",f=i?n[i.id]:"",h=d?n[d.id]:"",v=c?n[c.id]:"",y=a?n[a.id]:"",w=h===!0||String(h).toLowerCase().includes("read");return`
            <div class="book-card ${w?"read":"unread"}">
              <div class="book-spine">
                <div class="book-icon">📖</div>
              </div>
              <div class="book-details">
                <div class="book-header">
                  <h3 class="book-title ${w?"read-title":""}">${g}</h3>
                  <span class="read-status">${w?"✅":"📖"}</span>
                </div>
                ${m?`<div class="book-author">by ${m}</div>`:""}
                <div class="book-meta">
                  ${u?`<span class="genre-badge">${u}</span>`:""}
                  ${y?`<span class="year-badge">${y}</span>`:""}
                  ${v?`<span class="pages-info">${v} pages</span>`:""}
                </div>
                ${f?`<div class="book-rating">⭐ ${f}</div>`:""}
              </div>
            </div>
          `}).join("")}
      </div>
    </div>
  `},B=(e,t)=>{const o=e.columns.find(a=>a.name.toLowerCase().includes("title")||a.name.toLowerCase().includes("movie")||a.name.toLowerCase().includes("film")),r=e.columns.find(a=>a.name.toLowerCase().includes("director")),s=e.columns.find(a=>a.name.toLowerCase().includes("genre")||a.name.toLowerCase().includes("category")),i=e.columns.find(a=>a.name.toLowerCase().includes("rating")||a.name.toLowerCase().includes("score")),d=e.columns.find(a=>a.name.toLowerCase().includes("watched")||a.name.toLowerCase().includes("seen")),c=e.columns.find(a=>a.name.toLowerCase().includes("year")||a.name.toLowerCase().includes("released"));return`
    <div class="movie-list-container">
      <div class="movie-grid">
        ${e.rows.map(a=>{const p=o?a[o.id]:"Unknown Movie",l=r?a[r.id]:"",n=s?a[s.id]:"",g=i?a[i.id]:"",m=d?a[d.id]:!1,u=c?a[c.id]:"",f=m===!0||String(m).toLowerCase().includes("watched");return`
            <div class="movie-card ${f?"watched":"unwatched"}">
              <div class="movie-poster">🎬</div>
              <div class="movie-info">
                <h3 class="movie-title">${p}</h3>
                ${l?`<div class="movie-director">Directed by ${l}</div>`:""}
                <div class="movie-meta">
                  ${n?`<span class="genre-badge">${n}</span>`:""}
                  ${u?`<span class="year-badge">${u}</span>`:""}
                </div>
                ${g?`<div class="movie-rating">⭐ ${g}</div>`:""}
                <div class="watch-status ${f?"watched":"unwatched"}">
                  ${f?"✅ Watched":"📺 To Watch"}
                </div>
              </div>
            </div>
          `}).join("")}
      </div>
    </div>
  `},W=(e,t)=>{const o=e.columns.find(c=>c.name.toLowerCase().includes("name")||c.name.toLowerCase().includes("recipe")||c.name.toLowerCase().includes("dish")),r=e.columns.find(c=>c.name.toLowerCase().includes("cuisine")||c.name.toLowerCase().includes("type")),s=e.columns.find(c=>c.name.toLowerCase().includes("time")||c.name.toLowerCase().includes("duration")),i=e.columns.find(c=>c.name.toLowerCase().includes("serving")||c.name.toLowerCase().includes("portion")),d=e.columns.find(c=>c.name.toLowerCase().includes("difficulty")||c.name.toLowerCase().includes("level"));return`
    <div class="recipe-list-container">
      <div class="recipe-grid">
        ${e.rows.map(c=>{const a=o?c[o.id]:"Unknown Recipe",p=r?c[r.id]:"",l=s?c[s.id]:"",n=i?c[i.id]:"",g=d?c[d.id]:"";return`
            <div class="recipe-card">
              <div class="recipe-icon">👨‍🍳</div>
              <div class="recipe-info">
                <h3 class="recipe-name">${a}</h3>
                <div class="recipe-meta">
                  ${p?`<span class="cuisine-badge">${p}</span>`:""}
                  ${g?`<span class="difficulty-badge">${g}</span>`:""}
                </div>
                <div class="recipe-details">
                  ${l?`<span class="time-info">⏱️ ${l}</span>`:""}
                  ${n?`<span class="servings-info">🍽️ ${n} servings</span>`:""}
                </div>
              </div>
            </div>
          `}).join("")}
      </div>
    </div>
  `},U=(e,t)=>{const o=e.columns.find(a=>a.name.toLowerCase().includes("item")||a.name.toLowerCase().includes("product")||a.name.toLowerCase().includes("name")),r=e.columns.find(a=>a.name.toLowerCase().includes("quantity")||a.name.toLowerCase().includes("stock")||a.name.toLowerCase().includes("count")),s=e.columns.find(a=>a.name.toLowerCase().includes("location")||a.name.toLowerCase().includes("shelf")||a.name.toLowerCase().includes("warehouse")),i=e.columns.find(a=>a.name.toLowerCase().includes("sku")||a.name.toLowerCase().includes("code")||a.name.toLowerCase().includes("id")),d=e.rows.length,c=e.rows.filter(a=>(r&&parseFloat(a[r.id])||0)<10).length;return`
    <div class="inventory-list-container">
      <div class="inventory-summary">
        <div class="summary-stats">
          <span class="stat-item">📦 ${d} items</span>
          <span class="stat-item ${c>0?"warning":""}">⚠️ ${c} low stock</span>
        </div>
      </div>
      
      <div class="inventory-grid">
        ${e.rows.map(a=>{const p=o?a[o.id]:"Unknown Item",l=r?a[r.id]:"",n=s?a[s.id]:"",g=i?a[i.id]:"",m=parseFloat(l)||0,u=m===0?"out-of-stock":m<10?"low-stock":"in-stock";return`
            <div class="inventory-card ${u}">
              <div class="inventory-icon">📦</div>
              <div class="inventory-info">
                <h3 class="item-name">${p}</h3>
                ${g?`<div class="item-sku">SKU: ${g}</div>`:""}
                <div class="inventory-meta">
                  <span class="quantity-badge ${u}">
                    ${m===0?"❌":m<10?"⚠️":"✅"} ${l||"0"} units
                  </span>
                  ${n?`<span class="location-info">📍 ${n}</span>`:""}
                </div>
              </div>
            </div>
          `}).join("")}
      </div>
    </div>
  `},L=(e,t)=>{const o=e.columns.find(n=>n.name.toLowerCase().includes("item")||n.name.toLowerCase().includes("product")||n.name.toLowerCase().includes("name")),r=e.columns.find(n=>n.name.toLowerCase().includes("quantity")||n.name.toLowerCase().includes("qty")),s=e.columns.find(n=>n.name.toLowerCase().includes("price")||n.name.toLowerCase().includes("cost")),i=e.columns.find(n=>n.name.toLowerCase().includes("purchased")||n.name.toLowerCase().includes("bought")||n.name.toLowerCase().includes("done")),d=e.columns.find(n=>n.name.toLowerCase().includes("category")||n.name.toLowerCase().includes("type")),c=e.columns.find(n=>n.name.toLowerCase().includes("notes")||n.name.toLowerCase().includes("comment")),a=e.rows.length,p=e.rows.filter(n=>i?n[i.id]===!0:!1).length,l=e.rows.reduce((n,g)=>{if(s&&r){const m=parseFloat(g[s.id])||0,u=parseFloat(g[r.id])||1;return n+m*u}return n},0);return`
    <div class="shopping-list-container">
      <div class="shopping-summary">
        <div class="summary-stats">
          <span class="stat-item">📦 ${a} items</span>
          <span class="stat-item">✅ ${p} completed</span>
          ${l>0?`<span class="stat-item">💰 $${l.toFixed(2)} total</span>`:""}
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${a>0?p/a*100:0}%"></div>
        </div>
      </div>
      
      <div class="shopping-cards">
        ${e.rows.map(n=>{const g=o?n[o.id]:"Unknown Item",m=r?n[r.id]:"",u=s?n[s.id]:"",f=i?n[i.id]===!0:!1,h=d?n[d.id]:"",v=c?n[c.id]:"";return`
            <div class="shopping-card ${f?"purchased":""}">
              <div class="card-main">
                <div class="item-header">
                  <span class="purchase-status">${f?"✅":"⬜"}</span>
                  <span class="item-name ${f?"completed":""}">${g}</span>
                  ${h?`<span class="category-badge">${h}</span>`:""}
                </div>
                <div class="item-details">
                  ${m?`<span class="quantity">Qty: ${m}</span>`:""}
                  ${u?`<span class="price">$${parseFloat(u).toFixed(2)}</span>`:""}
                  ${m&&u?`<span class="subtotal">= $${(parseFloat(m)*parseFloat(u)).toFixed(2)}</span>`:""}
                </div>
                ${v?`<div class="item-notes">${v}</div>`:""}
              </div>
            </div>
          `}).join("")}
      </div>
    </div>
  `},k=(e,t)=>{const o=e.columns.find(d=>d.name.toLowerCase().includes("name")||d.name.toLowerCase().includes("contact")),r=e.columns.find(d=>d.name.toLowerCase().includes("phone")||d.name.toLowerCase().includes("mobile")),s=e.columns.find(d=>d.name.toLowerCase().includes("email")||d.name.toLowerCase().includes("mail")),i=e.columns.find(d=>d.name.toLowerCase().includes("company")||d.name.toLowerCase().includes("organization"));return`
    <div class="contact-list-container">
      <div class="contact-cards">
        ${e.rows.map(d=>{const c=o?d[o.id]:"Unknown Contact",a=r?d[r.id]:"",p=s?d[s.id]:"",l=i?d[i.id]:"";return`
            <div class="contact-card">
              <div class="contact-name">${c}</div>
              ${l?`<div class="contact-company">${l}</div>`:""}
              <div class="contact-details">
                ${a?`<div class="contact-phone">📞 ${a}</div>`:""}
                ${p?`<div class="contact-email">✉️ ${p}</div>`:""}
              </div>
            </div>
          `}).join("")}
      </div>
    </div>
  `},S=[{type:"book-list",priority:110,detector:P,renderer:E},{type:"movie-list",priority:105,detector:q,renderer:B},{type:"recipe-list",priority:102,detector:F,renderer:W},{type:"inventory-list",priority:101,detector:I,renderer:U},{type:"shopping-list",priority:100,detector:C,renderer:L},{type:"contact-list",priority:90,detector:$,renderer:k},{type:"financial-record",priority:80,detector:M,renderer:(e,t)=>b(e)},{type:"task-list",priority:70,detector:R,renderer:(e,t)=>b(e)}].sort((e,t)=>t.priority-e.priority),A=e=>{for(const t of S)if(t.detector(e))return t.type;return"generic"},b=(e,t)=>`
    <div class="table-container">
      <div class="table-info">Table with ${e.rows.length} rows, ${e.columns.length} columns</div>
      <table class="data-table">
        <thead>
          <tr>
            ${e.columns.map(o=>`
              <th class="table-header">
                <div>${o.name}</div>
                <div class="column-type">(${o.type})</div>
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody>
          ${e.rows.map(o=>`
            <tr>
              ${e.columns.map(r=>`
                <td class="table-cell">
                  ${H(o[r.id],r.type)}
                </td>
              `).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `,O=(e,t,o,r="auto")=>{if(t==null||t==="")return'<span class="text-muted">No data</span>';if(t&&typeof t=="object"&&"columns"in t&&"rows"in t){const s=t;if(!s.columns||s.columns.length===0)return'<span class="text-muted">Empty table</span>';if(r==="auto"){const i=A(s),d=S.find(c=>c.type===i);if(d)return d.renderer(s,e)}else if(r==="card"){if(C(s))return L(s);if($(s))return k(s)}return b(s)}if(Array.isArray(t))return t.length===0?'<span class="text-muted">No items</span>':t.some(i=>typeof i=="string"&&(i.includes("blob:")||i.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)))?`
        <div class="image-gallery">
          <div class="gallery-info">${t.length} image${t.length!==1?"s":""}</div>
          ${t.map((i,d)=>`
            <div class="image-item">
              <span class="image-label">Image ${d+1}</span>
              <div class="image-preview">📷 ${x(i)}</div>
            </div>
          `).join("")}
        </div>
      `:`
      <div class="list-container">
        ${t.map((i,d)=>`
          <div class="list-item">
            <span class="list-index">${d+1}.</span>
            <span class="list-value">${String(i)}</span>
          </div>
        `).join("")}
      </div>
    `;if(t instanceof Date||typeof t=="string"&&!isNaN(Date.parse(t))){const s=new Date(t);return`<span class="date-value">${s.toLocaleDateString()} ${s.toLocaleTimeString()}</span>`}return typeof t=="number"?`<span class="number-value">${t.toLocaleString()}</span>`:typeof t=="boolean"?`<span class="boolean-value">${t?"✓ Yes":"✗ No"}</span>`:typeof t=="string"&&t.length>100?`<div class="long-text">${t.replace(/\n/g,"<br>")}</div>`:typeof t=="string"&&(t.startsWith("http")||t.startsWith("blob:"))?t.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)||t.includes("blob:")?`<div class="image-reference">📷 ${x(t)}</div>`:`<a href="${t}" class="url-link">${t}</a>`:`<span class="text-value">${String(t)}</span>`},H=(e,t)=>{if(e==null||e==="")return"—";switch(t){case"checkbox":return e?"✓":"✗";case"number":return typeof e=="number"?e.toLocaleString():String(e);case"date":return new Date(e).toLocaleDateString();default:return String(e)}},x=e=>{if(e.includes("blob:"))return"Uploaded image";const t=e.match(/\/([^/]+\.[^/]+)$/);return t?t[1]:"Image file"},T=(e,t)=>{const{includeMetadata:o,pageBreakBetweenEntries:r,fontSize:s,template:i="auto"}=t,d={small:"text-sm",medium:"text-base",large:"text-lg"}[s||"medium"],c=`
    <style>
      @media print {
        body { 
          margin: 0; 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.4;
          color: #222;
        }
        .no-print { display: none !important; }
        .page-break { page-break-before: always; }
        
        .entry-card { 
          border: 2px solid #e1e5e9; 
          margin-bottom: 24px; 
          padding: 20px;
          break-inside: avoid;
          border-radius: 8px;
          background: #fafbfc;
        }
        
        .entry-title { 
          font-size: 20px; 
          font-weight: 700; 
          margin-bottom: 12px; 
          color: #1a1a1a;
          border-bottom: 2px solid #4f46e5;
          padding-bottom: 8px;
        }
        
        .entry-metadata { 
          font-size: 11px; 
          color: #6b7280; 
          margin-bottom: 16px;
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 4px;
          border-left: 4px solid #4f46e5;
        }
        
        .field-grid { 
          display: grid; 
          gap: 16px; 
        }
        
        .field-item { 
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
        }
        
        .field-label { 
          font-weight: 600; 
          color: #374151; 
          font-size: 13px;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .field-value { 
          color: #1f2937; 
          font-size: 14px;
          line-height: 1.5;
        }
        
        .text-muted { color: #9ca3af; font-style: italic; }
        .date-value { font-family: monospace; color: #059669; }
        .number-value { font-family: monospace; color: #dc2626; text-align: right; }
        .boolean-value { font-weight: 600; }
        .long-text { white-space: pre-wrap; line-height: 1.6; }
        .url-link { color: #2563eb; text-decoration: underline; }
        
        .table-container { 
          margin: 8px 0;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .table-info {
          background: #f9fafb;
          padding: 8px 12px;
          font-size: 12px;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .data-table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 12px;
        }
        
        .table-header { 
          background: #f3f4f6; 
          padding: 8px; 
          border: 1px solid #d1d5db; 
          font-weight: 600;
          text-align: left;
          color: #374151;
        }
        
        .column-type {
          font-size: 10px;
          color: #9ca3af;
          font-weight: normal;
        }
        
        .table-cell { 
          padding: 6px 8px; 
          border: 1px solid #e5e7eb; 
          vertical-align: top;
        }
        
        .image-gallery, .list-container {
          margin: 8px 0;
        }
        
        .gallery-info, .image-item, .list-item {
          padding: 4px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .gallery-info {
          font-weight: 600;
          color: #374151;
          font-size: 12px;
        }
        
        .image-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .image-label {
          font-weight: 500;
          color: #6b7280;
          font-size: 11px;
        }
        
        .image-preview, .image-reference {
          color: #059669;
          font-size: 12px;
        }
        
        .list-item {
          display: flex;
          gap: 8px;
        }
        
        .list-index {
          font-weight: 600;
          color: #6b7280;
          min-width: 20px;
        }
        
        .print-header {
          text-align: center;
          margin-bottom: 32px;
          border-bottom: 3px solid #1f2937;
          padding-bottom: 16px;
        }
        
        .print-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          color: #1f2937;
        }
        
        .print-date {
          font-size: 14px;
          color: #6b7280;
        }
        
        .entry-count {
          font-size: 16px;
          color: #4b5563;
          margin-bottom: 24px;
          background: #f9fafb;
          padding: 12px;
          border-radius: 8px;
          border-left: 4px solid #10b981;
        }
        
        /* Shopping List Styles */
        .shopping-list-container {
          margin: 16px 0;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .shopping-summary {
          background: #f8fafc;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .summary-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        
        .stat-item {
          background: white;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        
        .progress-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: #10b981;
          transition: width 0.3s ease;
        }
        
        .shopping-cards {
          padding: 8px;
        }
        
        .shopping-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
          break-inside: avoid;
        }
        
        .shopping-card.purchased {
          background: #f0f9ff;
          border-color: #0ea5e9;
        }
        
        .item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .purchase-status {
          font-size: 16px;
        }
        
        .item-name {
          font-weight: 600;
          color: #1f2937;
          flex: 1;
        }
        
        .item-name.completed {
          text-decoration: line-through;
          color: #6b7280;
        }
        
        .category-badge {
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
        }
        
        .item-details {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .quantity, .price, .subtotal {
          font-weight: 500;
        }
        
        .price, .subtotal {
          color: #059669;
        }
        
        .item-notes {
          font-size: 11px;
          color: #9ca3af;
          font-style: italic;
          margin-top: 4px;
        }
        
        /* Contact List Styles */
        .contact-list-container {
          margin: 16px 0;
        }
        
        .contact-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
        }
        
        .contact-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          break-inside: avoid;
        }
        
        .contact-name {
          font-weight: 700;
          font-size: 16px;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .contact-company {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 12px;
        }
        
        .contact-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .contact-phone, .contact-email {
          font-size: 12px;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      }
      
      @media screen {
        .print-preview {
          max-width: 8.5in;
          margin: 0 auto;
          padding: 24px;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }
      }
    </style>
  `,a=`
    <div class="print-header">
      <div class="print-title">Exported Data</div>
      <div class="print-date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
    </div>
    <div class="entry-count">${e.length} ${e.length===1?"entry":"entries"}</div>
  `,p=e.map((l,n)=>`
      <div class="entry-card ${r&&n>0?"page-break":""}">
        <div class="entry-title">${l.title}</div>
        
        ${o?`
          <div class="entry-metadata">
            <div><strong>Created:</strong> ${new Date(l.createdAt).toLocaleDateString()}</div>
            <div><strong>Last Modified:</strong> ${new Date(l.updatedAt).toLocaleDateString()}</div>
          </div>
        `:""}
        
        <div class="field-grid">
          ${Object.entries(l.fields).map(([m,u])=>`
            <div class="field-item">
              <div class="field-label">${j(m)}</div>
              <div class="field-value">${O(m,u,l.fieldDefinitions,i)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");return`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Preview</title>
      ${c}
    </head>
    <body class="${d}">
      <div class="print-preview">
        ${a}
        ${p}
      </div>
    </body>
    </html>
  `},z=e=>{const t=window.open("","_blank","width=800,height=600");if(t){t.document.open(),t.document.write(e),t.document.close();const o=()=>{try{t.focus(),t.print()}catch{}};t.document.readyState==="complete"?setTimeout(o,400):t.addEventListener("load",()=>setTimeout(o,400)),setTimeout(o,1500)}else{const o=document.createElement("iframe");o.style.position="fixed",o.style.right="0",o.style.bottom="0",o.style.width="0",o.style.height="0",o.style.border="0",document.body.appendChild(o);const r=o.contentWindow?.document;if(r){r.open(),r.write(e),r.close();const s=()=>{try{o.contentWindow?.focus(),o.contentWindow?.print()}catch(i){console.debug("Print cleanup failed:",i)}};o.contentWindow?.document.readyState==="complete"?setTimeout(s,400):o.addEventListener("load",()=>setTimeout(s,400)),setTimeout(s,1500)}setTimeout(()=>{try{document.body.removeChild(o)}catch(s){console.debug("Print cleanup failed:",s)}},4e3)}},ve=(e,t={})=>{const o=T(e,t),r=window.open("","_blank","width=1000,height=800");r&&(r.document.write(o),r.document.close(),r.onload=()=>{const s=r.document.createElement("button");s.textContent="Print",s.className="no-print",s.style.cssText=`
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
      `,s.onclick=()=>{r.print()},r.document.body.appendChild(s)})},we=(e,t)=>{const r=`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${e}</title>
        
    <style>
      @media print {
        body { margin: 24px; font-family: Arial, sans-serif; color: #111; }
        .print-header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #333; padding-bottom: 8px; }
        .print-title { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; }
        .print-date { font-size: 12px; color: #666; margin: 0; }
        .content { margin-top: 16px; }
        pre { white-space: pre-wrap; word-wrap: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      }
    </style>
  
      </head>
      <body>
        <div class="print-header">
          <div class="print-title">${e}</div>
          <div class="print-date">Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="content">${t}</div>
      </body>
    </html>
  `;z(r)},be=(e,t)=>{const o=URL.createObjectURL(e),r=window.open("","_blank","width=1000,height=800");if(!r)return;const s=`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${t||"Document"}</title>
        <style>
          html, body, iframe { height: 100%; width: 100%; margin: 0; }
          .toolbar { position: fixed; top: 10px; right: 10px; z-index: 1000; }
          .toolbar button { padding: 8px 12px; background: #2563eb; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
          @media print { .toolbar { display: none; } }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button onclick="window.focus(); window.print();">Print</button>
        </div>
        <iframe src="${o}" style="border:0;" onload="setTimeout(function(){ window.focus(); window.print(); }, 800);"></iframe>
      </body>
    </html>
  `;r.document.write(s),r.document.close()};export{ve as openPrintPreview,be as printBlobDocument,we as printDocumentHtml,N as printEntries,he as printSingleEntry};
