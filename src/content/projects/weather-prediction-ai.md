### Project context

During my minor IoT I made a device that gathers weather data such at pressure, hummidity, and temperature. this data would then get send to my raspberry pie via MQTT for storage and data visualisation. seeing this data is cool but it would be much cooler if we can use this data to predict the weather.

## Project Overview

The goal of this project was simple:  
**predict whether it will rain in the next 5 hours based on current weather conditions.**

To achieve this, I built a system consisting of:
- Data ingestion (historical + live sensor data)
- Data preprocessing and feature engineering
- Machine learning model training
- Backend API for predictions
- Frontend visualization

You can find the full codebase here:
- Input stream: https://github.com/DowneyX/IoT-weather-data-input-stream  
- Output stream: https://github.com/DowneyX/IoT-weather-data-output-stream  
- Backend: https://github.com/DowneyX/IoT-weather-data-backend  
- Frontend: https://github.com/DowneyX/IoT-weather-data-frontend


## Working with Real Weather Data

I started with historical weather data from the KNMI (Royal Netherlands Meteorological Institute). The dataset included hourly measurements such as temperature, humidity, and air pressure.

Before using the data, I had to clean and transform it:
- Converted the raw `.txt` file into a `.csv`
- Removed unnecessary whitespace and invalid rows
- Standardized datetime formatting
- Adjusted feature values to match my sensor output
- Shifted rainfall data **5 hours into the future** to create a prediction target

This last step was key — instead of predicting current rain, the model learns to predict *future* rain.

## Balancing the Dataset

One issue I encountered was class imbalance:
- ~12,500 records without rain
- ~6,400 records with rain

To avoid bias in the model, I balanced the dataset by randomly removing "no rain" samples until both classes were equal. This significantly improved the reliability of the model during training.

## Exploring the Data

Before jumping into modeling, I visualized the dataset in 3D using:
- Temperature
- Humidity
- Pressure

This helped reveal some clear patterns:
- **Low pressure** strongly correlates with rainfall
- **High humidity** increases the chance of rain
- Rain is more likely at **lower temperatures (5–15°C)**

However, there were still many ambiguous cases — which made this a good machine learning problem.

![image.](images/projects/weather-prediction-ai/image.png "visualisation of weather data")

- **red:** no rainfall
- **blue:** rain fall


## Choosing a Machine Learning Model

I tested three different models:
- Logistic Regression  
- Gaussian Naive Bayes  
- Random Forest Classifier  

The **Random Forest Classifier** performed best in terms of accuracy, so I selected it as my final model.

After tuning hyperparameters, I improved the model’s accuracy by about **1.8%** compared to the default configuration.

## Training and Deployment

Once trained, I exported the model and built a small Python service that:
- Loads the trained model
- Accepts sensor input
- Returns a rain prediction

I then integrated this into my backend, which pulls the latest sensor data from a database and feeds it into the model.


## Final Result

The system now works as follows:
1. Sensors send live weather data  
2. Backend processes the latest values  
3. The trained model predicts rainfall  
4. Frontend displays the result  

Everything is connected through an API, making the system modular and easy to extend.

![image](images/projects/weather-prediction-ai/home.png "frontend of data predictor")

unfortunatly the 3 parameters used are just not very good predictors of rainfall. in extreme cases like high humidity its fairly confident but in other cases its not very accurate. 

in the future adding more parameters like cload covarage and seasons might proof effective.