import styled from "styled-components";
// @ts-ignore: unused variable
import {
    // @ts-ignore: unused variable
    HTMLAttributes,
    // @ts-ignore: unused variable
    ClassAttributes
} from "react";

import { Size } from "./domain";

export interface WrapperProps {
    isActive: boolean;
    minSize?: Size;
    hidden?: boolean;
}

export interface HeaderProps {
    isDraggable?: boolean;
    isActive?: boolean;
}

const theme = require("styles/theme.scss");

export const defaultWidth = 200;
export const defaultHeight = 200;
export const padding = 10;

const wrapperStyles = ({ isActive }: WrapperProps) => {
    if (isActive) {
        return `
      
    `;
    }

    return `opacity: 1;`;
};

export const Wrapper = styled.div`
    ${wrapperStyles}
    position: absolute;
    display: ${({ hidden }: WrapperProps) => (hidden ? `none` : `inline-flex`)};
    flex-direction: column;
    background: white;
    border-radius: 3px;
    box-shadow: rgba(0, 0, 0, 0.25) 0px 2px 5px, rgba(0, 0, 0, 0.1) 0px 1px 1px;
    min-width: ${({ minSize }: WrapperProps) => (minSize ? minSize.width : defaultWidth)}px
    min-height: ${({ minSize }: WrapperProps) => (minSize ? minSize.height : defaultHeight)}px
    user-select: none;
`;

export const Header = styled.div`
    height: 30px;
    min-height: 30px;
    border-bottom: 1px solid #ccc;
    cursor: ${({ isDraggable }: HeaderProps) => (isDraggable ? `-webkit-grab` : `default`)};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: ${padding}px;
    background-color: ${({ isActive }: HeaderProps) => (isActive ? theme.primaryBlue : `white`)};
    color: ${({ isActive }: HeaderProps) => (isActive ? `white` : `#181818`)};
`;

export const BottomRightResizeHandle = styled.div`
    width: 20px;
    height: 20px;
    position: absolute;
    bottom: 0;
    right: 0;
    cursor: nwse-resize;
`;

export const ContentWrapper = styled.div`
    padding: ${padding}px;
    height: 100%;
    padding-bottom: 30px;
`;

export const ButtonContainer = styled.div`
    display: flex;
`;

export const CloseIcon = styled.div`
    position: relative;
    width: 20px;
    height: 20px;
    opacity: 0.3;
    cursor: pointer;
    margin-left: 5px;

    &:hover {
        opacity: 1;
    }

    &:before,
    &:after {
        position: absolute;
        right: 15px;
        content: " ";
        height: 21px;
        width: 2px;
        background-color: #333;
    }

    &:before {
        transform: rotate(45deg);
    }

    &:after {
        transform: rotate(-45deg);
    }
`;

export const MinimizeIcon = styled.div`
    position: relative;
    width: 20px;
    height: 20px;
    opacity: 0.3;
    cursor: pointer;

    &:hover {
        opacity: 1;
    }

    &:before {
        position: absolute;
        right: 15px;
        content: " ";
        height: 21px;
        width: 2px;
        background-color: #333;
    }

    &:before {
        transform: rotate(90deg);
    }
`;

export const Title = styled.div`
    white-space: nowrap;
    max-width: calc(100% - 25px);
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const RightResizeHandle = styled.div`
    width: 20px;
    height: calc(100% - 50px);
    position: absolute;
    bottom: 20px;
    right: 0;
    cursor: ew-resize;
`;

export const BottomResizeHandle = styled.div`
    width: calc(100% - 40px);
    height: 20px;
    position: absolute;
    bottom: 0;
    left: 20px;
    cursor: ns-resize;
`;
