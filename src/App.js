import { useEffect, useState } from "react";
import Admin from "./Admin";
import { BOOKS_URL, ORDERS_URL } from "./apiConfig";
import { BookCard } from "./components/BookCard";

function formatPriceDisplay(price) {
  const hasPrice = price !== undefined && price !== null && price !== "";
  return hasPrice ? `₹${price}` : "₹/N/A";
}

function cartTotalNumeric(cartLines) {
  return cartLines.reduce((sum, line) => {
    const n = Number(line.price);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

function formatOrderStatusLabel(status) {
  const s =
    typeof status === "string" && status.trim() ? status.trim() : "pending";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function trackStatusPillClass(status) {
  const s = (typeof status === "string" ? status : "pending").toLowerCase();
  if (s === "confirmed") return "store-status-pill store-status-pill--confirmed";
  if (s === "delivered") return "store-status-pill store-status-pill--delivered";
  return "store-status-pill store-status-pill--pending";
}

function normalizeIndianPhone(value) {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}

function buildWhatsAppOrderUrl(title, price) {
  const raw = process.env.REACT_APP_WHATSAPP_NUMBER || "";
  const phone = String(raw).replace(/\D/g, "");
  const priceLabel = formatPriceDisplay(price);
  const text = `Hi, I'd like to order: "${title}" — ${priceLabel}`;
  const query = new URLSearchParams({ text }).toString();
  const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
  return `${base}?${query}`;
}

function buildWhatsAppCartOrderUrl(cartBooks) {
  const raw = process.env.REACT_APP_WHATSAPP_NUMBER || "";
  const phone = String(raw).replace(/\D/g, "");
  const lines = cartBooks.map((book, i) => {
    const priceLabel = formatPriceDisplay(book.price);
    return `${i + 1}. ${book.title} - ${priceLabel}`;
  });
  const text = `Hi, I want to order:\n\n${lines.join("\n")}`;
  const encoded = encodeURIComponent(text);
  const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
  return `${base}?text=${encoded}`;
}

function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "store-modal-title" : undefined}
    >
      <div
        className={`modal-shell${wide ? " modal-shell--wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-bar">
          <h2 id="store-modal-title" className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-close-icon"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-scroll">{children}</div>
        {footer ? <div className="modal-footer-bar">{footer}</div> : null}
      </div>
    </div>
  );
}

function App() {
  const [routeHash, setRouteHash] = useState(() => window.location.hash || "#/");
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showTrack, setShowTrack] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [orderName, setOrderName] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [orderAddress, setOrderAddress] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackedOrders, setTrackedOrders] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

  useEffect(() => {
    const onHash = () => setRouteHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);



  useEffect(() => {
    fetch(BOOKS_URL)
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.log(err));
  }, []);

  if (routeHash === "#/admin") {
    return <Admin />;
  }
  const addToCart = (book) => {
    setOrderSuccess("");
    const cartLineId = Date.now() + Math.random();

    setCart((prev) => [
      ...prev,
      { ...book, cartLineId }
    ]);
  };
  const removeFromCart = (cartLineId) => {
    setCart((prev) => prev.filter((line) => line.cartLineId !== cartLineId));
  };

  const clearCart = () => {
    setCart([]);
    setShowOrderForm(false);
    setOrderName("");
    setOrderPhone("");
    setOrderAddress("");
    setOrderError("");
    setOrderSuccess("");
  };

  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setOrderError("");
    setOrderSuccess("");
    const normalizedPhone = normalizeIndianPhone(orderPhone);
    if (normalizedPhone.length !== 10) {
      setOrderError("Enter a valid 10-digit phone number");
      return;
    }
    setOrderSubmitting(true);
    const booksPayload = cart.map(({ cartLineId, ...book }) => book);
    const totalPrice = cartTotalNumeric(cart);
    try {
      const res = await fetch(ORDERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          books: booksPayload,
          totalPrice,
          customerName: orderName.trim(),
          phone: normalizedPhone,
          address: orderAddress.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrderError(data.message || `Order failed (${res.status})`);
        return;
      }
      setCart([]);
      setOrderName("");
      setOrderPhone("");
      setOrderAddress("");
      setShowOrderForm(false);
      const raw = typeof data.status === "string" ? data.status : "pending";
      const statusLabel =
        raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      setOrderSuccess(`Order placed successfully (${statusLabel})`);
    } catch (err) {
      console.error("[place-order]", err);
      setOrderError("Could not reach server. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleTrackOrder = async () => {
    setTrackError("");
    const normalizedPhone = normalizeIndianPhone(trackPhone);
    if (normalizedPhone.length !== 10) {
      setTrackedOrders(null);
      setTrackError("Please enter a valid 10-digit phone number");
      return;
    }
    setTrackLoading(true);
    try {
      const res = await fetch(
        `${ORDERS_URL}/track/${encodeURIComponent(normalizedPhone)}`
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setTrackedOrders(null);
        setTrackError(
          (data && data.message) || `Could not load orders (${res.status})`
        );
        return;
      }
      setTrackedOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[track-order]", err);
      setTrackedOrders(null);
      setTrackError("Could not reach server. Please try again.");
    } finally {
      setTrackLoading(false);
    }
  };

  const categories = [
    "All",
    ...Array.from(
      new Set(books.map((book) => (book.category || "General").trim() || "General"))
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
  ];

  const filteredBooks = books.filter((book) => {
    const normalizedSearch = search.toLowerCase();
    const normalizedCategory = (book.category || "General").trim() || "General";
    const matchesSearch =
      (book.title || "").toLowerCase().includes(normalizedSearch) ||
      (book.author || "").toLowerCase().includes(normalizedSearch);
    const matchesCategory =
      selectedCategory === "All" ||
      normalizedCategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const groupedBooks = filteredBooks.reduce((acc, book) => {
    const categoryName = (book.category || "General").trim() || "General";
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(book);
    return acc;
  }, {});

  const categoryKeys = Object.keys(groupedBooks).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return (
    <div className="min-h-screen">
      <nav className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur" aria-label="Main">
        <a href="#/" className="store-nav-brand">
          <span className="store-nav-brand-icon" aria-hidden="true">
            {"\u{1F4DA}"}
          </span>
          <span className="store-nav-brand-text">The Bookstore</span>
        </a>
        <div className="store-nav-actions">
          <a className="store-nav-link" href="#/admin">
            Admin
          </a>
          <button
            type="button"
            className="store-nav-btn"
            onClick={() => setShowCart(true)}
          >
            {"\u{1F6D2}"} Cart
            <span className="store-nav-badge" aria-label={`${cart.length} items`}>
              {cart.length}
            </span>
          </button>
          <button
            type="button"
            className="store-nav-btn store-nav-btn--ghost"
            onClick={() => setShowTrack(true)}
          >
            {"\u{1F4E6}"} Track
          </button>
          <button
            type="button"
            className="store-nav-btn store-nav-btn--ghost"
            onClick={() => setShowTerms(true)}
          >
            {"\u{1F4DC}"} Terms
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search + category filters */}
        <div className="store-panel">
          <label className="store-label" htmlFor="store-search-input">
            Search
          </label>
          <input
            id="store-search-input"
            className="store-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or author"
          />

          <p className="store-label" style={{ marginTop: "18px", marginBottom: "8px" }}>
            Category
          </p>
          <div className="filter-row">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={
                    "filter-chip " +
                    (active ? "category-chip-active" : "category-chip-inactive")
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Books by category */}
        {categoryKeys.map((categoryName) => (
          <div key={categoryName} className="store-category-section">
            <div className="store-category-heading-row">
              <h2 className="store-category-heading">{categoryName}</h2>
              <span className="store-category-count">
                {groupedBooks[categoryName].length}{" "}
                {groupedBooks[categoryName].length === 1 ? "book" : "books"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {groupedBooks[categoryName].map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  onAddToCart={addToCart}
                  whatsappUrl={buildWhatsAppOrderUrl(book.title, book.price)}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredBooks.length === 0 && books.length > 0 && (
          <div className="store-empty-state" role="status">
            <div className="store-empty-state-icon" aria-hidden="true">
              {"\u{1F4DA}"}
            </div>
            <h3 className="store-empty-state-title">No books found</h3>
            <p className="store-empty-state-sub">
              Try a different search or category.
            </p>
          </div>
        )}

        {showCart && (
          <Modal
            title="Your Cart"
            wide
            onClose={() => setShowCart(false)}
            footer={
              <div className="modal-cart-footer-total">
                <span>Total</span>
                <span className="modal-cart-footer-amount">
                  ₹{cartTotalNumeric(cart).toFixed(2)}
                </span>
              </div>
            }
          >
            <div style={{ margin: 0, padding: 0 }}>
              <div className="cart-toolbar">
                <p className="cart-toolbar-summary">
                  {cart.length === 0
                    ? "No items yet"
                    : `${cart.length} ${cart.length === 1 ? "item" : "items"} in cart`}
                </p>
                <div className="cart-actions">
                  <button
                    type="button"
                    className="store-btn store-btn-ghost"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                  >
                    Clear cart
                  </button>
                  {cart.length > 0 ? (
                    <a
                      className="store-btn-wa store-btn-wa-inline"
                      href={buildWhatsAppCartOrderUrl(cart)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Order all on WhatsApp
                    </a>
                  ) : (
                    <button type="button" disabled className="store-btn-wa-disabled">
                      Order all on WhatsApp
                    </button>
                  )}
                  <button
                    type="button"
                    className="store-btn store-btn-primary"
                    disabled={cart.length === 0}
                    onClick={() => {
                      setShowOrderForm((v) => !v);
                      setOrderError("");
                      setOrderSuccess("");
                    }}
                  >
                    {showOrderForm ? "Hide order form" : "Place order"}
                  </button>
                </div>
              </div>

              {orderSuccess ? (
                <p className="store-order-success" role="status">
                  {orderSuccess}
                </p>
              ) : null}

              {showOrderForm && cart.length > 0 ? (
                <form className="store-order-panel" onSubmit={handlePlaceOrderSubmit}>
                  <p className="store-label">Checkout</p>
                  <p style={{ margin: "0 0 14px", fontSize: "14px", color: "#565959" }}>
                    Total:{" "}
                    <strong style={{ color: "#0f1111" }}>
                      ₹{cartTotalNumeric(cart).toFixed(2)}
                    </strong>
                  </p>
                  {orderError ? (
                    <p className="store-order-error" role="alert">
                      {orderError}
                    </p>
                  ) : null}
                  <div style={{ marginBottom: "12px" }}>
                    <label className="store-label" htmlFor="order-name">
                      Name
                    </label>
                    <input
                      id="order-name"
                      className="store-search"
                      style={{ maxWidth: "100%" }}
                      value={orderName}
                      onChange={(e) => setOrderName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label className="store-label" htmlFor="order-phone">
                      Phone
                    </label>
                    <input
                      id="order-phone"
                      className="store-search"
                      style={{ maxWidth: "100%" }}
                      type="tel"
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="Enter phone (e.g. 9876543210)"
                      value={orderPhone}
                      onChange={(e) => setOrderPhone(e.target.value)}
                      required
                      autoComplete="tel"
                    />
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "13px",
                        color: "#767676",
                      }}
                    >
                      Supports formats like +91, spaces, dashes
                    </p>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label className="store-label" htmlFor="order-address">
                      Address
                    </label>
                    <textarea
                      id="order-address"
                      className="store-textarea"
                      value={orderAddress}
                      onChange={(e) => setOrderAddress(e.target.value)}
                      required
                      rows={3}
                      autoComplete="street-address"
                    />
                  </div>
                  <button
                    type="submit"
                    className="store-btn store-btn-primary"
                    disabled={orderSubmitting}
                  >
                    {orderSubmitting ? "Submitting…" : "Submit order"}
                  </button>
                </form>
              ) : null}

              {cart.length === 0 ? (
                <p style={{ margin: 0, color: "#767676", fontSize: "15px", lineHeight: 1.5 }}>
                  No items yet. Add books from below.
                </p>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {cart.map((line) => (
                    <li key={line.cartLineId} className="cart-line">
                      <span style={{ color: "#0f1111", fontSize: "15px", lineHeight: 1.45 }}>
                        {line.title}{" "}
                        <span style={{ color: "#565959", fontWeight: 700 }}>
                          — {formatPriceDisplay(line.price)}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="store-btn store-btn-remove"
                        onClick={() => removeFromCart(line.cartLineId)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Modal>
        )}

        {showTrack && (
          <Modal title="Track order" onClose={() => setShowTrack(false)}>
            <div style={{ margin: 0, padding: 0 }}>
              <p className="store-muted-text" style={{ margin: "0 0 12px" }}>
                Enter the phone number from your order to see status and details.
              </p>
              <p className="store-muted-text" style={{ margin: "0 0 16px", fontSize: "13px" }}>
                Supports formats like +91, spaces, dashes (10-digit Indian mobile).
              </p>
              <div className="store-track-row">
                <input
                  className="store-search"
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="Enter phone (e.g. 9876543210)"
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  style={{ flex: "1 1 220px", maxWidth: "360px" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTrackOrder();
                  }}
                />
                <button
                  type="button"
                  className="store-btn store-btn-primary"
                  onClick={handleTrackOrder}
                  disabled={trackLoading}
                >
                  {trackLoading ? "Searching…" : "Track"}
                </button>
              </div>
              {trackError ? (
                <p className="store-order-error" role="alert" style={{ margin: 0 }}>
                  {trackError}
                </p>
              ) : null}
              {trackedOrders && trackedOrders.length === 0 ? (
                <p style={{ margin: "12px 0 0", color: "#565959", fontSize: "15px" }}>
                  No orders found for this phone number.
                </p>
              ) : null}
              {trackedOrders && trackedOrders.length > 0
                ? trackedOrders.map((order) => (
                  <div key={order._id} className="store-track-card">
                    <p
                      style={{
                        margin: "0 0 14px",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#334155" }}>Status</span>
                      <span className={trackStatusPillClass(order.status)}>
                        {formatOrderStatusLabel(order.status)}
                      </span>
                    </p>
                    <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: "13px" }}>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : ""}
                    </p>
                    <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Books</p>
                    <ul style={{ margin: "0 0 10px", paddingLeft: "18px", color: "#333" }}>
                      {(order.books || []).map((b, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>
                          {(b && b.title) || "Book"}{" "}
                          {b && b.price != null && b.price !== ""
                            ? `— ${formatPriceDisplay(b.price)}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                    <p style={{ margin: 0, fontWeight: 700 }}>
                      Total: ₹{order.totalPrice}
                    </p>
                  </div>
                ))
                : null}
            </div>
          </Modal>
        )}

        {showTerms && (
          <Modal
            title="Terms & Conditions"
            onClose={() => setShowTerms(false)}
          >
            <div style={{ margin: 0, padding: 0 }}>
              <p className="store-muted-text" style={{ marginBottom: "10px" }}>
                Please review these terms before placing your order.
              </p>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#334155", lineHeight: 1.6 }}>
                <li>All orders are subject to stock availability.</li>
                <li>Prices are shown at checkout and may include applicable charges.</li>
                <li>Please provide accurate contact and delivery details.</li>
                <li>Order status updates are available through the Track Order section.</li>
              </ul>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}

export default App;
