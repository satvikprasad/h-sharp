import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import {
    initialiseInputList,
    InputList,
    InputListData,
    updateInputListDecibels,
    updateInputListSelectedItem,
} from "./input-list";

import "@styles/toolbar.css";

import * as audio from "../audio";
import { vec3, vec4 } from "gl-matrix";
import { ControlListData, initialiseControlList } from "./control-list";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

interface ToolbarData {
    inputListData: InputListData;
    controlListData: ControlListData;
}

function ToolbarItem({
    id,
    fragment,
}: {
    id: number;
    fragment: [() => React.JSX.Element, () => React.JSX.Element];
}): React.JSX.Element {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style = {
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : "",
        transition,
    };

    return (
        <ul
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="toolbar-item"
        >
            <div className="header">
                {fragment[0]()}
                <div className="dragger" {...listeners}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                        />
                    </svg>
                </div>
            </div>
            <div className="contents">{fragment[1]()}</div>
        </ul>
    );
}

function Toolbar({
    itemFragments,
}: {
    itemFragments: [() => React.JSX.Element, () => React.JSX.Element][];
}): React.JSX.Element {
    const [items, setItems] = useState(itemFragments.map((_, i) => i));

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over == null) {
            return;
        }

        if (active.id != over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id as number);
                const newIndex = items.indexOf(over.id as number);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items}
                strategy={verticalListSortingStrategy}
            >
                {items.map((id) => (
                    <ToolbarItem
                        key={id}
                        id={id}
                        fragment={itemFragments[id]}
                    />
                ))}
            </SortableContext>
        </DndContext>
    );
}

function initialiseToolbar(
    inputListParameters: {
        audioData: audio.AudioData;
        waveformPositions: vec3[];
    },
    controlListParameters: {
        centerViewportHandler: () => void;
        centerObjectsHandler: () => void;
        updateGridColorHandler: (newColor: vec4) => void;
    }
): ToolbarData {
    let toolbar = document.getElementById("toolbar");

    if (!toolbar) {
        throw Error("Could not find toolbar in DOM.");
    }

    const root = ReactDOM.createRoot(toolbar);

    const [inputListData, inputListFragment] = initialiseInputList(
        inputListParameters.audioData,
        inputListParameters.waveformPositions
    );

    const [controlListData, controlListFragment] = initialiseControlList(
        controlListParameters.centerViewportHandler,
        controlListParameters.centerObjectsHandler,
        controlListParameters.updateGridColorHandler
    );

    root.render(
        <Toolbar itemFragments={[controlListFragment, inputListFragment]} />
    );

    return {
        inputListData,
        controlListData,
    };
}

function updateToolbar(
    toolbarData: ToolbarData,
    inputListUpdateParameters: {
        audioData: audio.AudioData;
        decibels: number[];
        selectedWaveformIndex: number;
    }
) {
    updateInputListSelectedItem(
        toolbarData.inputListData,
        inputListUpdateParameters.audioData.inputs,
        inputListUpdateParameters.audioData.waveforms,
        inputListUpdateParameters.selectedWaveformIndex
    );

    updateInputListDecibels(
        toolbarData.inputListData,
        inputListUpdateParameters.decibels
    );
}

export { type ToolbarData, initialiseToolbar, updateToolbar };
