import { useEffect, useState } from "react";

const BOOK_IMAGE_PLACEHOLDER =
  "https://via.placeholder.com/300x200?text=Book";

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

function bookImageSrc(book) {
  const src = book.image;
  if (src != null && String(src).trim() !== "") return String(src).trim();
  return BOOK_IMAGE_PLACEHOLDER;
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
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");

  useEffect(() => {
    fetch("https://bookstore-backend-1-qz9s.onrender.com/books")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.log(err));
  }, []);

  const addToCart = (book) => {
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
    padding: "0 20px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "24px 0 40px" }}>
      <style>{`
        .book-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .book-card:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.12);
        }
      `}</style>
      <div style={shell}>
        <h1 style={{ textAlign: "center", margin: "0 0 20px", fontSize: "clamp(1.5rem, 4vw, 2rem)", color: "#1a1a1a" }}>
          📚 My Bookstore
        </h1>

        {/* Search + class filters */}
        <div
          style={{
            marginBottom: "20px",
            padding: "18px 20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "#555" }}>
            Search
          </label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or author…"
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "10px 14px",
              fontSize: "15px",
              border: "1px solid #dde1e6",
              borderRadius: "8px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <p style={{ margin: "16px 0 8px", fontSize: "13px", fontWeight: 600, color: "#555" }}>Class</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {CLASS_FILTERS.map((label) => {
              const active = selectedClass === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedClass(label)}
                  style={{
                    padding: "8px 14px",
                    fontSize: "14px",
                    fontWeight: 600,
                    border: active ? "2px solid #0d6efd" : "1px solid #dde1e6",
                    borderRadius: "8px",
                    background: active ? "#e7f1ff" : "#fff",
                    color: active ? "#0d6efd" : "#444",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <div
          style={{
            marginBottom: "24px",
            padding: "18px 20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: cart.length > 0 ? "14px" : 0,
              paddingBottom: cart.length > 0 ? "14px" : 0,
              borderBottom: cart.length > 0 ? "1px solid #eee" : "none",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#333" }}>
              Your cart{" "}
              <span style={{ fontWeight: 400, color: "#666", fontSize: "15px" }}>
                ({cart.length} {cart.length === 1 ? "item" : "items"})
              </span>
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              <button
                type="button"
                onClick={clearCart}
                disabled={cart.length === 0}
                style={{
                  padding: "8px 14px",
                  background: cart.length === 0 ? "#e9ecef" : "#fff",
                  color: cart.length === 0 ? "#aaa" : "#c0392b",
                  border: "1px solid " + (cart.length === 0 ? "#dee2e6" : "#e6b8b8"),
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: cart.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                Clear Cart
              </button>
              {cart.length > 0 ? (
                <a
                  href={buildWhatsAppCartOrderUrl(cart)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "8px 14px",
                    background: "#25D366",
                    color: "#fff",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Order All on WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  style={{
                    padding: "8px 14px",
                    background: "#e9ecef",
                    color: "#888",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "not-allowed",
                  }}
                >
                  Order All on WhatsApp
                </button>
              )}
            </div>
          </div>

          {cart.length === 0 ? (
            <p style={{ margin: 0, color: "#888", fontSize: "15px" }}>No items yet. Add books from below.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {cart.map((line, index) => (
                <li
                  key={line.cartLineId}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    padding: "10px 0",
                    borderBottom: index < cart.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}
                >
                  <span style={{ color: "#333", fontSize: "15px" }}>
                    {line.title}{" "}
                    <span style={{ color: "#666", fontWeight: 700 }}>— {formatPriceDisplay(line.price)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(line.cartLineId)}
                    style={{
                      padding: "6px 12px",
                      background: "#fff",
                      color: "#c0392b",
                      border: "1px solid #e6b8b8",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Book grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            gap: "24px",
          }}
        >
          {filteredBooks.map((book) => (
            <article
              key={book._id}
              className="book-card"
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#fff",
                padding: 0,
                overflow: "hidden",
                borderRadius: "14px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            >
              <img
                src={bookImageSrc(book)}
                alt={book.title ? `Cover: ${book.title}` : "Book cover"}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  display: "block",
                  background: "#e8eaed",
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "18px 20px 20px",
                  flex: 1,
                }}
              >
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.35 }}>
                  {book.title}
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>Author: {book.author}</p>
                <p style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111" }}>
                  {formatPriceDisplay(book.price)}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginTop: "auto",
                    paddingTop: "6px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => addToCart(book)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#0d6efd",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Add to Cart
                  </button>
                  <a
                    href={buildWhatsAppOrderUrl(book.title, book.price)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 12px",
                      background: "#25D366",
                      color: "#fff",
                      textAlign: "center",
                      textDecoration: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      boxSizing: "border-box",
                    }}
                  >
                    Order on WhatsApp
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredBooks.length === 0 && books.length > 0 && (
          <p style={{ textAlign: "center", marginTop: "28px", color: "#666", fontSize: "15px" }}>
            No books match your search or class filter.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
