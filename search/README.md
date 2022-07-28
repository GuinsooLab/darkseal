# Darkseal Search Service

Darkseal Search service serves a Restful API and is responsible for searching metadata. The service leverages [Elasticsearch](https://www.elastic.co/products/elasticsearch "Elasticsearch") for most of it's search capabilites.

By default, it creates in total 3 indexes:
* table_search_index
* user_search_index
* dashboard_search_index
* feature_search_index

For information about Amundsen and our other services, refer to this [README.md](./../README.md). 

## Requirements

- Python >= 3.6
- elasticsearch 6.x (currently it doesn't support 7.x)
