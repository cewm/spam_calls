
# configuration

# path to pickled model
model_path='../data/classifierPickle'

# path to pickled training set
train_set_path='../data/train.p'

# feature columns in dataset 
input_cols=['time','source_area_code','day','month','day_of_week','recipient_area_code']

# output class names (should be in order of class label)
classes=['Autodialed Live Voice Call', 'Live Voice', 'Abandoned Calls',
       'Prerecorded Voice', 'Text Message', 'Email']

categorical_features=['source_area_code','day_of_week','recipient_area_code']
cat_map_path = '../data/oneHotEncodedCategoriesPickle'