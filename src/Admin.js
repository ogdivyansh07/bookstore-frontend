import { useCallback, useEffect, useState } from "react";

const API_BASE = "https://bookstore-backend-1-qz9s.onrender.com/books";

const BOOK_IMAGE_PLACEHOLDER = "https://via.placeholder.com/150";

const shell = {
  maxWidth: "720px",
  margin: "0 auto",
  padding: "0 20px",
};

const inputStyle = {
  width: "100%",
  maxWidth: "400px",
  padding: "8px 10px",
  fontSize: "15px",
  border: "1px solid #dde1e6",
  borderRadius: "6px",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: "4px",
  fontSize: "13px",
  fontWeight: 600,
  color: "#555",
};

function Admin() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [bookClass, setBookClass] = useState("");
  const [subject, setSubject] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const loadBooks = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Failed to load books (${res.status})`);
      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Could not load books");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Delete this book?")) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      const deletedId = String(id);
      if (editingId === deletedId) {
        setEditingId(null);
        setTitle("");
        setAuthor("");
        setPrice("");
        setBookClass("");
        setSubject("");
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
    setBookClass(book.class ?? "");
    setSubject(book.subject ?? "");
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
    setBookClass("");
    setSubject("");
    setImage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      title,
      author,
      price: price === "" ? undefined : Number(price),
      class: bookClass,
      subject,
      image,
    };
    try {
      const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Save failed (${res.status})`);
      }
      clearForm();
      await loadBooks();
    } catch (e) {
      alert(e.message || (editingId ? "Could not update book" : "Could not add book"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "24px 0 40px" }}>
      <div style={shell}>
        <p style={{ margin: "0 0 16px" }}>
          <a
            href="#/"
            style={{ color: "#0d6efd", fontSize: "14px", fontWeight: 600 }}
          >
            ← Back to bookstore
          </a>
        </p>

        <h1 style={{ margin: "0 0 20px", fontSize: "1.5rem", color: "#1a1a1a" }}>
          Admin — Books
        </h1>

        <section
          style={{
            marginBottom: "28px",
            padding: "18px 20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ margin: "0 0 14px", fontSize: "17px", color: "#333" }}>
            {editingId ? "Edit book" : "Add book"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Price</label>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Class</label>
              <input
                type="text"
                value={bookClass}
                onChange={(e) => setBookClass(e.target.value)}
                placeholder="e.g. Class 10"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Image URL</label>
              <input
                type="text"
                placeholder="Image URL"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                style={inputStyle}
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
                style={{
                  padding: "10px 18px",
                  background: submitting ? "#9ec5fe" : "#0d6efd",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
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
                  style={{
                    padding: "10px 18px",
                    background: "#fff",
                    color: "#444",
                    border: "1px solid #dde1e6",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section
          style={{
            padding: "18px 20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ margin: "0 0 14px", fontSize: "17px", color: "#333" }}>
            All books
          </h2>
          {loading && <p style={{ color: "#666", margin: 0 }}>Loading…</p>}
          {error && (
            <p style={{ color: "#c0392b", margin: "0 0 8px" }}>{error}</p>
          )}
          {!loading && !error && books.length === 0 && (
            <p style={{ color: "#666", margin: 0 }}>No books yet.</p>
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
                        {book.class ? ` — ${book.class}` : ""}
                        {book.subject ? ` — ${book.subject}` : ""}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(book)}
                      style={{
                        padding: "6px 12px",
                        background: "#fff",
                        color: "#0d6efd",
                        border: "1px solid #b6d4fe",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(book._id || book.id)}
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
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Admin;
