const request = require("request-promise-any");
const baseURL = "https://nodes.wavesnodes.com/blocks"

const get = url => request({
    url: url,
    json: true,
    method: "GET"
})

module.exports = {
    getBlock: height => height != null ? get(baseURL + "/at/" + height) : get(baseURL + "/last"),
    getBlocksRange: (from, to) => get(baseURL + "/seq/" + from + "/" + to)
}