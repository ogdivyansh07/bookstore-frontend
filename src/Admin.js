import { useCallback, useEffect, useState } from "react";
import {
  BOOKS_URL,
  ORDERS_URL,
  ADMIN_LOGIN_URL,
  TOKEN_STORAGE_KEY,
} from "./apiConfig";

const BOOK_IMAGE_PLACEHOLDER = "https://via.placeholder.com/150";

function orderEffectiveStatus(order) {
  const s = order && order.status;
  return s === "confirmed" || s === "delivered" ? s : "pending";
}

function AdminLoginScreen({ onSuccess, sessionExpired, onClearExpired }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      console.log("LOGIN API:", ADMIN_LOGIN_URL);
      const res = await fetch(ADMIN_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      console.log("[admin-login] status", res.status);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          setError("Access denied — wrong password");
        } else if (res.status === 429) {
          setError("Too many attempts — try again later");
        } else if (res.status === 500) {
          setError("Server configuration error — contact admin");
        } else {
          setError(data.message || `Login failed (${res.status})`);
        }
        return;
      }
      if (!data.token || typeof data.token !== "string") {
        setError("Login failed — invalid server response");
        return;
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      onSuccess(data.token);
    } catch (err) {
      console.error("[admin-login] error", err);
      if (err instanceof TypeError) {
        // fetch throws TypeError for network failures & CORS blocks
        setError(
          "Cannot reach server — check your internet connection or CORS settings"
        );
      } else {
        setError("Unexpected error — please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1 className="admin-login-title">Admin sign in</h1>
        <p className="admin-login-desc">
          Enter the admin password to manage books.
        </p>
        {sessionExpired && !error ? (
          <p className="admin-login-banner admin-login-banner--warn">
            Session expired, please login again
          </p>
        ) : null}
        {error ? <p className="admin-login-error">{error}</p> : null}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
              if (onClearExpired) onClearExpired();
            }}
            placeholder="Password"
            autoComplete="current-password"
            className="admin-login-input"
          />
          <button
            type="submit"
            disabled={loading}
            className="admin-login-submit"
          >
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>
        <p className="admin-login-back">
          <a href="#/" className="admin-link">
            ← Back to store
          </a>
        </p>
      </div>
    </div>
  );
}

function isTokenExpired(jwt) {
  if (!jwt || typeof jwt !== "string") return true;
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

// Compute initial auth state from a single localStorage read so both
// useState hooks see the same snapshot (the token initializer removes
// the key, which would cause sessionExpired to always read null).
const _initStored = localStorage.getItem(TOKEN_STORAGE_KEY);
const _initExpired = _initStored ? isTokenExpired(_initStored) : false;
if (_initStored && _initExpired) localStorage.removeItem(TOKEN_STORAGE_KEY);

function Admin() {
  const [token, setToken] = useState(_initExpired ? null : _initStored);
  const [sessionExpired, setSessionExpired] = useState(_initExpired);
  const [adminTab, setAdminTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [categories, setCategories] = useState([
    "General",
    "Fiction",
    "Programming",
    "Science",
  ]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
  }, []);

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setSessionExpired(true);
  }, []);

  // Proactive expiry check — runs every 30 seconds
  useEffect(() => {
    if (!token) return;
    const check = () => {
      if (isTokenExpired(token)) handleSessionExpired();
    };
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [token, handleSessionExpired]);

  const loadBooks = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(BOOKS_URL);
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (!res.ok) throw new Error(`Failed to load books (${res.status})`);
      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Could not load books");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    if (token && adminTab === "books") loadBooks();
  }, [token, adminTab, loadBooks]);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setOrdersError(null);
    setOrdersLoading(true);
    try {
      const res = await fetch(ORDERS_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setOrdersError(e.message || "Could not load orders");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [token, handleSessionExpired]);

  useEffect(() => {
    if (token && adminTab === "orders") loadOrders();
  }, [token, adminTab, loadOrders]);

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter(
          (order) => orderEffectiveStatus(order) === filterStatus
        );

  const handleOrderStatusChange = async (orderId, status) => {
    if (!token || !orderId) return;
    const oid = String(orderId);
    const prev = orders.find((o) => String(o._id) === oid);
    const prevStatus = prev && prev.status ? prev.status : "pending";
    if (prevStatus === status) return;

    setStatusUpdatingId(oid);
    setOrdersError(null);
    try {
      const res = await fetch(`${ORDERS_URL}/${oid}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrdersError(data.message || `Update failed (${res.status})`);
        return;
      }
      setOrders((prevList) =>
        prevList.map((o) => (String(o._id) === oid ? { ...o, ...data } : o))
      );
    } catch (e) {
      setOrdersError(e.message || "Could not update status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!id || !token) return;
    if (!window.confirm("Delete this book?")) return;
    try {
      const res = await fetch(`${BOOKS_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      const deletedId = String(id);
      if (editingId === deletedId) {
        setEditingId(null);
        setTitle("");
        setAuthor("");
        setPrice("");
        setSubject("");
        setCategory("General");
        setImage("");
      }
      await loadBooks();
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  };

  const fillFormFromBook = (book) => {
    setTitle(book.title ?? "");
    setAuthor(book.author ?? "");
    setPrice(
      book.price !== undefined && book.price !== null && book.price !== ""
        ? String(book.price)
        : ""
    );
    setSubject(book.subject ?? "");
    const cat = book.category;
    setCategory(categories.includes(cat) ? cat : "General");
    setImage(book.image ?? "");
  };

  const handleEdit = (book) => {
    const id = book._id || book.id;
    if (!id) return;
    setEditingId(String(id));
    fillFormFromBook(book);
  };

  const clearForm = () => {
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setPrice("");
    setSubject("");
    setCategory("General");
    setShowNewCategoryInput(false);
    setNewCategory("");
    setImage("");
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    if (!categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }

    setCategory(trimmed);
    setNewCategory("");
    setShowNewCategoryInput(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    const payload = {
      title,
      author,
      price: price === "" ? undefined : Number(price),
      subject,
      category: category || "General",
      image,
    };
    try {
      const url = editingId ? `${BOOKS_URL}/${editingId}` : BOOKS_URL;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        let msg = text || `Save failed (${res.status})`;
        try {
          const j = JSON.parse(text);
          if (j.message) msg = j.message;
        } catch {
          /* use msg */
        }
        throw new Error(msg);
      }
      clearForm();
      await loadBooks();
    } catch (e) {
      alert(e.message || (editingId ? "Could not update book" : "Could not add book"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AdminLoginScreen
        onSuccess={(t) => {
          setSessionExpired(false);
          setToken(t);
        }}
        sessionExpired={sessionExpired}
        onClearExpired={() => setSessionExpired(false)}
      />
    );
  }


  return (
    <div className="admin-app">
      <div className="admin-shell">
        <div className="admin-topbar">
          <a href="#/" className="admin-link">
            ← Back to bookstore
          </a>
          <button type="button" onClick={logout} className="admin-logout-btn">
            Log out
          </button>
        </div>

        <div className="admin-tabs">
          <button
            type="button"
            onClick={() => setAdminTab("books")}
            className={
              "admin-tab" +
              (adminTab === "books" ? " admin-tab--active" : "")
            }
          >
            Books
          </button>
          <button
            type="button"
            onClick={() => setAdminTab("orders")}
            className={
              "admin-tab" +
              (adminTab === "orders" ? " admin-tab--active" : "")
            }
          >
            Orders
          </button>
        </div>

        <h1 className="admin-page-title">
          {adminTab === "books" ? "Admin — Books" : "Admin — Orders"}
        </h1>

        {adminTab === "orders" ? (
          <section className="admin-card">
            {ordersLoading && (
              <div className="loading-block" aria-busy="true">
                <div className="loading-spinner" />
                <p className="loading-text">Loading orders…</p>
              </div>
            )}
            {ordersError && (
              <p className="admin-login-error" style={{ margin: "0 0 8px" }}>
                {ordersError}
              </p>
            )}
            {!ordersLoading && !ordersError && orders.length === 0 && (
              <div className="store-empty-state">
                <div className="store-empty-state-icon" aria-hidden="true">
                  {"\u{1F4CB}"}
                </div>
                <h3 className="store-empty-state-title">No orders yet.</h3>
              </div>
            )}
            {!ordersLoading && !ordersError && orders.length > 0 ? (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <label className="admin-label">Filter by status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="admin-input admin-select admin-select--filter"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                {filteredOrders.length === 0 ? (
                  <p className="store-muted-text" style={{ margin: 0 }}>
                    No orders match this filter.
                  </p>
                ) : (
              <ul className="admin-orders-list">
                {filteredOrders.map((order) => (
                  <li key={order._id} className="admin-order-card">
                    <p style={{ margin: "0 0 10px", fontWeight: 700, color: "#0f172a" }}>
                      {order.customerName}{" "}
                      <span style={{ fontWeight: 500, color: "#64748b" }}>
                        — {order.phone}
                      </span>
                    </p>
                    <p
                      style={{
                        margin: "0 0 14px",
                        color: "#475569",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                      }}
                    >
                      {order.address}
                    </p>
                    <div style={{ marginBottom: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <label className="admin-label admin-label--inline">
                          Status
                        </label>
                        <span
                          className={`status-badge status-badge--${orderEffectiveStatus(
                            order
                          )}`}
                        >
                          {orderEffectiveStatus(order)}
                        </span>
                      </div>
                      <select
                        value={
                          order.status === "confirmed" ||
                          order.status === "delivered"
                            ? order.status
                            : "pending"
                        }
                        disabled={statusUpdatingId === String(order._id)}
                        onChange={(e) =>
                          handleOrderStatusChange(order._id, e.target.value)
                        }
                        className="admin-input admin-select admin-select--status"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                    <p style={{ margin: "0 0 8px", color: "#64748b", fontWeight: 600 }}>
                      Books
                    </p>
                    <ul style={{ margin: "0 0 12px", paddingLeft: "20px", color: "#334155" }}>
                      {(order.books || []).map((b, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>
                          {(b && b.title) || "Book"}{" "}
                          {b && b.price != null && b.price !== ""
                            ? `— ₹${b.price}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#0f172a" }}>
                      Total: ₹{order.totalPrice}
                    </p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
                )}
              </>
            ) : null}
          </section>
        ) : null}

        {adminTab === "books" ? (
        <>
        <section className="admin-card">
          <h2 className="admin-card-title">
            {editingId ? "Edit book" : "Add book"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "12px" }}>
              <label className="admin-label">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="admin-input"
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label className="admin-label">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                className="admin-input"
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label className="admin-label">Price</label>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="admin-input"
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label className="admin-label">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="admin-input"
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label className="admin-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="admin-input admin-select"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {!showNewCategoryInput ? (
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInput(true)}
                    className="admin-btn-secondary"
                  >
                    + Add Category
                  </button>
                ) : null}

                {showNewCategoryInput ? (
                  <>
                    <input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category"
                      className="admin-input admin-input--narrow"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="admin-btn-primary"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategory("");
                      }}
                      className="admin-btn-secondary"
                    >
                      Cancel
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label className="admin-label">Image URL</label>
              <input
                type="text"
                placeholder="Image URL"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="admin-input"
              />
              {image && (
                <img
                  src={image}
                  alt=""
                  style={{ width: "100px", marginTop: "8px", display: "block" }}
                  onError={(e) => {
                    if (e.currentTarget.src !== BOOK_IMAGE_PLACEHOLDER) {
                      e.currentTarget.src = BOOK_IMAGE_PLACEHOLDER;
                    }
                  }}
                />
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <button
                type="submit"
                disabled={submitting}
                className="admin-btn-primary"
              >
                {submitting
                  ? editingId
                    ? "Saving…"
                    : "Adding…"
                  : editingId
                    ? "Update book"
                    : "Add book"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={clearForm}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="admin-card">
          <h2 className="admin-card-title">All books</h2>
          {loading && (
            <div className="loading-block" aria-busy="true">
              <div className="loading-spinner" />
              <p className="loading-text">Loading…</p>
            </div>
          )}
          {error && (
            <p className="admin-login-error" style={{ margin: "0 0 8px" }}>
              {error}
            </p>
          )}
          {!loading && !error && books.length === 0 && (
            <div className="store-empty-state">
              <div className="store-empty-state-icon" aria-hidden="true">
                {"\u{1F4DA}"}
              </div>
              <h3 className="store-empty-state-title">No books yet.</h3>
            </div>
          )}
          {!loading && books.length > 0 && (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {books.map((book) => (
                <li
                  key={book._id || book.id}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    padding: "12px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flex: 1,
                      minWidth: 0,
                      fontSize: "15px",
                      color: "#333",
                    }}
                  >
                    <img
                      src={
                        String(book.image ?? "").trim() || BOOK_IMAGE_PLACEHOLDER
                      }
                      alt={book.title || ""}
                      style={{
                        width: "48px",
                        height: "72px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #dde1e6",
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        if (e.currentTarget.src !== BOOK_IMAGE_PLACEHOLDER) {
                          e.currentTarget.src = BOOK_IMAGE_PLACEHOLDER;
                        }
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <strong>{book.title}</strong>
                      <span style={{ color: "#666" }}>
                        {" "}
                        — {book.author}
                        {book.price != null && book.price !== ""
                          ? ` — ₹${book.price}`
                          : ""}
                        {book.subject ? ` — ${book.subject}` : ""}
                        {` — ${book.category || "General"}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(book)}
                      className="admin-btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(book._id || book.id)}
                      className="admin-btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        </>
        ) : null}
      </div>
    </div>
  );
}

export default Admin;
