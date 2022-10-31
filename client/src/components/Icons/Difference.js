import React from "react";

function DifferenceIcon(props) {
    return (
        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" {...props}>
            <defs>
                <clipPath id="mask_left">
                    <circle cx="14" cy="8" r="8" fill="#E5E5E5" />
                </clipPath>
            </defs>
            <g>
                <circle id="circle_left" cx="8" cy="8" r="8" fill="#E5E5E5" />
                <circle id="circle_right" cx="14" cy="8" r="8" fill="#E5E5E5" />
                <circle
                    id="center"
                    cx="8"
                    cy="8"
                    r="8"
                    fill="#181818"
                    clip-path="url(#mask_left)"
                />
            </g>
        </svg>
    );
}

export default DifferenceIcon;
