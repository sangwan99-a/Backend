from opensearchpy import OpenSearch

# Initialize OpenSearch client
client = OpenSearch(
    hosts=[{"host": "localhost", "port": 9200}],
    http_auth=("admin", "admin"),
    use_ssl=False,
    verify_certs=False
)

def create_index(index_name):
    """Create an OpenSearch index."""
    if not client.indices.exists(index=index_name):
        client.indices.create(index=index_name)
        print(f"Index '{index_name}' created.")

def tenant_index_name(tenant_id, base_index):
    """Generate a tenant-specific index name."""
    return f"{tenant_id}-{base_index}"

def index_document(index_name, document_id, document):
    """Index a document in OpenSearch."""
    client.index(index=index_name, id=document_id, body=document)
    print(f"Document {document_id} indexed in '{index_name}'.")

def index_document_for_tenant(tenant_id, base_index, document_id, document):
    """Index a document for a specific tenant."""
    index_name = tenant_index_name(tenant_id, base_index)
    index_document(index_name, document_id, document)

def search_documents(index_name, query):
    """Search documents in OpenSearch."""
    response = client.search(index=index_name, body={"query": {"match": {"content": query}}})
    return response

def search_documents_for_tenant(tenant_id, base_index, query):
    """Search documents for a specific tenant."""
    index_name = tenant_index_name(tenant_id, base_index)
    return search_documents(index_name, query)

def search_documents_with_optimization(index_name, query, filters=None, boost_fields=None):
    """
    Search documents with relevance optimization.
    - filters: Apply filters to narrow down results.
    - boost_fields: Boost specific fields for higher relevance.
    """
    search_body = {
        "query": {
            "bool": {
                "must": {
                    "match": {"content": query}
                },
                "filter": filters or []
            }
        },
        "sort": [
            {"_score": "desc"},
            {"timestamp": "desc"}  # Boost recency
        ]
    }

    if boost_fields:
        search_body["query"]["bool"]["must"] = {
            "multi_match": {
                "query": query,
                "fields": boost_fields,
                "type": "best_fields"
            }
        }

    response = client.search(index=index_name, body=search_body)
    return response

def search_documents_with_typo_tolerance(index_name, query, fuzziness="AUTO"):
    """
    Search documents with typo tolerance using fuzziness.
    """
    search_body = {
        "query": {
            "match": {
                "content": {
                    "query": query,
                    "fuzziness": fuzziness  # Allow typo tolerance
                }
            }
        }
    }
    response = client.search(index=index_name, body=search_body)
    return response