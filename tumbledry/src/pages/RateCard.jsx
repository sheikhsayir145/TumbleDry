// src/pages/RateCard.jsx

import { useState } from 'react'
import { GARMENT_CATEGORIES, GARMENT_RATES, SERVICE_KG_RATES } from '../lib/garments.js'
import { Card, Modal } from '../components/ui/index.jsx'
import { DollarSign, Scale, RotateCcw } from 'lucide-react'

function loadRates() {
  try { const s = JSON.parse(localStorage.getItem('td-custom-rates') || '{}'); return { ...GARMENT_RATES, ...s } }
  catch { return { ...GARMENT_RATES } }
}

function saveRates(rates) {
  const overrides = {}
  Object.entries(rates).forEach(([name, price]) => { if (GARMENT_RATES[name] !== price) overrides[name] = price })
  localStorage.setItem('td-custom-rates', JSON.stringify(overrides))
}

function loadKgRates() {
  try { const s = JSON.parse(localStorage.getItem('td-kg-rates') || '{}'); return { ...SERVICE_KG_RATES, ...s } }
  catch { return { ...SERVICE_KG_RATES } }
}

function saveKgRates(rates) { localStorage.setItem('td-kg-rates', JSON.stringify(rates)) }

export default function RateCard() {
  const [rates,    setRates]    = useState(loadRates)
  const [kgRates,  setKgRates]  = useState(loadKgRates)
  const [editKg,   setEditKg]   = useState(null)
  const [editKgPrice, setEditKgPrice] = useState('')
  const [search,   setSearch]   = useState('')
  const [editItem, setEditItem] = useState(null)
  const [editPrice,setEditPrice]= useState('')
  const [addModal, setAddModal] = useState(false)
  const [newName,  setNewName]  = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newCategory, setNewCategory] = useState(Object.keys(GARMENT_CATEGORIES)[0])
  const [customCategories, setCustomCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('td-custom-categories') || '{}') }
    catch { return {} }
  })
  const [toast, setToast] = useState('')

  const allCategories = { ...GARMENT_CATEGORIES }
  Object.entries(customCategories).forEach(([cat, items]) => {
    allCategories[cat] = [...(allCategories[cat] || []), ...items]
  })

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(''), 2500) }

  function saveEditKg() {
    const price = parseFloat(editKgPrice)
    if (!price || price <= 0) return showToast('Enter a valid price')
    const updated = { ...kgRates, [editKg.name]: price }
    setKgRates(updated); saveKgRates(updated); setEditKg(null)
    showToast(`✅ ${editKg.name} → ₹${price}/KG`)
  }

  function resetKgItem(name) {
    const updated = { ...kgRates, [name]: SERVICE_KG_RATES[name] }
    setKgRates(updated); saveKgRates(updated)
    showToast(`↩️ ${name} reset to ₹${SERVICE_KG_RATES[name]}/KG`)
  }

  function saveEdit() {
    const price = parseFloat(editPrice)
    if (!price || price <= 0) return showToast('Enter a valid price')
    const updated = { ...rates, [editItem.name]: price }
    setRates(updated); saveRates(updated); setEditItem(null)
    showToast(`✅ ${editItem.name} → ₹${price}`)
  }

  function resetItem(name) {
    if (!GARMENT_RATES[name]) return
    const updated = { ...rates, [name]: GARMENT_RATES[name] }
    setRates(updated); saveRates(updated)
    showToast(`↩️ ${name} reset to ₹${GARMENT_RATES[name]}`)
  }

  function addNewItem() {
    const name  = newName.trim()
    const price = parseFloat(newPrice)
    if (!name)  return showToast('Enter item name')
    if (!price) return showToast('Enter a valid price')
    if (rates[name] !== undefined) return showToast('Item already exists — edit it instead')
    const updatedRates = { ...rates, [name]: price }
    setRates(updatedRates); saveRates(updatedRates)
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
    <div className="page">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--tx-primary)', letterSpacing:'-0.4px', display:'flex', alignItems:'center', gap:10 }}><DollarSign size={20} strokeWidth={2} /> Rate Card Editor</h1>
          <p style={{ fontSize:13, color:'var(--tx-secondary)', marginTop:3 }}>
            {Object.keys(rates).length} items
            {overrideCount > 0 && <span style={{color:'var(--amber)'}}> · {overrideCount} modified</span>}
            {customCount   > 0 && <span style={{color:'var(--emerald)'}}> · {customCount} custom</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={resetAll} style={{ padding:'9px 14px', borderRadius:8, border:'1px solid rgba(244,63,94,0.25)', background:'rgba(244,63,94,0.08)', color:'var(--rose)', fontFamily:'inherit', fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            <RotateCcw size={13} strokeWidth={2} /> Reset All
          </button>
          <button onClick={()=>setAddModal(true)} style={{ padding:'9px 14px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'white', fontFamily:'inherit', fontWeight:700, fontSize:13, cursor:'pointer', boxShadow:'0 2px 8px rgba(16,185,129,0.2)' }}>
            + Add Item
          </button>
        </div>
      </div>

      {/* KG Service Rates */}
      <Card style={{ marginBottom:16, padding:0, overflow:'hidden' }}>
        <div style={{ padding:'12px 18px', background:'var(--bg-raised)', borderBottom:'1px solid var(--bd-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'var(--tx-primary)', display:'flex', alignItems:'center', gap:6 }}><Scale size={14} strokeWidth={2} /> KG Service Rates</div>
          <div style={{ fontSize:11, color:'var(--tx-secondary)' }}>Auto-applied when KG service is selected in POS</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))' }}>
          {Object.entries(kgRates).map(([name, price]) => {
            const isModified = SERVICE_KG_RATES[name] !== price
            return (
              <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid var(--bd-subtle)', borderRight:'1px solid var(--bd-subtle)', gap:8 }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--tx-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
                  {isModified && <div style={{ fontSize:11, color:'var(--tx-tertiary)' }}>default ₹{SERVICE_KG_RATES[name]}/KG</div>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  <span className="mono" style={{ fontWeight:700, fontSize:15, color:isModified?'var(--amber)':'var(--tx-primary)' }}>₹{price}<span style={{ fontSize:11, fontWeight:400, color:'var(--tx-secondary)' }}>/KG</span></span>
                  <button onClick={()=>{setEditKg({name,price}); setEditKgPrice(String(price))}} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--bd-subtle)', background:'var(--bg-raised)', color:'var(--tx-secondary)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
                  {isModified && <button onClick={()=>resetKgItem(name)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid rgba(244,63,94,0.2)', background:'rgba(244,63,94,0.08)', color:'var(--rose)', fontSize:11, cursor:'pointer' }}>↩</button>}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Search */}
      <div style={{ marginBottom:16 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search garment..."
          style={{ ...inp, maxWidth:360 }} />
      </div>

      {/* Categories */}
      <div style={{ display:'grid', gap:14 }}>
        {Object.entries(allCategories).map(([cat, items]) => {
          const filtered = search ? items.filter(g => g.toLowerCase().includes(search.toLowerCase())) : items
          if (filtered.length === 0) return null
          return (
            <Card key={cat} style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'10px 16px', background:'var(--bg-raised)', borderBottom:'1px solid var(--bd-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--tx-primary)' }}>{cat}</div>
                <div style={{ fontSize:11, color:'var(--tx-secondary)' }}>{filtered.length} items</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {filtered.map(name => {
                  const price      = rates[name] || 0
                  const isModified = GARMENT_RATES[name] !== undefined && GARMENT_RATES[name] !== price
                  const isCustom   = GARMENT_RATES[name] === undefined
                  return (
                    <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom:'1px solid var(--bd-subtle)', borderRight:'1px solid var(--bd-subtle)', gap:8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--tx-primary)', display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                          <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</span>
                          {isModified && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:99, background:'rgba(245,158,11,0.15)', color:'var(--amber)', fontWeight:700, flexShrink:0 }}>EDITED</span>}
                          {isCustom   && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:99, background:'rgba(16,185,129,0.15)', color:'var(--emerald)', fontWeight:700, flexShrink:0 }}>CUSTOM</span>}
                        </div>
                        {isModified && <div style={{ fontSize:11, color:'var(--tx-tertiary)' }}>default ₹{GARMENT_RATES[name]}</div>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                        <span className="mono" style={{ fontWeight:700, fontSize:15, color:isModified?'var(--amber)':'var(--tx-primary)' }}>₹{price}</span>
                        <button onClick={()=>{setEditItem({name,price}); setEditPrice(String(price))}} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--bd-subtle)', background:'var(--bg-raised)', color:'var(--tx-secondary)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
                        {isModified && <button onClick={()=>resetItem(name)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid rgba(244,63,94,0.2)', background:'rgba(244,63,94,0.08)', color:'var(--rose)', fontSize:11, cursor:'pointer' }}>↩</button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Edit KG rate modal */}
      <Modal open={!!editKg} onClose={()=>setEditKg(null)} title={`Edit KG Rate — ${editKg?.name}`} maxWidth={380}>
        {editKg && (
          <div style={{ display:'grid', gap:14 }}>
            <div style={{ padding:'12px 14px', background:'var(--bg-raised)', borderRadius:8, fontSize:13, color:'var(--tx-secondary)' }}>
              Current: <span className="mono" style={{ fontWeight:700, color:'var(--tx-primary)' }}>₹{editKg.price}/KG</span>
              {SERVICE_KG_RATES[editKg.name] !== editKg.price && <span style={{ marginLeft:8, color:'var(--tx-tertiary)' }}>· Default: ₹{SERVICE_KG_RATES[editKg.name]}/KG</span>}
            </div>
            <div><label style={lbl}>New Price per KG (₹)</label><input style={inp} type="number" min="1" value={editKgPrice} onChange={e=>setEditKgPrice(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveEditKg()} autoFocus /></div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setEditKg(null)} style={{ flex:1, padding:11, background:'var(--bg-raised)', border:'1px solid var(--bd-subtle)', borderRadius:8, fontFamily:'inherit', fontWeight:600, cursor:'pointer', color:'var(--tx-secondary)' }}>Cancel</button>
              <button onClick={saveEditKg} style={{ flex:2, padding:11, background:'linear-gradient(135deg,#72BF2C,#8DD446)', color:'white', border:'none', borderRadius:8, fontFamily:'inherit', fontWeight:700, cursor:'pointer' }}>Save Rate</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit price modal */}
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title={`Edit Price — ${editItem?.name}`} maxWidth={380}>
        {editItem && (
          <div style={{ display:'grid', gap:14 }}>
            <div style={{ padding:'12px 14px', background:'var(--bg-raised)', borderRadius:8, fontSize:13, color:'var(--tx-secondary)' }}>
              Current: <span className="mono" style={{ fontWeight:700, color:'var(--tx-primary)' }}>₹{editItem.price}</span>
              {GARMENT_RATES[editItem.name] && GARMENT_RATES[editItem.name] !== editItem.price && <span style={{ marginLeft:8, color:'var(--tx-tertiary)' }}>· Default: ₹{GARMENT_RATES[editItem.name]}</span>}
            </div>
            <div><label style={lbl}>New Price (₹)</label><input style={inp} type="number" min="1" value={editPrice} onChange={e=>setEditPrice(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveEdit()} autoFocus /></div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setEditItem(null)} style={{ flex:1, padding:11, background:'var(--bg-raised)', border:'1px solid var(--bd-subtle)', borderRadius:8, fontFamily:'inherit', fontWeight:600, cursor:'pointer', color:'var(--tx-secondary)' }}>Cancel</button>
              <button onClick={saveEdit} style={{ flex:2, padding:11, background:'linear-gradient(135deg,#72BF2C,#8DD446)', color:'white', border:'none', borderRadius:8, fontFamily:'inherit', fontWeight:700, cursor:'pointer' }}>Save Price</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add new item modal */}
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="+ Add New Garment" maxWidth={420}>
        <div style={{ display:'grid', gap:14 }}>
          <div><label style={lbl}>Item Name</label><input style={inp} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Pheran Ladies" autoFocus /></div>
          <div><label style={lbl}>Price (₹)</label><input style={inp} type="number" min="1" value={newPrice} onChange={e=>setNewPrice(e.target.value)} /></div>
          <div>
            <label style={lbl}>Category</label>
            <select style={{...inp, cursor:'pointer'}} value={newCategory} onChange={e=>setNewCategory(e.target.value)}>
              {Object.keys(allCategories).map(c=><option key={c}>{c}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setAddModal(false)} style={{ flex:1, padding:11, background:'var(--bg-raised)', border:'1px solid var(--bd-subtle)', borderRadius:8, fontFamily:'inherit', fontWeight:600, cursor:'pointer', color:'var(--tx-secondary)' }}>Cancel</button>
            <button onClick={addNewItem} style={{ flex:2, padding:11, background:'linear-gradient(135deg,#10b981,#059669)', color:'white', border:'none', borderRadius:8, fontFamily:'inherit', fontWeight:700, cursor:'pointer' }}>Add Item</button>
          </div>
        </div>
      </Modal>

      {toast && (
        <div style={{ position:'fixed', bottom:'calc(var(--nav-h) + 16px)', right:16, background:'var(--bg-card)', border:'1px solid var(--bd-subtle)', borderLeft:'3px solid var(--emerald)', borderRadius:10, padding:'10px 16px', boxShadow:'var(--shadow-lg)', fontSize:13, fontWeight:600, zIndex:9999, color:'var(--tx-primary)', animation:'fadeUp 0.25s var(--ease-out)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
