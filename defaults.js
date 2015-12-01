module.exports = {
  icon: "/resources/dictionary.png",
  description: "A JSON dictionary definition for use with the Qlik Sense Alternative REST Connector",
  readme: "",
  auth_methods: {
    none:{
      name: "None",
      description: "No authentication required. If your RESTful source requires authentication you'll need to specify it in the general tab."
    },
    basic:{
      name: "Basic",
      description: "Requires a Username and Password to authenticate. These details are requested when you setup the connection in Qlik Sense."
    },
    api_key:{
      name: "API Key",
      description: "Requires a specific key to authenticate."
    },
    oauth:{
      name: "OAuth",
      description: "Requires a Client ID and Client Secret to generate an access token for authentication."
    }
  },
  paging_methods: {
    none:{
      name: "None",
      description: ""
    },
    pages:{
      name: "Pages",
      description: ""
    },
    offset_limit:{
      name: "Offset/Limit",
      description: ""
    },
    url:{
      name: "Supplied Url",
      description: ""
    }
  }
}
