// src/pages/RateCard.jsx — Edit garment prices from UI

import { useState } from 'react'
import { GARMENT_CATEGORIES, GARMENT_RATES } from '../lib/garments.js'
import { Card, Modal } from '../components/ui/index.jsx'

// Load custom rates from localStorage, merge with defaults
function loadRates() {
  try {
    const saved = JSON.parse(localStorage.getItem('td-custom-rates') || '{}')
    return { ...GARMENT_RATES, ...saved }
  } catch { return { ...GARMENT_RATES } }
}

function saveRates(rates) {
  // Only save overrides — items that differ from defaults
  const overrides = {}
  Object.entries(rates).forEach(([name, price]) => {
    if (GARMENT_RATES[name] !== price) overrides[name] = price
  })
  localStorage.setItem('td-custom-rates', JSON.stringify(overrides))
}

export default function RateCard() {
  const [rates, setRates]         = useState(loadRates)
  const [search, setSearch]       = useState('')
  const [editItem, setEditItem]   = useState(null)   // { name, price }
  const [editPrice, setEditPrice] = useState('')
  const [addModal, setAddModal]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newPrice, setNewPrice]   = useState('')
  const [newCategory, setNewCategory] = useState(Object.keys(GARMENT_CATEGORIES)[0])
  const [customCategories, setCustomCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('td-custom-categories') || '{}') }
    catch { return {} }
  })
  const [toast, setToast] = useState('')

  // Merge default categories with custom additions
  const allCategories = { ...GARMENT_CATEGORIES }
  Object.entries(customCategories).forEach(([cat, items]) => {
    allCategories[cat] = [...(allCategories[cat] || []), ...items]
  })

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(''),2500) }

  function saveEdit() {
    const price = parseFloat(editPrice)
    if (!price || price <= 0) return showToast('Enter a valid price')
    const updated = { ...rates, [editItem.name]: price }
    setRates(updated)
    saveRates(updated)
    setEditItem(null)
    showToast(`✅ ${editItem.name} updated to ₹${price}`)
  }

  function resetItem(name) {
    if (!GARMENT_RATES[name]) return
    const updated = { ...rates, [name]: GARMENT_RATES[name] }
    setRates(updated)
    saveRates(updated)
    showToast(`↩️ ${name} reset to ₹${GARMENT_RATES[name]}`)
  }

  function addNewItem() {
    const name  = newName.trim()
    const price = parseFloat(newPrice)
    if (!name)  return showToast('Enter item name')
    if (!price) return showToast('Enter a valid price')
    if (rates[name] !== undefined) return showToast('Item already exists — edit it instead')

    // Add to rates
    const updatedRates = { ...rates, [name]: price }
    setRates(updatedRates)
    saveRates(updatedRates)

    // Add to custom categories
    const updatedCats = { ...customCategories }
    if (!updatedCats[newCategory]) updatedCats[newCategory] = []
    updatedCats[newCategory] = [...updatedCats[newCategory], name]
    setCustomCategories(updatedCats)
    localStorage.setItem('td-custom-categories', JSON.stringify(updatedCats))

    setNewName(''); setNewPrice(''); setAddModal(false)
    showToast(`✅ ${name} added at ₹${price}`)
  }

  function resetAll() {
    if (!confirm('Reset ALL prices back to defaults? Custom-added items will be kept.')) return
    localStorage.removeItem('td-custom-rates')
    setRates(loadRates())
    showToast('↩️ All prices reset to defaults')
  }

  const inp = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid var(--bd-subtle)', fontSize:13, fontFamily:'inherit', background:'var(--bg-input)', color:'var(--tx-primary)', outline:'none', boxSizing:'border-box' }
  const lbl = { display:'block', marginBottom:5, fontSize:11, fontWeight:700, color:'var(--tx-secondary)', textTransform:'uppercase', letterSpacing:'0.5px' }

  const overrideCount = Object.entries(rates).filter(([n,p]) => GARMENT_RATES[n] !== p && GARMENT_RATES[n] !== undefined).length
  const customCount   = Object.values(customCategories).flat().length

  return (
    <div style={{padding:24}}>
      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12}}>
        <div>
          <h1 style={{fontSize:22, fontWeight:800, color:'var(--tx-primary)', letterSpacing:'-0.5px'}}>💰 Rate Card Editor</h1>
          <p style={{fontSize:13, color:'var(--tx-secondary)', marginTop:4}}>
            {Object.keys(rates).length} items ·
            {overrideCount > 0 && <span style={{color:'var(--amber)'}}> {overrideCount} modified</span>}
            {customCount > 0 && <span style={{color:'var(--emerald)'}}> · {customCount} custom</span>}
          </p>
        </div>
        <div style={{display:'flex', gap:10}}>
          <button onClick={resetAll}
            style={{padding:'9px 16px', borderRadius:8, border:'1px solid rgba(244,63,94,0.25)', background:'rgba(244,63,94,0.08)', color:'var(--rose)', fontFamily:'inherit', fontWeight:600, fontSize:13, cursor:'pointer'}}>
            ↩️ Reset All
          </button>
          <button onClick={()=>setAddModal(true)}
            style={{padding:'9px 16px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'white', fontFamily:'inherit', fontWeight:700, fontSize:13, cursor:'pointer', boxShadow:'0 2px 8px rgba(16,185,129,0.2)'}}>
            + Add New Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{marginBottom:20}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Search garment..."
          style={{...inp, maxWidth:360}} />
      </div>

      {/* Categories */}
      <div style={{display:'grid', gap:16}}>
        {Object.entries(allCategories).map(([cat, items]) => {
          const filtered = search
            ? items.filter(g => g.toLowerCase().includes(search.toLowerCase()))
            : items
          if (filtered.length === 0) return null

          return (
            <Card key={cat} style={{padding:0, overflow:'hidden'}}>
              <div style={{padding:'12px 20px', background:'var(--bg-raised)', borderBottom:'1px solid var(--bd-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div style={{fontSize:13, fontWeight:800, color:'var(--tx-primary)'}}>{cat}</div>
                <div style={{fontSize:11, color:'var(--tx-secondary)'}}>{filtered.length} items</div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))'}}>
                {filtered.map(name => {
                  const price       = rates[name] || 0
                  const isModified  = GARMENT_RATES[name] !== undefined && GARMENT_RATES[name] !== price
                  const isCustom    = GARMENT_RATES[name] === undefined
                  return (
                    <div key={name} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid var(--bd-subtle)', borderRight:'1px solid var(--bd-subtle)'}}>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:13, fontWeight:600, color:'var(--tx-primary)', display:'flex', alignItems:'center', gap:6}}>
                          {name}
                          {isModified && <span style={{fontSize:9, padding:'1px 5px', borderRadius:99, background:'rgba(245,158,11,0.15)', color:'var(--amber)', fontWeight:700}}>EDITED</span>}
                          {isCustom   && <span style={{fontSize:9, padding:'1px 5px', borderRadius:99, background:'rgba(16,185,129,0.15)', color:'var(--emerald)', fontWeight:700}}>CUSTOM</span>}
                        </div>
                        {isModified && (
                          <div style={{fontSize:11, color:'var(--tx-tertiary)'}}>default ₹{GARMENT_RATES[name]}</div>
                        )}
                      </div>
                      <div style={{display:'flex', alignItems:'center', gap:8, flexShrink:0}}>
                        <span style={{fontFamily:'DM Mono', fontWeight:700, fontSize:15, color:isModified?'var(--amber)':'var(--tx-primary)'}}>₹{price}</span>
                        <button onClick={()=>{setEditItem({name, price}); setEditPrice(String(price))}}
                          style={{padding:'4px 10px', borderRadius:6, border:'1px solid var(--bd-subtle)', background:'var(--bg-raised)', color:'var(--tx-secondary)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit'}}>
                          Edit
                        </button>
                        {isModified && (
                          <button onClick={()=>resetItem(name)}
                            style={{padding:'4px 8px', borderRadius:6, border:'1px solid rgba(244,63,94,0.2)', background:'rgba(244,63,94,0.08)', color:'var(--rose)', fontSize:11, cursor:'pointer'}}>
                            ↩
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Edit price modal */}
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title={`Edit Price — ${editItem?.name}`} maxWidth={380}>
        {editItem && (
          <div style={{display:'grid', gap:14}}>
            <div style={{padding:'12px 14px', background:'var(--bg-raised)', borderRadius:8, fontSize:13, color:'var(--tx-secondary)'}}>
              Current: <span style={{fontFamily:'DM Mono', fontWeight:700, color:'var(--tx-primary)'}}>₹{editItem.price}</span>
              {GARMENT_RATES[editItem.name] && GARMENT_RATES[editItem.name] !== editItem.price && (
                <span style={{marginLeft:8, color:'var(--tx-tertiary)'}}>· Default: ₹{GARMENT_RATES[editItem.name]}</span>
              )}
            </div>
            <div>
              <label style={lbl}>New Price (₹)</label>
              <input style={inp} type="number" min="1" value={editPrice} onChange={e=>setEditPrice(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&saveEdit()} autoFocus />
            </div>
            <div style={{display:'flex', gap:10}}>
              <button onClick={()=>setEditItem(null)} style={{flex:1, padding:11, background:'var(--bg-raised)', border:'1px solid var(--bd-subtle)', borderRadius:8, fontFamily:'inherit', fontWeight:600, cursor:'pointer', color:'var(--tx-secondary)'}}>Cancel</button>
              <button onClick={saveEdit} style={{flex:2, padding:11, background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:8, fontFamily:'inherit', fontWeight:700, cursor:'pointer'}}>Save Price</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add new item modal */}
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="+ Add New Garment" maxWidth={420}>
        <div style={{display:'grid', gap:14}}>
          <div><label style={lbl}>Item Name</label><input style={inp} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Pheran Ladies" autoFocus /></div>
          <div><label style={lbl}>Price (₹)</label><input style={inp} type="number" min="1" value={newPrice} onChange={e=>setNewPrice(e.target.value)} /></div>
          <div>
            <label style={lbl}>Category</label>
            <select style={{...inp,cursor:'pointer'}} value={newCategory} onChange={e=>setNewCategory(e.target.value)}>
              {Object.keys(allCategories).map(c=><option key={c}>{c}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{display:'flex', gap:10}}>
            <button onClick={()=>setAddModal(false)} style={{flex:1, padding:11, background:'var(--bg-raised)', border:'1px solid var(--bd-subtle)', borderRadius:8, fontFamily:'inherit', fontWeight:600, cursor:'pointer', color:'var(--tx-secondary)'}}>Cancel</button>
            <button onClick={addNewItem} style={{flex:2, padding:11, background:'linear-gradient(135deg,#10b981,#059669)', color:'white', border:'none', borderRadius:8, fontFamily:'inherit', fontWeight:700, cursor:'pointer'}}>Add Item</button>
          </div>
        </div>
      </Modal>

      {toast && (
        <div style={{position:'fixed', bottom:24, right:24, background:'var(--bg-card)', border:'1px solid var(--bd-subtle)', borderLeft:'3px solid var(--emerald)', borderRadius:10, padding:'10px 18px', boxShadow:'var(--shadow-lg)', fontSize:13, fontWeight:600, zIndex:9999}}>
          {toast}
        </div>
      )}
    </div>
  )
}
