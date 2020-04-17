import React from "react";

import { WindowError } from "./WindowCenter";

class WindowErrorBoundary extends React.Component {
    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }

    componentDidCatch(error, info) {
        // You can also log the error to an error reporting service
        //logErrorToMyService(error, info);

        console.error(error, info);
        this.setState({ info });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            if (this.props.verbose) {
                let errorString = this.state.error.toString();
                if (this.state.info === null) {
                    errorString += "\n" + this.state.error.stack.toString();
                } else {
                    errorString += "\n" + this.state.info.componentStack.toString();
                }
                return (
                    <pre>
                        <code>{errorString}</code>
                    </pre>
                );
            }
            return <WindowError> Something went wrong! </WindowError>;
        }

        return this.props.children;
    }
}

export default WindowErrorBoundary;
