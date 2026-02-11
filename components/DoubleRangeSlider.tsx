import React, { useCallback, useEffect, useState, useRef } from 'react';

interface DoubleRangeSliderProps {
    min: number;
    max: number;
    onChange: (min: number, max: number) => void;
    minVal: number;
    maxVal: number;
}

const DoubleRangeSlider: React.FC<DoubleRangeSliderProps> = ({ min, max, onChange, minVal, maxVal }) => {
    const [minValState, setMinValState] = useState(minVal);
    const [maxValState, setMaxValState] = useState(maxVal);
    const minValRef = useRef(minVal);
    const maxValRef = useRef(maxVal);
    const range = useRef<HTMLDivElement>(null);

    // Convert to percentage
    const getPercent = useCallback(
        (value: number) => Math.round(((value - min) / (max - min)) * 100),
        [min, max]
    );

    // Set width of the range to decrease from the left side
    useEffect(() => {
        const minPercent = getPercent(minValState);
        const maxPercent = getPercent(maxValRef.current);

        if (range.current) {
            range.current.style.left = `${minPercent}%`;
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [minValState, getPercent]);

    // Set width of the range to decrease from the right side
    useEffect(() => {
        const minPercent = getPercent(minValRef.current);
        const maxPercent = getPercent(maxValState);

        if (range.current) {
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [maxValState, getPercent]);

    useEffect(() => {
        // Sync with props if they change externally
        setMinValState(minVal);
        setMaxValState(maxVal);
        minValRef.current = minVal;
        maxValRef.current = maxVal;
    }, [minVal, maxVal]);

    return (
        <div className="relative w-full h-8 flex items-center justify-center">
            <input
                type="range"
                min={min}
                max={max}
                value={minValState}
                onChange={(event) => {
                    const value = Math.min(Number(event.target.value), maxValState - 1);
                    setMinValState(value);
                    minValRef.current = value;
                    onChange(value, maxValState);
                }}
                className="thumb thumb--left"
                style={{ zIndex: minValState > max - 100 ? 5 : undefined }}
            />
            <input
                type="range"
                min={min}
                max={max}
                value={maxValState}
                onChange={(event) => {
                    const value = Math.max(Number(event.target.value), minValState + 1);
                    setMaxValState(value);
                    maxValRef.current = value;
                    onChange(minValState, value);
                }}
                className="thumb thumb--right"
            />

            <div className="slider">
                <div className="slider__track" />
                <div ref={range} className="slider__range" />
            </div>

            <style>{`
        .slider {
          position: relative;
          width: 100%;
        }

        .slider__track,
        .slider__range {
          position: absolute;
          border-radius: 3px;
          height: 4px; /* Matches Tailwind h-1 approx */
          top: 50%;
          transform: translateY(-50%);
        }

        .slider__track {
          background-color: #e2e8f0; /* slate-200 */
          width: 100%;
          z-index: 1;
        }

        .slider__range {
          background-color: #2563eb; /* blue-600 */
          z-index: 2;
        }

        .thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          pointer-events: none;
          position: absolute;
          height: 0;
          width: 100%;
          outline: none;
          top: 12px; /* Center thumb vertically approx */
        }

        .thumb--left {
          z-index: 3;
        }

        .thumb--right {
          z-index: 4;
        }

        /* Webkit Thumbs */
        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          background-color: white;
          border: 2px solid #2563eb; /* blue-600 */
          border-radius: 50%;
          cursor: pointer;
          height: 16px;
          width: 16px; 
          margin-top: 4px;
          pointer-events: all;
          position: relative;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        }

        /* Firefox Thumbs */
        .thumb::-moz-range-thumb {
          background-color: white;
          border: 2px solid #2563eb;
          border-radius: 50%;
          cursor: pointer;
          height: 16px;
          width: 16px;
          margin-top: 4px;
          pointer-events: all;
          position: relative;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>
        </div>
    );
};

export default DoubleRangeSlider;
