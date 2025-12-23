/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from 'swiper/modules';
import SwiperCore from 'swiper';
import "swiper/css";
import "swiper/css/pagination";
import { availableFilters } from "./Filters";

interface FilterSilderProps {
    activeIndex: number,
    setActiveIndex: React.Dispatch<React.SetStateAction<number>>
}

const FilterSilder = ({ activeIndex, setActiveIndex }: FilterSilderProps) => {
    const swiperRef = useRef<SwiperCore | null>(null);

    return (
        <div>
            <Swiper
                slidesPerView={3}
                spaceBetween={30}
                centeredSlides={true}
                freeMode={true}
                pagination={{
                    clickable: false,
                    enabled: false,
                }}
                modules={[Pagination]}
                className="mySwiper"
                onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                onSwiper={(swiper) => swiperRef.current = swiper}
            >
                {availableFilters.map((filter, index) => (
                    <SwiperSlide key={index} >
                        <div
                            className="lens"
                            style={{
                                opacity: index === activeIndex ? 1 : 0.6,
                                transform: index === activeIndex ? 'scale(1)' : 'scale(0.8)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textWrap: 'nowrap',
                            }}
                            onClick={() => {
                                swiperRef.current?.slideTo(index);
                                setActiveIndex(index);
                            }}
                        >
                            <img
                                src={filter.src}
                                alt={filter.alt}
                                style={{
                                    borderRadius: '50%',
                                    width: '60px',
                                    height: '60px',
                                    objectFit: 'cover',
                                    border: index === activeIndex ? '2px solid #fff' : 'none',
                                    transition: 'all 0.3s ease',
                                }}
                            />
                            <p className={`text-black text-sm text-center text-nowrap ${index === activeIndex ? 'font-semibold' : ''}`}>
                                {filter.alt}
                            </p>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
            {/* <div style={{ textAlign: 'center', marginTop: '10px' }}>
                Center Slide Index: {activeIndex}
            </div> */}
        </div>
    );
};

export default FilterSilder;