import pickle
from lime.lime_tabular import LimeTabularExplainer
import numpy as np

class ModelInterface(object):

    def __init__(self, model_path, train_set_path, input_cols, classes, cat_map_path, categorical_features):
        
        # initialize model
        self._define_model(model_path)
        self._define_input_cols(input_cols)
        self._define_train_set(train_set_path)
        self._define_classes(classes)
        self._define_cat_mappers(cat_map_path, categorical_features)
        self._define_explainer()

    def _define_model(self, model_path):
        # load pickled model
        with open(model_path,'rb') as f:
            self.model = pickle.load(f)

    def _define_train_set(self, train_set_path):
        # load pickled train set
        with open(train_set_path,'rb') as f:
            self.train_set = pickle.load(f).values
                
    def _define_input_cols(self, input_cols):
        # set ordered input columns
        self.input_cols = input_cols

    def _define_cat_mappers(self, mapper_path, categorical_features):
        # define categorical mapper dictionary
        with open(mapper_path, 'rb') as f:
            cat_val_dict = pickle.load(f)
        self.categorical_features = []
        self.cat_mappers = {}
        self.cat_names = {}
        for key in categorical_features:
            self.cat_mappers[key] =  {k:v for v,k in enumerate(cat_val_dict[key])}
        for i, el in enumerate(self.input_cols):
            if el in categorical_features:
                self.cat_names[i] = cat_val_dict[el]
                self.categorical_features.append(i)
    def _define_classes(self, classes):
        # set prediction class names
        self.prediction_classes = classes

    def _define_explainer(self):
        # define explainer
        self.explainer = LimeTabularExplainer(
            training_data=self.train_set,
            feature_names=self.input_cols,
            class_names=self.prediction_classes,
            categorical_features=self.categorical_features,
            categorical_names=self.cat_names,
            discretize_continuous=True
                )

    def get_prediction(self, input_params):
        type_dict = {'time':int,
                     'day_of_week':float,
                     'source_area_code':str,
                     'recipient_area_code':float,
                     'month':float,
                     'day':float}
        # build prediction list in correct order
        predict_arr = []
        for k in self.input_cols:
            if k in input_params.keys():
                if k in self.cat_mappers.keys(): 
                    # convert type
                    label_to_lookup = input_params[k]
                    label_to_lookup = type_dict[k](label_to_lookup)
                    predict_arr.append(np.int(self.cat_mappers[k][label_to_lookup]))
                else:
                    predict_arr.append(type_dict[k](input_params[k]))

            else:
                print(input_params)
                return f'Error: Missing column {k} for prediction.'
        
        # wrap prediction in list since only doing a single prediction
        predict_arr = np.array(predict_arr)

        # create explanation of instance
        explanation = self.explainer.explain_instance(predict_arr, self.model.predict_proba, top_labels=len(self.prediction_classes)) 

        # get prediction probabilities for each class
        predict_probs = explanation.predict_proba.tolist()
        predictions = {k:v for k,v in zip(self.prediction_classes,predict_probs)}

        # get top explanation for instance
        explanation = {k:v for (k,v) in explanation.as_list(label=explanation.top_labels[0])}
        
        # format as dictionary
        pred_dict = {'predictions':predictions,
                     'explanation':explanation}
        return pred_dict