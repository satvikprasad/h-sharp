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
import { vec3 } from "gl-matrix";
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
    children,
}: { id: number } & React.PropsWithChildren): React.JSX.Element {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style = {
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : "",
        transition,
    };

    console.log(style);

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

function Toolbar({
    itemFragments,
}: {
    itemFragments: React.JSX.Element[];
}): React.JSX.Element {
    const [items, setItems] = useState(itemFragments.map((_, i) => i));

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {delay: 100, tolerance: 0},
        }),
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
                    <ToolbarItem key={id} id={id}>
                        {itemFragments[id]}
                    </ToolbarItem>
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
        controlListParameters.centerObjectsHandler
    );

    root.render(
        <Toolbar itemFragments={[controlListFragment, inputListFragment]}/>
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
