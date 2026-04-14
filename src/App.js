import { useEffect, useState } from "react";
import { BOOKS_URL } from "./apiConfig";
import { BookCard } from "./components/BookCard";

function buildWhatsAppOrderUrl(title, price) {
  const raw = process.env.REACT_APP_WHATSAPP_NUMBER || "";
  const phone = String(raw).replace(/\D/g, "");
  const priceLabel = price !== undefined && price !== null && price !== "" ? `₹${price}` : "₹/N/A";
  const text = `Hi, I'd like to order: "${title}" — ${priceLabel}`;
  const query = new URLSearchParams({ text }).toString();
  const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
  return `${base}?${query}`;
}

function App() {
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState("home");

  useEffect(() => {
    fetch(BOOKS_URL)
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.log(err));
  }, []);

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

  const addToCart = (book) => {
    const cartLineId = Date.now() + Math.random();
    setCart((prev) => [...prev, { ...book, cartLineId }]);
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-xl font-semibold">The Bookstore</h1>
          <div className="flex gap-6 text-sm text-gray-700">
            <span onClick={() => setPage("admin")} className="cursor-pointer hover:text-black">
              Admin
            </span>
            <span onClick={() => setPage("cart")} className="cursor-pointer hover:text-black">
              Cart ({cart.length})
            </span>
            <span onClick={() => setPage("track")} className="cursor-pointer hover:text-black">
              Track
            </span>
            <span onClick={() => setPage("terms")} className="cursor-pointer hover:text-black">
              Terms
            </span>
          </div>
        </div>

        {page === "home" && (
          <>
            <div>
              <input
                id="store-search-input"
                type="text"
                placeholder="Search by title or author"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-1/2 border px-3 py-2 rounded"
              />
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-600 mb-2">Category</h2>
              <div className="flex flex-wrap gap-3">
                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        active ? "bg-gray-900 text-white border-gray-900" : "bg-gray-100 border-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-sm text-gray-500">{filteredBooks.length} books</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  onAddToCart={addToCart}
                  whatsappUrl={buildWhatsAppOrderUrl(book.title, book.price)}
                />
              ))}
            </div>
          </>
        )}

        {page === "cart" && (
          <div>
            <h2 className="text-lg font-semibold">Cart</h2>
            <p>{cart.length === 0 ? "Cart is empty" : "Items in cart"}</p>
          </div>
        )}

        {page === "track" && (
          <div>
            <h2 className="text-lg font-semibold">Track Order</h2>
            <p>Enter order ID to track</p>
          </div>
        )}

        {page === "terms" && (
          <div>
            <h2 className="text-lg font-semibold">Terms & Conditions</h2>
            <p>All sales are final.</p>
          </div>
        )}

        {page === "admin" && (
          <div>
            <h2 className="text-lg font-semibold">Admin Panel</h2>
            <p>Manage books here</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
