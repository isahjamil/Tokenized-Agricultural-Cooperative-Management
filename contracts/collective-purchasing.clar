;; Collective Purchasing Contract
;; Manages bulk buying of supplies

(define-data-var admin principal tx-sender)

;; Purchase order status: 0 = pending, 1 = ordered, 2 = received, 3 = distributed
(define-map purchase-orders
  {
    order-id: (string-utf8 16)
  }
  {
    item-name: (string-utf8 64),
    quantity: uint,
    total-cost: uint,
    status: uint,
    creation-date: uint
  }
)

;; Track member contributions to purchase orders
(define-map contributions
  {
    order-id: (string-utf8 16),
    member-id: (string-utf8 16)
  }
  {
    amount: uint,
    quantity-share: uint,
    contribution-date: uint
  }
)

(define-read-only (get-purchase-order (order-id (string-utf8 16)))
  (map-get? purchase-orders { order-id: order-id })
)

(define-read-only (get-contribution (order-id (string-utf8 16)) (member-id (string-utf8 16)))
  (map-get? contributions { order-id: order-id, member-id: member-id })
)

(define-public (create-purchase-order
    (order-id (string-utf8 16))
    (item-name (string-utf8 64))
    (quantity uint)
    (total-cost uint)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (is-none (map-get? purchase-orders { order-id: order-id })) (err u100))

    (map-set purchase-orders
      { order-id: order-id }
      {
        item-name: item-name,
        quantity: quantity,
        total-cost: total-cost,
        status: u0,
        creation-date: block-height
      }
    )
    (ok true)
  )
)

(define-public (contribute-to-order
    (order-id (string-utf8 16))
    (member-id (string-utf8 16))
    (amount uint)
    (quantity-share uint)
  )
  (begin
    (asserts! (is-some (map-get? purchase-orders { order-id: order-id })) (err u404))

    (let ((order (unwrap! (map-get? purchase-orders { order-id: order-id }) (err u404))))
      (asserts! (is-eq (get status order) u0) (err u102))

      (map-set contributions
        { order-id: order-id, member-id: member-id }
        {
          amount: amount,
          quantity-share: quantity-share,
          contribution-date: block-height
        }
      )
      (ok true)
    )
  )
)

(define-public (update-order-status (order-id (string-utf8 16)) (new-status uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (<= new-status u3) (err u101))

    (match (map-get? purchase-orders { order-id: order-id })
      order (begin
        (map-set purchase-orders
          { order-id: order-id }
          (merge order { status: new-status })
        )
        (ok true)
      )
      (err u404)
    )
  )
)

(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (var-set admin new-admin)
    (ok true)
  )
)
