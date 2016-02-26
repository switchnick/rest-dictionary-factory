module.exports = {
  github:{
    clientId: "c76a047f72b844447747", //to allow users to login with their git creds
    secret: "831a8fa3baa8a273aa4addf005af84f1d6ec5948", //to allow users to login with their git creds
    token: "456dabd69ff9b7805aca5f78f92deed6f502c679" //1b20325b074263568e72572514c115e6f1a152e6" //for access from the connector itself
  },
  mongo: 'mongodb://principal:principal%@ds041404.mongolab.com:41404/heroku_s6fg7p6h',
  oauth:{
    redirect_uri: "http://localhost:4000/auth/oauth"
  }
}
