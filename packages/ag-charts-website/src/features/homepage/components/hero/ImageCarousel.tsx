import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { useEffect, useRef, useState } from 'react';

import './ImageCarousel.scss';

const ImageCarousel = () => {
    const leftColumnRef = useRef(null);
    const rightColumnRef = useRef(null);
    const [scrollHeight, setScrollHeight] = useState(0);

    useEffect(() => {
        const leftColumn = leftColumnRef.current;
        const rightColumn = rightColumnRef.current;
        let animationId;

        const updateScrollHeight = () => {
            if (leftColumn) {
                setScrollHeight(leftColumn.scrollHeight / 2);
            }
        };

        const animate = () => {
            if (leftColumn && rightColumn) {
                leftColumn.scrollTop += 1;
                if (leftColumn.scrollTop >= scrollHeight) {
                    leftColumn.scrollTop = 0;
                }

                rightColumn.scrollTop -= 1;
                if (rightColumn.scrollTop <= 0) {
                    rightColumn.scrollTop = scrollHeight;
                }
            }
            animationId = requestAnimationFrame(animate);
        };

        updateScrollHeight();
        window.addEventListener('resize', updateScrollHeight);
        animationId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', updateScrollHeight);
        };
    }, [scrollHeight]);

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

    const leftImages = [...images, ...images];
    const rightImages = [...images.reverse(), ...images.reverse()];

    return (
        <div className="carousel-container">
            <div className="carousel-column">
                <div ref={leftColumnRef} className="carousel-scroll scroll-down">
                    <div className="carousel-content">
                        {leftImages.map((src, index) => (
                            <div key={index} className="image-row">
                                <img
                                    src={urlWithBaseUrl(src)}
                                    alt={`Left Image ${index + 1}`}
                                    className="carousel-image"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="carousel-column">
                <div ref={rightColumnRef} className="carousel-scroll scroll-up">
                    <div className="carousel-content">
                        {rightImages.map((src, index) => (
                            <div key={index} className="image-row">
                                <img
                                    src={urlWithBaseUrl(src)}
                                    alt={`Right Image ${index + 1}`}
                                    className="carousel-image"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="gradient-overlay"></div>
        </div>
    );
};

export default ImageCarousel;
