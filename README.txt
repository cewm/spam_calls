DESCRIPTION

This read me file guides the user in order to be able to run the output generated in the poster pdf. Please refer to the team10 report for the write up of this proyect.

Data sources:
Area Code Lat Long: https://github.com/ravisorg/Area-Code-Geolocation-Database
Dataset: https://opendata.fcc.gov/Consumer/CGB-Consumer-Complaints-Data/3xyp-aqkj
Dataset used after preprocessing: https://drive.google.com/open?id=1FaJE02nzkDFahtw5f5iq4txvU3vk_Nzq

INSTALLATION

This code was developed using Python/Anaconda 3.7 64 bit.

Anaconda can be installed here: https://www.anaconda.com/distribution/#download-section

Download the folder 'code' and keep the folder same for ease of use. Using Terminal (for Mac) switch the working directory to the 'code' folder.

Install dependencies by running the following commands in the Terminal window.

```
cd CODE
pip install -r requirements.txt
```

EXECUTION

To download the data and to ultimately run the web app, follow the below commands in Terminal:

```
cd Code
```

to go into the directory with the code.

In the `CODE` directory, run

```
chmod +x prepare.sh
./prepare.sh
```
Prepare.sh may take a few tries to work. If you get an error that the zip file is missing then please run the command a few times. The cloud sharing site may have a finicky connection. If it doesn't work then access the files from this link https://drive.google.com/open?id=1FN7W4c-w_MJ1N_BesWtoI9Lb2wq0pUh1

To manually select and download the files from the above link if the prepare.sh didnt download the files, please copy the files data_for_predictions.zip to CODE/data folder and, json_files.zip to CODE/flask_app/static/json/ folder on your computer.

To download necessary data to run the Flask server and extract into the correct folder structure.

In the `CODE` directory, run

```
cd flask_app
export FLASK_APP=flask_app.py
flask run
```

to run the Flask server. It can be viewed by going to `localhost:5000` in your web browser.


(Optional) Building files from source (necessary for replicating analysis):
In the `CODE` directory is a directory called `data`. This directory is empty due to Github's restriction on file size limits. If you want to run this code, you need to download the dataset from the FCC and save it in the `data` directory as `robocall.csv`. 

In addition, the following packages will need to be installed. These are specific to your installation and instructions will need to be looked up: 

basemap==1.2.0
Cartopy==0.17.0
datashader==0.7.0
datashape==0.5.4
dython==0.1.0
imageio==2.5.0
GDAL==2.3.3
geopandas==0.4.1
geoviews==1.6.2
mkl-fft==1.0.10
mkl-random==1.0.2
pyproj==1.9.5.1
pykdtree==1.3.1
pywinpty==0.5.5
scikit-image==0.15.0

In the `CODE` directory, run

```
python preprocess-data/preprocess-recipient-area-code.py
```

to preprocess the area code of the recipient. Note that this script takes a long time to run. The dataset link above contains a file with the results of this excecution with our dataset. If you want to download this file to use instead of running the script, save it in the `data` directory as `robocall-recipient-area-code.csv`.

In the `CODE` directory, run

```
python create-classifier/create-classifier.py
```

to build the classifier and other information needed for the classifier. These files are stored in the `python-script-outputs` directory.


