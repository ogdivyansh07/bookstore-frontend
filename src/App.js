import { useEffect, useState } from "react";
import Admin from "./Admin";
import { BOOKS_URL, ORDERS_URL } from "./apiConfig";

const BOOK_IMAGE_PLACEHOLDER = "https://via.placeholder.com/150";

const CLASS_FILTERS = [
  "All",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

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

function titleMatchesClass(title, selectedClass) {
  if (selectedClass === "All") return true;
  const num = selectedClass.replace(/^Class\s+/i, "").trim();
  const re = new RegExp(`class\\s*${num}\\b`, "i");
  return re.test(title || "");
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

function App() {
  const [routeHash, setRouteHash] = useState(() => window.location.hash || "#/");
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderName, setOrderName] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [orderAddress, setOrderAddress] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
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
    setOrderSubmitting(true);
    setOrderError("");
    setOrderSuccess("");
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
          phone: orderPhone.trim(),
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
    const phone = trackPhone.trim();
    setTrackError("");
    if (!phone) {
      setTrackedOrders(null);
      setTrackError("Enter the phone number you used when placing the order.");
      return;
    }
    setTrackLoading(true);
    try {
      const res = await fetch(
        `${ORDERS_URL}/track/${encodeURIComponent(phone)}`
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

  const query = search.trim().toLowerCase();

  const filteredBooks = books.filter((book) => {
    if (!titleMatchesClass(book.title, selectedClass)) return false;
    if (!query) return true;
    const title = (book.title || "").toLowerCase();
    const author = (book.author || "").toLowerCase();
    return title.includes(query) || author.includes(query);
  });

  const shell = {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 24px",
  };

  return (
    <div className="store-root">
      <style>{`
        .store-root {
          min-height: 100vh;
          background: #eaeded;
          padding: 28px 0 48px;
        }
        @keyframes store-fade-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .store-panel {
          margin-bottom: 20px;
          padding: 22px 24px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 2px 8px rgba(15, 17, 17, 0.06);
        }
        .store-header {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px 20px;
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .store-header h1 {
          margin: 0;
          font-size: clamp(1.35rem, 3.5vw, 1.85rem);
          font-weight: 700;
          color: #0f1111;
          letter-spacing: -0.02em;
        }
        .store-header a {
          font-size: 14px;
          font-weight: 600;
          color: #007185;
          text-decoration: none;
          padding: 6px 4px;
          border-radius: 4px;
          transition: color 0.2s ease, background 0.2s ease;
        }
        .store-header a:hover {
          color: #c7511f;
          background: rgba(0, 113, 133, 0.06);
        }
        .store-label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #565959;
        }
        .store-search {
          width: 100%;
          max-width: 440px;
          padding: 11px 16px;
          font-size: 15px;
          border: 1px solid #d5d9d9;
          border-radius: 8px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .store-search:focus {
          border-color: #007185;
          box-shadow: 0 0 0 3px rgba(0, 113, 133, 0.15);
        }
        .store-search::placeholder {
          color: #888;
        }
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 4px;
        }
        .filter-chip {
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          border-radius: 999px;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
        .filter-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(15, 17, 17, 0.08);
        }
        .filter-chip:active {
          transform: translateY(0);
        }
        .filter-chip-active {
          border: 2px solid #007185;
          background: #edfdff;
          color: #007185;
        }
        .filter-chip-inactive {
          border: 2px solid #d5d9d9;
          background: #fff;
          color: #565959;
        }
        .cart-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e3e6e6;
        }
        .cart-toolbar h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #0f1111;
        }
        .cart-toolbar .muted {
          font-weight: 400;
          color: #565959;
          font-size: 15px;
        }
        .cart-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .store-btn {
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          border-radius: 999px;
          padding: 9px 18px;
          cursor: pointer;
          border: none;
          transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease, opacity 0.2s ease;
        }
        .store-btn:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }
        .store-btn:not(:disabled):active {
          transform: scale(0.98);
        }
        .store-btn-ghost {
          background: #fff;
          color: #b12704;
          border: 1px solid #d5d9d9;
          box-shadow: 0 1px 2px rgba(15, 17, 17, 0.06);
        }
        .store-btn-ghost:hover:not(:disabled) {
          background: #fef8f7;
          border-color: #c45500;
        }
        .store-btn-ghost:disabled {
          color: #a2a9ad;
          border-color: #e3e6e6;
          background: #f0f2f2;
        }
        .store-btn-cart {
          width: 100%;
          padding: 11px 16px;
          background: #ffd814;
          color: #0f1111;
          border: none;
          border-radius: 999px;
          box-shadow: 0 2px 5px rgba(213, 217, 217, 0.65);
        }
        .store-btn-cart:hover {
          background: #f7ca00;
          box-shadow: 0 4px 10px rgba(213, 217, 217, 0.85);
        }
        .store-btn-wa {
          display: block;
          width: 100%;
          padding: 11px 16px;
          text-align: center;
          text-decoration: none;
          box-sizing: border-box;
          background: #25d366;
          color: #fff;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          box-shadow: 0 2px 6px rgba(37, 211, 102, 0.25);
          transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .store-btn-wa:hover {
          background: #20bd5a;
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
        }
        .store-btn-wa:active {
          transform: scale(0.99);
        }
        .store-btn-wa-inline {
          display: inline-block;
          width: auto;
          padding: 9px 18px;
        }
        .store-btn-wa:disabled {
          background: #e3e6e6;
          color: #888;
          box-shadow: none;
          cursor: not-allowed;
        }
        .store-btn-wa-disabled {
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          padding: 9px 18px;
          border-radius: 999px;
          border: none;
          background: #e3e6e6;
          color: #888;
          cursor: not-allowed;
        }
        .cart-line {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #f0f2f2;
          transition: background 0.2s ease;
        }
        .cart-line:hover {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
        }
        .cart-line:last-child {
          border-bottom: none;
        }
        .store-btn-remove {
          padding: 7px 14px;
          font-size: 13px;
          background: #fff;
          color: #b12704;
          border: 1px solid #d5d9d9;
          border-radius: 999px;
        }
        .store-btn-remove:hover {
          background: #fef8f7;
          border-color: #c45500;
        }
        .book-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 268px), 1fr));
          gap: 20px 22px;
          align-items: stretch;
        }
        .book-card {
          display: flex;
          flex-direction: column;
          background: #fff;
          padding: 0;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 2px 8px rgba(15, 17, 17, 0.08);
          transition: transform 0.28s cubic-bezier(0.25, 0.8, 0.25, 1),
            box-shadow 0.28s cubic-bezier(0.25, 0.8, 0.25, 1),
            border-color 0.25s ease;
          animation: store-fade-up 0.45s ease backwards;
        }
        .book-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(15, 17, 17, 0.12);
          border-color: rgba(0, 113, 133, 0.2);
        }
        .book-card-media {
          position: relative;
          padding: 16px 16px 0;
          background: linear-gradient(180deg, #f7f8f8 0%, #fff 100%);
        }
        .book-card-media img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 8px;
          display: block;
          background: #e3e6e6;
          transition: transform 0.35s ease;
        }
        .book-card:hover .book-card-media img {
          transform: scale(1.02);
        }
        .book-card-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px 18px 20px;
          flex: 1;
        }
        .book-card-body h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #0f1111;
          line-height: 1.4;
          letter-spacing: -0.01em;
        }
        .book-card-meta {
          margin: 0;
          font-size: 13px;
          color: #565959;
        }
        .book-card-price {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #0f1111;
        }
        .book-card-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: auto;
          padding-top: 8px;
        }
        .store-empty-hint {
          text-align: center;
          margin-top: 32px;
          color: #565959;
          font-size: 15px;
        }
        .store-order-panel {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #e3e6e6;
        }
        .store-order-success {
          margin: 0 0 14px;
          padding: 12px 14px;
          font-size: 14px;
          font-weight: 600;
          color: #0f5132;
          background: #d1e7dd;
          border: 1px solid #badbcc;
          border-radius: 8px;
        }
        .store-order-error {
          margin: 0 0 14px;
          font-size: 14px;
          font-weight: 600;
          color: #b12704;
        }
        .store-btn-primary {
          background: #007185;
          color: #fff;
          box-shadow: 0 2px 6px rgba(0, 113, 133, 0.25);
        }
        .store-btn-primary:hover:not(:disabled) {
          background: #005f6f;
          box-shadow: 0 4px 12px rgba(0, 113, 133, 0.3);
        }
        .store-track-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin-bottom: 16px;
        }
        .store-track-card {
          margin-top: 14px;
          padding: 14px 16px;
          background: #f7f8f8;
          border-radius: 10px;
          border: 1px solid #e3e6e6;
          font-size: 14px;
          color: #0f1111;
        }
        .store-track-card + .store-track-card {
          margin-top: 12px;
        }
      `}</style>
      <div style={shell}>
        <header className="store-header">
          <h1>My Bookstore</h1>
        </header>

        {/* Search + class filters */}
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
            Class
          </p>
          <div className="filter-row">
            {CLASS_FILTERS.map((label) => {
              const active = selectedClass === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedClass(label)}
                  className={
                    "filter-chip " +
                    (active ? "filter-chip-active" : "filter-chip-inactive")
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <div className="store-panel" style={{ marginBottom: "28px" }}>
          <div className="cart-toolbar">
            <h2>
              Your cart{" "}
              <span className="muted">
                ({cart.length} {cart.length === 1 ? "item" : "items"})
              </span>
            </h2>
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
                  value={orderPhone}
                  onChange={(e) => setOrderPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label className="store-label" htmlFor="order-address">
                  Address
                </label>
                <textarea
                  id="order-address"
                  value={orderAddress}
                  onChange={(e) => setOrderAddress(e.target.value)}
                  required
                  rows={3}
                  autoComplete="street-address"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    padding: "11px 16px",
                    fontSize: "15px",
                    border: "1px solid #d5d9d9",
                    borderRadius: "8px",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
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

        {/* Track order */}
        <div className="store-panel" style={{ marginBottom: "28px" }}>
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#0f1111",
            }}
          >
            Track order
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: "14px", color: "#565959" }}>
            Enter the phone number from your order to see status and details.
          </p>
          <div className="store-track-row">
            <input
              className="store-search"
              type="tel"
              value={trackPhone}
              onChange={(e) => setTrackPhone(e.target.value)}
              placeholder="Phone number"
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
                  <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
                    Status: {formatOrderStatusLabel(order.status)}
                  </p>
                  <p style={{ margin: "0 0 8px", color: "#565959", fontSize: "13px" }}>
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

        {/* Book grid */}
        <div className="book-grid">
          {filteredBooks.map((book, index) => (
            <article
              key={book._id}
              className="book-card"
              style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
            >
              <div className="book-card-media">
                <img
                  src={
                    String(book.image ?? "").trim() || BOOK_IMAGE_PLACEHOLDER
                  }
                  alt={book.title || ""}
                  onError={(e) => {
                    if (e.currentTarget.src !== BOOK_IMAGE_PLACEHOLDER) {
                      e.currentTarget.src = BOOK_IMAGE_PLACEHOLDER;
                    }
                  }}
                />
              </div>
              <div className="book-card-body">
                <h3>{book.title}</h3>
                <p className="book-card-meta">by {book.author}</p>
                <p className="book-card-price">{formatPriceDisplay(book.price)}</p>

                <div className="book-card-actions">
                  <button
                    type="button"
                    className="store-btn store-btn-cart"
                    onClick={() => addToCart(book)}
                  >
                    Add to Cart
                  </button>
                  <a
                    className="store-btn-wa"
                    href={buildWhatsAppOrderUrl(book.title, book.price)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Order on WhatsApp
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredBooks.length === 0 && books.length > 0 && (
          <p className="store-empty-hint">
            No books match your search or class filter.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
