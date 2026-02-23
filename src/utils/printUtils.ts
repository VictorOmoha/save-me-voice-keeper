import { SavedEntry } from "@/types/dashboard";
import { TableData } from "@/components/forms/types";
import { toDisplayFieldName } from "./fieldNameNormalizer";

export interface PrintOptions {
  includeMetadata?: boolean;
  selectedFields?: string[];
  pageBreakBetweenEntries?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  template?: 'auto' | 'table' | 'card' | 'compact';
}

export type ContentType = 'book-list' | 'movie-list' | 'recipe-list' | 'inventory-list' | 'shopping-list' | 'contact-list' | 'financial-record' | 'task-list' | 'generic';

export interface ContentTypeDefinition {
  type: ContentType;
  priority: number;
  detector: (tableData: TableData) => boolean;
  renderer: (tableData: TableData, title: string) => string;
}

export const printEntries = (entries: SavedEntry[], options: PrintOptions = {}) => {
  const {
    includeMetadata = true,
    pageBreakBetweenEntries = false,
    fontSize = 'medium'
  } = options;

  const printContent = generatePrintHTML(entries, {
    includeMetadata,
    pageBreakBetweenEntries,
    fontSize
  });

  openPrintWindow(printContent);
};

export const printSingleEntry = (entry: SavedEntry, options: PrintOptions = {}) => {
  printEntries([entry], options);
};

// Content type detection functions
const detectBookList = (tableData: TableData): boolean => {
  const columnNames = tableData.columns.map(col => col.name.toLowerCase());
  const hasBook = columnNames.some(name => 
    name.includes('book') || name.includes('title') || name.includes('novel')
  );
  const hasAuthor = columnNames.some(name => 
    name.includes('author') || name.includes('writer') || name.includes('by')
  );
  const hasReadingRelated = columnNames.some(name => 
    name.includes('read') || name.includes('genre') || name.includes('isbn') || 
    name.includes('publisher') || name.includes('pages') || name.includes('rating')
  );
  return (hasBook && hasAuthor) || (hasBook && hasReadingRelated);
};

const detectMovieList = (tableData: TableData): boolean => {
  const columnNames = tableData.columns.map(col => col.name.toLowerCase());
  const hasMovie = columnNames.some(name => 
    name.includes('movie') || name.includes('film') || name.includes('title')
  );
  const hasMovieRelated = columnNames.some(name => 
    name.includes('director') || name.includes('genre') || name.includes('year') || 
    name.includes('rating') || name.includes('watched') || name.includes('runtime')
  );
  return hasMovie && hasMovieRelated;
};

const detectRecipeList = (tableData: TableData): boolean => {
  const columnNames = tableData.columns.map(col => col.name.toLowerCase());
  const hasRecipe = columnNames.some(name => 
    name.includes('recipe') || name.includes('dish') || name.includes('meal')
  );
  const hasRecipeRelated = columnNames.some(name => 
    name.includes('ingredient') || name.includes('cooking') || name.includes('prep') || 
    name.includes('time') || name.includes('servings') || name.includes('cuisine')
  );
  return hasRecipe || (hasRecipeRelated && columnNames.some(name => name.includes('name') || name.includes('title')));
};

const detectInventoryList = (tableData: TableData): boolean => {
  const columnNames = tableData.columns.map(col => col.name.toLowerCase());
  const hasInventory = columnNames.some(name => 
    name.includes('inventory') || name.includes('stock') || name.includes('warehouse')
  );
  const hasInventoryRelated = columnNames.some(name => 
    name.includes('quantity') || name.includes('location') || name.includes('sku') || 
    name.includes('barcode') || name.includes('storage') || name.includes('shelf')
  );
  return hasInventory || hasInventoryRelated;
};

const detectShoppingList = (tableData: TableData): boolean => {
  const columnNames = tableData.columns.map(col => col.name.toLowerCase());
  const hasItem = columnNames.some(name => name.includes('item') || name.includes('product') || name.includes('name'));
  const hasQuantity = columnNames.some(name => name.includes('quantity') || name.includes('qty') || name.includes('amount'));
  const hasPrice = columnNames.some(name => name.includes('price') || name.includes('cost') || name.includes('total'));
  const hasShopping = columnNames.some(name => name.includes('shop') || name.includes('buy') || name.includes('purchase'));
  return (hasItem && (hasQuantity || hasPrice)) || hasShopping;
};

const detectContactList = (tableData: TableData): boolean => {
  const columnNames = tableData.columns.map(col => col.name.toLowerCase());
  const hasName = columnNames.some(name => name.includes('name') || name.includes('contact'));
  const hasPhone = columnNames.some(name => name.includes('phone') || name.includes('mobile') || name.includes('tel'));
  const hasEmail = columnNames.some(name => name.includes('email') || name.includes('mail'));
  return hasName && (hasPhone || hasEmail);
};

const detectFinancialRecord = (tableData: TableData): boolean => {
  const columnNames = tableData.columns.map(col => col.name.toLowerCase());
  const hasDate = columnNames.some(name => name.includes('date') || name.includes('when'));
  const hasAmount = columnNames.some(name => name.includes('amount') || name.includes('cost') || name.includes('price') || name.includes('total'));
  const hasDescription = columnNames.some(name => name.includes('description') || name.includes('item') || name.includes('expense'));
  return hasDate && hasAmount && hasDescription;
};

const detectTaskList = (tableData: TableData): boolean => {
  const columnNames = tableData.columns.map(col => col.name.toLowerCase());
  const hasTask = columnNames.some(name => name.includes('task') || name.includes('todo') || name.includes('item'));
  const hasStatus = columnNames.some(name => name.includes('status') || name.includes('done') || name.includes('complete'));
  const hasDeadline = columnNames.some(name => name.includes('deadline') || name.includes('due') || name.includes('date'));
  return hasTask && (hasStatus || hasDeadline);
};

// Specialized renderers for different content types
const renderBookListCard = (tableData: TableData, title: string): string => {
  const titleCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('title') || 
    col.name.toLowerCase().includes('book') || 
    col.name.toLowerCase().includes('name')
  );
  const authorCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('author') || 
    col.name.toLowerCase().includes('writer')
  );
  const genreCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('genre') || 
    col.name.toLowerCase().includes('category')
  );
  const ratingCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('rating') || 
    col.name.toLowerCase().includes('score')
  );
  const statusCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('read') || 
    col.name.toLowerCase().includes('status') || 
    col.name.toLowerCase().includes('finished')
  );
  const pagesCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('pages') || 
    col.name.toLowerCase().includes('length')
  );
  const yearCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('year') || 
    col.name.toLowerCase().includes('published')
  );

  const totalBooks = tableData.rows.length;
  const readBooks = tableData.rows.filter(row => 
    statusCol ? (row[statusCol.id] === true || String(row[statusCol.id]).toLowerCase().includes('read')) : false
  ).length;

  return `
    <div class="book-list-container">
      <div class="library-summary">
        <div class="summary-stats">
          <span class="stat-item">📚 ${totalBooks} books</span>
          <span class="stat-item">✅ ${readBooks} read</span>
          <span class="stat-item">📖 ${totalBooks - readBooks} to read</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${totalBooks > 0 ? (readBooks / totalBooks) * 100 : 0}%"></div>
        </div>
      </div>
      
      <div class="book-grid">
        ${tableData.rows.map(row => {
          const bookTitle = titleCol ? row[titleCol.id] : 'Unknown Title';
          const author = authorCol ? row[authorCol.id] : '';
          const genre = genreCol ? row[genreCol.id] : '';
          const rating = ratingCol ? row[ratingCol.id] : '';
          const status = statusCol ? row[statusCol.id] : '';
          const pages = pagesCol ? row[pagesCol.id] : '';
          const year = yearCol ? row[yearCol.id] : '';
          
          const isRead = status === true || String(status).toLowerCase().includes('read');

          return `
            <div class="book-card ${isRead ? 'read' : 'unread'}">
              <div class="book-spine">
                <div class="book-icon">📖</div>
              </div>
              <div class="book-details">
                <div class="book-header">
                  <h3 class="book-title ${isRead ? 'read-title' : ''}">${bookTitle}</h3>
                  <span class="read-status">${isRead ? '✅' : '📖'}</span>
                </div>
                ${author ? `<div class="book-author">by ${author}</div>` : ''}
                <div class="book-meta">
                  ${genre ? `<span class="genre-badge">${genre}</span>` : ''}
                  ${year ? `<span class="year-badge">${year}</span>` : ''}
                  ${pages ? `<span class="pages-info">${pages} pages</span>` : ''}
                </div>
                ${rating ? `<div class="book-rating">⭐ ${rating}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};

const renderMovieListCard = (tableData: TableData, title: string): string => {
  const titleCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('title') || 
    col.name.toLowerCase().includes('movie') || 
    col.name.toLowerCase().includes('film')
  );
  const directorCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('director')
  );
  const genreCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('genre') || 
    col.name.toLowerCase().includes('category')
  );
  const ratingCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('rating') || 
    col.name.toLowerCase().includes('score')
  );
  const watchedCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('watched') || 
    col.name.toLowerCase().includes('seen')
  );
  const yearCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('year') || 
    col.name.toLowerCase().includes('released')
  );

  return `
    <div class="movie-list-container">
      <div class="movie-grid">
        ${tableData.rows.map(row => {
          const movieTitle = titleCol ? row[titleCol.id] : 'Unknown Movie';
          const director = directorCol ? row[directorCol.id] : '';
          const genre = genreCol ? row[genreCol.id] : '';
          const rating = ratingCol ? row[ratingCol.id] : '';
          const watched = watchedCol ? row[watchedCol.id] : false;
          const year = yearCol ? row[yearCol.id] : '';
          
          const isWatched = watched === true || String(watched).toLowerCase().includes('watched');

          return `
            <div class="movie-card ${isWatched ? 'watched' : 'unwatched'}">
              <div class="movie-poster">🎬</div>
              <div class="movie-info">
                <h3 class="movie-title">${movieTitle}</h3>
                ${director ? `<div class="movie-director">Directed by ${director}</div>` : ''}
                <div class="movie-meta">
                  ${genre ? `<span class="genre-badge">${genre}</span>` : ''}
                  ${year ? `<span class="year-badge">${year}</span>` : ''}
                </div>
                ${rating ? `<div class="movie-rating">⭐ ${rating}</div>` : ''}
                <div class="watch-status ${isWatched ? 'watched' : 'unwatched'}">
                  ${isWatched ? '✅ Watched' : '📺 To Watch'}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};

const renderRecipeListCard = (tableData: TableData, title: string): string => {
  const nameCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('name') || 
    col.name.toLowerCase().includes('recipe') || 
    col.name.toLowerCase().includes('dish')
  );
  const cuisineCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('cuisine') || 
    col.name.toLowerCase().includes('type')
  );
  const timeCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('time') || 
    col.name.toLowerCase().includes('duration')
  );
  const servingsCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('serving') || 
    col.name.toLowerCase().includes('portion')
  );
  const difficultyCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('difficulty') || 
    col.name.toLowerCase().includes('level')
  );

  return `
    <div class="recipe-list-container">
      <div class="recipe-grid">
        ${tableData.rows.map(row => {
          const recipeName = nameCol ? row[nameCol.id] : 'Unknown Recipe';
          const cuisine = cuisineCol ? row[cuisineCol.id] : '';
          const time = timeCol ? row[timeCol.id] : '';
          const servings = servingsCol ? row[servingsCol.id] : '';
          const difficulty = difficultyCol ? row[difficultyCol.id] : '';

          return `
            <div class="recipe-card">
              <div class="recipe-icon">👨‍🍳</div>
              <div class="recipe-info">
                <h3 class="recipe-name">${recipeName}</h3>
                <div class="recipe-meta">
                  ${cuisine ? `<span class="cuisine-badge">${cuisine}</span>` : ''}
                  ${difficulty ? `<span class="difficulty-badge">${difficulty}</span>` : ''}
                </div>
                <div class="recipe-details">
                  ${time ? `<span class="time-info">⏱️ ${time}</span>` : ''}
                  ${servings ? `<span class="servings-info">🍽️ ${servings} servings</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};

const renderInventoryListCard = (tableData: TableData, title: string): string => {
  const itemCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('item') || 
    col.name.toLowerCase().includes('product') || 
    col.name.toLowerCase().includes('name')
  );
  const quantityCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('quantity') || 
    col.name.toLowerCase().includes('stock') || 
    col.name.toLowerCase().includes('count')
  );
  const locationCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('location') || 
    col.name.toLowerCase().includes('shelf') || 
    col.name.toLowerCase().includes('warehouse')
  );
  const skuCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('sku') || 
    col.name.toLowerCase().includes('code') || 
    col.name.toLowerCase().includes('id')
  );

  const totalItems = tableData.rows.length;
  const lowStock = tableData.rows.filter(row => {
    const qty = quantityCol ? parseFloat(row[quantityCol.id]) || 0 : 0;
    return qty < 10;
  }).length;

  return `
    <div class="inventory-list-container">
      <div class="inventory-summary">
        <div class="summary-stats">
          <span class="stat-item">📦 ${totalItems} items</span>
          <span class="stat-item ${lowStock > 0 ? 'warning' : ''}">⚠️ ${lowStock} low stock</span>
        </div>
      </div>
      
      <div class="inventory-grid">
        ${tableData.rows.map(row => {
          const itemName = itemCol ? row[itemCol.id] : 'Unknown Item';
          const quantity = quantityCol ? row[quantityCol.id] : '';
          const location = locationCol ? row[locationCol.id] : '';
          const sku = skuCol ? row[skuCol.id] : '';
          
          const qty = parseFloat(quantity) || 0;
          const stockStatus = qty === 0 ? 'out-of-stock' : qty < 10 ? 'low-stock' : 'in-stock';

          return `
            <div class="inventory-card ${stockStatus}">
              <div class="inventory-icon">📦</div>
              <div class="inventory-info">
                <h3 class="item-name">${itemName}</h3>
                ${sku ? `<div class="item-sku">SKU: ${sku}</div>` : ''}
                <div class="inventory-meta">
                  <span class="quantity-badge ${stockStatus}">
                    ${qty === 0 ? '❌' : qty < 10 ? '⚠️' : '✅'} ${quantity || '0'} units
                  </span>
                  ${location ? `<span class="location-info">📍 ${location}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};

const renderShoppingListCard = (tableData: TableData, title: string): string => {
  const itemCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('item') || 
    col.name.toLowerCase().includes('product') || 
    col.name.toLowerCase().includes('name')
  );
  const quantityCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('quantity') || 
    col.name.toLowerCase().includes('qty')
  );
  const priceCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('price') || 
    col.name.toLowerCase().includes('cost')
  );
  const purchasedCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('purchased') || 
    col.name.toLowerCase().includes('bought') || 
    col.name.toLowerCase().includes('done')
  );
  const categoryCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('category') || 
    col.name.toLowerCase().includes('type')
  );
  const notesCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('notes') || 
    col.name.toLowerCase().includes('comment')
  );

  const totalItems = tableData.rows.length;
  const purchasedItems = tableData.rows.filter(row => 
    purchasedCol ? row[purchasedCol.id] === true : false
  ).length;

  const totalCost = tableData.rows.reduce((sum, row) => {
    if (priceCol && quantityCol) {
      const price = parseFloat(row[priceCol.id]) || 0;
      const quantity = parseFloat(row[quantityCol.id]) || 1;
      return sum + (price * quantity);
    }
    return sum;
  }, 0);

  return `
    <div class="shopping-list-container">
      <div class="shopping-summary">
        <div class="summary-stats">
          <span class="stat-item">📦 ${totalItems} items</span>
          <span class="stat-item">✅ ${purchasedItems} completed</span>
          ${totalCost > 0 ? `<span class="stat-item">💰 $${totalCost.toFixed(2)} total</span>` : ''}
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0}%"></div>
        </div>
      </div>
      
      <div class="shopping-cards">
        ${tableData.rows.map(row => {
          const item = itemCol ? row[itemCol.id] : 'Unknown Item';
          const quantity = quantityCol ? row[quantityCol.id] : '';
          const price = priceCol ? row[priceCol.id] : '';
          const purchased = purchasedCol ? row[purchasedCol.id] === true : false;
          const category = categoryCol ? row[categoryCol.id] : '';
          const notes = notesCol ? row[notesCol.id] : '';

          return `
            <div class="shopping-card ${purchased ? 'purchased' : ''}">
              <div class="card-main">
                <div class="item-header">
                  <span class="purchase-status">${purchased ? '✅' : '⬜'}</span>
                  <span class="item-name ${purchased ? 'completed' : ''}">${item}</span>
                  ${category ? `<span class="category-badge">${category}</span>` : ''}
                </div>
                <div class="item-details">
                  ${quantity ? `<span class="quantity">Qty: ${quantity}</span>` : ''}
                  ${price ? `<span class="price">$${parseFloat(price).toFixed(2)}</span>` : ''}
                  ${quantity && price ? `<span class="subtotal">= $${(parseFloat(quantity) * parseFloat(price)).toFixed(2)}</span>` : ''}
                </div>
                ${notes ? `<div class="item-notes">${notes}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};

const renderContactListCard = (tableData: TableData, title: string): string => {
  const nameCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('name') || col.name.toLowerCase().includes('contact')
  );
  const phoneCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('phone') || col.name.toLowerCase().includes('mobile')
  );
  const emailCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('email') || col.name.toLowerCase().includes('mail')
  );
  const companyCol = tableData.columns.find(col => 
    col.name.toLowerCase().includes('company') || col.name.toLowerCase().includes('organization')
  );

  return `
    <div class="contact-list-container">
      <div class="contact-cards">
        ${tableData.rows.map(row => {
          const name = nameCol ? row[nameCol.id] : 'Unknown Contact';
          const phone = phoneCol ? row[phoneCol.id] : '';
          const email = emailCol ? row[emailCol.id] : '';
          const company = companyCol ? row[companyCol.id] : '';

          return `
            <div class="contact-card">
              <div class="contact-name">${name}</div>
              ${company ? `<div class="contact-company">${company}</div>` : ''}
              <div class="contact-details">
                ${phone ? `<div class="contact-phone">📞 ${phone}</div>` : ''}
                ${email ? `<div class="contact-email">✉️ ${email}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};

// Content type definitions with priority (higher priority = checked first)
const contentTypeDefinitions: ContentTypeDefinition[] = [
  {
    type: 'book-list' as const,
    priority: 110,
    detector: detectBookList,
    renderer: renderBookListCard
  },
  {
    type: 'movie-list' as const,
    priority: 105,
    detector: detectMovieList,
    renderer: renderMovieListCard
  },
  {
    type: 'recipe-list' as const,
    priority: 102,
    detector: detectRecipeList,
    renderer: renderRecipeListCard
  },
  {
    type: 'inventory-list' as const,
    priority: 101,
    detector: detectInventoryList,
    renderer: renderInventoryListCard
  },
  {
    type: 'shopping-list' as const,
    priority: 100,
    detector: detectShoppingList,
    renderer: renderShoppingListCard
  },
  {
    type: 'contact-list' as const,
    priority: 90,
    detector: detectContactList,
    renderer: renderContactListCard
  },
  {
    type: 'financial-record' as const,
    priority: 80,
    detector: detectFinancialRecord,
    renderer: (tableData, title) => renderGenericTable(tableData, title)
  },
  {
    type: 'task-list' as const,
    priority: 70,
    detector: detectTaskList,
    renderer: (tableData, title) => renderGenericTable(tableData, title)
  }
].sort((a, b) => b.priority - a.priority);

const detectContentType = (tableData: TableData): ContentType => {
  for (const def of contentTypeDefinitions) {
    if (def.detector(tableData)) {
      return def.type;
    }
  }
  return 'generic';
};

const renderGenericTable = (tableData: TableData, title: string): string => {
  return `
    <div class="table-container">
      <div class="table-info">Table with ${tableData.rows.length} rows, ${tableData.columns.length} columns</div>
      <table class="data-table">
        <thead>
          <tr>
            ${tableData.columns.map(col => `
              <th class="table-header">
                <div>${col.name}</div>
                <div class="column-type">(${col.type})</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableData.rows.map(row => `
            <tr>
              ${tableData.columns.map(col => `
                <td class="table-cell">
                  ${renderTableCellValue(row[col.id], col.type)}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// Enhanced helper function to render field values based on their type and content
const renderFieldValue = (key: string, value: unknown, fieldDefinitions?: Array<Record<string, unknown>>, template: string = 'auto'): string => {
  if (value === null || value === undefined || value === '') {
    return '<span class="text-muted">No data</span>';
  }

  // Handle table data with intelligent rendering
  if (value && typeof value === 'object' && 'columns' in value && 'rows' in value) {
    const tableData = value as TableData;
    if (!tableData.columns || tableData.columns.length === 0) {
      return '<span class="text-muted">Empty table</span>';
    }

    // Use intelligent rendering based on template preference
    if (template === 'auto') {
      const contentType = detectContentType(tableData);
      const contentDef = contentTypeDefinitions.find(def => def.type === contentType);
      
      if (contentDef) {
        return contentDef.renderer(tableData, key);
      }
    } else if (template === 'card') {
      // Force card rendering for shopping lists if detected
      if (detectShoppingList(tableData)) {
        return renderShoppingListCard(tableData, key);
      } else if (detectContactList(tableData)) {
        return renderContactListCard(tableData, key);
      }
    }

    // Fallback to generic table rendering
    return renderGenericTable(tableData, key);
  }

  // Handle arrays (like image galleries)
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '<span class="text-muted">No items</span>';
    }
    
    // Check if it's an array of image URLs
    const isImageArray = value.some(item => 
      typeof item === 'string' && (
        item.includes('blob:') || 
        item.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
      )
    );
    
    if (isImageArray) {
      return `
        <div class="image-gallery">
          <div class="gallery-info">${value.length} image${value.length !== 1 ? 's' : ''}</div>
          ${value.map((url, index) => `
            <div class="image-item">
              <span class="image-label">Image ${index + 1}</span>
              <div class="image-preview">📷 ${extractFileName(url)}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Regular array
    return `
      <div class="list-container">
        ${value.map((item, index) => `
          <div class="list-item">
            <span class="list-index">${index + 1}.</span>
            <span class="list-value">${String(item)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Handle dates
  if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
    const date = new Date(value);
    return `<span class="date-value">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>`;
  }

  // Handle numbers
  if (typeof value === 'number') {
    return `<span class="number-value">${value.toLocaleString()}</span>`;
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return `<span class="boolean-value">${value ? '✓ Yes' : '✗ No'}</span>`;
  }

  // Handle long text (textarea)
  if (typeof value === 'string' && value.length > 100) {
    return `<div class="long-text">${value.replace(/\n/g, '<br>')}</div>`;
  }

  // Handle URLs
  if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('blob:'))) {
    if (value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || value.includes('blob:')) {
      return `<div class="image-reference">📷 ${extractFileName(value)}</div>`;
    }
    return `<a href="${value}" class="url-link">${value}</a>`;
  }

  // Default string handling
  return `<span class="text-value">${String(value)}</span>`;
};

const renderTableCellValue = (value: unknown, columnType: string): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  switch (columnType) {
    case 'checkbox':
      return value ? '✓' : '✗';
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'date':
      return new Date(value).toLocaleDateString();
    default:
      return String(value);
  }
};

const extractFileName = (url: string): string => {
  if (url.includes('blob:')) {
    return 'Uploaded image';
  }
  const match = url.match(/\/([^/]+\.[^/]+)$/);
  return match ? match[1] : 'Image file';
};

const generatePrintHTML = (entries: SavedEntry[], options: PrintOptions) => {
  const { includeMetadata, pageBreakBetweenEntries, fontSize, template = 'auto' } = options;
  
  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }[fontSize || 'medium'];

  const printStyles = `
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
  `;

  const headerHTML = `
    <div class="print-header">
      <div class="print-title">Exported Data</div>
      <div class="print-date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
    </div>
    <div class="entry-count">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</div>
  `;

  const entriesHTML = entries.map((entry, index) => {
    const pageBreak = pageBreakBetweenEntries && index > 0 ? 'page-break' : '';
    
    return `
      <div class="entry-card ${pageBreak}">
        <div class="entry-title">${entry.title}</div>
        
        ${includeMetadata ? `
          <div class="entry-metadata">
            <div><strong>Created:</strong> ${new Date(entry.createdAt).toLocaleDateString()}</div>
            <div><strong>Last Modified:</strong> ${new Date(entry.updatedAt).toLocaleDateString()}</div>
          </div>
        ` : ''}
        
        <div class="field-grid">
          ${Object.entries(entry.fields).map(([key, value]) => `
            <div class="field-item">
              <div class="field-label">${toDisplayFieldName(key)}</div>
              <div class="field-value">${renderFieldValue(key, value, entry.fieldDefinitions, template)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Preview</title>
      ${printStyles}
    </head>
    <body class="${fontSizeClass}">
      <div class="print-preview">
        ${headerHTML}
        ${entriesHTML}
      </div>
    </body>
    </html>
  `;
};


const openPrintWindow = (content: string) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (printWindow) {
    // Write the content and ensure the print happens after rendering
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();

    const attemptPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        // ignore and let the fallback try again
      }
    };

    // If the document is already loaded, print shortly after
    if (printWindow.document.readyState === 'complete') {
      setTimeout(attemptPrint, 400);
    } else {
      // Otherwise wait for load
      printWindow.addEventListener('load', () => setTimeout(attemptPrint, 400));
    }

    // Final safety retry in case the above events didn't fire
    setTimeout(attemptPrint, 1500);
  } else {
    // Fallback if popup is blocked
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const iframeDoc = printFrame.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(content);
      iframeDoc.close();
      const tryIframePrint = () => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (error) {
      console.debug("Print cleanup failed:", error);
    }
      };
      if (printFrame.contentWindow?.document.readyState === 'complete') {
        setTimeout(tryIframePrint, 400);
      } else {
        printFrame.addEventListener('load', () => setTimeout(tryIframePrint, 400));
      }
      setTimeout(tryIframePrint, 1500);
    }

    setTimeout(() => {
      try { document.body.removeChild(printFrame); } catch (error) {
      console.debug("Print cleanup failed:", error);
    }
    }, 4000);
  }
};

export const openPrintPreview = (entries: SavedEntry[], options: PrintOptions = {}) => {
  const printContent = generatePrintHTML(entries, options);
  const previewWindow = window.open('', '_blank', 'width=1000,height=800');
  
  if (previewWindow) {
    previewWindow.document.write(printContent);
    previewWindow.document.close();
    
    // Add print button to preview
    previewWindow.onload = () => {
      const printButton = previewWindow.document.createElement('button');
      printButton.textContent = 'Print';
      printButton.className = 'no-print';
      printButton.style.cssText = `
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
      `;
      
      printButton.onclick = () => {
        previewWindow.print();
      };
      
      previewWindow.document.body.appendChild(printButton);
    };
  }
};

// Print an HTML document body with a header
export const printDocumentHtml = (title: string, htmlBody: string) => {
  const styles = `
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
  `;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        ${styles}
      </head>
      <body>
        <div class="print-header">
          <div class="print-title">${title}</div>
          <div class="print-date">Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="content">${htmlBody}</div>
      </body>
    </html>
  `;
  openPrintWindow(html);
};

// Print a Blob (e.g., PDF) by embedding it in an iframe and invoking print
export const printBlobDocument = (blob: Blob, fileName?: string) => {
  const url = URL.createObjectURL(blob);
  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${fileName || 'Document'}</title>
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
        <iframe src="${url}" style="border:0;" onload="setTimeout(function(){ window.focus(); window.print(); }, 800);"></iframe>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};