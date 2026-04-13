import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

const CarouselContext = React.createContext(null);

function Carousel({ orientation = "horizontal", opts, setApi, plugins, className, children, ...props }) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins
  );

  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((emblaApi) => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => api && api.scrollPrev(), [api]);
  const scrollNext = React.useCallback(() => api && api.scrollNext(), [api]);

  React.useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        orientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        role="region"
        aria-roledescription="carousel"
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

const CarouselContent = React.forwardRef(function CarouselContent({ className, ...props }, ref) {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  );
});

const CarouselItem = React.forwardRef(function CarouselItem({ className, ...props }, ref) {
  const { orientation } = useCarousel();
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  );
});

const CarouselPrevious = React.forwardRef(function CarouselPrevious({ className, ...props }, ref) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "absolute h-9 w-9 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--foreground)]",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <span aria-hidden>◀</span>
      <span className="sr-only">Previous slide</span>
    </button>
  );
});

const CarouselNext = React.forwardRef(function CarouselNext({ className, ...props }, ref) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "absolute h-9 w-9 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--foreground)]",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <span aria-hidden>▶</span>
      <span className="sr-only">Next slide</span>
    </button>
  );
});

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
