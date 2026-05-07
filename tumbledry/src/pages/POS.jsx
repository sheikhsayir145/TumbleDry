// src/pages/POS.jsx

import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/index.js'
import { GARMENT_CATEGORIES, GARMENT_RATES, SERVICES, getNextTag, calcDeliveryDate } from '../lib/garments.js'

// Use custom rates if set in rate card editor, else fall back to defaults
function getActiveRates() {
  try {
    const saved = JSON.parse(localStorage.getItem('td-custom-rates') || '{}')
    return { ...GARMENT_RATES, ...saved }
  } catch { return GARMENT_RATES }
}

export default function POS() {
  const { orders, upsertOrder, cart, addToCart, removeFromCart, clearCart, orderDiscount, setOrderDiscount } = useStore()

  const [customer, setCustomer]         = useState({ name:'', number:'', address:'', city:'', pincode:'' })
  const [serviceType, setServiceType]   = useState('Dry Clean')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentStatus, setPaymentStatus] = useState('Paid')
  const [tagNumber, setTagNumber]       = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [suggestions, setSuggestions]   = useState([])
  const [billingMode, setBillingMode]   = useState('piece')
  const [garmentSearch, setGarmentSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedGarment, setSelectedGarment] = useState(null)
  const [itemQty, setItemQty]     = useState(1)
  const [itemPrice, setItemPrice] = useState('')
  const [itemDiscount, setItemDiscount] = useState(0)
  const [kgWeight, setKgWeight]   = useState('')
  const [kgPrice, setKgPrice]     = useState(90)
  const [kgQty, setKgQty]         = useState(1)
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName]   = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [customQty, setCustomQty]     = useState(1)
  const [customDisc, setCustomDisc]   = useState(0)
  const [toast, setToast]         = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    setTagNumber(getNextTag(orders))
    setDeliveryDate(calcDeliveryDate())
  }, [orders.length])

  useEffect(() => {
    const h = e => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const cartItemDisc   = cart.reduce((s, i) => s + (i.discountAmount || 0), 0)
  const cartNet        = cart.reduce((s, i) => s + i.net, 0)
  const orderLevelDisc = orderDiscount > 0 ? Math.round(cartNet * orderDiscount / 100) : 0
  const totalDiscount  = cartItemDisc + orderLevelDisc
  const grandTotal     = Math.round(cartNet - orderLevelDisc)
  const totalGarments  = cart.reduce((s, i) => s + (i.qty || 1), 0)
  const cartGross      = cart.reduce((s, i) => s + (i.unitPrice * (i.qty || 1)), 0)

  function handleCustomerSearch(val) {
    setCustomer(c => ({ ...c, name: val }))
    if (!val.trim()) { setSuggestions([]); return }
    const seen = {}
    orders.forEach(o => {
      const p = o.customerNumber || ''
      if (!seen[p] || o.orderDate > seen[p].orderDate) seen[p] = o
    })
    setSuggestions(Object.values(seen).filter(o =>
      (o.customerName||'').toLowerCase().includes(val.toLowerCase()) || (o.customerNumber||'').includes(val)
    ).slice(0, 6))
  }

  const activeRates = getActiveRates()
  const allMatches = garmentSearch
    ? Object.entries(GARMENT_CATEGORIES).flatMap(([cat, items]) =>
        items.filter(g => g.toLowerCase().includes(garmentSearch.toLowerCase()) && activeRates[g])
             .map(g => ({ garment: g, rate: activeRates[g], cat }))
      )
    : []

  const grouped = allMatches.reduce((acc, { garment, rate, cat }) => {
    acc[cat] = acc[cat] || []
    acc[cat].push({ garment, rate })
    return acc
  }, {})

  function addPieceItem() {
    if (!selectedGarment) return showToast('Select a garment')
    if (!itemPrice) return showToast('Enter price')
    const price = parseFloat(itemPrice), qty = parseInt(itemQty) || 1
    const gross = price * qty, discAmt = Math.round(gross * (parseInt(itemDiscount)||0) / 100)
    addToCart({ type:'piece', name:selectedGarment, printedTagName:selectedGarment, serviceName:serviceType, unitPrice:price, qty, discountPct:parseInt(itemDiscount)||0, discountAmount:discAmt, net:gross-discAmt })
    setGarmentSearch(''); setSelectedGarment(null); setItemPrice(''); setItemQty(1); setItemDiscount(0)
  }

  function addKgItem() {
    const weight = parseFloat(kgWeight)
    if (!weight) return showToast('Enter weight')
    const net = weight * parseFloat(kgPrice)
    addToCart({ type:'kg', name:`${serviceType} (${weight} KG)`, printedTagName:'Assorted Garment', serviceName:serviceType, weight, unitPrice:parseFloat(kgPrice), qty:parseInt(kgQty)||1, discountPct:0, discountAmount:0, net:Math.round(net) })
    setKgWeight(''); setKgQty(1)
  }

  function addCustomItem() {
    if (!customName.trim()) return showToast('Enter item name')
    if (!customPrice) return showToast('Enter price')
    const price = parseFloat(customPrice), qty = parseInt(customQty)||1
    const gross = price * qty, discAmt = Math.round(gross * (parseInt(customDisc)||0) / 100)
    addToCart({ type:'piece', name:customName.trim(), printedTagName:customName.trim(), serviceName:serviceType, unitPrice:price, qty, discountPct:parseInt(customDisc)||0, discountAmount:discAmt, net:gross-discAmt })
    setCustomName(''); setCustomPrice(''); setCustomQty(1); setCustomDisc(0); setShowCustom(false)
  }

  async function processOrder() {
    if (!customer.name) return showToast('Enter customer name')
    if (!customer.number) return showToast('Enter phone number')
    if (!cart.length) return showToast('Cart is empty')
    const discPct = cartGross > 0 ? Math.round(totalDiscount / cartGross * 100 * 10) / 10 : 0
    const order = {
      id: String(Date.now()), customerName:customer.name, customerNumber:customer.number,
      customerAddress:customer.address, customerCity:customer.city, customerPincode:customer.pincode,
      tagNumber, serviceType, status:'pending', paymentMethod, paymentStatus,
      grandTotal, totalGarments, discountAmount:totalDiscount, discountPct:discPct,
      cart:[...cart], orderDate:new Date().toISOString(), deliveryDate, deleted:false,
    }
    try {
      await upsertOrder(order)
      sendWhatsApp(order)
      clearCart(); setCustomer({name:'',number:'',address:'',city:'',pincode:''}); setOrderDiscount(0)
      setTagNumber(getNextTag([...orders, order])); setDeliveryDate(calcDeliveryDate())
      showToast('✅ Order saved!')
    } catch(e) { showToast('❌ ' + e.message) }
  }

  function sendWhatsApp(order) {
    const items = order.cart.map(i => {
      const disc = i.discountAmount || 0
      if (i.type === 'kg') return `- ${i.name} [${i.qty} pcs] ₹${Math.round(i.net)}${disc > 0 ? ` _(discount -₹${Math.round(disc)})_` : ''}`
      return `- ${i.qty}x ${i.name} ₹${Math.round(i.net)}${disc > 0 ? ` _(${i.discountPct}% off)_` : ''}`
    }).join('\n')
    const discLine = order.discountAmount > 0
      ? `\n━━━━━━━━━━━━━━━━━━\n💸 *Original:* ₹${order.grandTotal+order.discountAmount}\n🏷️ *Discount (${order.discountPct}%):* -₹${order.discountAmount}\n✅ *Bill after discount:* ₹${order.grandTotal}\n━━━━━━━━━━━━━━━━━━`
      : ''
    const msg = `Hello ${order.customerName}, we have received your laundry order! 👕\n\n🏷️ *Tag #:* ${order.tagNumber}\n👕 *Garments:* ${order.totalGarments}\n\n*Items:*\n${items}${discLine}\n\n💰 *Total Bill: ₹${order.grandTotal}*\n📅 *Delivery By:* ${order.deliveryDate}\n\nThank you for choosing Tumbledry! 🙏`
    window.open(`https://web.whatsapp.com/send?phone=91${order.customerNumber}&text=${encodeURIComponent(msg)}`, '_blank')
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const s = { input: { width:'100%', padding:'10px 14px', borderRadius:8, border:'1.5px solid var(--bd-subtle)', fontSize:14, fontFamily:'inherit', fontWeight:500, background:'var(--bg-input)', color:'var(--tx-primary)', outline:'none' }, label: { display:'block', marginBottom:6, fontSize:11, fontWeight:700, color:'var(--tx-secondary)', textTransform:'uppercase', letterSpacing:'0.5px' }, wrap: { marginBottom:14 } }

  return (
    <div style={{ padding:24, maxWidth:820, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--tx-primary)', letterSpacing:'-0.5px' }}>New Order</h1>
        <p style={{ fontSize:13, color:'var(--tx-secondary)', marginTop:4 }}>
          Tag: <span style={{ fontFamily:'DM Mono', fontWeight:700, color:'var(--indigo)' }}>{tagNumber}</span>
        </p>
      </div>

      <div style={{ display:'grid', gap:20 }}>
        {/* Customer Card */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--bd-subtle)', borderRadius:16, padding:24, boxShadow:'var(--shadow-md)' }}>
          <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--tx-secondary)', marginBottom:16 }}>👤 Customer</div>
          <div style={{ position:'relative', marginBottom:14 }}>
            <label style={s.label}>Name / Search Previous Customer</label>
            <input style={s.input} value={customer.name} onChange={e => handleCustomerSearch(e.target.value)} placeholder="Type name or phone..." />
            {suggestions.length > 0 && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50, background:'var(--bg-card)', border:'1px solid var(--bd-subtle)', borderRadius:8, boxShadow:'var(--shadow-lg)', overflow:'hidden' }}>
                {suggestions.map(o => (
                  <div key={o.customerNumber} onClick={() => { setCustomer({ name:o.customerName||'', number:o.customerNumber||'', address:o.customerAddress||'', city:o.customerCity||'', pincode:o.customerPincode||'' }); setSuggestions([]) }} style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--bd-subtle)' }}>
                    <div style={{ fontWeight:700, fontSize:13, color:'var(--tx-primary)' }}>{o.customerName}</div>
                    <div style={{ fontSize:11, color:'var(--tx-secondary)' }}>{o.customerNumber}{o.customerAddress?` · ${o.customerAddress}`:''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['Phone','number','10-digit number'],['Address','address','Street address'],['City','city','City'],['Pincode','pincode','6-digit pincode']].map(([lbl,key,ph]) => (
              <div key={key} style={s.wrap}>
                <label style={s.label}>{lbl}</label>
                <input style={s.input} value={customer[key]} onChange={e => setCustomer(c => ({...c,[key]:e.target.value}))} placeholder={ph} />
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div style={s.wrap}><label style={s.label}>Tag Number</label><input style={s.input} value={tagNumber} onChange={e => setTagNumber(e.target.value)} /></div>
            <div style={s.wrap}><label style={s.label}>Delivery Date</label><input style={s.input} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} /></div>
            <div style={s.wrap}><label style={s.label}>Service</label><select style={s.input} value={serviceType} onChange={e => setServiceType(e.target.value)}>{SERVICES.map(sv => <option key={sv}>{sv}</option>)}</select></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={s.wrap}><label style={s.label}>Payment Method</label><select style={s.input} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>Cash</option><option>Online</option></select></div>
            <div style={s.wrap}><label style={s.label}>Payment Status</label><select style={s.input} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}><option>Paid</option><option>Pending</option><option>Partial</option></select></div>
          </div>
        </div>

        {/* Cart Card */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--bd-subtle)', borderRadius:16, padding:24, boxShadow:'var(--shadow-md)' }}>
          <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--tx-secondary)', marginBottom:16 }}>🛒 Cart & Billing</div>

          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {['piece','kg'].map(m => (
              <button key={m} onClick={() => setBillingMode(m)} style={{ padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:12, background:billingMode===m?'var(--indigo)':'var(--bg-raised)', color:billingMode===m?'white':'var(--tx-secondary)' }}>
                {m==='piece'?'👕 Piece Billing':'⚖️ KG Billing'}
              </button>
            ))}
          </div>

          {billingMode === 'piece' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 70px 90px 80px auto', gap:8, alignItems:'end', marginBottom:8 }}>
                <div style={{ position:'relative' }} ref={dropdownRef}>
                  <label style={s.label}>Garment</label>
                  <input style={s.input} value={garmentSearch} onChange={e => { setGarmentSearch(e.target.value); setShowDropdown(true); setSelectedGarment(null) }} onFocus={() => setShowDropdown(true)} placeholder="Search garment..." />
                  {showDropdown && Object.keys(grouped).length > 0 && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50, background:'var(--bg-card)', border:'1px solid var(--bd-subtle)', borderRadius:8, boxShadow:'var(--shadow-lg)', maxHeight:280, overflowY:'auto' }}>
                      {Object.entries(grouped).map(([cat, items]) => (
                        <div key={cat}>
                          <div style={{ padding:'5px 12px', fontSize:10, fontWeight:800, textTransform:'uppercase', color:'var(--indigo)', background:'var(--bg-raised)', borderBottom:'1px solid var(--bd-subtle)' }}>{cat}</div>
                          {items.map(({ garment, rate }) => (
                            <div key={garment} onClick={() => { setSelectedGarment(garment); setItemPrice(rate); setGarmentSearch(garment); setShowDropdown(false) }} style={{ padding:'8px 12px', cursor:'pointer', display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--bd-subtle)', fontSize:13, color:'var(--tx-primary)' }}>
                              <span>{garment}</span>
                              <span style={{ color:'var(--indigo)', fontWeight:700, fontFamily:'DM Mono' }}>₹{rate}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div><label style={s.label}>Qty</label><input type="number" min="1" style={s.input} value={itemQty} onChange={e => setItemQty(e.target.value)} /></div>
                <div><label style={s.label}>Price ₹</label><input type="number" style={s.input} value={itemPrice} onChange={e => setItemPrice(e.target.value)} /></div>
                <div><label style={s.label}>Disc %</label><input type="number" min="0" max="100" style={s.input} value={itemDiscount} onChange={e => setItemDiscount(e.target.value)} /></div>
                <button onClick={addPieceItem} style={{ padding:'10px 16px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600, background:'linear-gradient(135deg,#10b981,#059669)', color:'white', marginBottom:14 }}>Add</button>
              </div>

              <button onClick={() => setShowCustom(v => !v)} style={{ fontSize:12, color:'var(--indigo)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', marginBottom:showCustom?10:16 }}>
                {showCustom ? '▲ Hide custom item' : '+ Add custom item (not in list)'}
              </button>
              {showCustom && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px 80px auto', gap:8, alignItems:'end', padding:'12px 14px', background:'var(--bg-raised)', borderRadius:8, border:'1px solid var(--bd-subtle)', marginBottom:12 }}>
                  <div><label style={s.label}>Custom Item Name</label><input style={s.input} value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Phiran, Abaya..." /></div>
                  <div><label style={s.label}>Price ₹</label><input type="number" style={s.input} value={customPrice} onChange={e => setCustomPrice(e.target.value)} /></div>
                  <div><label style={s.label}>Qty</label><input type="number" min="1" style={s.input} value={customQty} onChange={e => setCustomQty(e.target.value)} /></div>
                  <div><label style={s.label}>Disc %</label><input type="number" min="0" max="100" style={s.input} value={customDisc} onChange={e => setCustomDisc(e.target.value)} /></div>
                  <button onClick={addCustomItem} style={{ padding:'10px 16px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600, background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'white', marginBottom:14 }}>Add</button>
                </div>
              )}
            </>
          )}

          {billingMode === 'kg' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px auto', gap:8, alignItems:'end', marginBottom:16 }}>
              <div><label style={s.label}>Weight (KG)</label><input type="number" step="0.5" style={s.input} value={kgWeight} onChange={e => setKgWeight(e.target.value)} placeholder="e.g. 3.5" /></div>
              <div><label style={s.label}>₹ per KG</label><input type="number" style={s.input} value={kgPrice} onChange={e => setKgPrice(e.target.value)} /></div>
              <div><label style={s.label}>Pcs</label><input type="number" style={s.input} value={kgQty} onChange={e => setKgQty(e.target.value)} /></div>
              <button onClick={addKgItem} style={{ padding:'10px 16px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600, background:'linear-gradient(135deg,#10b981,#059669)', color:'white', marginBottom:14 }}>Add</button>
            </div>
          )}

          {cart.length > 0 && (
            <>
              <div style={{ border:'1px solid var(--bd-subtle)', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'var(--bg-raised)' }}>
                      {['Item','Qty','Price','Disc','Net',''].map(h => <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--tx-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid var(--bd-subtle)' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, i) => (
                      <tr key={i}>
                        <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--bd-subtle)', color:'var(--tx-primary)' }}>{item.name}</td>
                        <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--bd-subtle)', color:'var(--tx-primary)' }}>{item.qty}</td>
                        <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--bd-subtle)', fontFamily:'DM Mono', color:'var(--tx-primary)' }}>₹{item.unitPrice}</td>
                        <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--bd-subtle)', color:'var(--rose)' }}>{item.discountPct > 0 ? `${item.discountPct}%` : '—'}</td>
                        <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--bd-subtle)', fontFamily:'DM Mono', fontWeight:700, color:'var(--tx-primary)' }}>₹{Math.round(item.net)}</td>
                        <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--bd-subtle)' }}><button onClick={() => removeFromCart(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--rose)', fontSize:16 }}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg-raised)', borderRadius:8, marginBottom:12, border:'1px solid var(--bd-subtle)' }}>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--tx-secondary)', flexShrink:0 }}>🏷️ Order Discount (%)</span>
                <input type="number" min="0" max="100" value={orderDiscount} onChange={e => setOrderDiscount(parseFloat(e.target.value)||0)} style={{ width:80, padding:'7px 10px', borderRadius:6, border:'1px solid var(--bd-subtle)', fontFamily:'inherit', fontSize:14, background:'var(--bg-input)', color:'var(--tx-primary)', textAlign:'center', outline:'none' }} />
                {orderLevelDisc > 0 && <span style={{ marginLeft:'auto', color:'var(--rose)', fontWeight:700, fontFamily:'DM Mono' }}>-₹{orderLevelDisc.toLocaleString()}</span>}
              </div>

              <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.02))', border:'1.5px solid rgba(16,185,129,0.25)', borderRadius:10, padding:'16px 20px', marginBottom:16 }}>
                {totalDiscount > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--rose)', marginBottom:6 }}><span>Total Discount</span><span style={{ fontFamily:'DM Mono', fontWeight:700 }}>-₹{totalDiscount.toLocaleString()}</span></div>}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--tx-secondary)', marginBottom:8 }}><span>Total Garments</span><span style={{ fontWeight:700, color:'var(--tx-primary)' }}>{totalGarments}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:15, fontWeight:700, color:'var(--tx-secondary)' }}>Grand Total</span>
                  <span style={{ fontSize:30, fontWeight:800, fontFamily:'DM Mono', color:'var(--emerald)', letterSpacing:'-1px' }}>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={processOrder} style={{ width:'100%', padding:14, borderRadius:10, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:14, background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', boxShadow:'0 4px 20px rgba(99,102,241,0.25)' }}>
                ✅ Process Order & Send WhatsApp
              </button>
            </>
          )}
        </div>
      </div>

      {toast && <div style={{ position:'fixed', bottom:24, right:24, background:'var(--bg-card)', border:'1px solid var(--bd-subtle)', borderLeft:'3px solid var(--indigo)', borderRadius:10, padding:'10px 18px', boxShadow:'var(--shadow-lg)', fontSize:13, fontWeight:600, zIndex:9999, color:'var(--tx-primary)' }}>{toast}</div>}
    </div>
  )
}
