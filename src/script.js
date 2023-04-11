const axios = require("axios");
const indexingStatus = require("./indexing-status.js");
const protocol = require("./protocol.js");

// error message sent back from the graph if the api key is invalid
const API_ERROR_MESSAGE = "Invalid API key: Subscriptions not supported";

async function getStatusJson(onlyProd, graphApiKey = null) {
  if (graphApiKey) {
    // test api key to see if it exists
    const res = await indexingStatus.testDecNetworkApiKey(graphApiKey);
    if (!res || res.data.errors.message == API_ERROR_MESSAGE) {
      return { error: res.data.errors.message };
    }
  }

  let data = null;
  try {
    const result = await axios.get(
      "https://raw.githubusercontent.com/messari/subgraphs/master/deployment/deployment.json"
    );
    data = result.data;
  } catch (err) {
    return { error: err.message };
  }

  let deployments = {};
  let decentralizedDeployments = {};
  const protocolNames = [];

  const hostedServiceEndpoints = await indexingStatus.getHostedServiceEndpoints(data);

  Object.entries(hostedServiceEndpoints).forEach(([protocolType, protocolsOnType]) => {
    Object.entries(protocolsOnType).forEach(([protocolName, protocolObj]) => {
      Object.entries(protocolObj).forEach(async ([network, deploymentString]) => {
        const deploymentData = Object.values(data[protocolName]?.deployments)?.find(x => x.network === network);
        const status = deploymentData?.status || 'dev';
        if (!(onlyProd && deploymentData?.status === "dev")) {
          const versions = deploymentData?.versions || { "schema": "N/A", "subgraph": "N/A", "methodology": "N/A" };
          const nameStr =
            deploymentString.split("name/")[1];
          const deploymentsKey = nameStr.split("/")[1];
          if (!deploymentsKey) {
            return;
          }
          deployments[deploymentsKey] = {
            status: status,
            protocolName: protocolName,
            indexingError: null,
            indexedPercentage: 0,
            url: deploymentString,
            protocolType: protocolType,
            versions: versions,
            network: network,
            isDecen: false
          };

          if (!protocolNames.includes(protocolName)) {
            protocolNames.push(protocolName);
          }
              if (
                graphApiKey &&
                decenKeyToEndpoint[
                  hostedEndpointToDecenNetwork[deploymentString]
                ]
              ) {
                // get decentralized network status if an api key is provided
                const hostedEndpointToDecenNetwork =
                  await indexingStatus.generateDecenEndpoints(deployments);
                const decenKeyToEndpoint = await indexingStatus.queryDecentralizedIndex(
                  hostedEndpointToDecenNetwork,
                  graphApiKey
                );

                const decenObj =
                  decenKeyToEndpoint[
                    hostedEndpointToDecenNetwork[deploymentString]
                  ];
                decentralizedDeployments[deploymentsKey + "-decen"] = {
                  status: status,
                  protocolName: protocolName,
                  hash: decenObj.hash,
                  indexingErrorMessage: decenObj.indexingErrorMessage,
                  indexingError: decenObj.indexingErrorBlock,
                  indexedPercentage: decenObj.indexingPercentage || 0,
                  url: decenObj.endpoint,
                  protocolType: protocolType,
                  version: decenObj.version,
                  network: network,
                  isDecen: true,
                };
              }
            }
          }
        );
      });
    }
  );

  const indexStatusFlowDepos = await indexingStatus.indexStatusFlow(
    deployments
  );
  deployments = await protocol.protocolLevel(indexStatusFlowDepos);
  deployments = { ...deployments, ...decentralizedDeployments };

  // map through data
  const resultData = {};
  Object.keys(data).forEach((protocol) => {
    resultData[protocol] = {};
    const applicableDepos = Object.keys(deployments).filter((x) =>
      x.includes(protocol)
    );
    applicableDepos.forEach((depoObj) => {
      if (!resultData[protocol][deployments[depoObj].network]) {
        resultData[protocol][deployments[depoObj].network] = [];
      }
      const statusObj = {
        version: deployments[depoObj]?.version || "N/A",
        synced: deployments[depoObj]?.synced,
        isHealthy: !deployments[depoObj].indexingError,
        errorMsg: deployments[depoObj].indexingErrorMessage || null,
        isPending: deployments[depoObj]?.pending || false,
        isDecen: deployments[depoObj]?.isDecen || false,
      };
      resultData[protocol][deployments[depoObj].network].push(statusObj);
    });
  });

  const newDeployments = {};
  Object.keys(data).forEach((protocol) => {
    const current = data[protocol];
    Object.keys(current.deployments).forEach((depo) => {
      const devStatus = current.deployments[depo].status;
      if ((onlyProd && devStatus === "prod") || !onlyProd) {
        const network = current.deployments[depo].network;
        const statusObjects = resultData[protocol]?.[network];
        if (statusObjects?.length > 0) {
          const decenObjs = statusObjects.filter((x) => x.isDecen);
          const hostedObjs = statusObjects.filter((x) => !x.isDecen);

          current.deployments[depo].services["hosted-service"].status =
            hostedObjs.map((x) => {
              const obj = x;
              delete obj.isDecen;
              delete obj.isPending;
              return obj;
            });
          if (decenObjs.length > 0) {
            current.deployments[depo].services["decentralized-network"].status =
              decenObjs.map((x) => {
                const obj = x;
                delete obj.isDecen;
                delete obj.isPending;
                return obj;
              });
          }
        }
      } else {
        delete current.deployments[depo];
      }
    });
    newDeployments[protocol] = current;
  });

  return newDeployments;
}

module.exports = {
  getStatusJson: getStatusJson,
};
