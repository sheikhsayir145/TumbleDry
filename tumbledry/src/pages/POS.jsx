// src/pages/POS.jsx — Main point of sale screen

import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/index.js'
import { GARMENT_CATEGORIES, GARMENT_RATES, SERVICES, getNextTag, calcDeliveryDate } from '../lib/garments.js'
import { Card, Button, Input, Select, Badge, Modal } from '../components/ui/index.jsx'

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

export default function POS() {
  const { orders, upsertOrder, cart, addToCart, removeFromCart, clearCart, orderDiscount, setOrderDiscount } = useStore()

  // Customer form
  const [customer, setCustomer] = useState({
    name: '', number: '', address: '', city: '', pincode: ''
  })
  const [serviceType, setServiceType] = useState('Dry Clean')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentStatus, setPaymentStatus] = useState('Paid')
  const [tagNumber, setTagNumber] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')

  // Cart state
  const [garmentSearch, setGarmentSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [billingMode, setBillingMode] = useState('piece') // 'piece' | 'kg'
  const [itemQty, setItemQty] = useState(1)
  const [itemPrice, setItemPrice] = useState('')
  const [itemDiscount, setItemDiscount] = useState(0)
  const [selectedGarment, setSelectedGarment] = useState(null)
  const [kgWeight, setKgWeight] = useState('')
  const [kgPrice, setKgPrice] = useState(90)

  // Customer suggestions
  const [suggestions, setSuggestions] = useState([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    // Set default tag and delivery date
    setTagNumber(getNextTag(orders))
    setDeliveryDate(calcDeliveryDate())
  }, [orders.length])

  // Calculate totals
  const cartGross = cart.reduce((s, i) => s + (i.unitPrice * (i.qty || 1)), 0)
  const cartItemDiscount = cart.reduce((s, i) => s + (i.discountAmount || 0), 0)
  const orderLevelDisc = orderDiscount > 0 ? Math.round(cartGross * orderDiscount / 100) : 0
  const totalDiscount = cartItemDiscount + orderLevelDisc
  const grandTotal = Math.round(cart.reduce((s, i) => s + i.net, 0) - orderLevelDisc)
  const totalGarments = cart.reduce((s, i) => s + (i.qty || 1), 0)

  // Search customers
  function handleCustomerSearch(val) {
    setCustomer(c => ({ ...c, name: val }))
    if (!val.trim()) { setSuggestions([]); return }
    const seen = {}
    orders.forEach(o => {
      const phone = o.customerNumber || ''
      if (!seen[phone] || o.orderDate > seen[phone].orderDate) seen[phone] = o
    })
    setSuggestions(
      Object.values(seen).filter(o =>
        (o.customerName||'').toLowerCase().includes(val.toLowerCase()) ||
        (o.customerNumber||'').includes(val)
      ).slice(0, 6)
    )
  }

  function selectCustomer(o) {
    setCustomer({
      name: o.customerName || '',
      number: o.customerNumber || '',
      address: o.customerAddress || '',
      city: o.customerCity || '',
      pincode: o.customerPincode || '',
    })
    setSuggestions([])
  }

  // Garment search
  const allMatches = garmentSearch
    ? Object.entries(GARMENT_CATEGORIES).flatMap(([cat, items]) => {
        const matched = items.filter(g =>
          g.toLowerCase().includes(garmentSearch.toLowerCase()) && GARMENT_RATES[g]
        )
        return matched.map(g => ({ garment: g, rate: GARMENT_RATES[g], cat }))
      })
    : []

  function selectGarment(g, rate) {
    setSelectedGarment(g)
    setItemPrice(rate)
    setGarmentSearch(g)
    setShowDropdown(false)
  }

  function addItem() {
    if (billingMode === 'kg') {
      const weight = parseFloat(kgWeight)
      if (!weight || !kgPrice) return showToast('Enter weight and price')
      const net = weight * kgPrice
      addToCart({
        type: 'kg', name: `${serviceType} (${weight} KG)`,
        printedTagName: 'Assorted Garment',
        serviceName: serviceType,
        weight, unitPrice: kgPrice, qty: itemQty || 1,
        discountPct: 0, discountAmount: 0, net: Math.round(net)
      })
    } else {
      if (!selectedGarment) return showToast('Select a garment')
      if (!itemPrice) return showToast('Enter price')
      const price = parseFloat(itemPrice)
      const qty = parseInt(itemQty) || 1
      const gross = price * qty
      const discAmt = Math.round(gross * (parseInt(itemDiscount) || 0) / 100)
      addToCart({
        type: 'piece', name: selectedGarment, printedTagName: selectedGarment,
        serviceName: serviceType,
        unitPrice: price, qty,
        discountPct: parseInt(itemDiscount) || 0,
        discountAmount: discAmt,
        net: gross - discAmt
      })
    }
    // Reset item form
    setGarmentSearch(''); setSelectedGarment(null)
    setItemPrice(''); setItemQty(1); setItemDiscount(0)
    setKgWeight('')
  }

  async function processOrder() {
    if (!customer.name) return showToast('Enter customer name')
    if (!customer.number) return showToast('Enter phone number')
    if (cart.length === 0) return showToast('Cart is empty')

    const discPct = cartGross > 0 ? Math.round(totalDiscount / cartGross * 100 * 10) / 10 : 0

    const order = {
      id: String(Date.now()),
      customerName: customer.name,
      customerNumber: customer.number,
      customerAddress: customer.address,
      customerCity: customer.city,
      customerPincode: customer.pincode,
      tagNumber,
      serviceType,
      status: 'pending',
      paymentMethod,
      paymentStatus,
      grandTotal,
      totalGarments,
      discountAmount: totalDiscount,
      discountPct: discPct,
      cart: [...cart],
      orderDate: new Date().toISOString(),
      deliveryDate,
      deleted: false,
    }

    try {
      await upsertOrder(order)
      // WhatsApp
      sendWhatsApp(order)
      // Reset
      clearCart()
      setCustomer({ name:'', number:'', address:'', city:'', pincode:'' })
      setOrderDiscount(0)
      setTagNumber(getNextTag([...orders, order]))
      setDeliveryDate(calcDeliveryDate())
      showToast('✅ Order saved!')
    } catch (e) {
      showToast('❌ ' + e.message)
    }
  }

  function sendWhatsApp(order) {
    const items = order.cart.map(i => {
      const disc = i.discountAmount || 0
      if (i.type === 'kg') return `- ${i.name} [${i.qty} pcs] ₹${Math.round(i.net)}${disc > 0 ? ` _(discount -₹${Math.round(disc)})_` : ''}`
      return `- ${i.qty}x ${i.name} ₹${Math.round(i.net)}${disc > 0 ? ` _(${i.discountPct}% off)_` : ''}`
    }).join('\n')

    const discLine = order.discountAmount > 0
      ? `\n━━━━━━━━━━━━━━━━━━\n💸 *Original:* ₹${order.grandTotal + order.discountAmount}\n🏷️ *Discount (${order.discountPct}%):* -₹${order.discountAmount}\n✅ *Bill after discount:* ₹${order.grandTotal}\n━━━━━━━━━━━━━━━━━━`
      : ''

    const msg = `Hello ${order.customerName}, we have received your laundry order! 👕\n\n🏷️ *Tag #:* ${order.tagNumber}\n👕 *Garments:* ${order.totalGarments}\n\n*Items:*\n${items}${discLine}\n\n💰 *Total Bill: ₹${order.grandTotal}*\n📅 *Delivery By:* ${order.deliveryDate}\n\nThank you for choosing Tumbledry! 🙏`
    window.open(`https://web.whatsapp.com/send?phone=91${order.customerNumber}&text=${encodeURIComponent(msg)}`, '_blank')
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--tx-primary)', letterSpacing: '-0.5px' }}>
          New Order
        </h1>
        <p style={{ fontSize: 13, color: 'var(--tx-secondary)', marginTop: 4 }}>
          Tag: <span style={{ fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--indigo)' }}>{tagNumber}</span>
        </p>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {/* Customer Info */}
        <Card>
          <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--tx-secondary)', marginBottom: 16 }}>
            👤 Customer
          </h3>
          <div style={{ position: 'relative' }}>
            <Input
              label="Search or enter customer name"
              value={customer.name}
              onChange={e => handleCustomerSearch(e.target.value)}
              placeholder="Name or phone number..."
            />
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)',
                borderRadius: 8, boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
              }}>
                {suggestions.map(o => (
                  <div
                    key={o.customerNumber}
                    onClick={() => selectCustomer(o)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid var(--bd-subtle)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{o.customerName}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>
                      {o.customerNumber}
                      {o.customerAddress && ` · ${o.customerAddress}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Phone" value={customer.number} onChange={e => setCustomer(c => ({ ...c, number: e.target.value }))} placeholder="10-digit number" />
            <Input label="Address" value={customer.address} onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))} placeholder="Street address" />
            <Input label="City" value={customer.city} onChange={e => setCustomer(c => ({ ...c, city: e.target.value }))} placeholder="City" />
            <Input label="Pincode" value={customer.pincode} onChange={e => setCustomer(c => ({ ...c, pincode: e.target.value }))} placeholder="6-digit pincode" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input label="Tag Number" value={tagNumber} onChange={e => setTagNumber(e.target.value)} />
            <Input label="Delivery Date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            <Select label="Service" value={serviceType} onChange={e => setServiceType(e.target.value)}>
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option>Cash</option>
              <option>Online</option>
            </Select>
            <Select label="Payment Status" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
              <option>Paid</option>
              <option>Pending</option>
              <option>Partial</option>
            </Select>
          </div>
        </Card>

        {/* Cart */}
        <Card>
          <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--tx-secondary)', marginBottom: 16 }}>
            🛒 Cart & Billing
          </h3>

          {/* Billing mode toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['piece', 'kg'].map(mode => (
              <button
                key={mode}
                onClick={() => setBillingMode(mode)}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: 600, fontSize: 12,
                  background: billingMode === mode ? 'var(--indigo)' : 'var(--bg-raised)',
                  color: billingMode === mode ? 'white' : 'var(--tx-secondary)',
                  transition: 'var(--transition)',
                }}
              >
                {mode === 'piece' ? '👕 Piece Billing' : '⚖️ KG Billing'}
              </button>
            ))}
          </div>

          {billingMode === 'piece' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 8, alignItems: 'end', marginBottom: 12 }}>
              <div style={{ position: 'relative' }}>
                <Input
                  label="Garment"
                  value={garmentSearch}
                  onChange={e => { setGarmentSearch(e.target.value); setShowDropdown(true); setSelectedGarment(null) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search garment..."
                />
                {showDropdown && allMatches.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)',
                    borderRadius: 8, boxShadow: 'var(--shadow-lg)', maxHeight: 280, overflowY: 'auto',
                  }}>
                    {Object.entries(
                      allMatches.reduce((acc, { garment, rate, cat }) => {
                        acc[cat] = acc[cat] || []
                        acc[cat].push({ garment, rate })
                        return acc
                      }, {})
                    ).map(([cat, items]) => (
                      <div key={cat}>
                        <div style={{ padding: '5px 12px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--indigo)', background: 'var(--bg-raised)', borderBottom: '1px solid var(--bd-subtle)' }}>
                          {cat}
                        </div>
                        {items.map(({ garment, rate }) => (
                          <div
                            key={garment}
                            onClick={() => selectGarment(garment, rate)}
                            style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bd-subtle)', fontSize: 13 }}
                          >
                            <span>{garment}</span>
                            <span style={{ color: 'var(--indigo)', fontWeight: 700, fontFamily: 'DM Mono' }}>₹{rate}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ width: 70 }}>
                <Input label="Qty" type="number" min="1" value={itemQty} onChange={e => setItemQty(e.target.value)} />
              </div>
              <div style={{ width: 90 }}>
                <Input label="Price ₹" type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)} />
              </div>
              <div style={{ width: 80 }}>
                <Input label="Disc %" type="number" min="0" max="100" value={itemDiscount} onChange={e => setItemDiscount(e.target.value)} />
              </div>
              <Button variant="success" onClick={addItem} style={{ marginBottom: 14 }}>Add</Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, alignItems: 'end', marginBottom: 12 }}>
              <Input label="Weight (KG)" type="number" step="0.5" value={kgWeight} onChange={e => setKgWeight(e.target.value)} placeholder="e.g. 3.5" />
              <div style={{ width: 90 }}><Input label="Price/KG ₹" type="number" value={kgPrice} onChange={e => setKgPrice(e.target.value)} /></div>
              <div style={{ width: 70 }}><Input label="Pcs" type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} /></div>
              <Button variant="success" onClick={addItem} style={{ marginBottom: 14 }}>Add</Button>
            </div>
          )}

          {/* Cart table */}
          {cart.length > 0 && (
            <div style={{ border: '1px solid var(--bd-subtle)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-raised)' }}>
                    {['Item', 'Qty', 'Price', 'Disc', 'Net', ''].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--tx-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--bd-subtle)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, i) => (
                    <tr key={i}>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--bd-subtle)' }}>{item.name}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--bd-subtle)' }}>{item.qty}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--bd-subtle)', fontFamily: 'DM Mono' }}>₹{item.unitPrice}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--bd-subtle)', color: 'var(--rose)' }}>{item.discountPct > 0 ? `${item.discountPct}%` : '-'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--bd-subtle)', fontFamily: 'DM Mono', fontWeight: 700 }}>₹{Math.round(item.net)}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--bd-subtle)' }}>
                        <button onClick={() => removeFromCart(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rose)', fontSize: 16 }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Order discount */}
          {cart.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-raised)', borderRadius: 8, marginBottom: 12, border: '1px solid var(--bd-subtle)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-secondary)', flexShrink: 0 }}>🏷️ Order Discount (%)</span>
                <input
                  type="number" min="0" max="100" value={orderDiscount}
                  onChange={e => setOrderDiscount(parseFloat(e.target.value) || 0)}
                  style={{ width: 80, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--bd-subtle)', fontFamily: 'inherit', fontSize: 14, background: 'var(--bg-input)', color: 'var(--tx-primary)', textAlign: 'center' }}
                />
                {orderLevelDisc > 0 && (
                  <span style={{ marginLeft: 'auto', color: 'var(--rose)', fontWeight: 700, fontFamily: 'DM Mono' }}>-₹{orderLevelDisc}</span>
                )}
              </div>

              {/* Totals */}
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))', border: '1.5px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '16px 20px' }}>
                {totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--rose)', marginBottom: 6 }}>
                    <span>Discount</span>
                    <span style={{ fontFamily: 'DM Mono', fontWeight: 700 }}>-₹{totalDiscount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx-secondary)', marginBottom: 8 }}>
                  <span>Total Garments</span>
                  <span style={{ fontWeight: 700, color: 'var(--tx-primary)' }}>{totalGarments}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx-secondary)' }}>Grand Total</span>
                  <span style={{ fontSize: 30, fontWeight: 800, fontFamily: 'DM Mono', color: 'var(--emerald)', letterSpacing: '-1px' }}>₹{grandTotal}</span>
                </div>
              </div>

              <Button variant="primary" size="full" onClick={processOrder} style={{ marginTop: 16 }}>
                ✅ Process Order & Send WhatsApp
              </Button>
            </>
          )}
        </Card>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--bg-card)', border: '1px solid var(--bd-subtle)', borderRadius: 10, padding: '10px 18px', boxShadow: 'var(--shadow-lg)', fontSize: 13, fontWeight: 600, zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
