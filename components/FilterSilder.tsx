/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { availableFilters } from "./Filters";

interface FilterSilderProps {
    activeIndex: number,
    setActiveIndex: React.Dispatch<React.SetStateAction<number>>
    capture: () => void
}

function FilterSlider({ activeIndex, setActiveIndex, capture }: FilterSilderProps) {
    const swiperRef = useRef<any>(null);

    return (
        <div className="w-full">
            <Swiper
                slidesPerView={3}
                spaceBetween={20}
                centeredSlides={true}
                className="pb-2!"
                onSlideChange={(swiper: any) => setActiveIndex(swiper.activeIndex)}
                onSwiper={(swiper: any) => (swiperRef.current = swiper)}
            >
                {availableFilters.map((filter, index) => (
                    <SwiperSlide key={index}>
                        <div
                            className="flex flex-col items-center cursor-pointer transition-all duration-300"
                            style={{
                                opacity: index === activeIndex ? 1 : 0.6,
                                transform: index === activeIndex ? 'scale(1)' : 'scale(0.85)',
                            }}
                            onClick={() => {
                                if (index === activeIndex) {
                                    capture();
                                    return;
                                }
                                swiperRef.current?.slideTo(index);
                                setActiveIndex(index);
                            }}
                        >
                            <img
                                src={filter.src}
                                alt={filter.alt}
                                className="rounded-full object-cover transition-all duration-300"
                                style={{
                                    width: index === activeIndex ? '56px' : '48px',
                                    height: index === activeIndex ? '56px' : '48px',
                                    border: index === activeIndex ? '2px solid #fff' : '2px solid transparent',
                                }}
                            />
                            <p
                                className={`text-black text-xs sm:text-sm mt-1 text-center whitespace-nowrap ${index === activeIndex ? 'font-semibold' : ''
                                    }`}
                            >
                                {filter.alt}
                            </p>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}

export default FilterSlider