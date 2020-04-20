import React, { Component } from "react";
import "./LoadingBar.css";

class LoadingBar extends Component {
    constructor(props) {
        super(props);

        this.ref = null;

        this.percent = 0;
        this.isIndeterminate = false;
    }

    setLoadingPercent(p) {
        if (this.isIndeterminate) return;
        if (p === 0 || p === 100 || p - this.percent > 5) {
            this.percent = p;
            if (this.ref) {
                this.ref.style.width = this.percent + "%";
                this.ref.style.opacity = 1;
                if (this.percent === 100) {
                    setTimeout(() => {
                        this.ref.style.opacity = 0;
                    }, 1000);
                }
            }
        }
    }

    toggleIndeterminateLoading(on, message) {
        this.isIndeterminate = on;
        if (this.ref) {
            if (this.isIndeterminate) {
                this.ref.style.width = "100%";
                this.ref.style.opacity = 1;
                this.ref.className = "indeterminate";
            } else {
                this.ref.style.width = "0%";
                this.ref.style.opacity = 0;
                this.ref.className = "";
            }
        }
    }

    render() {
        return (
            <div className="LoadingBar">
                <div
                    id="loadingBar"
                    ref={r => {
                        this.ref = r;
                    }}
                />
            </div>
        );
    }
}

export default LoadingBar;
