const axios = require("axios");
const Dev = require("../models/Dev");
const parseStringAsArray = require("../utils/ParseStringAsArray");
const { findConnections, sendMessage } = require("../websocket");
//index, show, store, update, destroy

module.exports = {
  async index(req, res) {
    const devs = await Dev.find();

    return res.json(devs);
  },

  async store(req, res) {
    const { github_username, techs, latitude, longitude } = req.body;

    let dev = await Dev.findOne({ github_username });

    if (!dev) {
      const apiResponse = await axios.get(
        `https://api.github.com/users/${github_username}`
      );

      const { name = login, avatar_url, bio } = apiResponse.data;

      const techsArrays = parseStringAsArray(techs);

      const location = {
        type: "Point",
        coordinates: [longitude, latitude]
      };

      dev = await Dev.create({
        github_username,
        name,
        avatar_url,
        bio,
        techs: techsArrays,
        location
      });
      //Filtrar as conexoes que estao ha no maximo 10km de distancia
      // e que o novo dev tenha pelo menos uma das techs filtradas

      const sendSocketMessageTo = findConnections(
        { latitude, longitude },
        techsArrays
      );
      sendMessage(sendSocketMessageTo, "new-dev", dev);
    }

    return res.json(dev);
  }
};
