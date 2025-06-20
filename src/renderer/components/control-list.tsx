import React, { useState } from "react";

import "@styles/control-list.css";
import { RgbaColor, RgbaColorPicker } from "react-colorful";
import { vec4 } from "gl-matrix";

type ControlHandler = () => void;

interface ControlListData {}

interface ControlListProps {
    centerViewportHandler: ControlHandler;
    centerObjectsHandler: ControlHandler;
    updateGridColorHandler: (newColor: vec4) => void;
}

interface ControlListButtonProps {
    name: string;
    keyHint: string;
    handler: ControlHandler;
}

function ControlListButton({ name, keyHint, handler }: ControlListButtonProps) {
    return (
        <div className="button-container toolbar-subitem">
            <button onClick={handler}>{name}</button>
            <span className="key-hint">[{keyHint}]</span>
        </div>
    );
}

interface ControlListColorPickerProps {
    onChange: (newColor: vec4) => void;

    initialColor: vec4;
}

function ControlListColorPicker({
    onChange,
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

                        onChange(
                            vec4.fromValues(
                                color.r / 255,
                                color.g / 255,
                                color.b / 255,
                                color.a
                            )
                        );
                    }}
                />
            ) : (
                <></>
            )}
        </div>
    );
}

function ControlList({
    centerViewportHandler,
    centerObjectsHandler,
    updateGridColorHandler,
}: ControlListProps): [() => React.JSX.Element, () => React.JSX.Element] {
    return [
        () => <h2>Controls</h2>,
        () => (
            <>
                <ControlListButton
                    name="Center Viewport"
                    handler={centerViewportHandler}
                    keyHint="e"
                />
                <ControlListButton
                    name="Center Objects"
                    keyHint="c"
                    handler={centerObjectsHandler}
                />
                <ControlListColorPicker
                    onChange={updateGridColorHandler}
                    initialColor={vec4.fromValues(1.0, 1.0, 1.0, 1.0)}
                />
            </>
        ),
    ];
}

function initialiseControlList(
    centerViewportHandler: ControlHandler,
    centerObjectsHandler: ControlHandler,
    updateGridColorHandler: (newColor: vec4) => void
): [ControlListData, [() => React.JSX.Element, () => React.JSX.Element]] {
    return [
        {},
        ControlList({
            centerViewportHandler,
            centerObjectsHandler,
            updateGridColorHandler,
        }),
    ];
}

export { type ControlListData, initialiseControlList };
