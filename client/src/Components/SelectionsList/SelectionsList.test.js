import React from "react";
import { SelectionsList } from "./SelectionsList";
import { mount } from "enzyme";
import { fromJS } from "immutable";
import sinon from "sinon";

// setup function
const setup = (
    selections,
    filterString = "",
    selectionToggle = () => {},
    selectionEmphasisToggle = () => {},
    selectionReorder = () => {},
    selectionRecolor = () => {},
    selectionRename = () => {},
    selectionRemove = () => {}
) => {
    // defaults
    selections =
        selections ||
        fromJS([
            {
                color: "#FF4500",
                mask: [],
                name: "Brush",
                visible: true,
                emphasize: false
            },
            {
                color: "#FF4500",
                mask: [],
                name: "sel1",
                visible: true,
                emphasize: false
            }
        ]);

    // have to fully mount to test through the sortable + context menu containers
    return mount(
        <SelectionsList
            selections={selections}
            filterString={filterString}
            onOffAll={"all"}
            selectionToggle={selectionToggle}
            selectionEmphasisToggle={selectionEmphasisToggle}
            selectionReorder={selectionReorder}
            selectionRecolor={selectionRecolor}
            selectionRename={selectionRename}
            selectionRemove={selectionRemove}
        />
    );
};

describe("<SelectionsList/>", () => {
    it("renders without crashing", () => {
        setup();
    });

    it("should render a list of selections", () => {
        const wrapper = setup(undefined);

        expect(wrapper.find("li")).toHaveLength(2);
        expect(
            wrapper
                .find("li")
                .first()
                .text()
        ).toEqual("Brush");
        expect(
            wrapper
                .find("li")
                .last()
                .text()
        ).toEqual("sel1");
        // there should be a selected class on the first element
        expect(
            wrapper
                .find("li")
                .first()
                .prop("className")
        ).toMatch(/selected/);
    });
    it("should handle selecting a selection", () => {
        const selectionToggle = sinon.fake();
        const wrapper = setup(undefined, undefined, selectionToggle);

        expect(selectionToggle.callCount).toEqual(0);

        wrapper
            .find("li")
            .last()
            .find(".SelectionsList__checkbox")
            .simulate("click");

        expect(selectionToggle.callCount).toEqual(1);
        expect(selectionToggle.args[0][0]).toEqual(1);
    });
    it("should filter based on the filterString prop", () => {
        const wrapper = setup(undefined, "Brush");
        expect(wrapper.find("li")).toHaveLength(1);
    });

    it("shouldn't render anything if the filter doesn't match", () => {
        const wrapper = setup(undefined, "zzzz");
        expect(wrapper.find("li")).toHaveLength(0);
    });
});
