import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const BOOK_IMAGE_PLACEHOLDER = "https://via.placeholder.com/150";

export function BookCard({ book, onAddToCart, whatsappUrl }) {
  const imageSrc = String(book?.image ?? "").trim() || BOOK_IMAGE_PLACEHOLDER;

  return (
    <Card className="overflow-hidden rounded-xl shadow-sm transition hover:shadow-md">
      <CardContent className="p-4">
        <img
          src={imageSrc}
          alt={book?.title || ""}
          className="h-48 w-full rounded-md object-cover"
          onError={(e) => {
            if (e.currentTarget.src !== BOOK_IMAGE_PLACEHOLDER) {
              e.currentTarget.src = BOOK_IMAGE_PLACEHOLDER;
            }
          }}
        />

        <h3 className="mt-3 line-clamp-2 text-sm font-semibold">{book?.title}</h3>

        <p className="text-sm text-gray-500">₹{book?.price ?? "N/A"}</p>

        <Button className="mt-3 w-full" onClick={() => onAddToCart(book)}>
          Add to Cart
        </Button>

        <a
          className="mt-2 block text-center text-xs text-green-600 hover:underline"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Order on WhatsApp
        </a>
      </CardContent>
    </Card>
  );
}
