import React from "react";
import ReactDOM from "react-dom";
import SparklineRange from "./SparklineRange";
import { shallow, mount } from "enzyme";

describe("<SparklineRange/>", () => {
    const randline = Array.apply(null, Array(7)).map(() => Math.random());

    it("renders without crashing", () => {
        const div = document.createElement("div");
        ReactDOM.render(<SparklineRange data={randline} min={0} max={100} />, div);
    });

    it("renders a sparkline + input", () => {
        const wrapper = mount(<SparklineRange data={randline} min={0} max={100} />);

        expect(wrapper.find("div.SparklineRange").children()).toHaveLength(2);
        expect(wrapper.find('input[type="range"]')).toHaveLength(1);
        expect(wrapper.find("Sparkline")).toHaveLength(1);
    });

    it("updates the slider", () => {
        const wrapper = shallow(<SparklineRange data={randline} min={0} max={100} />);

        wrapper.find('input[type="range"]').simulate("change", { target: { value: 25 } });
        expect(wrapper.state("rangeval")).toBe(25);
    });
});
