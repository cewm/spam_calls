#!/usr/bin/env python
# coding: utf-8
# Converts the location of the spam call recipient into an area code
# This script takes a long time to run

import pandas as pd
import numpy as np
from ast import literal_eval

import os
import re
import datetime
import math
import time
import pickle

## Generate Location dictionary with (zip code, location coordinate) pairs
## Assumes ROBOCALL_DF contains column 'Location (Center point of the Zip Code)'
def getLocations(df, d = dict()):
    splitter = lambda x: tuple(x.split('\n'))
    for e in df['Location (Center point of the Zip Code)']:
        try:
            entry = splitter(e)
            if len(entry) == 2:
                k, v = entry
                d[k.split('-')[0].split(' ')[1]] = literal_eval(v)
        except:
            continue
    return d

## Preprocess Location and Zip to consistent format
def preprocessLocation(s):
    try:
        s = re.sub(r'(\d)\(', r'\1\n(', s)
        return s.split('\n')[0].split(' ')[-1].split('-')[0]
    except:
        return None

def location(zipCode, locationDict):
    try:
        return locationDict[zipCode]
    except KeyError:
        return np.nan

def preprocess_location_and_zip(df):
    locationDict = getLocations(df)
    df = df.rename(index = str, columns = {'Location (Center point of the Zip Code)': 'Location'})
    df['Zip'] = df['Location'].apply(preprocessLocation)
    df['Recipient Location'] = df['Location'].apply(lambda x: location(preprocessLocation(x), locationDict))
    df = df.dropna(subset = ['Recipient Location'])
    return df

#Read in area code to lat-long coordinates csv for phone_number_to_lat_long() function
NUMBER_LAT_LONG_DF = pd.read_csv(os.path.join(os.getcwd(), 'data/area-code-to-lat-long.csv'))

#Converts a phone number to a lat-long coordinate point baesd on its area code
#Assumes phone numbers in the format xxx-yyy-zzzz
def phone_number_to_lat_long(phone_number):
    try:
        area_code = int(phone_number[0:3])
    except:
        return np.nan 
    index = np.where(NUMBER_LAT_LONG_DF['Area Code'] == area_code)[0]
    if len(index) > 0:
        index = index[0]
        lat = NUMBER_LAT_LONG_DF.iloc[index]['Lat'].item()
        _long = NUMBER_LAT_LONG_DF.iloc[index]['Long'].item()
        return (lat,_long)
    else:
        return np.nan

def geocoordinate_distance(origin, destination):
    #Computes distance between 2 geo coordinate points
    #Taken from https://gist.github.com/rochacbruno/2883505
    #Author: Wayne Dyck
    lat1, lon1 = origin
    lat2, lon2 = destination
    radius = 6371 # km

    dlat = math.radians(lat2-lat1)
    dlon = math.radians(lon2-lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    d = radius * c

    return d

#Takes a lat-long coordinate and returns the area code closest to it
def lat_long_to_area_code(lat_long):
    area_code = None
    max_distance_seen = None
    
    for index, row in NUMBER_LAT_LONG_DF.iterrows():
        df_lat = row['Lat']
        df_long = row['Long']
        current_distance =  geocoordinate_distance(lat_long, (df_lat, df_long))
        if max_distance_seen is None or current_distance < max_distance_seen:
            max_distance_seen = current_distance
            area_code = row['Area Code']

    return area_code

def run():
    #Load datafram
    ROBOCALL_DF = pd.read_csv(os.path.join(os.getcwd(), 'data/robocall.csv'))

    #Convert location to usable format
    ROBOCALL_DF = preprocess_location_and_zip(ROBOCALL_DF)

    #Create Recipient Area Code
    ROBOCALL_DF['Recipient Area Code'] = ROBOCALL_DF['Recipient Location'].apply(lat_long_to_area_code)

    #Save DF
    ROBOCALL_DF.to_csv("data/robocall-recipient-area-code.csv")

if __name__ == '__main__':
    run()
