import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { useEffect, useRef } from 'react';

import './ImageCarousel.scss';

const ImageCarousel = () => {
    const carouselRef = useRef(null);

    useEffect(() => {
        const carousel = carouselRef.current;
        let animationId;

        const animate = () => {
            if (carousel.scrollTop >= carousel.scrollHeight / 2) {
                carousel.scrollTop = 0;
            } else {
                carousel.scrollTop += 1;
            }
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationId);
    }, []);

    const images = [
        'images/scroller-1.png',
        'images/scroller-2.png',
        'images/scroller-3.png',
        'images/scroller-4.png',
        'images/scroller-5.png',
        'images/scroller-6.png',
        'images/scroller-7.png',
        'images/scroller-8.png',
    ];

    const createImagePairs = (imgs) => {
        const pairs = [];
        for (let i = 0; i < imgs.length; i += 2) {
            pairs.push([imgs[i], imgs[i + 1]]);
        }
        return pairs;
    };

    const imagePairs = createImagePairs([...images, ...images]);

    return (
        <div className="carousel-container">
            <div ref={carouselRef} className="carousel-scroll">
                <div className="carousel-content">
                    {imagePairs.map((pair, index) => (
                        <div key={index} className="image-row">
                            {pair.map((src, i) => (
                                <div key={`${index}-${i}`} className="image-column">
                                    <img
                                        src={urlWithBaseUrl(src)}
                                        alt={`Image ${index * 2 + i + 1}`}
                                        className="carousel-image"
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="gradient-overlay"></div>
        </div>
    );
};

export default ImageCarousel;
