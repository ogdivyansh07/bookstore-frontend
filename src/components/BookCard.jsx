const BOOK_IMAGE_PLACEHOLDER = "https://via.placeholder.com/150";

export function BookCard({ book, cart, setCart, whatsappUrl }) {
  const imageSrc = String(book?.image ?? "").trim() || BOOK_IMAGE_PLACEHOLDER;

  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white transition-transform duration-200 hover:scale-105">
      <img
        src={imageSrc}
        alt={book?.title || ""}
        className="w-full h-44 object-cover rounded-lg"
        onError={(e) => {
          if (e.currentTarget.src !== BOOK_IMAGE_PLACEHOLDER) {
            e.currentTarget.src = BOOK_IMAGE_PLACEHOLDER;
          }
        }}
      />

      <h3 className="mt-3 text-base font-semibold">{book?.title}</h3>

      <p className="text-sm text-gray-600 mt-1">₹{book?.price ?? "N/A"}</p>

      <button
        type="button"
        className="mt-3 w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
        onClick={() => setCart([...cart, book])}
      >
        Add to Cart
      </button>

      <a
        className="block text-xs text-green-600 mt-2 hover:underline"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Order on WhatsApp
      </a>
    </div>
  );
}
