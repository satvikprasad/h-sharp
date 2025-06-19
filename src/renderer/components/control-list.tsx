import React from "react";

import "@styles/control-list.css";

type ControlHandler = () => void;

interface ControlListData {}

interface ControlListProps {
    centerViewportHandler: ControlHandler;
    centerObjectsHandler: ControlHandler;
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

function ControlList({
    centerViewportHandler,
    centerObjectsHandler,
}: ControlListProps) {
    return (
        <ul className="toolbar-item control-list">
            <div className="header">
                <h2>Controls</h2>
            </div>
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
        </ul>
    );
}

function initialiseControlList(
    centerViewportHandler: ControlHandler,
    centerObjectsHandler: ControlHandler
): [ControlListData, React.JSX.Element] {
    return [
        {},
        <ControlList
            centerViewportHandler={centerViewportHandler}
            centerObjectsHandler={centerObjectsHandler}
        />,
    ];
}

export { type ControlListData, initialiseControlList };
