import sys
from spacy.lang.en import English

def calculate_similarity(text1, text2):
    nlp = English()
    doc1 = nlp(text1)
    doc2 = nlp(text2)
    words1 = set([token.lemma_ for token in doc1])
    words2 = set([token.lemma_ for token in doc2])
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    return round((intersection / union) * 100, 2)

if __name__ == "__main__":
    resume_text = sys.argv[1]
    job_desc_text = sys.argv[2]
    similarity = calculate_similarity(resume_text, job_desc_text)
    print(similarity)
