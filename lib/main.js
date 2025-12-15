import config from "../config.json" assert { type: "json" };
import Matey from "./matey";
const matey = new Matey();

document.body.innerHTML = '<div id="body-matey"></div>';

//for debug
window.matey = matey;

matey.init("body-matey", config);


