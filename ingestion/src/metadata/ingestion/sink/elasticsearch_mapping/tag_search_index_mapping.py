import textwrap

TAG_ELASTICSEARCH_INDEX_MAPPING = textwrap.dedent(
    """
    {
  "settings": {
    "analysis": {
      "normalizer": {
        "lowercase_normalizer": {
          "type": "custom",
          "char_filter": [],
          "filter": [
            "lowercase"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": {
        "type": "text"
      },
      "name": {
        "type": "text"
      },
      "fullyQualifiedName": {
        "type": "keyword",
        "normalizer": "lowercase_normalizer"
      },
      "description": {
        "type": "text"
      },
      "version": {
        "type": "float"
      },
      "updatedAt": {
        "type": "date",
        "format": "epoch_second"
      },
      "updatedBy": {
        "type": "text"
      },
      "href": {
        "type": "text"
      },
      "deleted": {
        "type": "boolean"
      },
       "deprecated": {
        "type": "boolean"
      },
      "suggest": {
        "type": "completion"
      }
    }
  }
}
    """
)
