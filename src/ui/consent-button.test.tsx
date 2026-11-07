// @vitest-environment jsdom
import { render } from "preact";
import { afterEach, expect, it } from "vitest";
import { ConfigContext } from "../hooks/use-consent";
import { ConsentDecisionButton } from "./consent-button";
const root=document.createElement("div");
afterEach(()=>render(null,root));
it.each([undefined,"equal","standard"] as const)("shares button style %s across native and WordPress",buttonStyle=>{
 render(<ConfigContext.Provider value={{mode:"standalone",lang:"pl",buttonStyle}}><ConsentDecisionButton variant="outline" onClick={()=>{}}>Refuse</ConsentDecisionButton></ConfigContext.Provider>,root);
 expect(root.querySelector("button")?.className).toContain(buttonStyle==="standard"?"cb-decision-outline":"cb-decision-primary");
});
