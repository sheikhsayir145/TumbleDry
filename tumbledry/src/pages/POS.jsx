// src/pages/POS.jsx

import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/index.js'
import {
  GARMENT_CATEGORIES, GARMENT_RATES, SERVICES,
  SERVICE_KG_RATES, isKgService, getNextTag, calcDeliveryDate
} from '../lib/garments.js'
import { printTagsInWindow, printReceiptInWindow } from '../lib/print.js'
import { User, ShoppingCart, Package, Scale, Shirt, Tag, DollarSign } from 'lucide-react'

function getActiveRates() {
  try {
    const saved = JSON.parse(localStorage.getItem('td-custom-rates') || '{}')
    return { ...GARMENT_RATES, ...saved }
  } catch { return GARMENT_RATES }
}

function getActiveKgRates() {
  try {
    const saved = JSON.parse(localStorage.getItem('td-kg-rates') || '{}')
    return { ...SERVICE_KG_RATES, ...saved }
  } catch { return SERVICE_KG_RATES }
}

const inp = {
  width: '100%', padding: '10px 12px', borderRadius: 9,
  border: '1.5px solid var(--bd-subtle)', fontSize: 14, fontFamily: 'inherit',
  fontWeight: 500, background: 'var(--bg-input)', color: 'var(--tx-primary)',
  outline: 'none', boxSizing: 'border-box',
}
const lbl = {
  display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 700,
  color: 'var(--tx-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px',
}

export default function POS() {
  const {
    orders, upsertOrder,
    cart, addToCart, removeFromCart, clearCart,
    orderDiscount, setOrderDiscount,
  } = useStore()

  const [customer,      setCustomer]      = useState({ name:'', number:'', address:'', city:'', pincode:'' })
  const [serviceType,   setServiceType]   = useState('Dry Clean')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentStatus, setPaymentStatus] = useState('Paid')
  const [tagNumber,     setTagNumber]     = useState('')
  const [deliveryDate,  setDeliveryDate]  = useState('')
  const [suggestions,   setSuggestions]   = useState([])
  const [billingMode,   setBillingMode]   = useState('piece')
  const [garmentSearch, setGarmentSearch] = useState('')
  const [showDropdown,  setShowDropdown]  = useState(false)
  const [selectedGarment, setSelectedGarment] = useState(null)
  const [itemQty,       setItemQty]       = useState(1)
  const [itemPrice,     setItemPrice]     = useState('')
  const [itemDiscount,  setItemDiscount]  = useState(0)
  const [kgWeight,      setKgWeight]      = useState('')
  const [kgPrice,       setKgPrice]       = useState(90)
  const [kgQty,         setKgQty]         = useState(1)
  const [showCustom,    setShowCustom]    = useState(false)
  const [customName,    setCustomName]    = useState('')
  const [customPrice,   setCustomPrice]   = useState('')
  const [customQty,     setCustomQty]     = useState(1)
  const [customDisc,    setCustomDisc]    = useState(0)
  const [rackLocation,  setRackLocation]  = useState('')
  const [cashAmount,    setCashAmount]    = useState('')
  const [onlineAmount,  setOnlineAmount]  = useState('')
  const [toast,         setToast]         = useState('')
  const [cartRevision,  setCartRevision]  = useState(0)
  const dropdownRef = useRef(null)

  useEffect(() => { setTagNumber(getNextTag(orders)) }, [orders.length])
  useEffect(() => { setDeliveryDate(calcDeliveryDate()) }, [])
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
      (o.customerName || '').toLowerCase().includes(val.toLowerCase()) ||
      (o.customerNumber || '').includes(val)
    ).slice(0, 6))
  }

  const activeRates = getActiveRates()
  const allMatches  = garmentSearch
    ? Object.entries(GARMENT_CATEGORIES).flatMap(([cat, items]) =>
        items
          .filter(g => g.toLowerCase().includes(garmentSearch.toLowerCase()) && activeRates[g])
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
    const gross = price * qty, discAmt = Math.round(gross * (parseInt(itemDiscount) || 0) / 100)
    addToCart({ type:'piece', name:selectedGarment, printedTagName:selectedGarment, serviceName:serviceType, unitPrice:price, qty, discountPct:parseInt(itemDiscount)||0, discountAmount:discAmt, net:gross-discAmt })
    setCartRevision(r => r + 1)
    setGarmentSearch(''); setSelectedGarment(null); setItemPrice(''); setItemQty(1); setItemDiscount(0)
  }

  function addKgItem() {
    const weight = parseFloat(kgWeight)
    if (!weight) return showToast('Enter weight')
    const net = weight * parseFloat(kgPrice)
    addToCart({ type:'kg', name:`${serviceType} (${weight} KG)`, printedTagName:'Assorted Garment', serviceName:serviceType, weight, unitPrice:parseFloat(kgPrice), qty:parseInt(kgQty)||1, discountPct:0, discountAmount:0, net:Math.round(net) })
    setCartRevision(r => r + 1)
    setKgWeight(''); setKgQty(1)
  }

  function addCustomItem() {
    if (!customName.trim()) return showToast('Enter item name')
    if (!customPrice) return showToast('Enter price')
    const price = parseFloat(customPrice), qty = parseInt(customQty) || 1
    const gross = price * qty, discAmt = Math.round(gross * (parseInt(customDisc) || 0) / 100)
    addToCart({ type:'piece', name:customName.trim(), printedTagName:customName.trim(), serviceName:serviceType, unitPrice:price, qty, discountPct:parseInt(customDisc)||0, discountAmount:discAmt, net:gross-discAmt })
    setCartRevision(r => r + 1)
    setCustomName(''); setCustomPrice(''); setCustomQty(1); setCustomDisc(0); setShowCustom(false)
  }

  async function processOrder() {
    if (!customer.name)   return showToast('Enter customer name')
    if (!customer.number) return showToast('Enter phone number')
    if (!cart.length)     return showToast('Cart is empty')
    if (paymentMethod === 'Split') {
      const cash   = parseFloat(cashAmount) || 0
      const online = parseFloat(onlineAmount) || 0
      if (cash + online !== grandTotal) return showToast(`Split amounts must add up to ₹${grandTotal}`)
    }
    const discPct   = cartGross > 0 ? Math.round(totalDiscount / cartGross * 100 * 10) / 10 : 0
    const cashAmt   = paymentMethod === 'Split' ? parseFloat(cashAmount) || 0 : paymentMethod === 'Cash' ? grandTotal : 0
    const onlineAmt = paymentMethod === 'Split' ? parseFloat(onlineAmount) || 0 : paymentMethod === 'Online' ? grandTotal : 0
    const order = {
      id: String(Date.now()), customerName:customer.name, customerNumber:customer.number,
      customerAddress:customer.address, customerCity:customer.city, customerPincode:customer.pincode,
      tagNumber, serviceType, status:'pending', paymentMethod, paymentStatus,
      grandTotal, totalGarments, discountAmount:totalDiscount, discountPct:discPct,
      cashAmount:cashAmt, onlineAmount:onlineAmt, rackLocation:rackLocation.trim(),
      cart:[...cart], orderDate:new Date().toISOString(), deliveryDate, deleted:false,
    }
    try {
      await upsertOrder(order)
      const tagsWin    = window.open('', '_blank', 'width=700,height=500')
      const receiptWin = window.open('', '_blank', 'width=300,height=600')
      printTagsInWindow(tagsWin, order)
      printReceiptInWindow(receiptWin, order)
      setTimeout(() => sendWhatsApp(order), 600)
      clearCart()
      setCustomer({ name:'', number:'', address:'', city:'', pincode:'' })
      setOrderDiscount(0); setRackLocation(''); setCashAmount(''); setOnlineAmount('')
      setTagNumber(getNextTag([...orders, order]))
      setDeliveryDate(calcDeliveryDate())
      showToast('✅ Order saved! Printing tags & receipt…')
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
    const msg = `Hello ${order.customerName}, we have received your laundry order! 👕\n\n🏷️ *Tag #:* ${order.tagNumber}\n👕 *Garments:* ${order.totalGarments}\n\n*Items:*\n${items}${discLine}\n\n💰 *Total Bill: ₹${order.grandTotal}*\n📅 *Delivery By:* ${order.deliveryDate}\n\n━━━━━━━━━━━━━━━━━━\n📍 *Banday Lane, Dargah Hazratbal, 190006*\n📞 *8899912859*\n📸 *Instagram:* https://www.instagram.com/tumbledryhazratbal?igsh=OGw2NTFyZmI4dmpi\n━━━━━━━━━━━━━━━━━━\n\nThank you for choosing Tumbledry! 🙏`
    window.open(`https://web.whatsapp.com/send?phone=91${order.customerNumber}&text=${encodeURIComponent(msg)}`, '_blank')
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const sectionHead = { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--tx-tertiary)', marginBottom: 14 }
  const cardStyle   = { background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)', borderRadius: 14, padding: 18, boxShadow: 'var(--shadow-sm)', marginBottom: 14 }

  return (
    <div className="page" style={{ maxWidth: 820, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <img
          src="/logo.png" alt="Tumbledry"
          onError={e => { e.target.style.display = 'none' }}
          style={{ height: 44, width: 'auto', objectFit: 'contain' }}
        />
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--tx-tertiary)' }}>New Order</div>
          <div style={{ fontSize: 13, color: 'var(--tx-secondary)', marginTop: 1 }}>
            Tag: <span className="mono" style={{ fontWeight: 800, color: 'var(--indigo)', fontSize: 14 }}>{tagNumber}</span>
          </div>
        </div>
      </div>

      {/* ── Customer card ── */}
      <div style={cardStyle}>
        <div style={{ ...sectionHead, display: 'flex', alignItems: 'center', gap: 6 }}><User size={12} strokeWidth={2.5} /> Customer</div>

        {/* Name with autocomplete */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <label style={lbl}>Name / Search Previous Customer</label>
          <input
            style={inp}
            value={customer.name}
            onChange={e => handleCustomerSearch(e.target.value)}
            placeholder="Type name or phone…"
          />
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)',
              borderRadius: 10, boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
              marginTop: 4,
            }}>
              {suggestions.map(o => (
                <div
                  key={o.customerNumber}
                  onClick={() => {
                    setCustomer({ name:o.customerName||'', number:o.customerNumber||'', address:o.customerAddress||'', city:o.customerCity||'', pincode:o.customerPincode||'' })
                    setSuggestions([])
                  }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--bd-subtle)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tx-primary)' }}>{o.customerName}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 1 }}>
                    {o.customerNumber}{o.customerAddress ? ` · ${o.customerAddress}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-two">
          {[
            ['Phone',   'number',  '10-digit number'],
            ['Address', 'address', 'Street address'],
            ['City',    'city',    'City'],
            ['Pincode', 'pincode', '6-digit pincode'],
          ].map(([l, k, ph]) => (
            <div key={k}>
              <label style={lbl}>{l}</label>
              <input style={inp} value={customer[k]} onChange={e => setCustomer(c => ({ ...c, [k]: e.target.value }))} placeholder={ph} />
            </div>
          ))}
        </div>

        <div className="form-three">
          <div>
            <label style={lbl}>Tag Number</label>
            <input style={inp} value={tagNumber} onChange={e => setTagNumber(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Delivery Date</label>
            <input style={inp} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Service</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={serviceType} onChange={e => {
              const svc = e.target.value
              setServiceType(svc)
              if (isKgService(svc)) {
                setBillingMode('kg')
                const kgRates = getActiveKgRates()
                setKgPrice(kgRates[svc] || SERVICE_KG_RATES[svc] || 90)
              } else {
                setBillingMode('piece')
              }
            }}>
              {SERVICES.map(sv => <option key={sv}>{sv}</option>)}
            </select>
          </div>
        </div>

        <div className="form-two">
          <div>
            <label style={lbl}>Payment Method</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); setCashAmount(''); setOnlineAmount('') }}>
              <option>Cash</option>
              <option>Online</option>
              <option>Split</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Payment Status</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
              <option>Paid</option>
              <option>Pending</option>
              <option>Partial</option>
            </select>
          </div>
        </div>

        {/* Split payment inputs */}
        {paymentMethod === 'Split' && (
          <div style={{ background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 10, padding: '12px 14px', marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--indigo)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 5 }}><DollarSign size={11} /> Split Payment — must total ₹{grandTotal || '—'}</div>
            <div className="form-two">
              <div>
                <label style={lbl}>Cash Amount ₹</label>
                <input type="number" style={inp} value={cashAmount} placeholder="0"
                  onChange={e => { const v = parseFloat(e.target.value)||0; setCashAmount(e.target.value); setOnlineAmount(String(Math.max(0, grandTotal - v))) }} />
              </div>
              <div>
                <label style={lbl}>Online Amount ₹</label>
                <input type="number" style={inp} value={onlineAmount} placeholder="0"
                  onChange={e => { const v = parseFloat(e.target.value)||0; setOnlineAmount(e.target.value); setCashAmount(String(Math.max(0, grandTotal - v))) }} />
              </div>
            </div>
          </div>
        )}

        {/* Rack location */}
        <div style={{ marginTop: 12 }}>
          <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 5 }}><Package size={11} /> Rack / Shelf Location (optional)</label>
          <input style={{ ...inp, maxWidth: 200 }} value={rackLocation} onChange={e => setRackLocation(e.target.value)} placeholder="e.g. A3, Shelf B2" />
        </div>
      </div>

      {/* ── Cart card ── */}
      <div style={cardStyle}>
        <div style={{ ...sectionHead, display: 'flex', alignItems: 'center', gap: 6 }}><ShoppingCart size={12} strokeWidth={2.5} /> Cart & Billing</div>

        {/* Billing mode toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'var(--bg-raised)', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid var(--bd-subtle)' }}>
          {['piece', 'kg'].map(m => (
            <button key={m} onClick={() => setBillingMode(m)} style={{
              padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 700, fontSize: 12,
              background: billingMode === m ? 'var(--bg-card)' : 'transparent',
              color: billingMode === m ? 'var(--indigo)' : 'var(--tx-secondary)',
              boxShadow: billingMode === m ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s',
            }}>
              {m === 'piece'
                ? <><Shirt size={13} strokeWidth={2} /> Piece</>
                : <><Scale size={13} strokeWidth={2} /> KG</>}
            </button>
          ))}
        </div>

        {/* Piece billing */}
        {billingMode === 'piece' && (
          <>
            <div className="pos-add-row">
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <label style={lbl}>Garment</label>
                <input
                  style={inp}
                  value={garmentSearch}
                  onChange={e => { setGarmentSearch(e.target.value); setShowDropdown(true); setSelectedGarment(null) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search garment…"
                />
                {showDropdown && Object.keys(grouped).length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)',
                    borderRadius: 10, boxShadow: 'var(--shadow-lg)', maxHeight: 260, overflowY: 'auto',
                    marginTop: 4,
                  }}>
                    {Object.entries(grouped).map(([cat, items]) => (
                      <div key={cat}>
                        <div style={{ padding: '5px 12px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--indigo)', background: 'var(--bg-raised)', borderBottom: '1px solid var(--bd-subtle)', letterSpacing: '0.5px' }}>
                          {cat}
                        </div>
                        {items.map(({ garment, rate }) => (
                          <div
                            key={garment}
                            onClick={() => { setSelectedGarment(garment); setItemPrice(rate); setGarmentSearch(garment); setShowDropdown(false) }}
                            style={{ padding: '9px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bd-subtle)', fontSize: 13, color: 'var(--tx-primary)', transition: 'background 0.1s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span>{garment}</span>
                            <span className="mono" style={{ color: 'var(--indigo)', fontWeight: 700 }}>₹{rate}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div><label style={lbl}>Qty</label><input type="number" min="1" style={inp} value={itemQty} onChange={e => setItemQty(e.target.value)} /></div>
              <div><label style={lbl}>Price ₹</label><input type="number" style={inp} value={itemPrice} onChange={e => setItemPrice(e.target.value)} /></div>
              <div><label style={lbl}>Disc %</label><input type="number" min="0" max="100" style={inp} value={itemDiscount} onChange={e => setItemDiscount(e.target.value)} /></div>

              <button onClick={addPieceItem} style={{
                padding: '10px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
                background: 'linear-gradient(135deg,#059669,#10B981)', color: 'white',
                marginBottom: 14, whiteSpace: 'nowrap',
              }}>
                + Add
              </button>
            </div>

            <button onClick={() => setShowCustom(v => !v)} style={{ fontSize: 12, color: 'var(--indigo)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: showCustom ? 10 : 16, padding: '0', textDecoration: 'underline', textUnderlineOffset: 2 }}>
              {showCustom ? '▲ Hide custom item' : '+ Add custom item (not in list)'}
            </button>

            {showCustom && (
              <div style={{ background: 'var(--bg-raised)', borderRadius: 10, padding: 14, border: '1px solid var(--bd-subtle)', marginBottom: 12 }}>
                <div className="pos-add-row-custom">
                  <div><label style={lbl}>Custom Item Name</label><input style={inp} value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Phiran, Abaya…" /></div>
                  <div><label style={lbl}>Price ₹</label><input type="number" style={inp} value={customPrice} onChange={e => setCustomPrice(e.target.value)} /></div>
                  <div><label style={lbl}>Qty</label><input type="number" min="1" style={inp} value={customQty} onChange={e => setCustomQty(e.target.value)} /></div>
                  <div><label style={lbl}>Disc %</label><input type="number" min="0" max="100" style={inp} value={customDisc} onChange={e => setCustomDisc(e.target.value)} /></div>
                  <button onClick={addCustomItem} style={{ padding: '10px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, background: 'linear-gradient(135deg,#D97706,#F59E0B)', color: 'white', marginBottom: 14, whiteSpace: 'nowrap' }}>
                    + Add
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* KG billing */}
        {billingMode === 'kg' && (
          <div className="pos-kg-row">
            <div><label style={lbl}>Weight (KG)</label><input type="number" step="0.5" style={inp} value={kgWeight} onChange={e => setKgWeight(e.target.value)} placeholder="e.g. 3.5" /></div>
            <div><label style={lbl}>₹ per KG</label><input type="number" style={inp} value={kgPrice} onChange={e => setKgPrice(e.target.value)} /></div>
            <div><label style={lbl}>Pcs</label><input type="number" style={inp} value={kgQty} onChange={e => setKgQty(e.target.value)} /></div>
            <button onClick={addKgItem} style={{ padding: '10px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, background: 'linear-gradient(135deg,#059669,#10B981)', color: 'white', marginBottom: 14, whiteSpace: 'nowrap' }}>
              + Add
            </button>
          </div>
        )}

        {/* Cart items */}
        {cart.length > 0 && (
          <>
            <div style={{ border: '1px solid var(--bd-subtle)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
              {/* Table header (desktop) */}
              <div className="hide-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 48px 80px 60px 80px 32px', padding: '8px 12px', background: 'var(--bg-raised)', borderBottom: '1px solid var(--bd-subtle)', fontSize: 10, fontWeight: 700, color: 'var(--tx-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', gap: 8 }}>
                <div>Item</div><div>Qty</div><div>Price</div><div>Disc</div><div>Net</div><div />
              </div>

              {cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: i < cart.length - 1 ? '1px solid var(--bd-subtle)' : 'none', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div className="hide-desktop" style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 2 }}>
                      Qty: {item.qty} · ₹{item.unitPrice}{item.discountPct > 0 ? ` · ${item.discountPct}% off` : ''}
                    </div>
                  </div>
                  <div className="hide-mobile" style={{ width: 48, fontSize: 13, color: 'var(--tx-secondary)' }}>{item.qty}</div>
                  <div className="hide-mobile mono" style={{ width: 80, fontSize: 13, color: 'var(--tx-secondary)' }}>₹{item.unitPrice}</div>
                  <div className="hide-mobile" style={{ width: 60, fontSize: 12, color: 'var(--rose)' }}>{item.discountPct > 0 ? `${item.discountPct}%` : '—'}</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)', minWidth: 60, textAlign: 'right' }}>₹{Math.round(item.net)}</div>
                  <button onClick={() => removeFromCart(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rose)', fontSize: 18, padding: '0 4px', lineHeight: 1, minHeight: 'auto', flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>

            {/* Order discount */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-raised)', borderRadius: 9, marginBottom: 12, border: '1px solid var(--bd-subtle)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-secondary)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}><Tag size={13} strokeWidth={2} /> Order Discount (%)</span>
              <input
                type="number" min="0" max="100"
                value={orderDiscount}
                onChange={e => setOrderDiscount(parseFloat(e.target.value) || 0)}
                style={{ width: 72, padding: '7px 10px', borderRadius: 7, border: '1px solid var(--bd-subtle)', fontFamily: 'inherit', fontSize: 14, background: 'var(--bg-input)', color: 'var(--tx-primary)', textAlign: 'center', outline: 'none' }}
              />
              {orderLevelDisc > 0 && (
                <span className="mono" style={{ marginLeft: 'auto', color: 'var(--rose)', fontWeight: 700 }}>-₹{orderLevelDisc.toLocaleString()}</span>
              )}
            </div>

            {/* Bill summary */}
            <div style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.07), rgba(13,148,136,0.03))', border: '1.5px solid rgba(13,148,136,0.2)', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx-secondary)', marginBottom: 6 }}>
                <span>Total Garments</span>
                <span style={{ fontWeight: 700, color: 'var(--tx-primary)' }}>{totalGarments}</span>
              </div>
              {totalDiscount > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx-tertiary)', marginBottom: 4 }}>
                    <span>Original Amount</span>
                    <span className="mono" style={{ fontWeight: 600, textDecoration: 'line-through' }}>₹{cartGross.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--rose)', marginBottom: 6 }}>
                    <span>Discount</span>
                    <span className="mono" style={{ fontWeight: 700 }}>-₹{totalDiscount.toLocaleString()}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: totalDiscount > 0 ? '1px dashed rgba(13,148,136,0.25)' : 'none', paddingTop: totalDiscount > 0 ? 10 : 0, marginTop: totalDiscount > 0 ? 4 : 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx-secondary)' }}>Grand Total</span>
                <span key={cartRevision} className="mono cart-bump" style={{ fontSize: 32, fontWeight: 800, color: 'var(--indigo)', letterSpacing: '-1px' }}>₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={processOrder} style={{
              width: '100%', padding: 14, borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 800, fontSize: 14,
              background: 'linear-gradient(135deg, #72BF2C, #8DD446)',
              color: 'white', boxShadow: 'var(--shadow-teal)',
              letterSpacing: '0.1px',
            }}>
              Process Order & Send WhatsApp
            </button>
          </>
        )}

        {cart.length === 0 && (
          <div style={{ textAlign: 'center', padding: '28px 0 8px', color: 'var(--tx-tertiary)', fontSize: 13 }}>
            Add items above to build the cart
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, right: 16, zIndex: 9999,
          background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)',
          borderLeft: '3px solid var(--indigo)', borderRadius: 10,
          padding: '10px 16px', boxShadow: 'var(--shadow-lg)',
          fontSize: 13, fontWeight: 600, color: 'var(--tx-primary)',
          animation: 'fadeUp 0.25s var(--ease-out)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
