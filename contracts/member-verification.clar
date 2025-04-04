;; Member Verification Contract
;; Stores and verifies cooperative members

(define-data-var admin principal tx-sender)

;; Member status: 0 = inactive, 1 = active
(define-map members
  { member-id: (string-utf8 16) }
  {
    principal: principal,
    name: (string-utf8 64),
    location: (string-utf8 64),
    join-date: uint,
    status: uint
  }
)

(define-read-only (get-member (member-id (string-utf8 16)))
  (map-get? members { member-id: member-id })
)

(define-read-only (is-active-member (member-id (string-utf8 16)))
  (match (map-get? members { member-id: member-id })
    member (is-eq (get status member) u1)
    false
  )
)

(define-public (register-member
    (member-id (string-utf8 16))
    (name (string-utf8 64))
    (location (string-utf8 64))
  )
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (is-none (map-get? members { member-id: member-id })) (err u100))

    (map-set members
      { member-id: member-id }
      {
        principal: tx-sender,
        name: name,
        location: location,
        join-date: block-height,
        status: u1
      }
    )
    (ok true)
  )
)

(define-public (update-member-status (member-id (string-utf8 16)) (new-status uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (or (is-eq new-status u0) (is-eq new-status u1)) (err u101))

    (match (map-get? members { member-id: member-id })
      member (begin
        (map-set members
          { member-id: member-id }
          (merge member { status: new-status })
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
