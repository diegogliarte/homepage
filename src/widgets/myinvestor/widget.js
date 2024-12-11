import myinvestorProxyHandler from "./proxy";

const widget = {
  api: `https://app.myinvestor.es/myinvestor-server/rest/{endpoint}`,
  proxyHandler: myinvestorProxyHandler,

  mappings: {
    resume: {
      endpoint: "protected/resume",
    },
  },
};

export default widget;
