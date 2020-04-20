import { useRef, useEffect, useState } from "react";

// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
export function useInterval(callback, delay) {
    const savedCallback = useRef();

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

export function useTimeout(callback, delay) {
    const savedCallback = useRef();

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setTimeout(tick, delay);
            return () => clearTimeout(id);
        }
    }, [delay]);
}

export function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

//https://dev.to/spaciecat/keyboard-input-with-react-hooks-3dkm
// Modified to handle meta-key presses
export function useKey(key, options = {}) {
    const [pressed, setPressed] = useState(false);

    function match(event) {
        return key.toLowerCase() == event.key.toLowerCase();
    }

    function onDown(event) {
        if (!match(event)) return setPressed(false);
        if (options.preventDefault) event.preventDefault();
        if (!options.withMeta) return setPressed(true);
        if (event.metaKey) {
            if (!options.disabled) event.preventDefault();
            setPressed(true);
        }
    }

    function onUp(event) {
        if (match(event)) {
            if (options.preventDefault) event.preventDefault();
            return setPressed(false);
        }
    }

    // Bind and unbind events
    useEffect(() => {
        window.addEventListener("keydown", onDown);
        window.addEventListener("keyup", onUp);
        return () => {
            window.removeEventListener("keydown", onDown);
            window.removeEventListener("keyup", onUp);
        };
    }, [key, options]);

    return pressed;
}
