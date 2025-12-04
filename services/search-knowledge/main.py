from fastapi import FastAPI, Query
from search_engine import search_documents
from embedding_generator import generate_embedding

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "Service is running"}

@app.get("/search/global")
def global_search(query: str = Query(..., description="Search query")):
    """Perform a global search."""
    results = search_documents("global-index", query)
    return results

@app.get("/search/scoped")
def scoped_search(module: str, query: str):
    """Perform a scoped search within a specific module."""
    index_name = f"{module}-index"
    results = search_documents(index_name, query)
    return results

@app.post("/search/semantic")
def semantic_search(query: str):
    """Perform a semantic search using embeddings."""
    embedding = generate_embedding(query)
    # Placeholder for vector search logic
    return {"query": query, "embedding": embedding}

@app.get("/search/suggestions")
def knowledge_suggestions():
    """Provide knowledge article suggestions."""
    # Placeholder for suggestion logic
    return {"suggestions": []}