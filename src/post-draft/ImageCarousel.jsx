import React, { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

function ImageCarousel({ images, title, onImageClick }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
    slidesToScroll: "auto",
    dragFree: false,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const updateButtons = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    updateButtons();
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi]);

  return (
    <div className="relative mb-4 select-none">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-1.5">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-[180px] sm:w-[200px] cursor-pointer group"
              onClick={() => onImageClick(img)}
            >
              <div className="w-full overflow-hidden rounded-lg bg-gray-100 shadow-md group-hover:shadow-lg transition-shadow">
                <img
                  src={img}
                  alt={`${title} ${idx + 1}`}
                  className="w-full h-auto object-contain"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 指示器 */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === selectedIndex
                  ? "w-5 bg-black"
                  : "w-1.5 bg-black/30"
              }`}
              onClick={() => emblaApi && emblaApi.scrollTo(idx)}
              type="button"
            />
          ))}
        </div>
      )}
      
      {/* 左箭头按钮 */}
      {canPrev && (
        <button
          aria-label="Previous"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center h-6 w-6 rounded-full bg-white text-black shadow-md ring ring-black/5 hover:bg-white transition-all"
          onClick={(e) => {
            e.stopPropagation();
            emblaApi && emblaApi.scrollPrev();
          }}
          type="button"
        >
          <ArrowLeft
            strokeWidth={1.5}
            className="h-3.5 w-3.5"
            aria-hidden="true"
          />
        </button>
      )}
      
      {/* 右箭头按钮 */}
      {canNext && (
        <button
          aria-label="Next"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center h-6 w-6 rounded-full bg-white text-black shadow-md ring ring-black/5 hover:bg-white transition-all"
          onClick={(e) => {
            e.stopPropagation();
            emblaApi && emblaApi.scrollNext();
          }}
          type="button"
        >
          <ArrowRight
            strokeWidth={1.5}
            className="h-3.5 w-3.5"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}

export default ImageCarousel;

