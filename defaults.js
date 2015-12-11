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
      description: "Requires a specific key to authenticate. The key is passed as a parameter in the URL."
    },
    oauth:{
      name: "OAuth",
      description: "Requires a Client ID and Client Secret to generate an access token for authentication."
    }
  },
  paging_methods: {
    none:{
      name: "None",
      description: "No paging required or available."
    },
    pages:{
      name: "Pages",
      description: "Pages are called explicitly using a URL parameter. The downloaded data should contain a property for the total number of pages available."
    },
    offset_limit:{
      name: "Offset/Limit",
      description: "Pages are created virtually by specifying a start position and the number of records to download."
    },
    url:{
      name: "Supplied URL",
      description: "A URL is provided in the downloaded data that can be used for downloading the next page."
    }
  },
  sense_data_types:{
    string: {
      name: "String"
    },
    boolean: {
      name: "Boolean"
    },
    integer: {
      name: "Integer"
    },
    real: {
      name: "Real"
    }
  },
  autodetect_requirements:{
    none: [],
    basic: [],
    api_key: [
      {
        path: "auth_options.api_key_parameter",
        label: "API Key Url Parameter"
      }
    ],
    oauth: [
      {
        path: "auth_options.oauth_authorize_url",
        label: "OAuth Authorize Url"
      },
      {
        path: "auth_options.oauth_token_url",
        label: "OAuth Token Url"
      }
    ]
  }
}
