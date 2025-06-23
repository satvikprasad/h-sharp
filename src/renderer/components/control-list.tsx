import React, { useEffect, useState } from "react";

import "@styles/control-list.css";
import { RgbaColor, RgbaColorPicker } from "react-colorful";
import { vec4 } from "gl-matrix";

type ControlEventType =
    | "CenterObjects"
    | "UpdateGridWidth"
    | "CenterViewport"
    | "UpdateGridColor"
    | "PrintEditor";

interface ControlEvent {
    type: ControlEventType;
    data?: number | vec4;
}

interface ControlListData {}

interface ControlListProps {
    controlHandler: (event: ControlEvent) => void;
}

interface ControlListButtonProps {
    name: string;
    keyHint: string;
    eventType: ControlEventType;
    handler: (event: ControlEvent) => void;
}

function ControlListButton({
    name,
    keyHint,
    handler,
    eventType,
}: ControlListButtonProps) {
    function controlHandler() {
        handler({
            type: eventType,
        });
    }

    return (
        <div className="button-container toolbar-subitem">
            <button onClick={controlHandler}>{name}</button>
            <span className="key-hint">[{keyHint}]</span>
        </div>
    );
}

interface ControlListColorPickerProps {
    handler: (event: ControlEvent) => void;
    initialColor: vec4;
}

function ControlListColorPicker({
    handler,
    initialColor,
}: ControlListColorPickerProps) {
    const [colorPickerVisible, setColorPickerVisible] =
        useState<boolean>(false);

    const [color, setColor] = useState<RgbaColor>({
        r: initialColor[0] * 255,
        g: initialColor[1] * 255,
        b: initialColor[2] * 255,
        a: initialColor[3],
    });

    return (
        <div className="toolbar-subitem color-picker-container">
            <div className="pane">
                <span>Grid Color</span>
                <div
                    className="color-preview"
                    style={{
                        backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
                    }}
                    onClick={() => {
                        setColorPickerVisible(!colorPickerVisible);
                    }}
                />
            </div>
            {colorPickerVisible ? (
                <RgbaColorPicker
                    className="color-picker"
                    color={color}
                    onChange={(color) => {
                        setColor(color);

                        handler({
                            type: "UpdateGridColor",
                            data: vec4.fromValues(
                                color.r / 255,
                                color.g / 255,
                                color.b / 255,
                                color.a
                            ),
                        });
                    }}
                />
            ) : (
                <></>
            )}
        </div>
    );
}

interface ControlListSliderProps {
    name: string;
    handler: (event: ControlEvent) => void;
    eventType: ControlEventType;

    // TODO: Don't hardcode these initial values
    initialValue: number;

    min: number;
    max: number;
}

function ControlListSlider({
    name,
    handler,
    eventType,
    min,
    max,
    initialValue,
}: ControlListSliderProps) {
    const maxGranularity = 10 ** 2;

    const [value, setValue] = useState<number>(
        (maxGranularity * (initialValue - min)) / (max - min)
    );

    useEffect(() => {
        console.log(value);
    }, [value]);

    return (
        <div className="toolbar-subitem slider">
            <span>{name}</span>
            <input
                type="range"
                min={0}
                max={maxGranularity}
                value={value}
                onInput={(event) => {
                    const val = parseFloat(event.currentTarget.value);

                    setValue(val);

                    handler({
                        type: eventType,
                        data: ((max - min) * val) / maxGranularity + min,
                    });
                }}
            />
        </div>
    );
}

function ControlList({
    controlHandler,
}: ControlListProps): [() => React.JSX.Element, () => React.JSX.Element] {
    return [
        () => <h2>Controls</h2>,
        () => (
            <>
                <ControlListButton
                    name="Center Viewport"
                    handler={controlHandler}
                    keyHint="e"
                    eventType="CenterViewport"
                />
                <ControlListButton
                    name="Center Objects"
                    keyHint="c"
                    handler={controlHandler}
                    eventType="CenterObjects"
                />
                <ControlListColorPicker
                    handler={controlHandler}
                    initialColor={vec4.fromValues(1.0, 1.0, 1.0, 1.0)}
                />
                <ControlListSlider
                    name="Grid Width"
                    handler={controlHandler}
                    eventType="UpdateGridWidth"
                    min={0.02}
                    max={0.1}
                    initialValue={0.04}
                />
                <ControlListButton
                    name="Print Editor"
                    keyHint=""
                    handler={controlHandler}
                    eventType="PrintEditor"
                />
            </>
        ),
    ];
}

function initialiseControlList(
    controlHandler: (event: ControlEvent) => void
): [ControlListData, [() => React.JSX.Element, () => React.JSX.Element]] {
    return [{}, ControlList({ controlHandler })];
}

export { type ControlListData, type ControlEvent, initialiseControlList };
