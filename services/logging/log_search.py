from fastapi import APIRouter, HTTPException
from elasticsearch import Elasticsearch

router = APIRouter()

# Elasticsearch setup
es = Elasticsearch(["http://localhost:9200"])

@router.get("/logs/search")
def search_logs(query: str, start_time: str = None, end_time: str = None):
    try:
        # Build Elasticsearch query
        es_query = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"message": query}}
                    ],
                    "filter": []
                }
            }
        }

        if start_time and end_time:
            es_query["query"]["bool"]["filter"].append({
                "range": {
                    "timestamp": {
                        "gte": start_time,
                        "lte": end_time
                    }
                }
            })

        # Execute search query
        response = es.search(index="logs", body=es_query)
        return {"hits": response["hits"]["hits"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search logs: {str(e)}")