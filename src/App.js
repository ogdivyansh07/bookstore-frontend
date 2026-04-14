import { useState } from "react";
import { BookCard } from "./components/BookCard";

const initialBooks = [
  {
    id: 1,
    title: "The Alchemist",
    price: 299,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600",
    category: "General",
    author: "Paulo Coelho",
  },
  {
    id: 2,
    title: "Atomic Habits",
    price: 399,
    image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600",
    category: "General",
    author: "James Clear",
  },
  {
    id: 3,
    title: "Rich Dad Poor Dad",
    price: 349,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600",
    category: "General",
    author: "Robert Kiyosaki",
  },
];

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
  const [page, setPage] = useState("home");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [books, setBooks] = useState(initialBooks);
  const [searchPhone, setSearchPhone] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

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
                  key={book.id ?? book._id}
                  book={book}
                  cart={cart}
                  setCart={setCart}
                  whatsappUrl={buildWhatsAppOrderUrl(book.title, book.price)}
                />
              ))}
            </div>
          </>
        )}

        {page === "cart" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Cart</h2>
            {cart.length === 0 ? (
              <p>Cart is empty</p>
            ) : (
              cart.map((item, i) => (
                <div key={i} className="flex justify-between border-b py-2">
                  <span>{item.title}</span>
                  <span>₹{item.price}</span>
                </div>
              ))
            )}

            <button
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => {
                const phone = prompt("Enter phone number");
                if (!phone) return;
                const newOrder = {
                  id: Date.now(),
                  phone,
                  items: cart,
                };
                setOrders([...orders, newOrder]);
                setCart([]);
                alert("Order placed!");
              }}
              disabled={cart.length === 0}
            >
              Place Order
            </button>
          </div>
        )}

        {page === "track" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Track Order</h2>
            <input
              type="text"
              placeholder="Enter phone number"
              className="border px-3 py-2 rounded w-full md:w-1/3"
              onChange={(e) => setSearchPhone(e.target.value)}
            />

            <div className="mt-4">
              {orders
                .filter((o) => o.phone === searchPhone)
                .map((o) => (
                  <div key={o.id} className="border p-3 mb-2">
                    <p>Order ID: {o.id}</p>
                    <p>Items: {o.items.length}</p>
                  </div>
                ))}
            </div>
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
            <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>
            <button
              className="bg-blue-600 text-white px-3 py-2 rounded mb-4"
              onClick={() => {
                const title = prompt("Book title");
                const price = prompt("Price");
                const image = prompt("Image URL");

                if (title && price && image) {
                  setBooks([
                    ...books,
                    {
                      id: Date.now(),
                      title,
                      price,
                      image,
                      category: "General",
                      author: "Unknown",
                    },
                  ]);
                }
              }}
            >
              Add Book
            </button>

            {books.map((b) => (
              <div key={b.id ?? b._id} className="flex justify-between border-b py-2">
                <span>{b.title}</span>
                <button
                  className="text-red-500"
                  onClick={() => setBooks(books.filter((x) => (x.id ?? x._id) !== (b.id ?? b._id)))}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
