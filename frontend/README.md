# Darkseal Frontend Service

Darkseal is a metadata driven application for improving the productivity of data analysts, data scientists and 
engineers when interacting with data. It does that today by indexing data resources (tables, dashboards, streams, etc.) 
and powering a page-rank style search based on usage patterns (e.g. highly queried tables show up earlier than less 
queried tables). Think of it as Google search for data. 

The frontend service leverages a separate [search service](./../search) for allowing users to search for data resources, 
and a separate [metadata service](./../metadata) for viewing and editing metadata for a given resource. 
It is a Flask application with a React frontend.

For information about Amundsen and our other services, refer to this [README.md](./../README.md). Please also see our 
instructions for a [quick start](./../docs/installation.md#bootstrap-a-default-version-of-amundsen-using-docker) setup 
of Darkseal with dummy data, and an [overview of the architecture](./../docs/architecture.md#architecture).

