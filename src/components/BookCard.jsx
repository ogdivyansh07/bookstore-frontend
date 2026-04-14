const BOOK_IMAGE_PLACEHOLDER = "https://via.placeholder.com/150";

export function BookCard({ book, onAddToCart, whatsappUrl }) {
  const imageSrc = String(book?.image ?? "").trim() || BOOK_IMAGE_PLACEHOLDER;

  return (
    <div className="border rounded-lg p-3 shadow-sm">
      <img
        src={imageSrc}
        alt={book?.title || ""}
        className="w-full h-40 object-cover rounded"
        onError={(e) => {
          if (e.currentTarget.src !== BOOK_IMAGE_PLACEHOLDER) {
            e.currentTarget.src = BOOK_IMAGE_PLACEHOLDER;
          }
        }}
      />

      <h3 className="mt-2 text-sm font-medium">{book?.title}</h3>

      <p className="text-sm text-gray-600">₹{book?.price ?? "N/A"}</p>

      <button
        type="button"
        className="mt-2 w-full bg-black text-white py-1 rounded"
        onClick={() => onAddToCart(book)}
      >
        Add to Cart
      </button>

      <a
        className="block text-xs text-green-600 mt-1 hover:underline"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Order on WhatsApp
      </a>
    </div>
  );
}
