// netlify/functions/orders.js
// GET all orders / POST upsert / POST bulk import

import { getDb, checkAuth, ok, err, cors } from './_db.js'

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return cors()
  if (!checkAuth(event)) return err('Unauthorized', 401)

  const db = getDb()

  // ── GET all orders ──────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const rows = await db`
        SELECT
          id, customer_name, customer_number,
          customer_address, customer_city, customer_pincode,
          tag_number, service_type, status,
          payment_method, payment_status,
          grand_total::float, total_garments,
          discount_amount::float, discount_pct::float,
          cart, order_date, delivery_date, deleted,
          created_at, updated_at
        FROM orders
        ORDER BY order_date DESC
      `
      // Normalize to camelCase for the React app
      const orders = rows.map(r => ({
        id:              r.id,
        customerName:    r.customer_name,
        customerNumber:  r.customer_number,
        customerAddress: r.customer_address,
        customerCity:    r.customer_city,
        customerPincode: r.customer_pincode,
        tagNumber:       r.tag_number,
        serviceType:     r.service_type,
        status:          r.status,
        paymentMethod:   r.payment_method,
        paymentStatus:   r.payment_status,
        grandTotal:      r.grand_total,
        totalGarments:   r.total_garments,
        discountAmount:  r.discount_amount,
        discountPct:     r.discount_pct,
        cart:            r.cart || [],
        orderDate:       r.order_date,
        deliveryDate:    r.delivery_date,
        deleted:         r.deleted,
      }))
      return ok({ orders })
    } catch (e) {
      return err(e.message, 500)
    }
  }

  // ── POST ────────────────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}')

    // Bulk replace all (for CSV import)
    if (body.action === 'REPLACE_ALL') {
      try {
        await db`DELETE FROM orders`
        for (const o of (body.orders || [])) {
          await db`
            INSERT INTO orders (
              id, customer_name, customer_number,
              customer_address, customer_city, customer_pincode,
              tag_number, service_type, status,
              payment_method, payment_status,
              grand_total, total_garments,
              discount_amount, discount_pct,
              cart, order_date, delivery_date, deleted
            ) VALUES (
              ${o.id}, ${o.customerName}, ${o.customerNumber},
              ${o.customerAddress||''}, ${o.customerCity||''}, ${o.customerPincode||''},
              ${o.tagNumber}, ${o.serviceType}, ${o.status||'pending'},
              ${o.paymentMethod||'Cash'}, ${o.paymentStatus||'Pending'},
              ${o.grandTotal||0}, ${o.totalGarments||0},
              ${o.discountAmount||0}, ${o.discountPct||0},
              ${JSON.stringify(o.cart||[])}, ${o.orderDate}, ${o.deliveryDate||''}, ${o.deleted||false}
            )
          `
        }
        return ok({ success: true, count: (body.orders||[]).length })
      } catch (e) {
        return err(e.message, 500)
      }
    }

    // Upsert single order
    const o = body.order || body
    try {
      await db`
        INSERT INTO orders (
          id, customer_name, customer_number,
          customer_address, customer_city, customer_pincode,
          tag_number, service_type, status,
          payment_method, payment_status,
          grand_total, total_garments,
          discount_amount, discount_pct,
          cart, order_date, delivery_date, deleted
        ) VALUES (
          ${o.id}, ${o.customerName}, ${o.customerNumber},
          ${o.customerAddress||''}, ${o.customerCity||''}, ${o.customerPincode||''},
          ${o.tagNumber}, ${o.serviceType}, ${o.status||'pending'},
          ${o.paymentMethod||'Cash'}, ${o.paymentStatus||'Pending'},
          ${o.grandTotal||0}, ${o.totalGarments||0},
          ${o.discountAmount||0}, ${o.discountPct||0},
          ${JSON.stringify(o.cart||[])}, ${o.orderDate}, ${o.deliveryDate||''}, ${o.deleted||false}
        )
        ON CONFLICT (id) DO UPDATE SET
          customer_name    = EXCLUDED.customer_name,
          customer_number  = EXCLUDED.customer_number,
          customer_address = EXCLUDED.customer_address,
          customer_city    = EXCLUDED.customer_city,
          customer_pincode = EXCLUDED.customer_pincode,
          service_type     = EXCLUDED.service_type,
          status           = EXCLUDED.status,
          payment_method   = EXCLUDED.payment_method,
          payment_status   = EXCLUDED.payment_status,
          grand_total      = EXCLUDED.grand_total,
          total_garments   = EXCLUDED.total_garments,
          discount_amount  = EXCLUDED.discount_amount,
          discount_pct     = EXCLUDED.discount_pct,
          cart             = EXCLUDED.cart,
          delivery_date    = EXCLUDED.delivery_date,
          deleted          = EXCLUDED.deleted,
          updated_at       = NOW()
      `
      return ok({ success: true })
    } catch (e) {
      return err(e.message, 500)
    }
  }

  return err('Method not allowed', 405)
}
