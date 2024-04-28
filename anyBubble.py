from flask import Flask, request, render_template, jsonify, session
from waitress import serve
from werkzeug.utils import secure_filename
import pandas as pd
import os
import json
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_extraction import text
from collections import defaultdict, Counter
from itertools import combinations


app = Flask(__name__)
app.secret_key = 'a_very_simple_secret_key'

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('anyHTML.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    if file:
        filename = os.path.join(app.config['UPLOAD_FOLDER'], 'uploaded_data.csv')
        file.save(filename)
        df = pd.read_csv(filename)

        # Determine which columns are categorical
        categorical_threshold = 0.05
        potential_categorical = [col for col in df.columns if df[col].nunique() / len(df) < categorical_threshold]
        numerical_columns = df.select_dtypes(include='number').columns.tolist()
        categorical_columns = list(set(potential_categorical + numerical_columns))

        # Calculate frequencies 
        frequencies = {}
        for col in categorical_columns:
            frequency = df[col].value_counts().reset_index()
            frequency.columns = ['keyword', 'frequency']
            frequencies[col] = frequency.to_dict(orient='records')

        # Save frequencies to a JSON file
        with open(os.path.join(app.config['UPLOAD_FOLDER'], 'frequencies.json'), 'w') as f:
            json.dump(frequencies, f)

        return jsonify(categorical_columns)
    
@app.route('/get-data', methods=['POST'])
def get_data():
    data = request.get_json()
    selected_column = data['column']
    
    freq_file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'frequencies.json')
    if os.path.exists(freq_file_path):
        with open(freq_file_path, 'r') as f:
            frequencies = json.load(f)
            return jsonify(frequencies.get(selected_column, []))
    else:
        return jsonify(error="Frequency data not found"), 404


@app.route('/get-frequencies', methods=['GET'])
def get_frequencies():
    try:
        with open(os.path.join(app.config['UPLOAD_FOLDER'], 'frequencies.json'), 'r') as f:
            frequencies = json.load(f)
        return jsonify(frequencies)
    except FileNotFoundError:
        return jsonify(error="Frequency data not found"), 404
    
@app.route('/view-frequencies')
def view_frequencies():
    freq_file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'frequencies.json')
    if os.path.isfile(freq_file_path):
        with open(freq_file_path, 'r') as file:
            frequencies = json.load(file)
            return jsonify(frequencies)
    else:
        return 'Frequency data not found', 404

@app.route('/view-json')
def view_json():
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'uploaded_data.json')
    if os.path.isfile(file_path):
        with open(file_path, 'r') as file:
            content = file.read()
            return '<pre>' + content + '</pre>'
    else:
        return 'File not found', 404
    
@app.route('/upload_network', methods=['POST'])
def upload_network():
    file = request.files['file']
    if file:
        filename = os.path.join(app.config['UPLOAD_FOLDER'], 'uploaded_network_data.csv')
        file.save(filename)
        session['uploaded_file_name'] = filename  


        df = pd.read_csv(filename)

        categorical_threshold = 0.05
        potential_categorical = [col for col in df.columns if df[col].nunique() / len(df) < categorical_threshold]

        # Identify numerical columns
        numerical_columns = df.select_dtypes(include='number').columns.tolist()

        # Combine to get all categorical columns
        categorical_columns = list(set(potential_categorical + numerical_columns))

        # Identify non-categorical columns
        non_categorical_columns = [col for col in df.columns if col not in categorical_columns]

        return jsonify(non_categorical_columns)



@app.route('/create_network', methods=['POST'])
def create_network():
    data = request.get_json()
    if not data or 'column' not in data:
        return jsonify({'error': 'No column provided'}), 400

    column_name = data['column']

    if 'uploaded_file_name' in session:
        filename = session['uploaded_file_name']
        if os.path.exists(filename):
            df = pd.read_csv(filename)
            if column_name in df.columns:
                # Extract text data for processing
                text_data = df[column_name].dropna().astype(str).tolist()
                
                network_data = network_data_generation(text_data)
                
                return jsonify(network_data)
            else:
                return jsonify({'error': f'Column {column_name} not found in the file.'}), 404
        else:
            return jsonify({'error': 'File not found.'}), 404
    else:
        return jsonify({'error': 'No uploaded file found in session.'}), 400
    
def network_data_generation(text_data):
    nlp = spacy.load("en_core_web_sm")

    # Function to filter out proper nouns
    def filter_proper_nouns(text):
        doc = nlp(text)
        return ' '.join([token.text for token in doc if token.pos_ != 'PROPN'])

    # Apply the function to filter out proper nouns from the descriptions
    filtered_descriptions = [filter_proper_nouns(description) for description in text_data]

    # Convert the frozenset of stop words to a list
    stop_words = list(text.ENGLISH_STOP_WORDS)

    # Tokenize the dataset and remove stop words
    tfidf_vectorizer = TfidfVectorizer(stop_words=stop_words, use_idf=True)
    tfidf_matrix = tfidf_vectorizer.fit_transform(filtered_descriptions)

    # Get feature names to use as node IDs
    feature_names = tfidf_vectorizer.get_feature_names_out()

    # Create a mask to identify the top N words per description
    top_n = 10
    sorted_indices = tfidf_matrix.toarray().argsort(axis=1)[:, -top_n:]

    # Create a list of sets to hold the unique words per description
    unique_words_per_description = [set() for _ in range(tfidf_matrix.shape[0])]

    # Gather the unique words per description
    for row_index, indices in enumerate(sorted_indices):
        for col_index in indices:
            unique_words_per_description[row_index].add(feature_names[col_index])

    # Flatten the list and get the total frequency of occurrence
    flattened_unique_words = [word for words in unique_words_per_description for word in words]
    word_freq = defaultdict(int)
    for word in flattened_unique_words:
        word_freq[word] += 1

    # Generate nodes with frequency as the word occurrence across all descriptions
    nodes = [{'id': word, 'frequency': freq} for word, freq in word_freq.items() if freq > 1]  # Filter out infrequent words

    # Define a context window size for co-occurrence
    context_window_size = 5

    def generate_links(tokens):
        links = Counter()
        for i in range(len(tokens)):
            start = max(0, i - context_window_size)
            end = min(len(tokens), i + context_window_size + 1)
            for a, b in combinations(tokens[start:end], 2):
                if a != b and a in word_freq and b in word_freq:
                    links[tuple(sorted([a, b]))] += 1
        return links

    all_links = Counter()
    tokens_per_description = [tfidf_vectorizer.build_tokenizer()(text.lower()) for text in filtered_descriptions]
    for tokens in tokens_per_description:
        all_links.update(generate_links(tokens))

    # Generate the final list of links
    links = [{'source': source, 'target': target, 'weight': weight} for (source, target), weight in all_links.items() if weight > 1]

    # Construct the final network data
    network_data = {
        'nodes': nodes,
        'links': links
    }

    valid_node_ids = {node['id'] for node in nodes}

    # Filter the links to include only those where both nodes exist in the nodes list
    valid_links = [link for link in links if link['source'] in valid_node_ids and link['target'] in valid_node_ids]


    connected_node_ids = set()
    for link in valid_links:
        connected_node_ids.add(link['source'])
        connected_node_ids.add(link['target'])


    nodes_with_links = [node for node in nodes if node['id'] in connected_node_ids]

    # Construct the final network data with the validated nodes and links
    network_data = {
        'nodes': nodes_with_links,
        'links': valid_links
    }

    # Sort the nodes by frequency, descending, and take the top 100
    top_nodes = sorted(nodes, key=lambda x: x['frequency'], reverse=True)[:20]

    # Now create a set of valid node IDs based on the top 100 nodes
    valid_node_ids = {node['id'] for node in top_nodes}

    # Filter the links to include only those where both nodes exist in the top 100 nodes list
    valid_links = [link for link in links if link['source'] in valid_node_ids and link['target'] in valid_node_ids]

    connected_node_ids = set()
    for link in valid_links:
        connected_node_ids.add(link['source'])
        connected_node_ids.add(link['target'])

    # Now, re-filter the top nodes to include only those that have connections
    nodes_with_links = [node for node in top_nodes if node['id'] in connected_node_ids]

    # Construct the final network data with the validated nodes and links
    network_data = {
        'nodes': nodes_with_links,
        'links': valid_links
    }
    #print(network_data)
    return network_data

if __name__ == "__main__":
    serve(app, host="0.0.0.0", port=8000)
