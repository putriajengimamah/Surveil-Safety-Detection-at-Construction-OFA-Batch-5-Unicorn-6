from flask import Flask, render_template, redirect, request
from process import preparation, generate_response

# download nltk
preparation()

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detection')
def detection():
    return render_template('detection.html')

# Start Chatbot
@app.route("/get")
def get_bot_response():
    user_input = str(request.args.get('msg'))
    result = generate_response(user_input)
    return result
# End Chatbot

if __name__ == '__main__':
    app.run(debug=True)