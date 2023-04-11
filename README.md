# Subgraph Status App

This RESTful application will return the status of every subgraph on the graph network. The hosted service, cronos hosted service, and the decentralized network are all supported.

## Endpoints

### `GET` `/status`

This GET endpoint will return the [deployment.json](https://github.com/messari/subgraphs/blob/master/deployment/deployment.json) file from [messari/subgraphs](https://github.com/messari/subgraphs) augmented with the status of each deployed subgraph.

**Request Headers**

The following are the custom headers that can be added to the GET request:

- `only-prod` (optional): defaults to `true` which will return the status of only `prod` subgraphs. `false` will return the status of all subgraphs.
- `graph-api-key` (optional): defaults to `null`. If an invalid key is provided the request will fail. If a valid key is provided it will be used to query the graph network for the status of subgraphs deployed to the decentralized network.

> Note: if you provide a valid api key it will use the $GRT associated with that key to query the graph network.

**Response Codes**

- `200`: successful request
- `400`: invalid request (error executing request)
- `401`: invalid api key (error querying graph network)

**Example Response**

```json
{
       "compound-v2": {
        "schema": "lending",
        "base": "compound-forks",
        "protocol": "compound-v2",
        "project": "compound",
        "deployments": {
            "compound-v2-ethereum": {
                "network": "ethereum",
                "status": "prod",
                "versions": {
                    "schema": "2.0.1",
                    "subgraph": "1.8.0",
                    "methodology": "1.0.0"
                },
                "files": {
                    "template": "compound-v2.template.yaml"
                },
                "options": {
                    "prepare:yaml": true,
                    "prepare:constants": false
                },
                "services": {
                    "hosted-service": {
                        "slug": "compound-v2-ethereum",
                        "query-id": "compound-v2-ethereum",
                        "status": [
                            {
                                "version": "2.0.0",
                                "synced": true,
                                "isHealthy": true,
                                "errorMsg": null
                            },
                            {
                                "version": "2.0.1",
                                "synced": false,
                                "isHealthy": true,
                                "errorMsg": null
                            }
                        ]
                    },
                    "decentralized-network": {
                        "slug": "compound-v2-ethereum",
                        "query-id": "6tGbL7WBx287EZwGUvvcQdL6m67JGMJrma3JSTtt5SV7",
                        "status": [
                            {
                                "version": "2.0.0",
                                "synced": true,
                                "isHealthy": true,
                                "errorMsg": null
                            }
                        ]
                    }
                }
            }
        }
    }
}
```

### Not Implemented

The following features are not implemented yet:

- Status from subgraphs on the `cronos` hosted service
