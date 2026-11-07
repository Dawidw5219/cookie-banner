// @vitest-environment jsdom
import { render } from "preact";
import { afterEach, expect, it } from "vitest";
import { ConfigContext } from "../../src/hooks/use-consent";
import { ConsentDecisionButton } from "../../src/ui/consent-button";
const root=document.createElement("div");
afterEach(()=>render(null,root));
it.each([undefined,"equal","standard"] as const)("renders the refusal button for style %s",buttonStyle=>{
 render(<ConfigContext.Provider value={{mode:"standalone",lang:"pl",buttonStyle}}><ConsentDecisionButton variant="outline" onClick={()=>{}}>Refuse</ConsentDecisionButton></ConfigContext.Provider>,root);
 expect(root.querySelector("button")?.className).toContain(buttonStyle==="equal"?"cb-decision-primary":"cb-decision-outline");
});
