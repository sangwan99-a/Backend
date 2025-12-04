from sentence_transformers import SentenceTransformer

# Initialize the NLP model
model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_embedding(text):
    """Generate an embedding for the given text."""
    embedding = model.encode(text)
    return embedding

# Example usage
if __name__ == "__main__":
    sample_text = "This is a sample document."
    embedding = generate_embedding(sample_text)
    print("Generated embedding:", embedding)