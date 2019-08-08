#!/bin/sh
echo "Downloading data for prediction module..."
curl https://transfer.sh/uIUxz/data_for_predictions.zip -o data_for_predictions.zip
echo "Extracting prediction files..."
unzip data_for_predictions.zip -d ./
echo "Downloading data for exploration module..."
curl https://transfer.sh/n2Zz7/json_files.zip -o json_files.zip
echo "Extracting exploration files..."
unzip json_files.zip -d ./flask_app/static/json/
