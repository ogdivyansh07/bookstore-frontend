import React from "react";
import { Button } from "components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "components/ui/carousel";

const galleryItems = [
  {
    id: 1,
    title: "Curated Classics",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    title: "Reading Nook",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    title: "Shelf Highlights",
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
  },
];

function Gallery4() {
  return (
    <section className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gallery</h2>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent>
          {galleryItems.map((item) => (
            <CarouselItem key={item.id} className="sm:basis-1/2 lg:basis-1/3">
              <article className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-56 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-4">
                  <h3 className="text-sm font-medium">{item.title}</h3>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}

export default Gallery4;
