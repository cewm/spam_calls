from flask import Flask, jsonify, request, url_for, render_template
import flask_conf
import model_interactions

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('home.html')

@app.route('/get-prediction',methods=['POST'])
def get_prediction():

    error = None
    if request.method == 'POST':

        # define model interface object. Should probably switch this to be cached
        model_interface = model_interactions.ModelInterface(
            model_path=flask_conf.model_path,
            train_set_path=flask_conf.train_set_path,
            input_cols=flask_conf.input_cols,
            classes=flask_conf.classes,
            cat_map_path=flask_conf.cat_map_path,
            categorical_features=flask_conf.categorical_features
            ) 
        
        # get prediction dict
        pred_dict = model_interface.get_prediction(input_params=request.form)

        # return dict as JSON if worked, else error message
        if 'error' in pred_dict:
            error = pred_dict
            pred_dict = {}
            return error
        else:
            return jsonify(pred_dict)
@app.route('/prediction')
def prediction():
    return render_template('prediction.html')

@app.route('/exploration')
def exploration():
    return render_template('exploration.html') 
