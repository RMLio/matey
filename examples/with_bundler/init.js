const Matey = require("../..");
const matey = new Matey();

document.body.innerHTML = '<div id="test"></div>';

const config = {
  rmlMapperUrl: "http://172.23.43.193:4000/execute" // make sure an endpoint with this URL is active!
};

//for debug
window.matey = matey;

matey.init("test", config);


