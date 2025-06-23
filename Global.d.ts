import React from "react";

declare global {
    // Backwards compatability for @dnd-kit/sortable
    namespace JSX {
        type Element = React.JSX.Element;

        type IntrinsicElements = React.JSX.IntrinsicElements;
    }
}
