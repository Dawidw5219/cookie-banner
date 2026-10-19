import { render } from "preact";
import { App } from "./app";
import "./index.css";

const root = document.getElementById("cookie-banner-admin");
if (root) {
	render(<App />, root);
}
