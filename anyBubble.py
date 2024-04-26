from flask import Flask, request, render_template, jsonify
from waitress import serve
from werkzeug.utils import secure_filename
import pandas as pd
import os
import json


app = Flask(__name__)

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

        # Determine which columns are categorical or could be treated as categorical (like years)
        categorical_threshold = 0.05
        potential_categorical = [col for col in df.columns if df[col].nunique() / len(df) < categorical_threshold]
        numerical_columns = df.select_dtypes(include='number').columns.tolist()
        categorical_columns = list(set(potential_categorical + numerical_columns))

        # Calculate frequencies for categorical data including numerical categories like years
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
    
    # Ensure you are using the correct filename where the frequencies are stored
    freq_file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'frequencies.json')
    if os.path.exists(freq_file_path):
        with open(freq_file_path, 'r') as f:
            frequencies = json.load(f)
            # Return frequency data for the selected column
            return jsonify(frequencies.get(selected_column, []))
    else:
        return jsonify(error="Frequency data not found"), 404


@app.route('/get-frequencies', methods=['GET'])
def get_frequencies():
    # Load the frequency data from the JSON file
    try:
        with open(os.path.join(app.config['UPLOAD_FOLDER'], 'frequencies.json'), 'r') as f:
            frequencies = json.load(f)
        return jsonify(frequencies)
    except FileNotFoundError:
        return jsonify(error="Frequency data not found"), 404
    
@app.route('/view-frequencies')
def view_frequencies():
    # Load the frequency data from the JSON file
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

if __name__ == "__main__":
    serve(app, host="0.0.0.0", port=8000)
