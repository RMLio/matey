let Matey = require("../..");
let matey = new Matey();

document.body.innerHTML = '<div id="test"></div>';

let config = {
  rmlMapperUrl: "http://localhost:4000/execute" // make sure an endpoint with this URL is active!
};
matey.init("test", config);