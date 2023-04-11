const axios = require("axios");

const protocolLevel = async (deployments) => {
  const endpointsList = [];
  Object.keys(deployments).forEach((key) => {
    const depo = deployments[key];
    if (!depo.indexingError) {
      endpointsList.push(depo.url);
    }
  });

  const baseQuery = `query MyQuery {
          protocols {
              schemaVersion
          }
      }`;

  const promiseArr = [];
  endpointsList.forEach((endpoint) => {
    promiseArr.push(
      axios.post(
        endpoint,
        { query: baseQuery },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
    );
  });
  const endpointToVersions = {};
  let protocolEntityData = [];
  await Promise.allSettled(promiseArr)
    .then(
      (response) =>
        (protocolEntityData = response.map((protocolData) => {
          if (!protocolData?.value) return null;
          return {
            data: protocolData?.value?.data?.data,
            url: protocolData?.value?.config?.url,
          };
        }))
    )
    .catch((err) => console.log("ERROR: " + err.message));
  protocolEntityData.forEach((deployment) => {
    if (!deployment?.url) return;
    if (!deployment?.data?.protocols[0]?.schemaVersion) return;

    endpointToVersions[deployment.url] =
      deployment?.data?.protocols[0]?.schemaVersion;
  });

  const deploymentsObjToReturn = {};
  Object.entries(deployments).forEach(([x, depoObj]) => {
    deploymentsObjToReturn[x] = { ...depoObj };
    deploymentsObjToReturn[x].version =
      endpointToVersions[deploymentsObjToReturn[x].url];
  });
  return deploymentsObjToReturn;
};

module.exports = {
  protocolLevel: protocolLevel,
};
