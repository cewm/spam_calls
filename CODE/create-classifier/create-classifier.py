#!/usr/bin/env python
# coding: utf-8

# Note: any column of the format XXX_int is used as a predictive feature
#   already converted to numeric values or one-hot encoded
# Any column of the format XXX_cat is used as a predictive feature
#   as categories (needs to be one-hot encoded)
#       Typically any <name>_cat will have a <name>_int representing
#       the column one-hot encoded
import pandas as pd
import numpy as np
from ast import literal_eval
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics  import confusion_matrix

import os
import re
import datetime
import math
import time
import pickle

## Preprocess Time of Issue to consistent format
def preprocessTime(s):
    if isinstance(s, float):
        return s
    s = re.sub(r'[^a-zA-Z\d:]', '', s.lower())
    condition = re.sub(r'[^:]*:[^\D]*', '', s)
    if 2 != len(condition):
        if 'a' in condition:
            s = re.match(r'[^:]*:[^\D]*', s).group(0)+'am'
        else:
            s = re.match(r'[^:]*:[^\D]*', s).group(0)+'pm'
    s = s[0:-2] + ":" + s[-2:]
    [hour, minute, am_or_pm] = s.split(":")
    hour = int(hour)
    minute = int(minute)
    second = 0
    is_pm = am_or_pm == "pm"
    if is_pm and hour < 12:
        hour += 12

    return datetime.time(hour=hour, minute=minute, second=second)

# Convert "mm/dd/yyyy" string to a datetime date object
def preprocess_date(x):
    try:
        return datetime.datetime.strptime(x, "%m/%d/%Y").date()
    except:
        return np.nan

# Convert "mm/dd/yyyy hh:mm:ss [AM][PM] +0000" to a datetime datetime object
def preprocess_date_time(x):
    [month, day, year] = x[0:10].split("/")
    [hour, minute, second] = x[11:19].split(":")
    is_pm = "PM" in x

    month = int(month)
    day = int(day)
    year = int(year)
    hour = int(hour)
    minute = int(minute)
    second = int(second)

    if is_pm and hour < 12:
        hour += 12

    return pd.to_datetime(datetime.datetime(hour=hour, minute=minute, second=second, month=month, day=day, year=year))

# Combines 'Time of Issue' and 'Date of Issue' columns into 'Date Time of Issue'
def combine_date_time_issue_columns(row):
    date = row['Date of Issue']
    time = row['Time of Issue']
    if True in map(pd.isnull, [date, time]):
        return np.nan

    return datetime.datetime.combine(date, time)

# Computes the difference between 'Ticket Created' and 'Date Time of Issue'
def compute_time_difference(row):
    ticket_created = row['Ticket Created']
    date_time_of_issue = row['Date Time of Issue']
    if True in map(pd.isnull, [ticket_created, date_time_of_issue]):
        return np.nan

    try:
        return max([ticket_created - ticket_created, ticket_created - date_time_of_issue])
    except:
        return np.nan

# Takes a datetime object and drops the date from it
def drop_date_from_datetime(datetime_object):
    if isinstance(datetime_object, datetime.datetime):
        return (datetime_object - datetime_object.replace(hour=0, minute=0, second=0)).seconds
    else:
        return datetime_object

# Create 'Date Time of Issue' as a python datetime object showing the date
#  and time of the occurrence
#
# Steps: Convert all time fields into datetime objects
#   Combine 'Time of Issue' and 'Date of Issue' into 'Date Time of Issue'
#   Compute the 'Issue Submission Delay' based on difference between 'Date Time of Issue'
#       and 'Ticket Created'
#   Fill in missing values for 'Issue Submission Delay' with the median
#   Fill in missing values for 'Date Time of Issue' based on difference between
#       'Ticket Created' and median of 'Issue Submission Delay'
def create_date_time_of_issue(df):
    df['Time of Issue'] = df['Time of Issue'].apply(preprocessTime)
    df['Date of Issue'] = df['Date of Issue'].apply(preprocess_date)
    df['Ticket Created'] = df['Ticket Created'].apply(preprocess_date_time)
    df['Date Time of Issue'] = df.apply(combine_date_time_issue_columns, axis=1)
    df['Issue Submission Delay'] = df.apply(compute_time_difference, axis=1)
    delay_median = df['Issue Submission Delay'].median()
    df['Issue Submission Delay'] = df['Issue Submission Delay'].fillna(delay_median)
    df['Date Time of Issue'] = df['Date Time of Issue'].fillna(df['Ticket Created'] - delay_median)
    return df

#Merge 'Caller ID Number' and 'Advertiser Business Number' columns into 1 (precedence to 'Caller ID Number')
def merge_phone_numbers(row):
    if not pd.isnull(row['Caller ID Number']):
        return row['Caller ID Number']
    elif not pd.isnull(row['Advertiser Business Number']):
        return row['Advertiser Business Number']
    else:
        return np.nan

#Converts a phone number to a string representation of its area code
#Assumes phone numbres in the format xxx-yyy-zzzz
def phone_number_to_area_code(phone_number):
    try:
        return str(phone_number[0:3])
    except:
        return None

#Factorizes the column in the dataframe with the given function
def factorize_column(df, column_name, factorized_name, f, one_hot):
    factorized_cat = factorized_name + '_cat'
    factorized_int = factorized_name + '_int'
    df[factorized_cat] = df[column_name].apply(f)
    if one_hot:
        df[factorized_int], categories = pd.factorize(df[factorized_cat])
        return (df, categories)
    else:
        #Need to fill NAs
        median_value = df[factorized_cat].median()
        df[factorized_cat] = df[factorized_cat].fillna(median_value)
        df[factorized_int] = df[factorized_cat]
        return (df, None)

#column_name, factorized_name, function
FACTORIZE_COLUMNS = [
    ('Recipient Area Code', 'recipient_area_code', lambda x: x, True),
    ('Issue', 'issue', lambda x: x, True),
    ('Caller ID Number', 'source_area_code', phone_number_to_area_code, True),
    ('Date Time of Issue', 'time', drop_date_from_datetime, False),
    ('Date Time of Issue', 'day', lambda x: x.day if isinstance(x, datetime.datetime) else None, False),
    ('Date Time of Issue', 'month', lambda x: x.month if isinstance(x, datetime.datetime) else None, False),
    ('Date Time of Issue', 'day_of_week', lambda x: x.weekday() if isinstance(x, datetime.datetime) else None, False),
]

#Maps factorized_name to a list of its categories
FACTORIZED_CATEGORIES = {}

def run():
    #Load datafram
    ROBOCALL_DF = pd.read_csv(os.path.join(os.getcwd(), 'data/robocall-recipient-area-code.csv'))

    #Combine phone number rows into 'Caller ID Number' column
    ROBOCALL_DF['Caller ID Number'] = ROBOCALL_DF.apply(merge_phone_numbers, axis=1)
    #Drop 'Advertiser Business Number' as it is no longer needed
    ROBOCALL_DF = ROBOCALL_DF.drop(columns=['Advertiser Business Number'])

    #Convert time into an easily usable field
    ROBOCALL_DF = create_date_time_of_issue(ROBOCALL_DF)

    #Factorized columns
    for t in FACTORIZE_COLUMNS:
        (column_name, factorized_name, f, one_hot) = t
        (ROBOCALL_DF, FACTORIZED_CATEGORIES[factorized_name]) = factorize_column(ROBOCALL_DF, column_name, factorized_name, f, one_hot)

    #Identify columns to use for prediction
    prediction_indexs = []
    prediction_column_names = ['time_int', 'source_area_code_int', 'day_int', 'month_int', 'day_of_week_int', 'recipient_area_code_int']

    for column_name in prediction_column_names:
        prediction_indexs.append(ROBOCALL_DF.columns.get_loc(column_name))

    prediction_columns = ROBOCALL_DF.columns[prediction_indexs]
    predicted_column = 'issue_int'

    #Make training and testing data
    ROBOCALL_DF['is_training'] = np.random.uniform(0,1,len(ROBOCALL_DF)) <= 0.8
    train, test = ROBOCALL_DF[ROBOCALL_DF['is_training']==True], ROBOCALL_DF[ROBOCALL_DF['is_training']==False]

    train_x = train[prediction_columns]
    train_y = train[predicted_column]

    test_x = test[prediction_columns]
    test_y = test[predicted_column].tolist()

    #Make and train classifier
    classifier = RandomForestClassifier(n_estimators=100, max_depth=30)
    classifier.fit(train_x, train_y)

    #Test classifier
    test_y_predicted = classifier.predict(test_x)

    #Print raw accuracy
    print(sum([test_y_predicted[i] == test_y[i] for i in range(len(test_y_predicted))])/len(test_y_predicted))

    #Print feature importances
    print(prediction_column_names)
    print(classifier.feature_importances_)

    #Save classifier, categories, and training data
    f = open("python-script-outputs/classifierPickle", "wb+")
    pickle.dump(classifier, f)
    f.close()

    f = open("python-script-outputs/oneHotEncodedCategoriesPickle", "wb+")
    pickle.dump(FACTORIZED_CATEGORIES, f)
    f.close()

    f = open("python-script-outputs/categoricalColumns", "w+")
    cols = [x for x in FACTORIZED_CATEGORIES.keys() if FACTORIZED_CATEGORIES[x] is not None]
    f.write(",".join(cols))
    f.close()

    f = open("python-script-outputs/trainingDatasetPickle", "wb+")
    pickle.dump(train, f)
    f.close()

    f = open("python-script-outputs/predictionColumns", "w+")
    f.write(",".join(prediction_column_names))
    f.close()

    f = open("python-script-outputs/predictedColumn", "w+")
    f.write(predicted_column)
    f.close()

if __name__ == '__main__':
    run()
