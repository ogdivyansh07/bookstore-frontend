import { useEffect, useState } from "react";
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
  const [view, setView] = useState("store");
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("orders");
    return saved ? JSON.parse(saved) : [];
  });
  const [books, setBooks] = useState(initialBooks);
  const [showCheckout, setShowCheckout] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [orderSuccessMessage, setOrderSuccessMessage] = useState("");
  const [trackedPhone, setTrackedPhone] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [searchPhone, setSearchPhone] = useState(() => {
    return localStorage.getItem("userPhone") || "";
  });
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookPrice, setNewBookPrice] = useState("");
  const [newBookImage, setNewBookImage] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminAuthenticated, setAdminAuthenticated] = useState(() => {
    return localStorage.getItem("admin_auth") === "true";
  });

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
  const matchedOrders = orders.filter((o) => o.phone === trackedPhone);
  const cartLineItems = Object.values(
    cart.reduce((acc, item, index) => {
      const key = String(item?.id ?? item?._id ?? item?.title ?? `item-${index}`);
      if (!acc[key]) {
        acc[key] = {
          key,
          title: item?.title || item?.name || item?.productName || "Unnamed Item",
          price: Number(item?.price) || 0,
          quantity: 0,
        };
      }
      acc[key].quantity += 1;
      return acc;
    }, {})
  );
  const cartTotal = cartLineItems.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const isAdminRoute = currentPath === "/admin";
  const adminPassword =
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.REACT_APP_ADMIN_PASSWORD || "";

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    setTrackedPhone(searchPhone.trim());
  }, [searchPhone]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {!isAdminRoute && (
          <header className="w-full shadow-md rounded-lg bg-white px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setView("store")}
                className="cursor-pointer text-xl font-semibold text-gray-900 hover:text-blue-600 hover:underline underline-offset-4"
              >
                The Bookstore
              </button>

              <nav className="hidden md:flex items-center gap-8 text-sm text-gray-700">
                <button
                  type="button"
                  onClick={() => setView("store")}
                  className={`hover:text-black ${view === "store" ? "font-semibold underline underline-offset-4" : ""}`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => setView("store")}
                  className={`hover:text-black ${view === "store" ? "font-semibold underline underline-offset-4" : ""}`}
                >
                  Books
                </button>
              </nav>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView("cart")}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    view === "cart"
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-300 text-gray-700 hover:text-black"
                  }`}
                >
                  Cart ({cart.length})
                </button>
                <button
                  type="button"
                  onClick={() => setView("track")}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    view === "track"
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-300 text-gray-700 hover:text-black"
                  }`}
                >
                  Track Order
                </button>
              </div>
            </div>
          </header>
        )}

        {!isAdminRoute && view === "store" && (
          <>
            <section className="text-center mt-10 mb-8 space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Find Your Next Book</h2>
              <p className="text-base text-gray-600">Explore our curated collection</p>
            </section>

            <div className="pt-2">
              <input
                id="store-search-input"
                type="text"
                placeholder="Search by title or author"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-1/2 border px-3 py-2 rounded-lg"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

        {!isAdminRoute && view === "cart" && (
          <div className="max-w-2xl mx-auto w-full p-4 border rounded-xl bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Cart</h2>
            {orderSuccessMessage && (
              <div className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-3">
                <p className="text-sm text-green-700 font-medium">{orderSuccessMessage}</p>
                <p className="mt-1 text-sm text-green-700">
                  You can track your order using your phone number
                </p>
                <button
                  type="button"
                  onClick={() => setView("store")}
                  className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
            {cart.length === 0 ? (
              <p>Cart is empty</p>
            ) : (
              <>
                {cartLineItems.map((item) => (
                  <div key={item.key} className="flex justify-between border-b py-3 text-sm">
                    <span className="font-medium">{item.title} x{item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-4 text-base font-semibold">
                  <span>Total</span>
                  <span>₹{cartTotal}</span>
                </div>

                <button
                  className="mt-5 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  onClick={() => {
                    setOrderSuccessMessage("");
                    setPhoneError("");
                    setAddressError("");
                    setShowCheckout(true);
                  }}
                >
                  Place Order
                </button>
              </>
            )}

            {showCheckout && (
              <div className="mt-6 border p-4 rounded-xl space-y-3">
                <h3 className="font-medium">Enter Details</h3>

                <input
                  type="text"
                  placeholder="Phone Number"
                  className="border px-3 py-2 w-full rounded-lg"
                  value={phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "");
                    setPhone(digitsOnly.slice(0, 10));
                    setPhoneError("");
                    setOrderSuccessMessage("");
                  }}
                />
                {phoneError && (
                  <p className="text-sm text-red-600">Enter a valid 10-digit phone number</p>
                )}

                <input
                  type="text"
                  placeholder="Address"
                  className="border px-3 py-2 w-full rounded-lg"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setAddressError("");
                    setOrderSuccessMessage("");
                  }}
                />
                {addressError && <p className="text-sm text-red-600">{addressError}</p>}

                <button
                  className="bg-black text-white px-4 py-2 rounded-lg w-full hover:bg-gray-800 transition-colors"
                  onClick={() => {
                    const trimmedPhone = phone.trim();
                    const trimmedAddress = address.trim();
                    const isPhoneValid = /^\d{10}$/.test(trimmedPhone);

                    if (!isPhoneValid) {
                      setPhoneError("invalid");
                      return;
                    }

                    if (!trimmedAddress) {
                      setAddressError("Please enter address");
                      return;
                    }

                    if (cart.length === 0) {
                      setAddressError("Cart is empty");
                      return;
                    }

                    const newOrder = {
                      id: Date.now(),
                      phone: trimmedPhone,
                      address: trimmedAddress,
                      items: cart,
                      status: "pending",
                    };

                    const updatedOrders = [...orders, newOrder];
                    setOrders(updatedOrders);
                    localStorage.setItem("orders", JSON.stringify(updatedOrders));
                    localStorage.setItem("userPhone", trimmedPhone);
                    setSearchPhone(trimmedPhone);
                    setTrackedPhone(trimmedPhone);
                    setCart([]);
                    localStorage.setItem("cart", JSON.stringify([]));
                    setShowCheckout(false);
                    setPhone("");
                    setAddress("");
                    setPhoneError("");
                    setAddressError("");
                    setOrderSuccessMessage("Order placed successfully!");
                  }}
                >
                  Confirm Order
                </button>
              </div>
            )}
          </div>
        )}

        {!isAdminRoute && view === "track" && (
          <div className="max-w-md mx-auto w-full border rounded-xl p-6 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setView("store")}
              className="mb-3 text-sm text-gray-500 hover:text-gray-800"
            >
              ← Back to Store
            </button>
            <h2 className="text-xl font-semibold mb-4">Track Order</h2>
            <div className="space-y-3">
              <label htmlFor="track-phone" className="block text-sm font-medium text-gray-700">
                Enter your phone number
              </label>
              <input
                id="track-phone"
                type="text"
                placeholder="Enter phone number"
                className="border px-3 py-2 rounded-lg w-full"
                value={searchPhone}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  setSearchPhone(digitsOnly.slice(0, 10));
                  localStorage.setItem("userPhone", digitsOnly.slice(0, 10));
                }}
              />
              <button
                type="button"
                className="w-full bg-black text-white px-4 py-2 rounded-lg disabled:opacity-70 hover:bg-gray-800 transition-colors"
                disabled={isTracking}
                onClick={() => {
                  setIsTracking(true);
                  const phoneToTrack = searchPhone.trim();
                  setTrackedPhone(phoneToTrack);
                  localStorage.setItem("userPhone", phoneToTrack);
                  setTimeout(() => {
                    setIsTracking(false);
                  }, 350);
                }}
              >
                {isTracking ? "Tracking..." : "Track Order"}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {matchedOrders.map((o) => {
                const status = o.status || "pending";
                const statusClass =
                  status === "delivered"
                    ? "bg-green-100 text-green-700"
                    : status === "shipped"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700";

                return (
                  <div key={o.id} className="border rounded-xl p-4 bg-white">
                    <p className="text-sm font-medium">Order ID: {o.id}</p>
                    <p className="text-sm mt-1">Items: {o.items.length}</p>
                    <div className="mt-2 space-y-1">
                      {o.items.map((item, index) => {
                        const itemName =
                          item?.name ||
                          item?.title ||
                          item?.productName ||
                          "Unnamed Item";
                        const quantity = Number(item?.quantity) > 0 ? Number(item.quantity) : 1;

                        return (
                          <p key={`${o.id}-${index}`} className="text-sm text-gray-700">
                            {itemName} x{quantity}
                          </p>
                        );
                      })}
                    </div>
                    <p className="text-sm mt-1">
                      Status:
                      <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                        {status}
                      </span>
                    </p>
                    <p className="text-sm mt-1">Address: {o.address}</p>
                  </div>
                );
              })}

              {trackedPhone && matchedOrders.length === 0 && (
                <div className="rounded border border-gray-200 p-3 bg-gray-50">
                  <p className="text-sm text-gray-600">No orders found. Try placing an order first.</p>
                  <button
                    type="button"
                    onClick={() => setView("store")}
                    className="mt-3 inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:text-black hover:border-gray-400"
                  >
                    Go to Store
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isAdminRoute && (
          <div className="max-w-3xl mx-auto w-full">
            {!adminAuthenticated ? (
              <div className="border rounded p-4 space-y-3">
                <h2 className="text-lg font-semibold">Admin Login</h2>
                <input
                  type="password"
                  placeholder="Enter admin password"
                  className="border px-3 py-2 w-full rounded"
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    setAdminError("");
                  }}
                />
                {adminError && <p className="text-sm text-red-600">{adminError}</p>}
                <button
                  className="bg-black text-white px-4 py-2 rounded w-full"
                  onClick={() => {
                    if (!adminPassword) {
                      setAdminError("Admin password is not configured");
                      return;
                    }

                    if (adminPasswordInput === adminPassword) {
                      localStorage.setItem("admin_auth", "true");
                      setAdminAuthenticated(true);
                      setAdminError("");
                      return;
                    }

                    setAdminError("Incorrect password");
                  }}
                >
                  Login
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Admin Panel</h2>
                  <button
                    className="bg-gray-200 text-gray-800 px-3 py-2 rounded"
                    onClick={() => {
                      localStorage.removeItem("admin_auth");
                      setAdminAuthenticated(false);
                      setAdminPasswordInput("");
                      setAdminError("");
                    }}
                  >
                    Logout
                  </button>
                </div>

                <div className="border rounded p-4 mb-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Book title"
                    className="border px-3 py-2 w-full rounded"
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Price"
                    className="border px-3 py-2 w-full rounded"
                    value={newBookPrice}
                    onChange={(e) => setNewBookPrice(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    className="border px-3 py-2 w-full rounded"
                    value={newBookImage}
                    onChange={(e) => setNewBookImage(e.target.value)}
                  />
                  <button
                    className="bg-blue-600 text-white px-3 py-2 rounded"
                    onClick={() => {
                      const title = newBookTitle.trim();
                      const price = newBookPrice.trim();
                      const image = newBookImage.trim();

                      if (!title || !price || !image) {
                        alert("Please fill all details");
                        return;
                      }

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
                      setNewBookTitle("");
                      setNewBookPrice("");
                      setNewBookImage("");
                    }}
                  >
                    Add Book
                  </button>
                </div>

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

                <div className="mt-6">
                  <h3 className="text-base font-semibold mb-3">Manage Orders</h3>
                  {orders.length === 0 ? (
                    <p className="text-sm text-gray-500">No orders yet</p>
                  ) : (
                    orders.map((o) => (
                      <div key={o.id} className="border p-3 mb-2 rounded">
                        <p>Order ID: {o.id}</p>
                        <p>Phone: {o.phone}</p>
                        <p>Status: {o.status || "pending"}</p>
                        <button
                          className="mt-2 bg-green-600 text-white px-2 py-1 rounded disabled:opacity-60"
                          onClick={() => {
                            setOrders(
                              orders.map((ord) =>
                                ord.id === o.id
                                  ? { ...ord, status: "delivered" }
                                  : ord
                              )
                            );
                          }}
                          disabled={o.status === "delivered"}
                        >
                          Mark Delivered
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
