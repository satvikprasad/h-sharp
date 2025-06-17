import React, { useEffect, useState } from "react";

interface DecibelMeterProps {
    value: number;
}

function DecibelMeter({ value }: DecibelMeterProps) {
    let [norm, setNorm] = useState<number>(0);

    useEffect(() => {
        if (isFinite(value)) {
            const clamped: number = Math.min(Math.max(0, (value + 80) / 80), 1);
            setNorm(clamped);
            return;
        }

        setNorm(0);
    }, [value]);

    return (
        <div
            className={`db-rectangle ${norm == 0 ? "hidden" : ""}`}
            style={{
                width: `${norm * 100}%`,
                backgroundColor: `rgb(255 ${norm * 255} 0)`,
            }}
        ></div>
    );
}

export { DecibelMeter };
